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
  WarrantyTier,
  WizardProblemCategory,
} from '../types'
import {
  adminApproveClientShippingSchema,
  adminCloseTicketSchema,
  adminReassignSchoolSchema,
  adminRefuseClientShippingSchema,
  adminRemindSchoolSchema,
  assignWorkshopSchema,
} from '../schemas'
import { sendClientStepUpdateEmail, type ClientStepEmail, type TicketEmailContext } from '../email'
import { requestStatusToSavStatus } from './_helpers'
import {
  notifyClientOnPlumeShippingApproved,
  notifyClientOnPlumeShippingRefused,
} from '@/features/notifications/sav-events'

export async function assignWorkshopForCommunicationAction(formData: FormData) {
  const parsed = assignWorkshopSchema.safeParse({
    ticketId:      formData.get('ticketId'),
    workshopId:    formData.get('workshopId'),
    workshopLabel: formData.get('workshopLabel'),
  })
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: { _form: ['Non authentifiÃ©'] } }

  const { ticketId, workshopId, workshopLabel } = parsed.data

  // Garde-fou : workshopId doit correspondre à une row partner_workshops (anti-forge).
  const ws = await getPartnerWorkshopById(workshopId)
  if (!ws) {
    return { error: { _form: ["Atelier inconnu — choisissez un atelier du réseau partenaire"] } }
  }

  const now = new Date().toISOString()

  // État atelier AVANT la réassignation — pour détecter un vrai changement et
  // poster la trace « Atelier changé » dans le canal groupe.
  const { data: prev } = await supabase
    .from('service_requests')
    .select('assigned_workshop_id, assigned_workshop_label')
    .eq('id', ticketId)
    .maybeSingle()
    .returns<{ assigned_workshop_id: string | null; assigned_workshop_label: string | null }>()
  const previousWorkshopId    = prev?.assigned_workshop_id ?? null
  const previousWorkshopLabel = prev?.assigned_workshop_label ?? null

  // Changer d'atelier remet la validation atelier à zéro : le nouvel atelier
  // doit re-confirmer qu'il accepte la demande (workshop_accepted → NULL).
  const baseUpdate: TicketUpdate = {
    assigned_workshop_id:    workshopId,
    assigned_workshop_label: workshopLabel,
    workshop_assigned_at:    now,
    workshop_assigned_by:    user.id,
  }
  const fullUpdate: TicketUpdate = {
    ...baseUpdate,
    workshop_accepted:       null,
    workshop_accepted_at:    null,
    workshop_accepted_by:    null,
    workshop_refusal_reason: null,
  }

  let { error } = await supabase
    .from('service_requests')
    .update(fullUpdate)
    .eq('id', ticketId)

  // Tier 2 : si les colonnes workshop_accepted_* n'existent pas encore
  // (migration 20260516000000 non appliquée), on retombe sur l'update de base.
  if (error) {
    const looksLikeMissingColumn =
      error.code === '42703' || error.code === 'PGRST204' ||
      /column .* does not exist/i.test(error.message) ||
      /could not find the .* column/i.test(error.message)
    if (looksLikeMissingColumn) {
      console.warn('assignWorkshopForCommunicationAction: retrying without workshop_accepted —', error.message)
      const r = await supabase.from('service_requests').update(baseUpdate).eq('id', ticketId)
      error = r.error
    }
  }

  if (error) return { error: { _form: [`Erreur lors de l'assignation (${error.message})`] } }

  // Messagerie dynamique — « la conversation suit l'aile ». Quand l'école
  // change réellement d'atelier (un atelier différent était déjà assigné), on
  // poste une trace dans le canal groupe. Le nouvel atelier hérite de tout
  // l'historique ; l'ancien perd l'accès via le scoping assigned_workshop_id.
  // Best-effort : un échec d'insertion ne casse jamais la réassignation.
  if (previousWorkshopId && previousWorkshopId !== workshopId) {
    const oldLabel = previousWorkshopLabel ?? "l'atelier précédent"
    const { error: msgError } = await supabase.from('ticket_messages').insert({
      ticket_id:        ticketId,
      sender_id:        user.id,
      sender_role:      'school',
      content:          `🔄 Atelier changé : ${oldLabel} → ${workshopLabel}`,
      is_internal:      false,
      visibility_level: 'all',
      channel:          'group',
    })
    if (msgError) {
      console.error('assignWorkshopForCommunicationAction: message insert failed —', msgError.message)
    }
  }

  revalidatePath(`/school/ticket/${ticketId}`)
  revalidatePath(`/workshop/ticket/${ticketId}`)
  return { success: true }
}

