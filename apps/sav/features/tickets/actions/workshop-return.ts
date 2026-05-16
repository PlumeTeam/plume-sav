'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserRoles } from '@/features/auth/queries'
import type {
  MessageSenderRole,
  RequestStatus,
  TicketUpdate,
  WorkshopDecision,
} from '../types'
import {
  approveReplacementSchema,
  prepareReturnShippingSchema,
  refuseReplacementSchema,
  revertWorkshopStepSchema,
} from '../schemas'
import { requestStatusToSavStatus } from './_helpers'

// ============================================================
// Refonte du workflow atelier — étapes post-décision
// ============================================================
//
// Après la « Prise de décision » (submitWorkshopDecisionAction), le parcours
// se ramifie. Les étapes restantes ne sont PAS de nouveaux statuts : ce sont
// des flags (timestamps / booléens) sur service_requests. Ça permet un retour
// en arrière granulaire (bouton « Modifier ») sans réécrire le pipeline.
//
//   no_issue    : [décision] → ticket d'envoi → envoyer
//   repair      : [décision] → réparation → terminée → ticket d'envoi → envoyer
//   replacement : [décision] → validation Plume HQ → ticket d'envoi → envoyer
//
// Toutes les actions ci-dessous re-valident le rôle explicitement.

function revalidateTicket(ticketId: string) {
  revalidatePath(`/workshop/ticket/${ticketId}`)
  revalidatePath(`/school/ticket/${ticketId}`)
  revalidatePath(`/client/ticket/${ticketId}`)
  revalidatePath(`/plume/messages/${ticketId}`)
  revalidatePath('/plume')
  revalidatePath('/workshop')
}

interface ActionResult {
  error?:   { _form?: string[]; [k: string]: unknown }
  success?: true
}

// ────────────────────────────────────────────────────────────────────────────
// Étape « Créer le ticket d'envoi » — l'atelier prépare l'expédition retour
// ────────────────────────────────────────────────────────────────────────────
export async function prepareReturnShippingAction(formData: FormData): Promise<ActionResult> {
  const parsed = prepareReturnShippingSchema.safeParse({
    ticketId:  formData.get('ticketId'),
    recipient: formData.get('recipient'),
  })
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: { _form: ['Non authentifié'] } }

  const roles = await getCurrentUserRoles()
  if (!roles.includes('workshop') && !roles.includes('plume_admin')) {
    return { error: { _form: ["Réservé à l'atelier ou Plume HQ"] } }
  }

  const { ticketId, recipient } = parsed.data

  const { data: ticket, error: fetchError } = await supabase
    .from('service_requests')
    .select('id, status, workshop_decision, plume_replacement_approved, workshop_shipping_prepared_at')
    .eq('id', ticketId)
    .single()
    .returns<{
      id:                            string
      status:                        RequestStatus
      workshop_decision:             WorkshopDecision | null
      plume_replacement_approved:    boolean | null
      workshop_shipping_prepared_at: string | null
    }>()
  if (fetchError || !ticket) return { error: { _form: ['Ticket introuvable'] } }

  const decision = ticket.workshop_decision
  if (!decision) {
    return { error: { _form: ["Renseignez d'abord la décision atelier (étape « Prise de décision »)."] } }
  }

  // Garde-fous par branche.
  if (decision === 'replacement') {
    if (ticket.plume_replacement_approved !== true) {
      return { error: { _form: ['Le remplacement doit être validé par Plume HQ avant de créer le ticket d\'envoi.'] } }
    }
    if (recipient !== 'plume') {
      return { error: { _form: ['Une aile irréparable est renvoyée à Plume HQ.'] } }
    }
  } else {
    if (recipient === 'plume') {
      return { error: { _form: ['Destination Plume réservée aux ailes irréparables.'] } }
    }
    if (decision === 'repair' && ticket.status !== 'workshop_done') {
      return { error: { _form: ['Terminez la réparation avant de créer le ticket d\'envoi.'] } }
    }
  }

  const { error: updateError } = await supabase
    .from('service_requests')
    .update({
      workshop_shipping_prepared_at: new Date().toISOString(),
      workshop_return_destination:   recipient,
    } satisfies TicketUpdate)
    .eq('id', ticketId)
  if (updateError) {
    return { error: { _form: [`Erreur lors de l'enregistrement (${updateError.message})`] } }
  }

  const destLabel =
    recipient === 'plume'  ? 'Plume HQ' :
    recipient === 'school' ? "l'école partenaire" :
                             'le client'
  await supabase.from('ticket_status_history').insert({
    ticket_id:  ticketId,
    old_status: requestStatusToSavStatus(ticket.status),
    new_status: requestStatusToSavStatus(ticket.status),
    changed_by: user.id,
    note:       `📦 Ticket d'envoi créé — destination : ${destLabel}.`,
  })

  revalidateTicket(ticketId)
  return { success: true }
}

