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
  assignWorkshopSchema,
} from './schemas'
import type { MessageSenderRole, TicketStatus, ServiceType, ProblemCategory, TicketUpdate } from './types'
import type { RequestStatus, SchoolResolution } from './types'
import { resolveClientIdentity } from '@/features/auth/identity'

// Maps school resolution outcome → request_status the ticket transitions into.
function resolutionToRequestStatus(r: SchoolResolution): RequestStatus {
  switch (r) {
    case 'resolved_by_school':         return 'completed'
    case 'normal_behavior_explained':  return 'completed'
    case 'escalated_to_workshop':      return 'approved'    // visible by workshop queue
    case 'escalated_to_plume':         return 'processing'  // stays open, plume picks up
    case 'workshop_advice_requested':  return 'processing'  // school keeps the wing, just asks for input
    case 'reflection':                 return 'processing'  // école n'a pas encore décidé
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

const PROBLEM_CATEGORY_LABELS: Record<ProblemCategory, string> = {
  tear:         'Déchirure',
  line_issue:   'Suspente',
  riser_issue:  'Élévateur',
  buckle_issue: 'Boucle',
  porosity:     'Porosité',
  other:        'Comportement',
}

const BEHAVIOR_LABELS_BY_ID: Record<string, string> = {
  not_straight:    'Aile qui ne vole pas droit',
  too_fragile:     'Aile trop fragile',
  lazy_inflation:  'Aile trop paresseuse au gonflage',
  closes_easily:   'Aile qui ferme facilement',
  unstable:        'Aile instable en turbulence',
  brake_issue:     'Problème de freins',
  speed_issue:     'Vitesse anormale',
  other_behavior:  'Autre comportement inhabituel',
}

// The DB only has a single `description` TEXT column for narrative — no dedicated
// problem_category, wing_size, wing_color, flight_hours, etc. We fold all the
// wizard metadata into a structured prefix the school can read, then append the
// client's free text.
function buildRichDescription(input: {
  problemCategory: ProblemCategory
  urgency:         'normal' | 'urgent'
  freeText:        string
  wingBrand?:      string
  wingModel?:      string
  wingSize?:       string
  wingColor?:      string
  flightHours?:    number | null
  wingBehaviors?:  string[]
}): string {
  const lines: string[] = []
  lines.push(`[Catégorie] ${PROBLEM_CATEGORY_LABELS[input.problemCategory] ?? input.problemCategory}`)
  lines.push(`[Urgence] ${input.urgency === 'urgent' ? 'Urgent' : 'Normal'}`)

  const aile = [input.wingBrand, input.wingModel, input.wingSize && `Taille ${input.wingSize}`, input.wingColor]
    .filter(Boolean).join(' — ')
  if (aile) lines.push(`[Aile] ${aile}`)

  if (input.flightHours != null) {
    lines.push(`[Heures de vol] ${input.flightHours} h`)
  }

  if (input.wingBehaviors && input.wingBehaviors.length > 0) {
    const labels = input.wingBehaviors
      .map((id) => BEHAVIOR_LABELS_BY_ID[id] ?? id)
      .join(', ')
    lines.push(`[Comportements] ${labels}`)
  }

  return `${lines.join('\n')}\n\n---\n\n${input.freeText}`
}

export async function createTicketAction(input: unknown) {
  const parsed = createTicketSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: { _form: ['Non authentifié'] } }

  const identity = await resolveClientIdentity(supabase, user)

  const {
    wingBrand, wingModel, wingSize, wingSerial, wingColor,
    purchaseDate, flightHours, problemCategory, problemDescription,
    urgency, photoPaths, schoolId, referentSchoolId: _ignoredReferentId,
    schoolChangeReasonCode, schoolChangeReasonNote, deliveryMethod,
    wingBehaviors,
  } = parsed.data

  const serviceType = deriveServiceType(problemCategory)

  // The DB has a single `referent_school_id` column (no separate `school_id`).
  // We use it for the school that actually handles the ticket — i.e. the one
  // chosen by the client (`schoolId`). When that's a fallback hardcoded id
  // (no row in partner_schools), persist null so the FK isn't violated.
  const persistedSchoolId = schoolId.startsWith('plume-default-') ? null : schoolId

  // Build the rich description that folds all wizard metadata (category,
  // urgency, wing size/colour, flight hours, behaviors) into the single
  // narrative column the DB actually has.
  const richDescription = buildRichDescription({
    problemCategory,
    urgency,
    freeText:    problemDescription,
    wingBrand,
    wingModel,
    wingSize,
    wingColor,
    flightHours: flightHours ?? null,
    wingBehaviors,
  })

  // Insert payload — restricted to columns that actually exist in
  // public.service_requests on the live DB. NOT NULL columns covered:
  // user_id, service_type, first_name, last_name, email, phone, description.
  const insertPayload = {
    user_id:        user.id,
    first_name:     identity.firstName,
    last_name:      identity.lastName,
    email:          identity.email,
    phone:          identity.phone, // '' when unknown — column is NOT NULL
    service_type:   serviceType,
    status:         'pending' as RequestStatus,
    product_brand:  wingBrand,
    product_model:  wingModel,
    serial_number:  wingSerial,
    description:    richDescription,
    urgency_level:  urgency === 'urgent' ? 2 : 1,
    purchase_date:  purchaseDate,
    // Recent migrations
    referent_school_id:        persistedSchoolId,
    school_change_reason_code: schoolChangeReasonCode ?? null,
    school_change_reason_note: schoolChangeReasonNote ?? null,
    delivery_method:           deliveryMethod,
  }

  const { data: ticket, error: ticketError } = await supabase
    .from('service_requests')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .insert(insertPayload as any)
    .select('id')
    .single<{ id: string }>()

  if (ticketError || !ticket) {
    console.error('createTicketAction error:', ticketError)
    const detail = ticketError?.message ? ` (${ticketError.message})` : ''
    return { error: { _form: [`Erreur lors de la création du ticket${detail}`] } }
  }

  // Photos: separate ticket_photos table (best-effort — failure shouldn't
  // block the ticket since it's already created)
  if (photoPaths.length > 0) {
    const photoRows = photoPaths.map((p, idx) => ({
      ticket_id:    ticket.id,
      storage_path: p.storagePath,
      photo_type:   p.photoType,
      caption:      p.caption ?? null,
      sort_order:   idx,
    }))
    const { error: photoError } = await supabase.from('ticket_photos').insert(photoRows)
    if (photoError) console.warn('Photo insert failed:', photoError.message)
  }

  // Audit trail (best-effort — table may not exist on legacy envs)
  const { error: histError } = await supabase.from('ticket_status_history').insert({
    ticket_id:  ticket.id,
    old_status: null,
    new_status: 'submitted',
    changed_by: user.id,
  })
  if (histError) console.warn('ticket_status_history insert failed:', histError.message)

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

  if (updateError) return { error: { _form: [`Erreur lors de la mise à jour (${updateError.message})`] } }

  // Best-effort audit trail (table may not exist on legacy envs)
  const { error: histError } = await supabase.from('ticket_status_history').insert({
    ticket_id:  ticketId,
    old_status: requestStatusToSavStatus(current.status),
    new_status: newSavStatus,
    changed_by: user.id,
    note:       note ?? null,
  })
  if (histError) console.warn('ticket_status_history insert failed:', histError.message)

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
  if (!user) return { error: { _form: ['Non authentifié'] } }

  const { ticketId, content, isInternal, senderRole, visibilityLevel } = parsed.data

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
    sender_role:      senderRole as MessageSenderRole,
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
    isPlumeUrgent: formData.get('isPlumeUrgent') || undefined,
  })
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: { _form: ['Non authentifié'] } }

  const { ticketId, resolution, note, workshopId, workshopLabel, isPlumeUrgent } = parsed.data
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
      console.warn('applySchoolResolutionAction: retrying without is_plume_urgent —', error.message)
      const legacyUpdate: TicketUpdate = { ...fullUpdate }
      delete legacyUpdate.is_plume_urgent
      const r = await supabase.from('service_requests').update(legacyUpdate).eq('id', ticketId)
      error = r.error
    }
  }

  if (error) return { error: { _form: [`Erreur lors de la résolution (${error.message})`] } }

  // Best-effort audit trail
  const { error: histError } = await supabase.from('ticket_status_history').insert({
    ticket_id:  ticketId,
    old_status: null,
    new_status: newSavStatus,
    changed_by: user.id,
    note:       note ? `[${resolution}] ${note}` : `[${resolution}]`,
  })
  if (histError) console.warn('ticket_status_history insert failed:', histError.message)

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

// École : assigne un atelier au ticket pour la communication, sans escalade.
// Utilisé par le picker du composer "Communiquer avec l'atelier" — l'école
// choisit son interlocuteur, sans verrouiller la décision finale (qui reste
// gérée par applySchoolResolutionAction).
export async function assignWorkshopForCommunicationAction(formData: FormData) {
  const parsed = assignWorkshopSchema.safeParse({
    ticketId:      formData.get('ticketId'),
    workshopId:    formData.get('workshopId'),
    workshopLabel: formData.get('workshopLabel'),
  })
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: { _form: ['Non authentifié'] } }

  const { ticketId, workshopId, workshopLabel } = parsed.data
  const now = new Date().toISOString()

  const { error } = await supabase
    .from('service_requests')
    .update({
      assigned_workshop_id:    workshopId,
      assigned_workshop_label: workshopLabel,
      workshop_assigned_at:    now,
      workshop_assigned_by:    user.id,
    })
    .eq('id', ticketId)

  if (error) return { error: { _form: [`Erreur lors de l'assignation (${error.message})`] } }

  revalidatePath(`/school/ticket/${ticketId}`)
  revalidatePath(`/workshop/ticket/${ticketId}`)
  return { success: true }
}
