'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserRoles } from '@/features/auth/queries'
import { getPartnerSchoolById } from '../queries'
import type {
  ClientShippingAddress,
  MessageChannel,
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
  channelMessageSchema,
  roleMessageSchema,
  updateStatusSchema,
} from '../schemas'
import {
  ROLE_CHANNELS,
  visibilityLevelForChannel,
  type ChannelRole,
} from '../channels'
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
    // Client → école par défaut. Le canal client↔atelier n'est ouvert
    // qu'après mise en relation par l'école, depuis un composer dédié.
    channel: 'school_client',
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
    channel:         formData.get('channel') || undefined,
  })
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: { _form: ['Non authentifié'] } }

  const { ticketId, content, isInternal, senderRole: requestedRole, visibilityLevel, channel } = parsed.data

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
    // Authenticated ticket owner without an explicit user_roles row — RLS still
    // enforces ownership (client_insert_messages requires service_request.client_id = auth.uid()).
    senderRole = 'client'
  } else {
    return { error: { _form: ["Vous n'avez pas le droit de poster avec ce rôle."] } }
  }

  // Validation 5-canaux : si un `channel` est fourni, le rôle effectif doit
  // figurer dans l'allowlist. Plume admin court-circuite cette vérification.
  if (channel && !isAdmin) {
    const channelRole: ChannelRole | null =
      senderRole === 'client'   ? 'client'
      : senderRole === 'school' ? 'school'
      : senderRole === 'workshop' ? 'workshop'
      : null
    if (!channelRole) {
      return { error: { _form: ["Rôle inconnu pour ce canal."] } }
    }
    const allowed = ROLE_CHANNELS[channelRole] as readonly string[]
    if (!allowed.includes(channel)) {
      return { error: { _form: ["Vous n'avez pas accès à ce canal."] } }
    }
  }

  // Garde-fou supplémentaire : le canal client_workshop n'est activé qu'une
  // fois la mise en relation faite par l'école (assigned_workshop_id != null).
  if (channel === 'client_workshop') {
    const { data: ticketRow } = await supabase
      .from('service_requests')
      .select('assigned_workshop_id')
      .eq('id', ticketId)
      .maybeSingle()
      .returns<{ assigned_workshop_id: string | null }>()
    if (!ticketRow?.assigned_workshop_id) {
      return { error: { _form: ["Ce canal n'est pas encore actif (atelier non assigné)."] } }
    }
  }

  // Détermine visibility_level : channel-aware si fourni, sinon legacy.
  // visibility_level reste obligatoire (CHECK constraint sur la colonne).
  const visibility = channel
    ? visibilityLevelForChannel(channel as MessageChannel)
    : (visibilityLevel ??
      (isInternal
        ? senderRole === 'school'      ? 'school_plume'
        : senderRole === 'workshop'    ? 'workshop_plume'
        : senderRole === 'plume_admin' ? 'plume_only'
        : 'all'
        : 'all'))

  const { error } = await supabase.from('ticket_messages').insert({
    ticket_id:        ticketId,
    sender_id:        user.id,
    sender_role:      senderRole,
    content,
    is_internal:      isInternal,
    visibility_level: visibility,
    channel:          channel ?? null,
  })

  if (error) return { error: { _form: [`Erreur lors de l'envoi (${error.message})`] } }

  revalidatePath(`/school/ticket/${ticketId}`)
  revalidatePath(`/workshop/ticket/${ticketId}`)
  revalidatePath(`/client/ticket/${ticketId}`)
  return { success: true }
}

// ============================================================
// T3 — Discussion par canal explicite (atelier)
// ============================================================
// Poste un message sur un canal nommé (school_client, client_workshop,
// workshop_school, group, workshop_plume). Le sender_role est dérivé du
// rôle authentifié — pas du formulaire — pour éviter l'usurpation.
// La RLS finit le contrôle (cf. migration 20260512000000).
export async function addChannelMessageAction(formData: FormData) {
  const attachmentPathsRaw = formData.getAll('attachmentPaths').map((v) => String(v))

  const parsed = channelMessageSchema.safeParse({
    ticketId:        formData.get('ticketId'),
    channel:         formData.get('channel'),
    content:         formData.get('content') ?? '',
    attachmentPaths: attachmentPathsRaw,
  })
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: { _form: ['Non authentifié'] } }

  const { ticketId, channel, content, attachmentPaths } = parsed.data

  // Dérive le sender_role du rôle effectif. plume_admin tag toujours
  // 'plume_admin' ; atelier → 'workshop' ; école → 'school' ; sinon 'client'.
  const userRoles = await getCurrentUserRoles()
  let senderRole: MessageSenderRole
  if (userRoles.includes('plume_admin')) {
    senderRole = 'plume_admin'
  } else if (userRoles.includes('workshop')) {
    senderRole = 'workshop'
  } else if (userRoles.includes('school')) {
    senderRole = 'school'
  } else {
    senderRole = 'client'
  }

  // Mapping de cohérence visibility_level — utile pour les rôles qui
  // continuent à lire via le système legacy (UI client/école pas encore
  // refondues). On garde une visibilité large quand le canal inclut le
  // client (school_client, client_workshop, group), restrictive sinon.
  const visibilityLevel =
    channel === 'group' || channel === 'school_client' || channel === 'client_workshop'
      ? 'all'
      : channel === 'workshop_plume'
        ? 'plume_only'
        : 'workshop_plume'

  const { error } = await supabase.from('ticket_messages').insert({
    ticket_id:        ticketId,
    sender_id:        user.id,
    sender_role:      senderRole,
    content:          content || '(photo)',
    is_internal:      visibilityLevel !== 'all',
    visibility_level: visibilityLevel,
    channel:          channel as MessageChannel,
    attachment_paths: attachmentPaths,
  })

  if (error) {
    return { error: { _form: [`Erreur lors de l'envoi (${error.message})`] } }
  }

  revalidatePath(`/workshop/ticket/${ticketId}`)
  revalidatePath(`/school/ticket/${ticketId}`)
  revalidatePath(`/client/ticket/${ticketId}`)
  revalidatePath(`/plume/messages/${ticketId}`)
  return { success: true }
}
