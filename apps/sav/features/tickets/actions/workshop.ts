'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserRoles } from '@/features/auth/queries'
import { PARTNER_WORKSHOPS } from '../constants'
import { getPartnerSchoolById, getPlumeSettings } from '../queries'
import type {
  ClientShippingAddress,
  MessageSenderRole,
  ProblemCategory,
  RequestStatus,
  SchoolResolution,
  ServiceType,
  ShipmentLeg,
  TicketStatus,
  TicketUpdate,
  WarrantyStatus,
  WarrantyTier,
  WizardProblemCategory,
  WorkshopDecision,
} from '../types'
import {
  finishWorkshopPreCheckSchema,
  repairDecisionSchema,
  startWorkshopPreCheckSchema,
  workshopChecklistSchema,
  workshopDecisionSchema,
} from '../schemas'
import { workshopChecklistPayloadSchema } from '../workshop-checklist'
import { sendClientStepUpdateEmail, type ClientStepEmail, type TicketEmailContext } from '../email'
import { computeRepairDecision, computeWarrantyStatus } from '../utils'
import { getPreCheckFeeEur } from '@/features/settings/queries'
import { requestStatusToSavStatus } from './_helpers'
import { advanceTicketStep } from './_step-advance'

export async function saveWorkshopChecklistAction(formData: FormData) {
  const parsed = workshopChecklistSchema.safeParse({
    ticketId:   formData.get('ticketId'),
    checkedIds: formData.getAll('checkedIds'),
    notes:      formData.get('notes') || undefined,
  })
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: { _form: ['Non authentifiÃ©'] } }

  const { ticketId, checkedIds, notes } = parsed.data
  const payload = { checkedIds, notes: notes ?? null, updatedAt: new Date().toISOString() }

  const { error } = await supabase
    .from('service_requests')
    .update({ workshop_checklist: payload })
    .eq('id', ticketId)

  if (error) return { error: { _form: ['Erreur lors de la sauvegarde'] } }

  revalidatePath(`/workshop/ticket/${ticketId}`)
  return { success: true }
}

// Save de la checklist v2 (structurée 6 sections). Le payload arrive
// stringifié dans le form pour préserver la structure complexe.
export async function saveWorkshopFullChecklistAction(formData: FormData) {
  const ticketId   = String(formData.get('ticketId') ?? '')
  const payloadRaw = String(formData.get('payload') ?? '')
  if (!ticketId)        return { error: { _form: ['Identifiant manquant'] } }
  if (!payloadRaw)      return { error: { _form: ['Payload vide'] } }

  let parsedJson: unknown
  try {
    parsedJson = JSON.parse(payloadRaw)
  } catch {
    return { error: { _form: ['Payload invalide (JSON malformé)'] } }
  }

  const parsed = workshopChecklistPayloadSchema.safeParse(parsedJson)
  if (!parsed.success) {
    console.error('[saveWorkshopFullChecklistAction] schema error:', parsed.error.flatten())
    return { error: { _form: ['Payload invalide (structure inattendue)'] } }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: { _form: ['Non authentifié'] } }

  const stored = {
    ...parsed.data,
    updatedAt: new Date().toISOString(),
    updatedBy: user.id,
  }

  // Round-trip via JSON.stringify pour obtenir un Json conforme aux types
  // strict de @supabase/postgrest-js (Json est récursif, nos interfaces
  // typées sans index signature n'y matchent pas directement).
  const jsonStored = JSON.parse(JSON.stringify(stored))
  const { error } = await supabase
    .from('service_requests')
    .update({ workshop_checklist: jsonStored })
    .eq('id', ticketId)

  if (error) return { error: { _form: [`Erreur lors de la sauvegarde (${error.message})`] } }

  revalidatePath(`/workshop/ticket/${ticketId}`)
  return { success: true }
}

export async function markWingReceivedWorkshopAction(formData: FormData) {
  const ticketId = String(formData.get('ticketId') ?? '')
  if (!ticketId) return { error: { _form: ['Identifiant manquant'] } }
  return advanceTicketStep({
    ticketId,
    from:            ['escalated_to_workshop'],
    to:              'wing_received_workshop',
    timestampColumn: 'wing_received_workshop_at',
    emailStep:       'wing_received_workshop',
  })
}

/**
 * Étape 5 — L'atelier commence le diagnostic technique.
 * Accepte deux statuts de départ :
 *  - wing_received_workshop      (le problème est évident → diagnostic direct)
 *  - workshop_pre_checking       (après pré-check → diagnostic confirmé)
 */
