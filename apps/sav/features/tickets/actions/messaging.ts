'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserRoles } from '@/features/auth/queries'
import { PARTNER_WORKSHOPS } from '../constants'
import { getPartnerSchoolById } from '../queries'
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
  addMessageSchema,
  roleMessageSchema,
  updateStatusSchema,
} from '../schemas'
import { sendClientStepUpdateEmail, type ClientStepEmail, type TicketEmailContext } from '../email'
import { requestStatusToSavStatus } from './_helpers'

export async function addMessageAction(formData: FormData) {
  const parsed = addMessageSchema.safeParse({
    ticketId: formData.get('ticketId'),
    content: formData.get('content'),
  })
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: { _form: ['Non authentifiÃ©'] } }

  const { error } = await supabase.from('ticket_messages').insert({
    ticket_id: parsed.data.ticketId,
    sender_id: user.id,
    sender_role: 'client',
    content: parsed.data.content,
    is_internal: false,
    visibility_level: 'all',
  })

  if (error) return { error: { _form: ["Erreur lors de l'envoi du message"] } }

  revalidatePath(`/client/ticket/${parsed.data.ticketId}`)
  return { success: true }
}

export async function updateTicketStatusAction(formData: FormData) {
  const parsed = updateStatusSchema.safeParse({
    ticketId: formData.get('ticketId'),
    newStatus: formData.get('newStatus'),
    note: formData.get('note') || undefined,
  })
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: { _form: ['Non authentifiÃ©'] } }

  const { ticketId, newStatus, note } = parsed.data

  const { data: current, error: fetchError } = await supabase
    .from('service_requests')
    .select('status')
    .eq('id', ticketId)
    .single()
    .returns<{ status: RequestStatus }>()

  if (fetchError || !current) return { error: { _form: ['Ticket introuvable'] } }

  const newSavStatus = requestStatusToSavStatus(newStatus)

  const { error: updateError } = await supabase
    .from('service_requests')
    .update({
      status: newStatus,
    })
    .eq('id', ticketId)

  if (updateError) return { error: { _form: [`Erreur lors de la mise Ã  jour (${updateError.message})`] } }

  // Best-effort audit trail (table may not exist on legacy envs)
  const { error: histError } = await supabase.from('ticket_status_history').insert({
    ticket_id:  ticketId,
    old_status: requestStatusToSavStatus(current.status),
    new_status: newSavStatus,
    changed_by: user.id,
    note:       note ?? null,
  })
  if (histError) console.error('[SAV] ticket_status_history insert failed:', histError.message)

  revalidatePath(`/client/ticket/${ticketId}`)
  revalidatePath(`/school/ticket/${ticketId}`)
  revalidatePath(`/workshop/ticket/${ticketId}`)
  revalidatePath(`/plume`)
  revalidatePath(`/school`)
  revalidatePath(`/workshop`)
  return { success: true }
}

export async function addRoleMessageAction(formData: FormData) {
  const parsed = roleMessageSchema.safeParse({
    ticketId:        formData.get('ticketId'),
    content:         formData.get('content'),
    isInternal:      formData.get('isInternal'),
    senderRole:      formData.get('senderRole'),
    visibilityLevel: formData.get('visibilityLevel') || undefined,
  })
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: { _form: ['Non authentifiÃ©'] } }

  const { ticketId, content, isInternal, senderRole: requestedRole, visibilityLevel } = parsed.data

  // Trust the user's actual role(s), not the form payload, to prevent spoofing
  // and to re-tag plume_admin messages correctly when an admin uses the school /
  // workshop UI (the existing composers hardcode 'school' / 'workshop').
  const userRoles = await getCurrentUserRoles()
  const isAdmin   = userRoles.includes('plume_admin')

  let senderRole: MessageSenderRole
  if (isAdmin) {
    // Plume admin always posts as 'plume_admin' regardless of which dashboard
    // they're on. Their messages need to be unambiguously attributed for audit.
    senderRole = 'plume_admin'
  } else if (userRoles.includes(requestedRole)) {
    // Non-admin: requested role must match a role they actually own.
    senderRole = requestedRole
  } else if (requestedRole === 'client') {
    // Authenticated ticket owner without an explicit user_roles row â€” RLS still
    // enforces ownership (client_insert_messages requires service_request.client_id = auth.uid()).
    senderRole = 'client'
  } else {
    return { error: { _form: ["Vous n'avez pas le droit de poster avec ce rÃ´le."] } }
  }

  // Explicit visibility wins; otherwise fall back to a sender-role mapping.
  // Allowed values per CHECK constraint: 'all' | 'school_plume' | 'workshop_plume' | 'plume_only'.
  const visibility =
    visibilityLevel ??
    (isInternal
      ? senderRole === 'school'      ? 'school_plume'
      : senderRole === 'workshop'    ? 'workshop_plume'
      : senderRole === 'plume_admin' ? 'plume_only'
      : 'all'
      : 'all')

  const { error } = await supabase.from('ticket_messages').insert({
    ticket_id:        ticketId,
    sender_id:        user.id,
    sender_role:      senderRole,
    content,
    is_internal:      isInternal,
    visibility_level: visibility,
  })

  if (error) return { error: { _form: [`Erreur lors de l'envoi (${error.message})`] } }

  revalidatePath(`/school/ticket/${ticketId}`)
  revalidatePath(`/workshop/ticket/${ticketId}`)
  revalidatePath(`/client/ticket/${ticketId}`)
  return { success: true }
}


