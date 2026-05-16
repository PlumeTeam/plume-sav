'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserRoles } from '@/features/auth/queries'
import { statusGte } from '../utils'
import { requestStatusToSavStatus } from './_helpers'
import type { RequestStatus, TicketUpdate } from '../types'

// ─── Revert d'étape ──────────────────────────────────────────────────────────
//
// Permet à un atelier ou à une école de revenir en arrière dans le pipeline
// après avoir validé une étape par erreur. Le statut est ramené à l'état
// correspondant à l'étape ciblée, et tous les champs (timestamps,
// résolutions, décisions) saisis pour les étapes STRICTEMENT POSTÉRIEURES
// sont remis à null. Une trace est insérée dans ticket_status_history.
//
// L'action est volontairement permissive sur la fenêtre temporelle (pas de
// "tu as 24h") — c'est un outil de correction manuelle, le journal d'audit
// retrace toujours qui est revenu à quel état et quand.

const STATUSES_REVERTIBLE_BY_SCHOOL: readonly RequestStatus[] = [
  'school_acknowledged',
  'wing_received_school',
  'school_checking',
  'school_resolved',
]

const STATUSES_REVERTIBLE_BY_WORKSHOP: readonly RequestStatus[] = [
  'escalated_to_workshop',
  'wing_received_workshop',
  'workshop_pre_checking',
  'workshop_diagnosing',
  'workshop_repairing',
  'workshop_done',
  'wing_returned',
]

// Champs SET au moment d'entrer dans un statut. Quand on revient à un statut
// antérieur, tous les champs des statuts plus avancés sont nullifiés. L'ordre
// reflète le pipeline (cf. STATUS_ORDER dans utils.ts).
const FIELDS_BY_STATUS_ENTRY: Array<{ status: RequestStatus; fields: (keyof TicketUpdate)[] }> = [
  // ─── École ──────────────────────────────────────────────────────────────
  { status: 'school_acknowledged',  fields: ['school_acknowledged_at'] },
  { status: 'wing_received_school', fields: ['wing_received_school_at'] },
  // Note : school_checklist N'EST PAS effacé sur revert — le check terrain
  // peut servir à plusieurs résolutions successives et représente du travail
  // utilisateur précieux (photos + observations).
  { status: 'school_resolved', fields: [
      'school_resolved_at',
      'school_resolution',
      'school_resolution_note',
      'school_resolved_by',
  ] },
  // ─── Bascule école → atelier ────────────────────────────────────────────
  { status: 'escalated_to_workshop', fields: [
      'escalated_to_workshop_at',
      'assigned_workshop_id',
      'assigned_workshop_label',
      'workshop_assigned_at',
      'workshop_assigned_by',
  ] },
  // ─── Atelier ─────────────────────────────────────────────────────────────
  { status: 'wing_received_workshop', fields: ['wing_received_workshop_at'] },
  { status: 'workshop_pre_checking',  fields: ['pre_check_started_at'] },
  { status: 'workshop_diagnosing', fields: [
      'pre_check_completed_at',
      'pre_check_observations',
      'pre_check_fee_eur',
      'workshop_diagnosis_at',
      'workshop_decision',
      'workshop_decision_at',
      'workshop_decision_by',
      'workshop_decision_warranty_status',
      'workshop_decision_warranty_covered',
      'workshop_decision_note',
      'workshop_estimated_repair_cost',
      'workshop_repair_estimated_date',
      'plume_replacement_approved',
      'plume_replacement_approved_at',
      'plume_replacement_decided_by',
      'plume_replacement_refusal_reason',
  ] },
  { status: 'workshop_done',   fields: ['workshop_repair_done_at'] },
  { status: 'wing_returned',   fields: ['wing_returned_at', 'workshop_return_destination', 'workshop_shipping_prepared_at'] },
]