// ============================================================
// Actions admin Plume HQ (T2) â€” toutes refusent si rÃ´le â‰  plume_admin
// ============================================================

async function ensurePlumeAdmin(): Promise<{ ok: true; userId: string } | { ok: false; error: { _form: string[] } }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: { _form: ['Non authentifiÃ©'] } }
  const roles = await getCurrentUserRoles()
  if (!roles.includes('plume_admin')) {
    return { ok: false, error: { _form: ['Action rÃ©servÃ©e Ã  Plume HQ'] } }
  }
  return { ok: true, userId: user.id }
}

/**
 * RÃ©assigne un ticket Ã  une autre Ã©cole. Met Ã  jour `school_id` (Ã©cole qui
 * traite dÃ©sormais) ET `referent_school_id` (nouvelle Ã©cole rÃ©fÃ©rente). La
 * raison est postÃ©e comme message interne `plume_only` pour la traÃ§abilitÃ©.
 */
export async function adminReassignSchoolAction(formData: FormData) {
  const parsed = adminReassignSchoolSchema.safeParse({
    ticketId: formData.get('ticketId'),
    schoolId: formData.get('schoolId'),
    reason:   formData.get('reason'),
  })
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const auth = await ensurePlumeAdmin()
  if (!auth.ok) return { error: auth.error }

  const { ticketId, schoolId, reason } = parsed.data
  const supabase = await createClient()

  const { error } = await supabase
    .from('service_requests')
    .update({
      school_id:          schoolId,
      referent_school_id: schoolId,
    })
    .eq('id', ticketId)

  if (error) return { error: { _form: [`Erreur rÃ©assignation (${error.message})`] } }

  // Trace en interne pour Plume â€” pas visible cÃ´tÃ© client/Ã©cole/atelier.
  await supabase.from('ticket_messages').insert({
    ticket_id:        ticketId,
    sender_id:        auth.userId,
    sender_role:      'plume_admin' as MessageSenderRole,
    content:          `[RÃ©assignation] Ticket transfÃ©rÃ© Ã  une autre Ã©cole.\nMotif : ${reason}`,
    is_internal:      true,
    visibility_level: 'plume_only',
  })

  revalidatePath('/plume')
  revalidatePath(`/school/ticket/${ticketId}`)
  revalidatePath(`/workshop/ticket/${ticketId}`)
  return { success: true }
}

/**
 * ClÃ´ture manuelle d'un ticket par Plume HQ (status â†’ completed). Note
 * obligatoire pour la traÃ§abilitÃ©, postÃ©e en interne `plume_only`.
 */
export async function adminCloseTicketAction(formData: FormData) {
  const parsed = adminCloseTicketSchema.safeParse({
    ticketId: formData.get('ticketId'),
    note:     formData.get('note'),
  })
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const auth = await ensurePlumeAdmin()
  if (!auth.ok) return { error: auth.error }

  const { ticketId, note } = parsed.data
  const supabase = await createClient()

  const { data: current } = await supabase
    .from('service_requests')
    .select('status')
    .eq('id', ticketId)
    .single()
    .returns<{ status: RequestStatus }>()

  const { error } = await supabase
    .from('service_requests')
    .update({
      status:          'completed' as RequestStatus,
      sav_status:      'closed' as TicketStatus,
      completion_date: new Date().toISOString(),
    })
    .eq('id', ticketId)

  if (error) return { error: { _form: [`Erreur clÃ´ture (${error.message})`] } }

  await supabase.from('ticket_messages').insert({
    ticket_id:        ticketId,
    sender_id:        auth.userId,
    sender_role:      'plume_admin' as MessageSenderRole,
    content:          `[ClÃ´ture admin] ${note}`,
    is_internal:      true,
    visibility_level: 'plume_only',
  })

  // Audit trail â€” best-effort (la table peut ne pas exister sur certains envs).
  if (current?.status) {
    const { error: histError } = await supabase.from('ticket_status_history').insert({
      ticket_id:  ticketId,
      old_status: requestStatusToSavStatus(current.status),
      new_status: 'closed' as TicketStatus,
      changed_by: auth.userId,
      note:       `ClÃ´ture admin : ${note}`,
    })
    if (histError) console.error('[SAV] ticket_status_history insert failed:', histError.message)
  }

  revalidatePath('/plume')
  revalidatePath(`/client/ticket/${ticketId}`)
  revalidatePath(`/school/ticket/${ticketId}`)
  revalidatePath(`/workshop/ticket/${ticketId}`)
  return { success: true }
}