// ────────────────────────────────────────────────────────────────────────────
// Retour en arrière — bouton « Modifier » sur une étape post-décision
// ────────────────────────────────────────────────────────────────────────────
export async function revertWorkshopStepAction(formData: FormData): Promise<ActionResult> {
  const parsed = revertWorkshopStepSchema.safeParse({
    ticketId: formData.get('ticketId'),
    step:     formData.get('step'),
  })
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: { _form: ['Non authentifié'] } }

  const roles = await getCurrentUserRoles()
  if (!roles.includes('workshop') && !roles.includes('plume_admin')) {
    return { error: { _form: ["Réservé à l'atelier ou Plume HQ"] } }
  }

  const { ticketId, step } = parsed.data

  const { data: ticket, error: fetchError } = await supabase
    .from('service_requests')
    .select('id, status, workshop_decision')
    .eq('id', ticketId)
    .single()
    .returns<{ id: string; status: RequestStatus; workshop_decision: WorkshopDecision | null }>()
  if (fetchError || !ticket) return { error: { _form: ['Ticket introuvable'] } }

  // Champs nullifiés + statut cible selon l'étape annulée. Chaque étape efface
  // aussi l'aval (annuler « validation Plume » efface le ticket d'envoi, etc.).
  const update: TicketUpdate = {}
  let label = ''

  switch (step) {
    case 'decision':
      update.workshop_decision                  = null
      update.workshop_decision_at               = null
      update.workshop_decision_by               = null
      update.workshop_decision_warranty_status  = null
      update.workshop_decision_warranty_covered = null
      update.workshop_decision_note             = null
      update.workshop_estimated_repair_cost     = null
      update.workshop_repair_estimated_date     = null
      update.workshop_repair_done_at            = null
      update.plume_replacement_approved         = null
      update.plume_replacement_approved_at      = null
      update.plume_replacement_decided_by       = null
      update.plume_replacement_refusal_reason   = null
      update.workshop_shipping_prepared_at      = null
      update.workshop_return_destination        = null
      update.wing_returned_at                   = null
      update.status                             = 'workshop_diagnosing'
      label = 'Prise de décision'
      break

    case 'plume_validation':
      update.plume_replacement_approved       = null
      update.plume_replacement_approved_at    = null
      update.plume_replacement_decided_by     = null
      update.plume_replacement_refusal_reason = null
      update.workshop_shipping_prepared_at    = null
      update.workshop_return_destination      = null
      update.wing_returned_at                 = null
      if (ticket.status === 'wing_returned') update.status = 'workshop_diagnosing'
      label = 'Validation Plume HQ'
      break

    case 'repair_done':
      if (ticket.status !== 'workshop_done' && ticket.status !== 'wing_returned') {
        return { error: { _form: ['La réparation n\'est pas marquée comme terminée.'] } }
      }
      update.workshop_repair_done_at       = null
      update.workshop_shipping_prepared_at = null
      update.workshop_return_destination   = null
      update.wing_returned_at              = null
      update.status                        = 'workshop_repairing'
      label = 'Réparation terminée'
      break

    case 'shipping_prepared':
      update.workshop_shipping_prepared_at = null
      update.workshop_return_destination   = null
      update.wing_returned_at              = null
      if (ticket.status === 'wing_returned') {
        update.status = ticket.workshop_decision === 'repair' ? 'workshop_done' : 'workshop_diagnosing'
      }
      label = "Ticket d'envoi créé"
      break

    case 'wing_sent':
      if (ticket.status !== 'wing_returned') {
        return { error: { _form: ["L'aile n'est pas marquée comme envoyée."] } }
      }
      update.wing_returned_at = null
      update.status = ticket.workshop_decision === 'repair' ? 'workshop_done' : 'workshop_diagnosing'
      label = "Aile envoyée"
      break
  }

  const { error: updateError } = await supabase
    .from('service_requests')
    .update(update)
    .eq('id', ticketId)
  if (updateError) {
    return { error: { _form: [`Erreur lors du retour en arrière (${updateError.message})`] } }
  }

  await supabase.from('ticket_status_history').insert({
    ticket_id:  ticketId,
    old_status: requestStatusToSavStatus(ticket.status),
    new_status: requestStatusToSavStatus((update.status as RequestStatus | undefined) ?? ticket.status),
    changed_by: user.id,
    note:       `↩︎ Retour en arrière — étape « ${label} » annulée.`,
  })

  revalidateTicket(ticketId)
  return { success: true }
}

