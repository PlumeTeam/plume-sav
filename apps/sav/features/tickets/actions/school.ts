'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserRoles } from '@/features/auth/queries'
import { getPartnerSchoolById, getPartnerWorkshopById } from '../queries'
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
  WizardProblemCategory,
} from '../types'
import {
  approveShippingSchema,
  diagnosisSchema,
  refuseShippingSchema,
  schoolChecklistSchema,
  schoolResolutionSchema,
} from '../schemas'
import { sendClientStepUpdateEmail, type ClientStepEmail, type TicketEmailContext } from '../email'
import {
  requestStatusToSavStatus,
  resolutionToRequestStatus,
} from './_helpers'
import {
  notifyClientOnEscalatedToWorkshop,
  notifyClientOnShippingApproved,
  notifyClientOnShippingRefused,
} from '@/features/notifications/sav-events'
import { advanceTicketStep } from './_step-advance'

export async function saveDiagnosisAction(formData: FormData) {
  const parsed = diagnosisSchema.safeParse({
    ticketId: formData.get('ticketId'),
    diagnosisNotes: formData.get('diagnosisNotes'),
    estimatedCost: formData.get('estimatedCost'),
    estimatedHours: formData.get('estimatedHours'),
    partsNeeded: formData.get('partsNeeded'),
  })
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: { _form: ['Non authentifiÃ©'] } }

  const { ticketId, diagnosisNotes, estimatedCost, estimatedHours, partsNeeded } = parsed.data

  const { error } = await supabase
    .from('service_requests')
    .update({
      diagnosis_notes: diagnosisNotes ?? null,
      estimated_cost: estimatedCost ?? null,
      estimated_hours: estimatedHours ?? null,
      parts_needed: partsNeeded ?? null,
    })
    .eq('id', ticketId)

  if (error) return { error: { _form: ['Erreur lors de la sauvegarde'] } }

  revalidatePath(`/workshop/ticket/${ticketId}`)
  return { success: true }
}

// ============================================================
// Workflow diagnostic Ã©cole / atelier (migration 20260503120000)
// ============================================================