function clearForwardFields(target: RequestStatus): TicketUpdate {
  const payload: TicketUpdate = {}
  for (const { status: entryStatus, fields } of FIELDS_BY_STATUS_ENTRY) {
    // Champ entré APRÈS le statut cible → on le nullifie.
    if (entryStatus !== target && statusGte(entryStatus, target)) {
      for (const f of fields) {
        // TicketUpdate types are heterogeneous (string|null, number|null, json|null…)
        // — null est une valeur valide pour toutes les colonnes effacées ici.
        ;(payload as Record<string, unknown>)[f] = null
      }
    }
  }
  return payload
}

interface RevertResult {
  error?: { _form?: string[] }
  success?: true
}

export async function revertToStepAction(formData: FormData): Promise<RevertResult> {
  const ticketId     = String(formData.get('ticketId') ?? '')
  const targetStatus = String(formData.get('targetStatus') ?? '') as RequestStatus
  const stepLabel    = String(formData.get('stepLabel') ?? '').slice(0, 80)

  if (!ticketId) return { error: { _form: ['Identifiant manquant'] } }
  if (!targetStatus) return { error: { _form: ['Statut cible manquant'] } }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: { _form: ['Non authentifié'] } }

  const roles = await getCurrentUserRoles()
  const isAdmin    = roles.includes('plume_admin')
  const isWorkshop = roles.includes('workshop')
  const isSchool   = roles.includes('school')

  // Vérification du droit de revert sur ce statut spécifique. plume_admin
  // peut tout faire ; sinon le rôle doit matcher le segment du pipeline.
  const canRevert =
    isAdmin ||
    (isWorkshop && STATUSES_REVERTIBLE_BY_WORKSHOP.includes(targetStatus)) ||
    (isSchool   && STATUSES_REVERTIBLE_BY_SCHOOL.includes(targetStatus))
  if (!canRevert) {
    return { error: { _form: ["Vous n'avez pas le droit de revenir à cette étape."] } }
  }

  // Recharge le ticket pour avoir le statut courant (pour l'audit).
  const { data: ticket, error: fetchError } = await supabase
    .from('service_requests')
    .select('id, status')
    .eq('id', ticketId)
    .single()
    .returns<{ id: string; status: RequestStatus }>()
  if (fetchError || !ticket) {
    return { error: { _form: ['Ticket introuvable'] } }
  }

  // Refus : on n'autorise le revert que si le statut courant est strictement
  // postérieur au statut cible (sinon ce n'est pas un "retour", c'est une
  // avance ou un no-op).
  if (!statusGte(ticket.status, targetStatus) || ticket.status === targetStatus) {
    return { error: { _form: ['Le ticket n\'est pas plus avancé que cette étape.'] } }
  }

  const clearPayload = clearForwardFields(targetStatus)
  const updatePayload: TicketUpdate = {
    ...clearPayload,
    status: targetStatus,
  }

  const { error: updateError } = await supabase
    .from('service_requests')
    .update(updatePayload)
    .eq('id', ticketId)
  if (updateError) {
    return { error: { _form: [`Erreur lors de la mise à jour (${updateError.message})`] } }
  }

  // Audit : trace explicite du retour en arrière.
  const note = stepLabel
    ? `↩︎ Retour à l'étape « ${stepLabel} » (status: ${targetStatus})`
    : `↩︎ Retour au statut « ${targetStatus} »`
  const { error: histError } = await supabase.from('ticket_status_history').insert({
    ticket_id:  ticketId,
    old_status: requestStatusToSavStatus(ticket.status),
    new_status: requestStatusToSavStatus(targetStatus),
    changed_by: user.id,
    note,
  })
  if (histError) {
    console.error('[revertToStepAction] history insert failed:', histError.message)
  }

  revalidatePath(`/workshop/ticket/${ticketId}`)
  revalidatePath(`/school/ticket/${ticketId}`)
  revalidatePath(`/client/ticket/${ticketId}`)
  revalidatePath(`/plume/messages/${ticketId}`)
  return { success: true }
}
