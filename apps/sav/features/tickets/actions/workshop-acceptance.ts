'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserRoles, getCurrentUserWorkshopId } from '@/features/auth/queries'
import type { RequestStatus, TicketUpdate } from '../types'
import {
  acceptWorkshopAssignmentSchema,
  refuseWorkshopAssignmentSchema,
} from '../schemas'

// ============================================================
// Validation atelier d'une demande escaladée (migration 20260516000000)
// ============================================================
//
// Quand l'école escalade un ticket (school_resolution = 'escalated_to_workshop'),
// l'atelier assigné doit confirmer qu'il accepte la demande AVANT que l'école
// ne génère le bon de transport. Trois états sur `workshop_accepted` :
//   NULL  → en attente
//   TRUE  → accepté — l'école peut imprimer le ticket d'envoi
//   FALSE → refusé  — `workshop_refusal_reason` explique ; l'école réoriente
//
// L'action est réservée aux rôles `workshop` et `plume_admin`.

async function applyWorkshopAcceptanceDecision(params: {
  ticketId: string
  accepted: boolean
  refusalReason: string | null
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: { _form: ['Non authentifié'] } }

  const roles = await getCurrentUserRoles()
  if (!roles.includes('workshop') && !roles.includes('plume_admin')) {
    return { error: { _form: ["Action réservée à l'atelier"] } }
  }

  // Le ticket doit être escaladé vers un atelier — sinon la validation n'a
  // pas de sens (pas d'escalade, ou déjà réceptionné à l'atelier).
  const { data: ticket, error: fetchError } = await supabase
    .from('service_requests')
    .select('id, status, assigned_workshop_id')
    .eq('id', params.ticketId)
    .maybeSingle()
    .returns<{ id: string; status: RequestStatus; assigned_workshop_id: string | null }>()

  if (fetchError || !ticket) {
    return { error: { _form: ['Demande introuvable'] } }
  }
  if (ticket.status !== 'escalated_to_workshop') {
    return {
      error: {
        _form: ["Cette demande n'est pas en attente de validation atelier."],
      },
    }
  }

  // Un atelier ne valide que SES demandes. plume_admin n'est pas scopé (rôle
  // transverse). Atelier non rattaché à partner_workshops → pas de scoping
  // possible, on laisse passer (la RLS reste la dernière barrière).
  if (!roles.includes('plume_admin')) {
    const myWorkshopId = await getCurrentUserWorkshopId()
    if (
      myWorkshopId &&
      ticket.assigned_workshop_id &&
      ticket.assigned_workshop_id !== myWorkshopId
    ) {
      return { error: { _form: ['Cette demande est assignée à un autre atelier.'] } }
    }
  }

  const update: TicketUpdate = {
    workshop_accepted:       params.accepted,
    workshop_refusal_reason: params.accepted ? null : params.refusalReason,
    workshop_accepted_at:    new Date().toISOString(),
    workshop_accepted_by:    user.id,
  }

  const { error: updateError } = await supabase
    .from('service_requests')
    .update(update)
    .eq('id', params.ticketId)

  if (updateError) {
    return { error: { _form: [`Erreur lors de l'enregistrement (${updateError.message})`] } }
  }

  // Trace publique dans le canal `group` (visible école + client + Plume).
  // Best-effort : ne bloque jamais le retour de l'action.
  const { error: msgError } = await supabase.from('ticket_messages').insert({
    ticket_id:        params.ticketId,
    sender_id:        user.id,
    sender_role:      'workshop',
    content:          params.accepted
      ? "✅ L'atelier a accepté la demande — l'aile peut être envoyée."
      : `⛔ L'atelier ne peut pas prendre la demande.\nMotif : ${params.refusalReason ?? '—'}`,
    is_internal:      false,
    visibility_level: 'all',
    channel:          'group',
  })
  if (msgError) {
    console.error('[applyWorkshopAcceptanceDecision] message insert failed:', msgError.message)
  }

  revalidatePath(`/school/ticket/${params.ticketId}`)
  revalidatePath(`/workshop/ticket/${params.ticketId}`)
  revalidatePath('/school')
  revalidatePath('/workshop')
  revalidatePath('/plume')
  return { success: true as const }
}

export async function acceptWorkshopAssignmentAction(formData: FormData) {
  const parsed = acceptWorkshopAssignmentSchema.safeParse({
    ticketId: formData.get('ticketId'),
  })
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }
  return applyWorkshopAcceptanceDecision({
    ticketId:      parsed.data.ticketId,
    accepted:      true,
    refusalReason: null,
  })
}

export async function refuseWorkshopAssignmentAction(formData: FormData) {
  const parsed = refuseWorkshopAssignmentSchema.safeParse({
    ticketId: formData.get('ticketId'),
    reason:   formData.get('reason'),
  })
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }
  return applyWorkshopAcceptanceDecision({
    ticketId:      parsed.data.ticketId,
    accepted:      false,
    refusalReason: parsed.data.reason,
  })
}
