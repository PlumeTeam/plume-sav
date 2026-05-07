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
  schoolChecklistSchema,
  schoolResolutionSchema,
  workshopChecklistSchema,
} from './schemas'
import type { MessageSenderRole, TicketStatus, ServiceType, ProblemCategory, TicketUpdate } from './types'
import type { RequestStatus, SchoolResolution } from './types'

// Maps school resolution outcome → request_status the ticket transitions into.
function resolutionToRequestStatus(r: SchoolResolution): RequestStatus {
  switch (r) {
    case 'resolved_by_school':         return 'completed'
    case 'normal_behavior_explained':  return 'completed'
    case 'escalated_to_workshop':      return 'approved'   // visible by workshop queue
    case 'escalated_to_plume':         return 'processing' // stays open, plume picks up
    default: {
      const _exhaustive: never = r
      return 'processing'
    }
  }
}

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
    urgency, photoPaths, schoolId, referentSchoolId,
    schoolChangeReasonCode, schoolChangeReasonNote, deliveryMethod,
  } = parsed.data

  const serviceType = deriveServiceType(problemCategory)

  // school_id references partner_schools(id); when the wizard sends a fallback
  // hardcoded id (no real partner_schools row), set null so we don't break FK.
  const persistedSchoolId = schoolId.startsWith('plume-default-') ? null : schoolId
  const persistedReferentSchoolId = referentSchoolId && !referentSchoolId.startsWith('plume-default-')
    ? referentSchoolId
    : null

  // Base payload: columns that exist since migration 20260429 / 20260503.
  // These are guaranteed in any deployed environment.
  const basePayload = {
    user_id: user.id,
    client_id: user.id,
    email: user.email ?? null,
    service_type: serviceType,
    status: 'pending' as RequestStatus,
    sav_status: 'submitted' as TicketStatus,
    product_brand: wingBrand,
    product_model: wingModel,
    serial_number: wingSerial,
    description: problemDescription,
    urgency_level: urgency === 'urgent' ? 2 : 1,
    purchase_date: purchaseDate,
    wing_brand: wingBrand,
    wing_model: wingModel,
    wing_size: wingSize,
    wing_color: wingColor,
    wing_serial_number: wingSerial,
    flight_hours_estimate: flightHours ?? null,
    problem_category: problemCategory,
    problem_description: problemDescription,
    urgency,
    school_id: persistedSchoolId,
  }

  // Recent-migration columns: 20260507000000 (school_change_*) + 20260507100000 (delivery_method).
  // If those migrations aren't applied yet on the target env, the first insert fails
  // with "column does not exist" — we then retry with basePayload only.
  const recentColumns = {
    referent_school_id:        persistedReferentSchoolId,
    school_change_reason_code: schoolChangeReasonCode ?? null,
    school_change_reason_note: schoolChangeReasonNote ?? null,
    delivery_method:           deliveryMethod,
  }

  let ticket: { id: string } | null = null
  let ticketError: { message: string; code?: string } | null = null

  // Tier 1: full payload (all migrations applied)
  {
    const r = await supabase
      .from('service_requests')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert({ ...basePayload, ...recentColumns } as any)
      .select('id')
      .single()
    ticket = r.data
    ticketError = r.error
  }

  // Tier 2: retry without recent columns if the failure looks like a missing column
  if (ticketError) {
    const msg = ticketError.message ?? ''
    const looksLikeMissingColumn =
      ticketError.code === '42703'   ||
      ticketError.code === 'PGRST204' ||
      /column .* does not exist/i.test(msg) ||
      /could not find the .* column/i.test(msg)

    if (looksLikeMissingColumn) {
      console.warn('createTicketAction: retrying without recent columns —', msg)
      const r = await supabase
        .from('service_requests')
        .insert(basePayload)
        .select('id')
        .single()
      ticket = r.data
      ticketError = r.error
    }
  }

  if (ticketError || !ticket) {
    console.error('createTicketAction error:', ticketError)
    // Surface the underlying DB message so the client can report it.
    const detail = ticketError?.message ? ` (${ticketError.message})` : ''
    return { error: { _form: [`Erreur lors de la création du ticket${detail}`] } }
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

// ============================================================
// Workflow diagnostic école / atelier (migration 20260503120000)
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
  if (!user) return { error: { _form: ['Non authentifié'] } }

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
  })
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: { _form: ['Non authentifié'] } }

  const { ticketId, resolution, note, workshopId, workshopLabel } = parsed.data
  const newStatus = resolutionToRequestStatus(resolution)
  const newSavStatus = (() => {
    switch (resolution) {
      case 'resolved_by_school':
      case 'normal_behavior_explained':
        return 'closed' as TicketStatus
      case 'escalated_to_workshop':
        return 'repair_in_progress' as TicketStatus
      case 'escalated_to_plume':
        return 'in_review' as TicketStatus
    }
  })()

  const now = new Date().toISOString()
  const update: TicketUpdate = {
    school_resolution:      resolution,
    school_resolution_note: note ?? null,
    school_resolved_at:     now,
    school_resolved_by:     user.id,
    status:                 newStatus,
    sav_status:             newSavStatus,
  }
  if (resolution === 'escalated_to_workshop') {
    update.assigned_workshop_id    = workshopId ?? null
    update.assigned_workshop_label = workshopLabel ?? null
    update.workshop_assigned_at    = now
    update.workshop_assigned_by    = user.id
  }

  const { error } = await supabase
    .from('service_requests')
    .update(update)
    .eq('id', ticketId)

  if (error) return { error: { _form: ['Erreur lors de la résolution'] } }

  await supabase.from('ticket_status_history').insert({
    ticket_id:  ticketId,
    old_status: null,
    new_status: newSavStatus,
    changed_by: user.id,
    note:       note ? `[${resolution}] ${note}` : `[${resolution}]`,
  })

  revalidatePath(`/school/ticket/${ticketId}`)
  revalidatePath(`/workshop/ticket/${ticketId}`)
  revalidatePath(`/client/ticket/${ticketId}`)
  revalidatePath('/school')
  revalidatePath('/workshop')
  revalidatePath('/plume')
  return { success: true }
}

export async function saveWorkshopChecklistAction(formData: FormData) {
  const parsed = workshopChecklistSchema.safeParse({
    ticketId:   formData.get('ticketId'),
    checkedIds: formData.getAll('checkedIds'),
    notes:      formData.get('notes') || undefined,
  })
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: { _form: ['Non authentifié'] } }

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