export async function saveSchoolChecklistAction(formData: FormData) {
  const parsed = schoolChecklistSchema.safeParse({
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
    .update({ school_checklist: payload })
    .eq('id', ticketId)

  if (error) return { error: { _form: ['Erreur lors de la sauvegarde de la checklist'] } }

  revalidatePath(`/school/ticket/${ticketId}`)
  return { success: true }
}

export async function applySchoolResolutionAction(formData: FormData) {
  const parsed = schoolResolutionSchema.safeParse({
    ticketId:      formData.get('ticketId'),
    resolution:    formData.get('resolution'),
    note:          formData.get('note') || undefined,
    workshopId:    formData.get('workshopId') || undefined,
    workshopLabel: formData.get('workshopLabel') || undefined,
    isPlumeUrgent: formData.get('isPlumeUrgent') || undefined,
  })
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: { _form: ['Non authentifiÃ©'] } }

  const { ticketId, resolution, note, workshopId, workshopLabel, isPlumeUrgent } = parsed.data

  // Garde-fou : si l'Ã©cole escalade ou demande un avis, le workshopId doit
  // correspondre Ã  un atelier connu de PARTNER_WORKSHOPS. EmpÃªche un client
  // qui forgerait une requÃªte de pointer vers un atelier arbitraire.
  if (resolution === 'escalated_to_workshop' || resolution === 'workshop_advice_requested') {
    if (!workshopId) {
      return { error: { _form: ["Atelier inconnu — choisissez un atelier du réseau partenaire"] } }
    }
    const ws = await getPartnerWorkshopById(workshopId)
    if (!ws) {
      return { error: { _form: ["Atelier inconnu â€” choisissez un atelier du rÃ©seau partenaire"] } }
    }
  }

  const newStatus = resolutionToRequestStatus(resolution)
  const newSavStatus = (() => {
    switch (resolution) {
      case 'resolved_by_school':
      case 'normal_behavior_explained':
        return 'closed' as TicketStatus
      case 'escalated_to_workshop':
        return 'repair_in_progress' as TicketStatus
      case 'escalated_to_plume':
      case 'workshop_advice_requested':
      case 'reflection':
        return 'in_review' as TicketStatus
    }
  })()

  const now = new Date().toISOString()
  // Tier 1 update: with all the new columns (is_plume_urgent + advice fields).
  // Tier 2 fallback: drop is_plume_urgent if migration 20260508000000 isn't applied.
  const fullUpdate: TicketUpdate = {
    school_resolution:      resolution,
    school_resolution_note: note ?? null,
    school_resolved_at:     now,
    school_resolved_by:     user.id,
    status:                 newStatus,
    is_plume_urgent:        isPlumeUrgent ?? false,
  }
  // Both escalation and advice need a workshop reference, but reflection doesn't.
  if (resolution === 'escalated_to_workshop' || resolution === 'workshop_advice_requested') {
    fullUpdate.assigned_workshop_id    = workshopId ?? null
    fullUpdate.assigned_workshop_label = workshopLabel ?? null
    fullUpdate.workshop_assigned_at    = now
    fullUpdate.workshop_assigned_by    = user.id
  }
  // Step pipeline timestamp â€” l'escalade vers atelier marque l'entrÃ©e dans
  // la branche workshop, le client le voit dans sa timeline.
  if (resolution === 'escalated_to_workshop') {
    fullUpdate.escalated_to_workshop_at = now
  }

  let { error } = await supabase
    .from('service_requests')
    .update(fullUpdate)
    .eq('id', ticketId)

  // Retry without is_plume_urgent if the column is missing (migration not applied yet).
  if (error) {
    const looksLikeMissingColumn =
      error.code === '42703' || error.code === 'PGRST204' ||
      /column .* does not exist/i.test(error.message) ||
      /could not find the .* column/i.test(error.message)
    if (looksLikeMissingColumn) {
      console.warn('applySchoolResolutionAction: retrying without is_plume_urgent â€”', error.message)
      const legacyUpdate: TicketUpdate = { ...fullUpdate }
      delete legacyUpdate.is_plume_urgent
      const r = await supabase.from('service_requests').update(legacyUpdate).eq('id', ticketId)
      error = r.error
    }
  }

  if (error) return { error: { _form: [`Erreur lors de la rÃ©solution (${error.message})`] } }

  // Best-effort audit trail
  const { error: histError } = await supabase.from('ticket_status_history').insert({
    ticket_id:  ticketId,
    old_status: null,
    new_status: newSavStatus,
    changed_by: user.id,
    note:       note ? `[${resolution}] ${note}` : `[${resolution}]`,
  })
  if (histError) console.error('[SAV] ticket_status_history insert failed:', histError.message)

  // Notification client (best-effort) â€” seules les dÃ©cisions Â« dÃ©finitives Â»
  // (Ã©cole rÃ©sout, ou ticket part vers l'atelier) dÃ©clenchent un email. Les
  // Ã©tats transitoires (advice/reflection) restent silencieux cÃ´tÃ© client.
  const stepEmail: ClientStepEmail | null =
    resolution === 'resolved_by_school' || resolution === 'normal_behavior_explained'
      ? 'school_resolved'
      : resolution === 'escalated_to_workshop'
        ? 'escalated_to_workshop'
        : null

  if (stepEmail) {
    try {
      const { data: ticketRow } = await supabase
        .from('service_requests')
        .select('id, ticket_number, first_name, email, referent_school_id')
        .eq('id', ticketId)
        .single()
        .returns<{
          id:                 string
          ticket_number:      string | null
          first_name:         string | null
          email:              string | null
          referent_school_id: string | null
        }>()

      if (ticketRow?.email) {
        const schoolDetail = ticketRow.referent_school_id
          ? await getPartnerSchoolById(ticketRow.referent_school_id)
          : null
        const ref = ticketRow.ticket_number ?? `#${ticketRow.id.slice(0, 8).toUpperCase()}`
        const r = await sendClientStepUpdateEmail(supabase, stepEmail, {
          ticketId:    ticketRow.id,
          ticketRef:   ref,
          clientFirst: ticketRow.first_name ?? 'Pilote',
          clientEmail: ticketRow.email,
          schoolName:  schoolDetail?.name ?? null,
        })
        if (!r.ok) console.warn(`[applySchoolResolutionAction] step email "${stepEmail}" skipped:`, r.error)
      }
    } catch (e) {
      console.warn(`[applySchoolResolutionAction] step email "${stepEmail}" threw:`, e)
    }
  }

  // Notification in-app client si escalade vers atelier (l'email school_resolved
  // étant déjà couvert plus haut, on garde la cohérence : in-app pour les
  // étapes "visibles client" — escalade = grand changement, ça mérite une notif).
  if (resolution === 'escalated_to_workshop') {
    try {
      await notifyClientOnEscalatedToWorkshop(supabase, ticketId)
    } catch (e) {
      console.warn('[applySchoolResolutionAction] in-app notif threw:', e)
    }
  }

  revalidatePath(`/school/ticket/${ticketId}`)
  revalidatePath(`/workshop/ticket/${ticketId}`)
  revalidatePath(`/client/ticket/${ticketId}`)
  revalidatePath('/school')
  revalidatePath('/workshop')
  revalidatePath('/plume')
  revalidatePath('/client', 'layout')
  return { success: true }
}


export async function markWingReceivedSchoolAction(formData: FormData) {
  const ticketId = String(formData.get('ticketId') ?? '')
  if (!ticketId) return { error: { _form: ['Identifiant manquant'] } }
  return advanceTicketStep({
    ticketId,
    from:            ['school_acknowledged'],
    to:              'wing_received_school',
    timestampColumn: 'wing_received_school_at',
    emailStep:       'wing_received_school',
  })
}

/**
 * Ã‰tape 3 â€” L'Ã©cole lance le check (ouvre le wizard).
 * wing_received_school â†’ school_checking
 *
 * Pas de timestamp dÃ©diÃ© : la fin de check est matÃ©rialisÃ©e par le
 * remplissage de school_checklist, qui porte sa propre updatedAt.
 */
export async function startSchoolCheckAction(formData: FormData) {
  const ticketId = String(formData.get('ticketId') ?? '')
  if (!ticketId) return { error: { _form: ['Identifiant manquant'] } }
  return advanceTicketStep({
    ticketId,
    from:      ['wing_received_school'],
    to:        'school_checking',
    emailStep: 'school_checking',
  })
}

// ============================================================
// Validation école de l'envoi postal de l'aile par le client
// ============================================================
//
// Le client choisit dans le wizard `delivery_method='postal'` ⇒ il doit
// expédier son aile à l'école. Avant qu'il ne génère son bon de transport,
// l'école doit donner son feu vert (sécurise les flux GLS et permet à
// l'école de prévenir/refuser si un dépôt en main propre est préférable).
//
// Trois états possibles sur la colonne `shipping_approved` :
//   NULL  → décision pas encore prise (état initial)
//   TRUE  → l'école autorise — le client peut générer son étiquette
//   FALSE → l'école refuse — `shipping_refusal_reason` explique pourquoi
//
// Garde-fou DB : si shipping_approved=FALSE, la raison doit être non vide
// (cf. migration 20260512000000, contrainte CHECK).

async function applyShippingDecision(params: {
  ticketId:      string
  approved:      boolean
  refusalReason: string | null
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: { _form: ['Non authentifié'] } }

  // On ne valide / refuse que les tickets dont le client a choisi l'envoi
  // postal. Une décision sur un dépôt en main propre n'a aucun sens.
  const { data: ticket, error: fetchError } = await supabase
    .from('service_requests')
    .select('id, delivery_method, shipping_approved')
    .eq('id', params.ticketId)
    .maybeSingle()

  if (fetchError || !ticket) {
    return { error: { _form: ['Demande introuvable'] } }
  }
  if (ticket.delivery_method !== 'postal') {
    return { error: { _form: ["Cette demande n'est pas un envoi postal — pas besoin de validation"] } }
  }

  const update: TicketUpdate = {
    shipping_approved:       params.approved,
    shipping_refusal_reason: params.approved ? null : params.refusalReason,
    shipping_decided_at:     new Date().toISOString(),
    shipping_decided_by:     user.id,
  }

  const { error: updateError } = await supabase
    .from('service_requests')
    .update(update)
    .eq('id', params.ticketId)

  if (updateError) {
    return { error: { _form: [`Erreur lors de l'enregistrement (${updateError.message})`] } }
  }

  // Notif client : BAT validé → success ; BAT refusé → warning + reason.
  // Best-effort, ne bloque pas le retour de l'action en cas d'erreur RLS.
  if (params.approved) {
    await notifyClientOnShippingApproved(supabase, params.ticketId)
  } else {
    await notifyClientOnShippingRefused(supabase, params.ticketId, params.refusalReason)
  }

  revalidatePath(`/school/ticket/${params.ticketId}`)
  revalidatePath(`/client/ticket/${params.ticketId}`)
  revalidatePath('/school')
  revalidatePath('/client')
  revalidatePath('/plume')
  // Layout : NotificationsNavButton côté client doit refléter +1 notif.
  revalidatePath('/client', 'layout')
  return { success: true as const }
}

export async function approveShippingAction(formData: FormData) {
  const parsed = approveShippingSchema.safeParse({
    ticketId: formData.get('ticketId'),
  })
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }
  return applyShippingDecision({
    ticketId:      parsed.data.ticketId,
    approved:      true,
    refusalReason: null,
  })
}

export async function refuseShippingAction(formData: FormData) {
  const parsed = refuseShippingSchema.safeParse({
    ticketId: formData.get('ticketId'),
    reason:   formData.get('reason'),
  })
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }
  return applyShippingDecision({
    ticketId:      parsed.data.ticketId,
    approved:      false,
    refusalReason: parsed.data.reason,
  })
}

// â”€â”€ Atelier : Ã©tapes post-escalade â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * Ã‰tape 4 â€” L'atelier a rÃ©ceptionnÃ© l'aile.
 * escalated_to_workshop â†’ wing_received_workshop
 */