export async function startWorkshopDiagnosisAction(formData: FormData) {
  const ticketId = String(formData.get('ticketId') ?? '')
  if (!ticketId) return { error: { _form: ['Identifiant manquant'] } }
  return advanceTicketStep({
    ticketId,
    from:            ['wing_received_workshop', 'workshop_pre_checking'],
    to:              'workshop_diagnosing',
    timestampColumn: 'workshop_diagnosis_at',
    emailStep:       'workshop_diagnosing',
  })
}

/**
 * Étape 5 bis — Démarre un pré-check (~1h max) quand le problème n'est pas
 * évident à la réception. Tarif fixe facturé à Plume (cf. plume_settings).
 * wing_received_workshop → workshop_pre_checking
 */
export async function startWorkshopPreCheckAction(formData: FormData) {
  const parsed = startWorkshopPreCheckSchema.safeParse({
    ticketId: formData.get('ticketId'),
  })
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  return advanceTicketStep({
    ticketId:        parsed.data.ticketId,
    from:            ['wing_received_workshop'],
    to:              'workshop_pre_checking',
    timestampColumn: 'pre_check_started_at',
    // Pas d'email client : étape interne atelier+Plume (Plume paye), pas
    // d'événement utile pour le client.
    emailStep:       null,
    historyNote:     'Pré-check démarré (problème pas clair à la réception)',
  })
}

/**
 * Étape 5 bis (fin) — Clôt le pré-check : enregistre les observations, fige
 * le tarif sur le ticket et passe en workshop_diagnosing (T6).
 */
export async function finishWorkshopPreCheckAction(formData: FormData) {
  const parsed = finishWorkshopPreCheckSchema.safeParse({
    ticketId:     formData.get('ticketId'),
    observations: formData.get('observations'),
  })
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const { ticketId, observations } = parsed.data

  // Snapshot du tarif : on lit plume_settings AU MOMENT de la complétion
  // pour qu'une modif ultérieure du tarif n'affecte pas la facturation
  // de ce ticket.
  const feeEur = await getPreCheckFeeEur()

  return advanceTicketStep({
    ticketId,
    from:            ['workshop_pre_checking'],
    to:              'workshop_diagnosing',
    timestampColumn: 'workshop_diagnosis_at',
    emailStep:       'workshop_diagnosing',
    patch: {
      pre_check_completed_at: new Date().toISOString(),
      pre_check_observations: observations,
      pre_check_fee_eur:      feeEur,
    },
    historyNote: `Pré-check terminé (facturé ${feeEur} € à Plume)`,
  })
}

/**
 * Ã‰tape 6 â€” La rÃ©paration dÃ©marre.
 * workshop_diagnosing â†’ workshop_repairing
 */
export async function startWorkshopRepairAction(formData: FormData) {
  const ticketId = String(formData.get('ticketId') ?? '')
  if (!ticketId) return { error: { _form: ['Identifiant manquant'] } }
  return advanceTicketStep({
    ticketId,
    from:      ['workshop_diagnosing'],
    to:        'workshop_repairing',
    emailStep: 'workshop_repairing',
  })
}

/**
 * Ã‰tape 7 â€” L'atelier a fini la rÃ©paration.
 * workshop_repairing â†’ workshop_done
 */
export async function markWorkshopDoneAction(formData: FormData) {
  const ticketId = String(formData.get('ticketId') ?? '')
  if (!ticketId) return { error: { _form: ['Identifiant manquant'] } }
  return advanceTicketStep({
    ticketId,
    from:            ['workshop_repairing'],
    to:              'workshop_done',
    timestampColumn: 'workshop_repair_done_at',
    emailStep:       'workshop_done',
  })
}

/**
 * Ã‰tape 8 â€” L'atelier renvoie l'aile (au client direct ou via l'Ã©cole).
 * workshop_done â†’ wing_returned
 *
 * `recipient` est consignÃ© dans la note d'audit pour traÃ§abilitÃ©.
 */

// ============================================================
// T6 — Décision réparation / remplacement (post pré-check)
// ============================================================
//
// Après pré-check, l'atelier saisit un coût estimé. Le seuil (plume_settings)
// décide automatiquement repair ≤ seuil < replacement. Garantie 2 ans depuis
// purchase_date par défaut. Hors garantie → Plume ne prend pas en charge sauf
// décision exceptionnelle (override + note obligatoire).
//
// La Server Action est l'unique source de vérité :
//  - le seuil est relu en DB (jamais accepté du client),
//  - la garantie est recalculée depuis purchase_date,
//  - le rôle est vérifié (workshop ou plume_admin uniquement).