// ────────────────────────────────────────────────────────────────────────────
// Validation Plume HQ du remplacement (aile irréparable)
// ────────────────────────────────────────────────────────────────────────────
async function applyReplacementDecision(params: {
  ticketId:      string
  approved:      boolean
  refusalReason: string | null
}): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: { _form: ['Non authentifié'] } }

  const roles = await getCurrentUserRoles()
  if (!roles.includes('plume_admin')) {
    return { error: { _form: ['Action réservée à Plume HQ'] } }
  }

  const { data: ticket, error: fetchError } = await supabase
    .from('service_requests')
    .select('id, status, workshop_decision, plume_replacement_approved')
    .eq('id', params.ticketId)
    .single()
    .returns<{
      id:                         string
      status:                     RequestStatus
      workshop_decision:          WorkshopDecision | null
      plume_replacement_approved: boolean | null
    }>()
  if (fetchError || !ticket) return { error: { _form: ['Ticket introuvable'] } }

  if (ticket.workshop_decision !== 'replacement') {
    return {
      error: {
        _form: ["Ce ticket n'attend pas de validation de remplacement (décision atelier ≠ irréparable)."],
      },
    }
  }

  const { error: updateError } = await supabase
    .from('service_requests')
    .update({
      plume_replacement_approved:       params.approved,
      plume_replacement_approved_at:    new Date().toISOString(),
      plume_replacement_decided_by:     user.id,
      plume_replacement_refusal_reason: params.approved ? null : params.refusalReason,
    } satisfies TicketUpdate)
    .eq('id', params.ticketId)
  if (updateError) {
    return { error: { _form: [`Erreur lors de l'enregistrement (${updateError.message})`] } }
  }

  await supabase.from('ticket_status_history').insert({
    ticket_id:  params.ticketId,
    old_status: requestStatusToSavStatus(ticket.status),
    new_status: requestStatusToSavStatus(ticket.status),
    changed_by: user.id,
    note: params.approved
      ? '🦅 Remplacement validé par Plume HQ — l\'atelier peut renvoyer l\'aile.'
      : `🦅 Remplacement refusé par Plume HQ.\nMotif : ${params.refusalReason ?? '—'}`,
  })

  // Trace interne dans le fil — visible atelier + Plume.
  await supabase.from('ticket_messages').insert({
    ticket_id:        params.ticketId,
    sender_id:        user.id,
    sender_role:      'plume_admin' as MessageSenderRole,
    content:          params.approved
      ? '[Validation Plume HQ] Remplacement de l\'aile irréparable approuvé.'
      : `[Refus Plume HQ] Remplacement refusé.\nMotif : ${params.refusalReason ?? '—'}\n\nL'atelier doit revoir sa décision.`,
    is_internal:      true,
    visibility_level: 'workshop_plume',
    channel:          'workshop_plume',
  })

  revalidateTicket(params.ticketId)
  return { success: true }
}

export async function approveReplacementAction(formData: FormData): Promise<ActionResult> {
  const parsed = approveReplacementSchema.safeParse({ ticketId: formData.get('ticketId') })
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }
  return applyReplacementDecision({ ticketId: parsed.data.ticketId, approved: true, refusalReason: null })
}

export async function refuseReplacementAction(formData: FormData): Promise<ActionResult> {
  const parsed = refuseReplacementSchema.safeParse({
    ticketId: formData.get('ticketId'),
    reason:   formData.get('reason'),
  })
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }
  return applyReplacementDecision({
    ticketId:      parsed.data.ticketId,
    approved:      false,
    refusalReason: parsed.data.reason,
  })
}