/**
 * Relance email de l'Ã©cole : envoie une notification "rappel" via Resend
 * (rÃ©utilise `send-email-resend` Edge Function comme les autres emails SAV).
 * Best-effort â€” log un warning si l'Ã©cole n'a pas d'email connu.
 */
export async function adminRemindSchoolAction(formData: FormData) {
  const parsed = adminRemindSchoolSchema.safeParse({
    ticketId: formData.get('ticketId'),
  })
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const auth = await ensurePlumeAdmin()
  if (!auth.ok) return { error: auth.error }

  const { ticketId } = parsed.data
  const supabase = await createClient()

  const { data: ticket } = await supabase
    .from('service_requests')
    .select('school_id, ticket_number, first_name, last_name, product_brand, product_model, created_at')
    .eq('id', ticketId)
    .single()
    .returns<{
      school_id:      string | null
      ticket_number:  string | null
      first_name:     string | null
      last_name:      string | null
      product_brand:  string | null
      product_model:  string | null
      created_at:     string
    }>()

  if (!ticket) return { error: { _form: ['Ticket introuvable'] } }
  if (!ticket.school_id) {
    return { error: { _form: ["Aucune Ã©cole assignÃ©e Ã  ce ticket"] } }
  }

  const school = await getPartnerSchoolById(ticket.school_id)
  if (!school?.email) {
    return { error: { _form: ["L'Ã©cole n'a pas d'email enregistrÃ© dans partner_schools"] } }
  }

  const ticketRef = ticket.ticket_number ?? `#${ticketId.slice(0, 8).toUpperCase()}`
  const fullName  = `${ticket.first_name ?? ''} ${ticket.last_name ?? ''}`.trim() || 'le client'
  const wing      = `${ticket.product_brand ?? ''} ${ticket.product_model ?? ''}`.trim() || 'l\'aile'
  const daysOpen  = Math.max(0, Math.floor((Date.now() - new Date(ticket.created_at).getTime()) / 86_400_000))

  const html = `
    <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px">
      <p style="font-size:12px;color:#9333ea;letter-spacing:.08em;text-transform:uppercase;margin:0">Plume HQ â€” relance</p>
      <h1 style="font-size:20px;color:#0f172a;margin:8px 0 16px">Ticket SAV ${ticketRef} en attente</h1>
      <p style="color:#334155;line-height:1.55">Bonjour,</p>
      <p style="color:#334155;line-height:1.55">
        Le ticket SAV de ${fullName} pour ${wing} a Ã©tÃ© ouvert il y a <strong>${daysOpen} jour${daysOpen > 1 ? 's' : ''}</strong>
        et n'a pas encore Ã©tÃ© pris en charge par votre Ã©cole.
      </p>
      <p style="color:#334155;line-height:1.55">
        Merci de prendre quelques minutes pour le traiter dans votre espace Ã‰cole :
      </p>
      <p style="margin:24px 0">
        <a href="https://sav.plumeparagliders.com/school/ticket/${ticketId}"
           style="background:#f59e0b;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:600">
          Ouvrir le ticket ${ticketRef}
        </a>
      </p>
      <p style="font-size:12px;color:#94a3b8;margin-top:32px">â€” L'Ã©quipe Plume</p>
    </div>
  `

  try {
    const { error } = await supabase.functions.invoke('send-email-resend', {
      body: {
        to:         school.email,
        subject:    `Plume SAV â€” Relance ticket ${ticketRef} en attente depuis ${daysOpen} j`,
        html,
        email_type: 'sav_notification',
      },
    })
    if (error) return { error: { _form: [`Erreur envoi email (${error.message})`] } }
  } catch (e) {
    return { error: { _form: [`Erreur envoi email (${e instanceof Error ? e.message : String(e)})`] } }
  }

  // Trace de la relance â€” visible Plume uniquement.
  await supabase.from('ticket_messages').insert({
    ticket_id:        ticketId,
    sender_id:        auth.userId,
    sender_role:      'plume_admin' as MessageSenderRole,
    content:          `[Relance Ã©cole] Email envoyÃ© Ã  ${school.email} (ticket ouvert depuis ${daysOpen} j).`,
    is_internal:      true,
    visibility_level: 'plume_only',
  })

  revalidatePath('/plume')
  return { success: true }
}