export interface RepairDecisionResult {
  success:           true
  decision:          WorkshopDecision
  warrantyStatus:    WarrantyStatus | null
  warrantyCovered:   boolean
  thresholdEur:      number
  estimatedCost:     number
}

export async function submitRepairDecisionAction(formData: FormData) {
  const parsed = repairDecisionSchema.safeParse({
    ticketId:         formData.get('ticketId'),
    estimatedCost:    formData.get('estimatedCost'),
    warrantyOverride: formData.get('warrantyOverride') ?? undefined,
    note:             formData.get('note') ?? undefined,
  })
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: { _form: ['Non authentifié'] } }

  const roles = await getCurrentUserRoles()
  if (!roles.includes('workshop') && !roles.includes('plume_admin')) {
    return { error: { _form: ["Réservé à l'atelier ou Plume HQ"] } }
  }

  const { ticketId, estimatedCost, warrantyOverride, note } = parsed.data

  // Le ticket doit avoir au moins atteint le diagnostic atelier — sinon la
  // notion de "post pré-check" n'a pas de sens.
  const { data: ticket, error: ticketError } = await supabase
    .from('service_requests')
    .select('id, status, purchase_date, assigned_workshop_id')
    .eq('id', ticketId)
    .single()
    .returns<{
      id:                   string
      status:               RequestStatus
      purchase_date:        string | null
      assigned_workshop_id: string | null
    }>()

  if (ticketError || !ticket) {
    return { error: { _form: ['Ticket introuvable'] } }
  }

  const allowedStatuses: RequestStatus[] = [
    'wing_received_workshop',
    'workshop_diagnosing',
    'workshop_repairing',
    'workshop_done',
  ]
  if (!allowedStatuses.includes(ticket.status)) {
    return {
      error: {
        _form: [
          `La décision n'est possible qu'après réception de l'aile à l'atelier ` +
          `(statut courant : « ${ticket.status} »).`,
        ],
      },
    }
  }

  const settings = await getPlumeSettings()
  const decision = computeRepairDecision(estimatedCost, settings.repairReplacementThresholdEur)
  const warrantyStatus = computeWarrantyStatus(ticket.purchase_date, settings.warrantyDurationMonths)

  // Garde-fous métier :
  //  - sous garantie → couverture automatique, override ignoré
  //  - hors garantie + override → note obligatoire (justification)
  //  - hors garantie sans override → Plume ne prend pas en charge
  const isUnderWarranty = warrantyStatus === 'under_warranty'
  const isOutOfWarrantyOverride = warrantyStatus === 'out_of_warranty' && Boolean(warrantyOverride)
  const warrantyCovered = isUnderWarranty || isOutOfWarrantyOverride

  if (isOutOfWarrantyOverride && !note?.trim()) {
    return {
      error: {
        note: ['Justification requise pour une prise en charge hors garantie'],
      },
    }
  }

  const nowIso = new Date().toISOString()

  const { error: updateError } = await supabase
    .from('service_requests')
    .update({
      workshop_estimated_repair_cost:     estimatedCost,
      workshop_decision:                  decision,
      workshop_decision_at:               nowIso,
      workshop_decision_by:               user.id,
      workshop_decision_warranty_status:  warrantyStatus,
      workshop_decision_warranty_covered: warrantyCovered,
      workshop_decision_note:             note?.trim() ? note.trim() : null,
      // Conserve le coût estimé legacy synchro avec la nouvelle décision
      // pour ne pas casser les sections existantes du ticket.
      estimated_cost:                     estimatedCost,
    })
    .eq('id', ticketId)

  if (updateError) {
    return { error: { _form: [`Erreur lors de la sauvegarde (${updateError.message})`] } }
  }

  // Audit trail léger — la décision n'est pas un changement de statut, on
  // l'enregistre quand même dans ticket_status_history pour traçabilité.
  const auditNote = [
    `[T6] Décision : ${decision === 'repair' ? 'réparation' : 'remplacement'} (coût estimé ${estimatedCost} €, seuil ${settings.repairReplacementThresholdEur} €).`,
    warrantyStatus ? `Garantie : ${warrantyStatus === 'under_warranty' ? 'active' : 'hors garantie'}.` : 'Garantie : indéterminée (date d\'achat manquante).',
    `Prise en charge Plume : ${warrantyCovered ? 'oui' : 'non'}.`,
    note?.trim() ? `Note : ${note.trim()}` : null,
  ].filter(Boolean).join(' ')

  const { error: histError } = await supabase.from('ticket_status_history').insert({
    ticket_id:  ticketId,
    old_status: requestStatusToSavStatus(ticket.status),
    new_status: requestStatusToSavStatus(ticket.status),
    changed_by: user.id,
    note:       auditNote,
  })
  if (histError) console.error('[T6 decision] history insert failed:', histError.message)

  revalidatePath(`/workshop/ticket/${ticketId}`)
  revalidatePath(`/school/ticket/${ticketId}`)
  revalidatePath(`/client/ticket/${ticketId}`)
  revalidatePath('/plume')

  const result: RepairDecisionResult = {
    success:          true,
    decision,
    warrantyStatus,
    warrantyCovered,
    thresholdEur:     settings.repairReplacementThresholdEur,
    estimatedCost,
  }
  return result
}

