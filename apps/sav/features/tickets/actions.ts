'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  createTicketSchema,
  addMessageSchema,
  updateStatusSchema,
  roleMessageSchema,
  diagnosisSchema,
} from './schemas'
import type { MessageSenderRole, TicketStatus, ServiceType, ProblemCategory } from './types'
import type { RequestStatus } from './types'

// Maps SAV problem category to the shared-platform service_type enum.
// 'porosity' is excluded from the client wizard (staff-only diagnosis), so
// the wizard never reaches this function with that value.
function deriveServiceType(category: ProblemCategory): ServiceType {
  if (['tear', 'line_issue', 'riser_issue', 'buckle_issue'].includes(category)) return 'repair'
  return 'sav'
}

// Maps the request_status (used by UI + actions) to the SAV ticket_status enum
// so both columns stay in sync. Read by status_history triggers + cross-app queries.
function requestStatusToSavStatus(status: RequestStatus): TicketStatus {
  switch (status) {
    case 'pending':    return 'submitted'
    case 'processing': return 'in_review'
    case 'approved':   return 'diagnosed'
    case 'completed':  return 'closed'
    case 'rejected':   return 'rejected'
    case 'cancelled':  return 'closed'
    default:           return 'submitted'
  }
}

export async function createTicketAction(input: unknown) {
  const parsed = createTicketSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: { _form: ['Non authentifié'] } }

  const {
    wingBrand, wingModel, wingSize, wingSerial, wingColor,
    purchaseDate, flightHours, problemCategory, problemDescription,
    urgency, photoPaths,
  } = parsed.data

  const serviceType = deriveServiceType(problemCategory)

  const { data: ticket, error: ticketError } = await supabase
    .from('service_requests')
    .insert({
      user_id: user.id,
      client_id: user.id,
      email: user.email ?? null,
      service_type: serviceType,
      status: 'pending',
      sav_status: 'submitted',
      // Standard columns (request_status side)
      product_brand: wingBrand,
      product_model: wingModel,
      serial_number: wingSerial,
      description: problemDescription,
      urgency_level: urgency === 'urgent' ? 2 : 1,
      purchase_date: purchaseDate,
      // SAV-specific columns (used by school/workshop dashboards + filters)
      wing_brand: wingBrand,
      wing_model: wingModel,
      wing_size: wingSize,
      wing_color: wingColor,
      wing_serial_number: wingSerial,
      flight_hours_estimate: flightHours,
      problem_category: problemCategory,
      problem_description: problemDescription,
      urgency,
    })
    .select('id')
    .single()

  if (ticketError || !ticket) {
    console.error('createTicketAction error:', ticketError?.message)
    return { error: { _form: ['Erreur lors de la création du ticket'] } }
  }

  if (photoPaths.length > 0) {
    const photoRows = photoPaths.map((p, idx) => ({
      ticket_id: ticket.id,
      storage_path: p.storagePath,
      photo_type: p.photoType,
      caption: p.caption ?? null,
      sort_order: idx,
    }))
    const { error: photoError } = await supabase.from('ticket_photos').insert(photoRows)
    if (photoError) console.error('Photo insert failed:', photoError.message)
  }

  await supabase.from('ticket_status_history').insert({
    ticket_id: ticket.id,
    old_status: null,
    new_status: 'submitted',
    changed_by: user.id,
  })

  revalidatePath('/client')
  redirect(`/client/ticket/${ticket.id}`)
}

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
  if (!user) return { error: { _form: ['Non authentifié'] } }

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
  if (!user) return { error: { _form: ['Non authentifié'] } }

  const { ticketId, newStatus, note } = parsed.data

  const { data: current, error: fetchError } = await supabase
    .from('service_requests')
    .select('status, sav_status')
    .eq('id', ticketId)
    .single()
    .returns<{ status: RequestStatus; sav_status: TicketStatus }>()

  if (fetchError || !current) return { error: { _form: ['Ticket introuvable'] } }

  const newSavStatus = requestStatusToSavStatus(newStatus)

  const { error: updateError } = await supabase
    .from('service_requests')
    .update({
      status: newStatus,
      sav_status: newSavStatus,
    })
    .eq('id', ticketId)

  if (updateError) return { error: { _form: ['Erreur lors de la mise à jour'] } }

  // Best-effort audit trail; non-blocking if RLS denies (handled at policy level).
  await supabase.from('ticket_status_history').insert({
    ticket_id: ticketId,
    old_status: current.sav_status,
    new_status: newSavStatus,
    changed_by: user.id,
    note: note ?? null,
  })

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
    ticketId: formData.get('ticketId'),
    content: formData.get('content'),
    isInternal: formData.get('isInternal'),
    senderRole: formData.get('senderRole'),
  })
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: { _form: ['Non authentifié'] } }

  const { ticketId, content, isInternal, senderRole } = parsed.data

  const { error } = await supabase.from('ticket_messages').insert({
    ticket_id: ticketId,
    sender_id: user.id,
    sender_role: senderRole as MessageSenderRole,
    content,
    is_internal: isInternal,
    visibility_level: isInternal ? senderRole : 'all',
  })

  if (error) return { error: { _form: ["Erreur lors de l'envoi"] } }

  revalidatePath(`/school/ticket/${ticketId}`)
  revalidatePath(`/workshop/ticket/${ticketId}`)
  revalidatePath(`/client/ticket/${ticketId}`)
  return { success: true }
}

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
  if (!user) return { error: { _form: ['Non authentifié'] } }

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