// ────────────────────────────────────────────────────────────────────────────
// Override garantie — Plume HQ prend en charge un ticket extended/HG
// ────────────────────────────────────────────────────────────────────────────
//
// Bascule warranty_tier vers 'plume_override' (qui se comporte ensuite comme
// 'standard' pour le reste du flow) avec une note de justification obligatoire,
// l'identité Plume HQ et un timestamp. Reservé plume_admin et ne s'applique
// que si le tier courant est 'extended' ou 'out_of_warranty' — pas la peine
// d'écraser un standard déjà couvert, et un override existant ne devrait pas
// être ré-overridé sans audit dédié.
export async function applyPlumeOverrideAction(formData: FormData) {
  const ticketId = String(formData.get('ticketId') ?? '')
  const note     = String(formData.get('note') ?? '').trim()
  if (!ticketId)        return { error: { _form: ['Identifiant manquant'] } }
  if (note.length < 3)  return { error: { note: ['Note de justification requise (3 caractères min)'] } }
  if (note.length > 2000) return { error: { note: ['Note trop longue (2000 caractères max)'] } }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: { _form: ['Non authentifié'] } }

  const roles = await getCurrentUserRoles()
  if (!roles.includes('plume_admin')) {
    return { error: { _form: ['Réservé à Plume HQ'] } }
  }

  const { data: ticket, error: fetchError } = await supabase
    .from('service_requests')
    .select('id, status, warranty_tier')
    .eq('id', ticketId)
    .single()
    .returns<{ id: string; status: RequestStatus; warranty_tier: WarrantyTier | null }>()

  if (fetchError || !ticket) {
    return { error: { _form: ['Ticket introuvable'] } }
  }

  if (ticket.warranty_tier !== 'extended' && ticket.warranty_tier !== 'out_of_warranty') {
    return {
      error: {
        _form: [
          `Override possible uniquement si le tier courant est 'extended' ou ` +
          `'out_of_warranty' (actuel : ${ticket.warranty_tier ?? '—'}).`,
        ],
      },
    }
  }

  const nowIso = new Date().toISOString()
  const { error: updateError } = await supabase
    .from('service_requests')
    .update({
      warranty_tier:          'plume_override',
      warranty_override_by:   user.id,
      warranty_override_at:   nowIso,
      warranty_override_note: note,
    })
    .eq('id', ticketId)

  if (updateError) {
    return { error: { _form: [`Erreur de sauvegarde (${updateError.message})`] } }
  }

  // Audit — l'override est un changement non-trivial qui mérite sa propre
  // entrée dans l'historique. old_status = new_status (pas un changement
  // de pipeline, mais une bascule de couverture).
  const { error: histError } = await supabase.from('ticket_status_history').insert({
    ticket_id:  ticketId,
    old_status: requestStatusToSavStatus(ticket.status),
    new_status: requestStatusToSavStatus(ticket.status),
    changed_by: user.id,
    note:       `🦅 Override garantie Plume HQ (depuis « ${ticket.warranty_tier} »). Motif : ${note}`,
  })
  if (histError) console.error('[applyPlumeOverrideAction] history insert failed:', histError.message)

  revalidatePath(`/workshop/ticket/${ticketId}`)
  revalidatePath(`/school/ticket/${ticketId}`)
  revalidatePath(`/client/ticket/${ticketId}`)
  revalidatePath('/plume')
  return { success: true }
}