// ============================================================
// Décision atelier 3-options — étape "Prise de décision" du pipeline
// ============================================================
// Branches :
//  - 'no_issue'    : aucun défaut → on saute directement à wing_returned
//  - 'repair'      : coût ≤ seuil Plume → workshop_repairing
//  - 'replacement' : coût > seuil OU non réparable → status conservé
//                    (le remplacement est piloté manuellement avec Plume HQ).
//
// Le seuil est relu côté serveur depuis plume_settings (jamais reçu du
// client). Le check est strict pour 'repair' : si cost > threshold,
// on refuse et on demande à l'atelier de choisir 'replacement'.
export async function submitWorkshopDecisionAction(formData: FormData) {
  const parsed = workshopDecisionSchema.safeParse({
    ticketId:      formData.get('ticketId'),
    decision:      formData.get('decision'),
    estimatedCost: formData.get('estimatedCost') ?? undefined,
    note:          formData.get('note') ?? undefined,
  })
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: { _form: ['Non authentifié'] } }

  const roles = await getCurrentUserRoles()
  if (!roles.includes('workshop') && !roles.includes('plume_admin')) {
    return { error: { _form: ["Réservé à l'atelier ou Plume HQ"] } }
  }

  const { ticketId, decision, estimatedCost, note } = parsed.data

  // La prise de décision n'a de sens qu'après réception de l'aile et
  // démarrage du diagnostic atelier. On reste tolérant sur les étapes
  // ultérieures (révision d'une décision déjà prise).
  const { data: ticket, error: ticketError } = await supabase
    .from('service_requests')
    .select('id, status, purchase_date, warranty_tier, ticket_number')
    .eq('id', ticketId)
    .single()
    .returns<{
      id:             string
      status:         RequestStatus
      purchase_date:  string | null
      warranty_tier:  WarrantyTier | null
      ticket_number:  string | null
    }>()

  if (ticketError || !ticket) {
    return { error: { _form: ['Ticket introuvable'] } }
  }

  const allowedStatuses: RequestStatus[] = [
    'wing_received_workshop',
    'workshop_pre_checking',
    'workshop_diagnosing',
    'workshop_repairing',
    'workshop_done',
  ]
  if (!allowedStatuses.includes(ticket.status)) {
    return {
      error: {
        _form: [
          `La décision n'est possible qu'après réception/diagnostic de l'aile ` +
          `(statut courant : « ${ticket.status} »).`,
        ],
      },
    }
  }

  const settings = await getPlumeSettings()

  // Plafond effectif selon le tier figé sur le ticket :
  // - standard / plume_override : repair_replacement_threshold_eur
  // - extended                  : repair_threshold_extended_eur
  // - out_of_warranty           : pas de plafond (devis libre soumis au client)
  // - null (ticket pré-chantier garantie) : on retombe sur le standard
  const ticketTier = ticket.warranty_tier
  const effectiveThreshold: number | null =
    ticketTier === 'out_of_warranty' ? null :
    ticketTier === 'extended'        ? settings.repairThresholdExtendedEur :
    settings.repairReplacementThresholdEur

  // Le seuil Plume est une recommandation informative côté UI — l'atelier
  // garde le contrôle final sur la décision (peut décider de réparer même
  // au-dessus du plafond ; la justification vit dans la note + l'audit
  // trail). Pas de check bloquant ici.

  // Refuse 'replacement' en garantie étendue si Plume ne le couvre pas.
  if (
    decision === 'replacement' &&
    ticketTier === 'extended' &&
    !settings.extendedCoversReplacement
  ) {
    return {
      error: {
        _form: [
          "Plume ne couvre pas le remplacement en garantie étendue. " +
          "Coordonnez avec Plume HQ pour un override.",
        ],
      },
    }
  }

  const warrantyStatus: WarrantyStatus | null = computeWarrantyStatus(
    ticket.purchase_date,
    settings.warrantyDurationMonths,
  )
  // 'no_issue' = aucun travail → pas de couverture à calculer. 'repair' et
  // 'replacement' suivent le statut garantie (Plume couvre quand active).
  const warrantyCovered = decision === 'no_issue'
    ? null
    : warrantyStatus === 'under_warranty'

  const nowIso = new Date().toISOString()

  // Mapping décision → statut suivant.
  // 'no_issue'    → wing_returned (skip réparation / done)
  // 'repair'      → workshop_repairing (le bouton step 4 prend le relai après)
  // 'replacement' → on conserve le statut courant (Plume HQ pilote la suite)
  const nextStatus: RequestStatus | null =
    decision === 'no_issue' ? 'wing_returned' :
    decision === 'repair'   ? 'workshop_repairing' :
    null

  const updatePayload: TicketUpdate = {
    workshop_decision:                  decision,
    workshop_decision_at:               nowIso,
    workshop_decision_by:               user.id,
    workshop_decision_warranty_status:  warrantyStatus,
    workshop_decision_warranty_covered: warrantyCovered,
    workshop_decision_note:             note?.trim() ? note.trim() : null,
    ...(decision === 'repair' && estimatedCost != null
      ? { workshop_estimated_repair_cost: estimatedCost, estimated_cost: estimatedCost }
      : {}),
    ...(nextStatus ? { status: nextStatus } : {}),
    // 'no_issue' saute repair/done — on pose wing_returned_at tout de suite
    // pour que le badge final ait son timestamp.
    ...(decision === 'no_issue' ? { wing_returned_at: nowIso } : {}),
  }

  const { error: updateError } = await supabase
    .from('service_requests')
    .update(updatePayload)
    .eq('id', ticketId)

  if (updateError) {
    return { error: { _form: [`Erreur lors de la sauvegarde (${updateError.message})`] } }
  }

  // Audit trail — utile pour comprendre le saut de statut (no_issue) et
  // garder trace des justifications de remplacement.
  const seuilLabel = effectiveThreshold != null ? `, seuil ${effectiveThreshold} € HT` : ', hors garantie (devis libre)'
  const decisionLabel =
    decision === 'no_issue'    ? 'aucun défaut détecté' :
    decision === 'repair'      ? `réparation (coût estimé ${estimatedCost} €${seuilLabel})` :
                                 'remplacement'
  const auditNote = [
    `[T6] Décision atelier : ${decisionLabel}.`,
    ticketTier ? `Tier : ${ticketTier}.` : null,
    warrantyStatus ? `Garantie : ${warrantyStatus === 'under_warranty' ? 'active' : 'hors garantie'}.` : null,
    note?.trim() ? `Note : ${note.trim()}` : null,
  ].filter(Boolean).join(' ')

  const { error: histError } = await supabase.from('ticket_status_history').insert({
    ticket_id:  ticketId,
    old_status: requestStatusToSavStatus(ticket.status),
    new_status: requestStatusToSavStatus(nextStatus ?? ticket.status),
    changed_by: user.id,
    note:       auditNote,
  })
  if (histError) console.error('[workshop decision] history insert failed:', histError.message)

  // Flow devis client (hors garantie + repair) : poste le devis dans le
  // canal client_workshop pour validation. Best-effort — n'échoue pas la
  // décision si l'insert message foire.
  if (ticketTier === 'out_of_warranty' && decision === 'repair' && estimatedCost != null) {
    const ticketRef = ticket.ticket_number ?? `#${ticketId.slice(0, 8).toUpperCase()}`
    const quoteMessage =
      `📨 Devis SAV ${ticketRef}\n\n` +
      `Suite au diagnostic atelier, le coût estimé de la réparation est de ` +
      `${estimatedCost} € HT.\n\n` +
      `Votre aile étant hors garantie, ce devis est à votre charge. ` +
      `Merci de nous répondre dans ce canal pour valider ou refuser. ` +
      `Tant que vous n'avez pas validé, aucune intervention n'est lancée.` +
      (note?.trim() ? `\n\nNote de l'atelier : ${note.trim()}` : '')
    const { error: quoteError } = await supabase.from('ticket_messages').insert({
      ticket_id:        ticketId,
      sender_id:        user.id,
      sender_role:      'workshop',
      content:          quoteMessage,
      is_internal:      false,
      visibility_level: 'all',
      channel:          'client_workshop',
    })
    if (quoteError) {
      console.warn('[workshop decision] devis message insert failed:', quoteError.message)
    }
  }

  revalidatePath(`/workshop/ticket/${ticketId}`)
  revalidatePath(`/school/ticket/${ticketId}`)
  revalidatePath(`/client/ticket/${ticketId}`)
  revalidatePath('/plume')

  return { success: true, decision, threshold: effectiveThreshold }
}