// ────────────────────────────────────────────────────────────────────────────
// Validation Plume HQ de l'envoi postal client (anti-abus seuil annuel)
// ────────────────────────────────────────────────────────────────────────────
//
// Quand le client a déjà créé ≥ 2 SAV cette année, `generateSavShippingLabelAction`
// flag `auto_approved_shipping = FALSE` et renvoie `pendingAdminApproval`. Le
// ticket apparaît alors dans la queue Plume HQ (cf. `/plume`). Cette section
// expose les deux décisions possibles :
//   - approve → plume_shipping_approved = TRUE → le client peut re-cliquer
//     "Générer mon bon de transport" et l'action procède normalement.
//   - refuse  → plume_shipping_approved = FALSE + raison → l'action renverra
//     une erreur explicative au client.
//
// Idempotence : on accepte de re-décider tant qu'aucun label n'a été émis. Si
// `client_school_label_url` est déjà posé, on bloque (pas de revert d'un envoi
// déjà initié — il faudrait passer par un ticket-level admin override).

async function applyPlumeShippingDecision(params: {
  ticketId:      string
  approved:      boolean
  refusalReason: string | null
}) {
  const auth = await ensurePlumeAdmin()
  if (!auth.ok) return { error: auth.error }

  const supabase = await createClient()

  // Lookup le ticket pour vérifier qu'il est effectivement en attente Plume
  // (auto_approved_shipping = FALSE, pas encore décidé, pas de label émis).
  const { data: ticket, error: fetchError } = await supabase
    .from('service_requests')
    .select('id, auto_approved_shipping, plume_shipping_approved, client_school_label_url')
    .eq('id', params.ticketId)
    .maybeSingle()

  if (fetchError || !ticket) {
    return { error: { _form: ['Demande introuvable'] } }
  }
  if (ticket.auto_approved_shipping !== false) {
    return {
      error: {
        _form: [
          "Cette demande n'est pas en attente de validation Plume — aucune décision à prendre.",
        ],
      },
    }
  }
  if (ticket.client_school_label_url) {
    return {
      error: {
        _form: [
          "Un bon de transport a déjà été émis pour ce ticket — décision Plume verrouillée.",
        ],
      },
    }
  }

  const { error: updateError } = await supabase
    .from('service_requests')
    .update({
      plume_shipping_approved:       params.approved,
      plume_shipping_refusal_reason: params.approved ? null : params.refusalReason,
      plume_shipping_decided_at:     new Date().toISOString(),
      plume_shipping_decided_by:     auth.userId,
    })
    .eq('id', params.ticketId)

  if (updateError) {
    return { error: { _form: [`Erreur lors de l'enregistrement (${updateError.message})`] } }
  }

  // Trace audit interne — `plume_only` pour ne pas polluer le fil client/école.
  await supabase.from('ticket_messages').insert({
    ticket_id:        params.ticketId,
    sender_id:        auth.userId,
    sender_role:      'plume_admin' as MessageSenderRole,
    content:          params.approved
      ? "[Validation Plume HQ] Envoi postal autorisé — le client peut générer son bon de transport."
      : `[Refus Plume HQ] Envoi postal refusé.\nMotif : ${params.refusalReason ?? '—'}`,
    is_internal:      true,
    visibility_level: 'plume_only',
  })

  // Notif client — best-effort, ne bloque pas la réponse de l'action.
  try {
    if (params.approved) {
      await notifyClientOnPlumeShippingApproved(supabase, params.ticketId)
    } else {
      await notifyClientOnPlumeShippingRefused(supabase, params.ticketId, params.refusalReason)
    }
  } catch (e) {
    console.warn('[applyPlumeShippingDecision] notif threw:', e)
  }

  revalidatePath('/plume')
  revalidatePath(`/client/ticket/${params.ticketId}`)
  revalidatePath(`/school/ticket/${params.ticketId}`)
  // Layout — bump le badge notif côté client.
  revalidatePath('/client', 'layout')
  return { success: true as const }
}

export async function adminApproveClientShippingAction(formData: FormData) {
  const parsed = adminApproveClientShippingSchema.safeParse({
    ticketId: formData.get('ticketId'),
  })
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }
  return applyPlumeShippingDecision({
    ticketId:      parsed.data.ticketId,
    approved:      true,
    refusalReason: null,
  })
}

export async function adminRefuseClientShippingAction(formData: FormData) {
  const parsed = adminRefuseClientShippingSchema.safeParse({
    ticketId: formData.get('ticketId'),
    reason:   formData.get('reason'),
  })
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }
  return applyPlumeShippingDecision({
    ticketId:      parsed.data.ticketId,
    approved:      false,
    refusalReason: parsed.data.reason,
  })
}

