'use server'

import { revalidatePath } from 'next/cache'
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
  generateShippingLabelSchema,
  adminReassignSchoolSchema,
  adminCloseTicketSchema,
  adminRemindSchoolSchema,
} from './schemas'
import { getCurrentUserRoles } from '@/features/auth/queries'
import type { MessageSenderRole, TicketStatus, ServiceType, ProblemCategory, TicketUpdate, WizardProblemCategory } from './types'
import type { RequestStatus, SchoolResolution, ClientShippingAddress, ShipmentLeg } from './types'
import { PARTNER_WORKSHOPS } from './constants'
import { resolveClientIdentity } from '@/features/auth/identity'
import {
  sendClientConfirmationEmail,
  sendSchoolNotificationEmail,
  sendClientStepUpdateEmail,
  type ClientStepEmail,
  type TicketEmailContext,
} from './email'
import { getPartnerSchoolById } from './queries'

// Maps school resolution outcome → request_status the ticket transitions into.
// Aligned with the new step pipeline (migration 20260509000000).
function resolutionToRequestStatus(r: SchoolResolution): RequestStatus {
  switch (r) {
    case 'resolved_by_school':         return 'school_resolved'      // école clôt sur place
    case 'normal_behavior_explained':  return 'school_resolved'      // idem — pas de réparation
    case 'escalated_to_workshop':      return 'escalated_to_workshop' // visible par l'atelier
    case 'escalated_to_plume':         return 'processing'            // reste ouvert, Plume reprend
    case 'workshop_advice_requested':  return 'processing'            // école garde l'aile, demande un avis
    case 'reflection':                 return 'processing'            // école n'a pas encore décidé
    default: {
      const _exhaustive: never = r
      return 'processing'
    }
  }
}

// Maps SAV problem category to the shared-platform service_type enum.
// 'porosity' is excluded from the client wizard (staff-only diagnosis), so
// the wizard never reaches this function with that value. 'fabric_issue'
// is wizard-only ("Tissu") and behaves like the other physical-damage
// categories — it routes to 'repair'.
function deriveServiceType(category: WizardProblemCategory): ServiceType {
  if (['tear', 'fabric_issue', 'line_issue', 'riser_issue'].includes(category)) return 'repair'
  return 'sav'
}

// Maps the request_status (used by UI + actions) to the SAV ticket_status enum
// so both columns stay in sync. Read by status_history triggers + cross-app queries.
function requestStatusToSavStatus(status: RequestStatus): TicketStatus {
  switch (status) {
    case 'pending':                 return 'submitted'
    case 'school_acknowledged':     return 'submitted'
    case 'wing_received_school':    return 'in_review'
    case 'school_checking':         return 'in_review'
    case 'processing':              return 'in_review'
    case 'approved':                return 'diagnosed'
    case 'school_resolved':         return 'closed'
    case 'escalated_to_workshop':   return 'diagnosed'
    case 'wing_received_workshop':  return 'in_review'
    case 'workshop_diagnosing':     return 'in_review'
    case 'workshop_repairing':      return 'repair_in_progress'
    case 'workshop_done':           return 'repaired'
    case 'wing_returned':           return 'shipped'
    case 'completed':               return 'closed'
    case 'rejected':                return 'rejected'
    case 'cancelled':               return 'closed'
    default:                        return 'submitted'
  }
}

const PROBLEM_CATEGORY_LABELS: Record<WizardProblemCategory, string> = {
  tear:         'Déchirure',
  fabric_issue: 'Tissu',
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

const WATER_CONTACT_LABELS: Record<string, string> = {
  none:  'Non',
  fresh: 'Eau douce',
  salt:  'Eau salée',
}

const SURFACE_CONTACT_LABELS: Record<string, string> = {
  none:  'Non',
  sand:  'Sable / dunes',
  snow:  'Neige',
  other: 'Autre',
}

const CONDITION_LABELS: Record<string, string> = {
  excellent: 'Excellent',
  good:      'Bon',
  worn:      'Usé',
  bad:       'Mauvais',
}

type WingHistoryInput = {
  flightHours?:        string
  flightCount?:        string
  alreadyRepaired?:    'yes' | 'no' | null
  repairDescription?:  string
  waterContact?:       'none' | 'fresh' | 'salt' | null
  treeContact?:        'yes' | 'no' | null
  surfaceContact?:     'none' | 'sand' | 'snow' | 'other' | null
  surfaceContactNote?: string
  generalCondition?:   'excellent' | 'good' | 'worn' | 'bad' | null
}

function formatWingHistory(h: WingHistoryInput | undefined): string[] {
  if (!h) return []
  const lines: string[] = []
  if (h.flightHours)     lines.push(`  • Heures de vol : ${h.flightHours} h`)
  if (h.flightCount)     lines.push(`  • Nombre de vols : ${h.flightCount}`)
  if (h.alreadyRepaired === 'yes') {
    const repairLine = h.repairDescription
      ? `  • Déjà réparée : oui — ${h.repairDescription}`
      : `  • Déjà réparée : oui`
    lines.push(repairLine)
  } else if (h.alreadyRepaired === 'no') {
    lines.push('  • Déjà réparée : non')
  }
  if (h.waterContact) {
    lines.push(`  • Contact avec l'eau : ${WATER_CONTACT_LABELS[h.waterContact] ?? h.waterContact}`)
  }
  if (h.treeContact === 'yes') {
    lines.push('  • Arbrissage : Oui')
  } else if (h.treeContact === 'no') {
    lines.push('  • Arbrissage : Non')
  }
  if (h.surfaceContact) {
    const surface = SURFACE_CONTACT_LABELS[h.surfaceContact] ?? h.surfaceContact
    const note = h.surfaceContact === 'other' && h.surfaceContactNote
      ? ` (${h.surfaceContactNote})`
      : ''
    lines.push(`  • Sable/neige/dunes : ${surface}${note}`)
  }
  if (h.generalCondition) {
    lines.push(`  • État général : ${CONDITION_LABELS[h.generalCondition] ?? h.generalCondition}`)
  }
  return lines
}

// The DB only has a single `description` TEXT column for narrative — no dedicated
// problem_category, wing_size, wing_color, flight_hours, etc. We fold all the
// wizard metadata into a structured prefix the school can read, then append the
// client's free text.
function buildRichDescription(input: {
  problemCategory: WizardProblemCategory
  urgency:         'normal' | 'urgent'
  freeText:        string
  wingBrand?:      string
  wingModel?:      string
  wingSize?:       string
  wingColor?:      string
  flightHours?:    number | null
  wingBehaviors?:  string[]
  wingHistory?:    WingHistoryInput
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

  const historyLines = formatWingHistory(input.wingHistory)
  if (historyLines.length > 0) {
    lines.push('[Historique aile]')
    lines.push(...historyLines)
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
    wingBehaviors, wingHistory, clientMessage,
  } = parsed.data

  const serviceType = deriveServiceType(problemCategory)

  // The DB has a single `referent_school_id` column (no separate `school_id`).
  // We use it for the school that actually handles the ticket — i.e. the one
  // chosen by the client (`schoolId`). When that's a fallback hardcoded id
  // (no row in partner_schools), persist null so the FK isn't violated.
  const persistedSchoolId = schoolId.startsWith('plume-default-') ? null : schoolId

  // Build the rich description that folds all wizard metadata (category,
  // urgency, wing size/colour, flight hours, behaviors, wing history) into
  // the single narrative column the DB actually has.
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
    wingHistory,
  })

  // Insert payload — restricted to columns that actually exist in
  // public.service_requests on the live DB. NOT NULL columns covered:
  // user_id, service_type, first_name, last_name, email, phone, description.
  const insertPayload = {
    user_id:        user.id,
    client_id:      user.id,
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
    // school_id mirrors referent_school_id — c'est la colonne utilisée par
    // la RLS pour scoper les tickets par école. Doit rester en sync (cf.
    // applySchoolResolutionAction qui ne touche pas à school_id quand
    // l'école escalade vers un atelier).
    school_id:                 persistedSchoolId,
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
    return { error: { _form: [`Erreur lors de l'envoi de la demande${detail}`] } }
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

  // First chat message — posts the client's personalised message as the
  // opening reply so the school sees it in the conversation thread.
  // Best-effort: skipped silently if empty or if ticket_messages is missing.
  const trimmedClientMessage = clientMessage?.trim() ?? ''
  if (trimmedClientMessage.length > 0) {
    const { error: msgError } = await supabase.from('ticket_messages').insert({
      ticket_id:        ticket.id,
      sender_id:        user.id,
      sender_role:      'client',
      content:          trimmedClientMessage,
      is_internal:      false,
      visibility_level: 'all',
    })
    if (msgError) console.warn('client message insert failed:', msgError.message)
  }

  // Email notifications (best-effort) — never block ticket creation.
  // Both dispatches run in parallel; failures are logged but swallowed.
  try {
    const schoolDetail = persistedSchoolId
      ? await getPartnerSchoolById(persistedSchoolId)
      : null

    const emailCtx: TicketEmailContext = {
      ticketId:       ticket.id,
      ticketRef:      `#${ticket.id.slice(0, 8).toUpperCase()}`,
      client: {
        firstName:  identity.firstName,
        lastName:   identity.lastName,
        email:      identity.email,
      },
      school: {
        name:       schoolDetail?.name ?? 'Votre école partenaire',
        email:      schoolDetail?.email ?? null,
        city:       schoolDetail?.city ?? null,
      },
      wing: {
        brand:      wingBrand,
        model:      wingModel,
        size:       wingSize,
        color:      wingColor,
        serial:     wingSerial,
      },
      problemLabel:   PROBLEM_CATEGORY_LABELS[problemCategory] ?? problemCategory,
      description:    richDescription,
      urgency,
      deliveryMethod,
      clientMessage:  trimmedClientMessage || undefined,
    }

    const [clientRes, schoolRes] = await Promise.allSettled([
      sendClientConfirmationEmail(supabase, emailCtx),
      sendSchoolNotificationEmail(supabase, emailCtx),
    ])

    if (clientRes.status === 'rejected') {
      console.warn('[createTicketAction] client email threw:', clientRes.reason)
    } else if (!clientRes.value.ok) {
      console.warn('[createTicketAction] client email skipped/failed:', clientRes.value.error)
    }
    if (schoolRes.status === 'rejected') {
      console.warn('[createTicketAction] school email threw:', schoolRes.reason)
    } else if (!schoolRes.value.ok) {
      console.warn('[createTicketAction] school email skipped/failed:', schoolRes.value.error)
    }
  } catch (e) {
    console.warn('[createTicketAction] email dispatch threw:', e)
  }

  revalidatePath('/client')
  // The client navigates to the confirmation page itself after this call so
  // it can reset() the wizard store before the URL change. Returning a typed
  // success here is more flexible than throwing redirect() from the server.
  return { ok: true as const, ticketId: ticket.id }
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
    // Authenticated ticket owner without an explicit user_roles row — RLS still
    // enforces ownership (client_insert_messages requires service_request.client_id = auth.uid()).
    senderRole = 'client'
  } else {
    return { error: { _form: ["Vous n'avez pas le droit de poster avec ce rôle."] } }
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

  // Garde-fou : si l'école escalade ou demande un avis, le workshopId doit
  // correspondre à un atelier connu de PARTNER_WORKSHOPS. Empêche un client
  // qui forgerait une requête de pointer vers un atelier arbitraire.
  if (resolution === 'escalated_to_workshop' || resolution === 'workshop_advice_requested') {
    if (!workshopId || !PARTNER_WORKSHOPS.some((w) => w.id === workshopId)) {
      return { error: { _form: ["Atelier inconnu — choisissez un atelier du réseau partenaire"] } }
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
  // Step pipeline timestamp — l'escalade vers atelier marque l'entrée dans
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

  // Notification client (best-effort) — seules les décisions « définitives »
  // (école résout, ou ticket part vers l'atelier) déclenchent un email. Les
  // états transitoires (advice/reflection) restent silencieux côté client.
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

// ============================================================
// Pipeline d'étapes SAV (migration 20260509000000)
// ============================================================
//
// Chaque transition est :
//  - séquentielle (refus si le statut actuel n'est pas dans la whitelist),
//  - write-once (le timestamp se remplit côté DB en even of duplicate clicks),
//  - notifiée au client par email (best-effort).
//
// Les boutons UI s'appuient sur des Server Actions dédiées plutôt qu'un seul
// `updateStatusAction` générique : ça permet d'écrire le timestamp correspondant
// et de cibler la bonne copie email sans couplage côté client.

interface AdvanceArgs {
  ticketId:        string
  /** Statuts à partir desquels la transition est autorisée. */
  from:            RequestStatus[]
  /** Statut cible. */
  to:              RequestStatus
  /** Colonne timestamp à renseigner avec NOW(). */
  timestampColumn?: keyof TicketUpdate
  /** ID de copie email envoyé au client à la transition. null = pas d'email. */
  emailStep:       ClientStepEmail | null
  /** Champs additionnels à patcher (ex: assignations). */
  patch?:          Partial<TicketUpdate>
  /** Note optionnelle à enregistrer dans ticket_status_history. */
  historyNote?:    string
}

async function advanceTicketStep(args: AdvanceArgs) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: { _form: ['Non authentifié'] } }

  const { ticketId, from, to, timestampColumn, emailStep, patch, historyNote } = args

  // Lit le status courant + les infos client/école pour l'email.
  const { data: current, error: fetchError } = await supabase
    .from('service_requests')
    .select('id, status, first_name, last_name, email, ticket_number, referent_school_id')
    .eq('id', ticketId)
    .single()
    .returns<{
      id:                  string
      status:              RequestStatus
      first_name:          string | null
      last_name:           string | null
      email:               string | null
      ticket_number:       string | null
      referent_school_id:  string | null
    }>()

  if (fetchError || !current) {
    return { error: { _form: ['Demande introuvable'] } }
  }

  // Garde-fou séquentiel : si le statut courant n'est pas dans la whitelist
  // ET qu'on n'est pas déjà au statut cible (idempotence), on refuse.
  if (!from.includes(current.status) && current.status !== to) {
    return {
      error: {
        _form: [
          `Étape impossible depuis le statut actuel (« ${current.status} »). ` +
          `Rafraîchissez la page pour voir l'état à jour.`,
        ],
      },
    }
  }

  const now = new Date().toISOString()
  const update: Partial<TicketUpdate> = {
    ...(patch ?? {}),
    status: to,
  }
  if (timestampColumn) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(update as any)[timestampColumn] = now
  }

  const { error: updateError } = await supabase
    .from('service_requests')
    .update(update)
    .eq('id', ticketId)

  if (updateError) {
    return { error: { _form: [`Erreur lors de la mise à jour (${updateError.message})`] } }
  }

  // Audit trail (best-effort)
  const { error: histError } = await supabase.from('ticket_status_history').insert({
    ticket_id:  ticketId,
    old_status: requestStatusToSavStatus(current.status),
    new_status: requestStatusToSavStatus(to),
    changed_by: user.id,
    note:       historyNote ?? null,
  })
  if (histError) console.warn('ticket_status_history insert failed:', histError.message)

  // Notification client (best-effort — n'interrompt jamais la transition)
  if (emailStep && current.email) {
    try {
      const schoolDetail = current.referent_school_id
        ? await getPartnerSchoolById(current.referent_school_id)
        : null
      const ref = current.ticket_number ?? `#${current.id.slice(0, 8).toUpperCase()}`
      const r = await sendClientStepUpdateEmail(supabase, emailStep, {
        ticketId:    current.id,
        ticketRef:   ref,
        clientFirst: current.first_name ?? 'Pilote',
        clientEmail: current.email,
        schoolName:  schoolDetail?.name ?? null,
      })
      if (!r.ok) console.warn(`[advanceTicketStep] step email "${emailStep}" skipped:`, r.error)
    } catch (e) {
      console.warn(`[advanceTicketStep] step email "${emailStep}" threw:`, e)
    }
  }

  // Revalidation des pages susceptibles d'afficher ce ticket.
  revalidatePath(`/client/ticket/${ticketId}`)
  revalidatePath(`/school/ticket/${ticketId}`)
  revalidatePath(`/workshop/ticket/${ticketId}`)
  revalidatePath('/client')
  revalidatePath('/school')
  revalidatePath('/workshop')
  revalidatePath('/plume')

  return { success: true as const, previousStatus: current.status }
}

// ── École : étapes pré-décision ─────────────────────────────────────────────

/**
 * Étape 1 — L'école confirme avoir lu la demande.
 * pending → school_acknowledged
 */
export async function acknowledgeTicketAction(formData: FormData) {
  const ticketId = String(formData.get('ticketId') ?? '')
  if (!ticketId) return { error: { _form: ['Identifiant manquant'] } }
  return advanceTicketStep({
    ticketId,
    from:            ['pending'],
    to:              'school_acknowledged',
    timestampColumn: 'school_acknowledged_at',
    emailStep:       'school_acknowledged',
  })
}

/**
 * Étape 2 — L'école a réceptionné l'aile (en main propre ou par poste).
 * school_acknowledged → wing_received_school
 */
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
 * Étape 3 — L'école lance le check (ouvre le wizard).
 * wing_received_school → school_checking
 *
 * Pas de timestamp dédié : la fin de check est matérialisée par le
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

// ── Atelier : étapes post-escalade ──────────────────────────────────────────

/**
 * Étape 4 — L'atelier a réceptionné l'aile.
 * escalated_to_workshop → wing_received_workshop
 */
export async function markWingReceivedWorkshopAction(formData: FormData) {
  const ticketId = String(formData.get('ticketId') ?? '')
  if (!ticketId) return { error: { _form: ['Identifiant manquant'] } }
  return advanceTicketStep({
    ticketId,
    from:            ['escalated_to_workshop'],
    to:              'wing_received_workshop',
    timestampColumn: 'wing_received_workshop_at',
    emailStep:       'wing_received_workshop',
  })
}

/**
 * Étape 5 — L'atelier commence le diagnostic technique.
 * wing_received_workshop → workshop_diagnosing
 */
export async function startWorkshopDiagnosisAction(formData: FormData) {
  const ticketId = String(formData.get('ticketId') ?? '')
  if (!ticketId) return { error: { _form: ['Identifiant manquant'] } }
  return advanceTicketStep({
    ticketId,
    from:            ['wing_received_workshop'],
    to:              'workshop_diagnosing',
    timestampColumn: 'workshop_diagnosis_at',
    emailStep:       'workshop_diagnosing',
  })
}

/**
 * Étape 6 — La réparation démarre.
 * workshop_diagnosing → workshop_repairing
 */
export async function startWorkshopRepairAction(formData: FormData) {
  const ticketId = String(formData.get('ticketId') ?? '')
  if (!ticketId) return { error: { _form: ['Identifiant manquant'] } }
  return advanceTicketStep({
    ticketId,
    from:      ['workshop_diagnosing'],
    to:        'workshop_repairing',
    emailStep: 'workshop_repairing',
  })
}

/**
 * Étape 7 — L'atelier a fini la réparation.
 * workshop_repairing → workshop_done
 */
export async function markWorkshopDoneAction(formData: FormData) {
  const ticketId = String(formData.get('ticketId') ?? '')
  if (!ticketId) return { error: { _form: ['Identifiant manquant'] } }
  return advanceTicketStep({
    ticketId,
    from:            ['workshop_repairing'],
    to:              'workshop_done',
    timestampColumn: 'workshop_repair_done_at',
    emailStep:       'workshop_done',
  })
}

/**
 * Étape 8 — L'atelier renvoie l'aile (au client direct ou via l'école).
 * workshop_done → wing_returned
 *
 * `recipient` est consigné dans la note d'audit pour traçabilité.
 */
export async function markWingReturnedAction(formData: FormData) {
  const ticketId = String(formData.get('ticketId') ?? '')
  if (!ticketId) return { error: { _form: ['Identifiant manquant'] } }
  const recipient = String(formData.get('recipient') ?? '')
  // recipient est requis et doit être 'school' ou 'client' — refuse explicitement
  // les valeurs forgées (anti-injection) plutôt que de fallback silencieusement.
  if (recipient !== 'school' && recipient !== 'client') {
    return { error: { _form: ['Destination invalide — choisissez école ou client'] } }
  }
  const note = recipient === 'school'
    ? "Aile renvoyée à l'école partenaire"
    : 'Aile renvoyée directement au client'
  return advanceTicketStep({
    ticketId,
    from:            ['workshop_done'],
    to:              'wing_returned',
    timestampColumn: 'wing_returned_at',
    emailStep:       'wing_returned',
    historyNote:     note,
  })
}

/**
 * Étape finale — Clôture du ticket. Disponible depuis :
 *  - wing_returned (parcours atelier complet)
 *  - school_resolved (parcours école-only)
 */
export async function markTicketCompletedAction(formData: FormData) {
  const ticketId = String(formData.get('ticketId') ?? '')
  if (!ticketId) return { error: { _form: ['Identifiant manquant'] } }
  return advanceTicketStep({
    ticketId,
    from:      ['wing_returned', 'school_resolved'],
    to:        'completed',
    emailStep: 'completed',
  })
}

// ============================================================
// Bons de transport GLS (migration 20260510000000)
// ============================================================
//
// Trois legs de transport peuvent être déclenchés :
//   1. client_to_school   — par le client, après choix "envoi postal"
//   2. school_to_workshop — par l'école, après escalade vers atelier
//   3. workshop_to_return — par l'atelier, après réparation
//
// La génération elle-même est, pour l'instant, simulée (placeholder).
// Le câblage vers l'API GLS réelle (via une edge function wrapper qui
// peut lire les secrets GLS_*) est documenté en Phase 4 — voir le PR.
//
// Anti-abus : un client a droit à 1 SAV gratuit par année civile. À
// partir du 2ème ticket, le leg client_to_school passe en validation
// admin (auto_approved_shipping = false) avant que l'étiquette ne soit
// générée. Les autres legs (école/atelier) ne sont jamais bloqués.

const ANNUAL_FREE_SAV_THRESHOLD = 2  // dès le 2ème ticket de l'année → admin

interface GenerateLabelOk {
  ok:             true
  trackingNumber: string
  labelUrl:       string
  /** Échos de l'adresse persistée (utile pour rafraîchir l'UI). */
  address?:       ClientShippingAddress | null
}

interface GenerateLabelNeedsAddress {
  needsAddress: true
}

interface GenerateLabelPending {
  pendingAdminApproval: true
}

interface GenerateLabelError {
  error: { _form?: string[]; [k: string]: unknown }
}

type GenerateLabelResult =
  | GenerateLabelOk
  | GenerateLabelNeedsAddress
  | GenerateLabelPending
  | GenerateLabelError

// Adresse postale école — récupérée depuis partner_schools, ou string brute
// fallback. L'API GLS a juste besoin du `rawLine` final + `country`, on garde
// les champs décomposés nullables pour les écoles dont on n'a qu'un texte libre.
type ResolvedAddress = {
  name:    string
  street:  string | null
  postal:  string | null
  city:    string | null
  country: string
  rawLine: string  // version one-line si on n'a pas la décomposition
}

function clientShippingAddressOrNull(raw: unknown): ClientShippingAddress | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  if (typeof r.street !== 'string' || typeof r.postalCode !== 'string') return null
  if (typeof r.city !== 'string' || typeof r.country !== 'string') return null
  return {
    street:     r.street,
    postalCode: r.postalCode,
    city:       r.city,
    country:    r.country,
  }
}

// Placeholder GLS — sera remplacé par un appel vers une edge function
// `create-sav-gls-shipment` qui lit les secrets et appelle l'API GLS réelle.
// Le format du retour reproduit ce que l'edge function exposera.
function generatePlaceholderLabel(args: {
  ticketId: string
  leg:      ShipmentLeg
  from:     ResolvedAddress
  to:       ResolvedAddress
}): { trackingNumber: string; labelUrl: string } {
  const legCode = args.leg.toUpperCase()
  const stamp   = Date.now().toString(36).toUpperCase()
  const short   = args.ticketId.replace(/-/g, '').slice(0, 8).toUpperCase()
  const trackingNumber = `GLS-PLACEHOLDER-${legCode}-${short}-${stamp}`
  // URL clairement fake : facile à grepper le jour où on branche le vrai GLS.
  const labelUrl = `https://placeholder.gls.invalid/labels/${trackingNumber}.pdf`
  if (process.env.NODE_ENV !== 'production') {
    console.warn('[generateSavShippingLabelAction] PLACEHOLDER GLS call', {
      leg: args.leg,
      from: args.from.rawLine,
      to:   args.to.rawLine,
      trackingNumber,
    })
  }
  return { trackingNumber, labelUrl }
}

// Compose un ResolvedAddress lisible à partir d'une école (DB) — adresse libre
// ou décomposée selon ce que partner_schools fournit.
function resolveSchoolAddress(detail: {
  name: string
  city?: string | null
  region?: string | null
  address?: string | null
}): ResolvedAddress {
  const line = [detail.address, detail.city, detail.region].filter(Boolean).join(', ')
  return {
    name:    detail.name,
    street:  detail.address ?? null,
    postal:  null,
    city:    detail.city ?? null,
    country: 'FR',
    rawLine: line || detail.name,
  }
}

function resolveWorkshopAddress(workshopId: string | null, label: string | null): ResolvedAddress | null {
  if (!workshopId) return null
  const w = PARTNER_WORKSHOPS.find((x) => x.id === workshopId)
  if (!w) {
    return label ? {
      name:    label,
      street:  null,
      postal:  null,
      city:    null,
      country: 'FR',
      rawLine: label,
    } : null
  }
  return {
    name:    w.label,
    street:  w.address,
    postal:  null,
    city:    w.city,
    country: 'FR',
    rawLine: `${w.label} — ${w.address}`,
  }
}

function resolveClientAddress(name: string, addr: ClientShippingAddress): ResolvedAddress {
  return {
    name,
    street:  addr.street,
    postal:  addr.postalCode,
    city:    addr.city,
    country: addr.country,
    rawLine: `${addr.street}, ${addr.postalCode} ${addr.city}, ${addr.country}`,
  }
}

export async function generateSavShippingLabelAction(formData: FormData): Promise<GenerateLabelResult> {
  // 1. Parse + validate
  const rawAddress = formData.get('address')
  let parsedAddress: unknown = undefined
  if (typeof rawAddress === 'string' && rawAddress.length > 0) {
    try { parsedAddress = JSON.parse(rawAddress) }
    catch { return { error: { _form: ["Adresse mal formée"] } } }
  }

  const parsed = generateShippingLabelSchema.safeParse({
    ticketId:          formData.get('ticketId'),
    leg:               formData.get('leg'),
    address:           parsedAddress,
    returnDestination: formData.get('returnDestination') || undefined,
  })
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const { ticketId, leg, address, returnDestination } = parsed.data

  // 2. Auth
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: { _form: ['Non authentifié'] } }

  // 3. Ticket lookup (RLS scoped — le client ne lit que ses tickets, l'école
  //    que ceux qu'elle traite, etc.)
  const { data: ticket, error: fetchError } = await supabase
    .from('service_requests')
    .select('*')
    .eq('id', ticketId)
    .maybeSingle()

  if (fetchError || !ticket) {
    return { error: { _form: ['Demande introuvable'] } }
  }

  // 4. Idempotence : si on a déjà un tracking pour ce leg, on le ré-expose.
  const existingTracking =
    leg === 'client_to_school'   ? ticket.client_school_tracking
  : leg === 'school_to_workshop' ? ticket.school_workshop_tracking
  : leg === 'workshop_to_return' ? ticket.workshop_return_tracking
  : null

  const existingLabel =
    leg === 'client_to_school'   ? ticket.client_school_label_url
  : leg === 'school_to_workshop' ? ticket.school_workshop_label_url
  : leg === 'workshop_to_return' ? ticket.workshop_return_label_url
  : null

  if (existingTracking && existingLabel) {
    return {
      ok:             true,
      trackingNumber: existingTracking,
      labelUrl:       existingLabel,
      address:        clientShippingAddressOrNull(ticket.client_shipping_address),
    }
  }

  // 5. Résolution des adresses + checks spécifiques par leg
  const clientName = [ticket.first_name, ticket.last_name].filter(Boolean).join(' ').trim() || 'Client Plume'

  let from: ResolvedAddress | null = null
  let to:   ResolvedAddress | null = null
  let addressToPersist: ClientShippingAddress | null = null

  // Adresse école — partagée par les legs 1 et 3-vers-école.
  const schoolDetail = ticket.referent_school_id
    ? await getPartnerSchoolById(ticket.referent_school_id)
    : null
  const schoolAddress: ResolvedAddress | null = schoolDetail ? resolveSchoolAddress({
    name:    schoolDetail.name,
    city:    schoolDetail.city,
    region:  schoolDetail.region,
    address: schoolDetail.address,
  }) : null

  if (leg === 'client_to_school') {
    // 5a. Adresse client : capture lazy si pas encore stockée.
    const stored = clientShippingAddressOrNull(ticket.client_shipping_address)
    const finalAddress = address ?? stored
    if (!finalAddress) return { needsAddress: true }
    addressToPersist = finalAddress

    // 5b. Anti-abus : si déjà flaggé par un précédent appel, ou si le compteur
    //     annuel passe le seuil → bloquer et notifier admin.
    if (ticket.auto_approved_shipping === false) {
      return { pendingAdminApproval: true }
    }

    const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString()
    // Restreindre aux types créés par le wizard SAV ('sav' pour comportements,
    // 'repair' pour tear/line/riser — voir deriveServiceType). Les autres
    // service_type (cours, info, révision) ne comptent pas dans le quota.
    const { count, error: countError } = await supabase
      .from('service_requests')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .in('service_type', ['sav', 'repair'])
      .gte('created_at', yearStart)
    if (countError) {
      console.warn('[generateSavShippingLabelAction] count failed:', countError.message)
    }
    if ((count ?? 0) >= ANNUAL_FREE_SAV_THRESHOLD) {
      // Persiste l'adresse + flag → admin verra le ticket dans sa queue.
      // Le cast en `Json` est nécessaire car ClientShippingAddress est une
      // interface stricte sans index signature.
      const { error: flagError } = await supabase
        .from('service_requests')
        .update({
          auto_approved_shipping:   false,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          client_shipping_address:  finalAddress as any,
        })
        .eq('id', ticketId)
      if (flagError) {
        console.warn('[generateSavShippingLabelAction] flag update failed:', flagError.message)
      }
      revalidatePath(`/client/ticket/${ticketId}`)
      revalidatePath('/plume')
      return { pendingAdminApproval: true }
    }

    if (!schoolAddress) {
      return { error: { _form: ['École destinataire introuvable — impossible de générer le bon de transport'] } }
    }
    from = resolveClientAddress(clientName, finalAddress)
    to   = schoolAddress
  }

  if (leg === 'school_to_workshop') {
    if (!schoolAddress) {
      return { error: { _form: ['Adresse de l\'école introuvable'] } }
    }
    const workshopAddr = resolveWorkshopAddress(ticket.assigned_workshop_id, ticket.assigned_workshop_label)
    if (!workshopAddr) {
      return { error: { _form: ["Aucun atelier assigné à ce ticket"] } }
    }
    from = schoolAddress
    to   = workshopAddr
  }

  if (leg === 'workshop_to_return') {
    const dest = returnDestination ?? ticket.workshop_return_destination
    if (!dest) {
      return { error: { _form: ['Précisez la destination du renvoi (école ou client)'] } }
    }
    const workshopAddr = resolveWorkshopAddress(ticket.assigned_workshop_id, ticket.assigned_workshop_label)
    if (!workshopAddr) {
      return { error: { _form: ["Atelier source introuvable pour ce ticket"] } }
    }
    if (dest === 'school') {
      if (!schoolAddress) {
        return { error: { _form: ['École destinataire introuvable'] } }
      }
      from = workshopAddr
      to   = schoolAddress
    } else {
      const stored = clientShippingAddressOrNull(ticket.client_shipping_address)
      if (!stored) {
        return { error: { _form: ["Adresse client absente — le client doit d'abord générer son bon de transport initial"] } }
      }
      from = workshopAddr
      to   = resolveClientAddress(clientName, stored)
    }
  }

  if (!from || !to) {
    return { error: { _form: ['Impossible de résoudre les adresses pour ce leg'] } }
  }

  // 6. Génération (placeholder pour l'instant)
  const { trackingNumber, labelUrl } = generatePlaceholderLabel({ ticketId, leg, from, to })

  // 7. Persistance des champs sur le ticket
  const update: TicketUpdate = {}
  if (leg === 'client_to_school') {
    update.client_school_tracking  = trackingNumber
    update.client_school_label_url = labelUrl
    update.client_school_carrier   = 'GLS'
    if (addressToPersist) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(update as any).client_shipping_address = addressToPersist
    }
  } else if (leg === 'school_to_workshop') {
    update.school_workshop_tracking  = trackingNumber
    update.school_workshop_label_url = labelUrl
  } else if (leg === 'workshop_to_return') {
    update.workshop_return_tracking    = trackingNumber
    update.workshop_return_label_url   = labelUrl
    if (returnDestination) {
      update.workshop_return_destination = returnDestination
    }
  }

  const { error: updateError } = await supabase
    .from('service_requests')
    .update(update)
    .eq('id', ticketId)

  if (updateError) {
    return { error: { _form: [`Erreur lors de l'enregistrement (${updateError.message})`] } }
  }

  revalidatePath(`/client/ticket/${ticketId}`)
  revalidatePath(`/school/ticket/${ticketId}`)
  revalidatePath(`/workshop/ticket/${ticketId}`)
  revalidatePath('/plume')

  return {
    ok:             true,
    trackingNumber,
    labelUrl,
    address:        addressToPersist ?? clientShippingAddressOrNull(ticket.client_shipping_address),
  }
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

  // Garde-fou : workshopId doit être dans PARTNER_WORKSHOPS (anti-forge).
  if (!PARTNER_WORKSHOPS.some((w) => w.id === workshopId)) {
    return { error: { _form: ["Atelier inconnu — choisissez un atelier du réseau partenaire"] } }
  }

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

// ============================================================
// Actions admin Plume HQ (T2) — toutes refusent si rôle ≠ plume_admin
// ============================================================

async function ensurePlumeAdmin(): Promise<{ ok: true; userId: string } | { ok: false; error: { _form: string[] } }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: { _form: ['Non authentifié'] } }
  const roles = await getCurrentUserRoles()
  if (!roles.includes('plume_admin')) {
    return { ok: false, error: { _form: ['Action réservée à Plume HQ'] } }
  }
  return { ok: true, userId: user.id }
}

/**
 * Réassigne un ticket à une autre école. Met à jour `school_id` (école qui
 * traite désormais) ET `referent_school_id` (nouvelle école référente). La
 * raison est postée comme message interne `plume_only` pour la traçabilité.
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

  if (error) return { error: { _form: [`Erreur réassignation (${error.message})`] } }

  // Trace en interne pour Plume — pas visible côté client/école/atelier.
  await supabase.from('ticket_messages').insert({
    ticket_id:        ticketId,
    sender_id:        auth.userId,
    sender_role:      'plume_admin' as MessageSenderRole,
    content:          `[Réassignation] Ticket transféré à une autre école.\nMotif : ${reason}`,
    is_internal:      true,
    visibility_level: 'plume_only',
  })

  revalidatePath('/plume')
  revalidatePath(`/school/ticket/${ticketId}`)
  revalidatePath(`/workshop/ticket/${ticketId}`)
  return { success: true }
}

/**
 * Clôture manuelle d'un ticket par Plume HQ (status → completed). Note
 * obligatoire pour la traçabilité, postée en interne `plume_only`.
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

  if (error) return { error: { _form: [`Erreur clôture (${error.message})`] } }

  await supabase.from('ticket_messages').insert({
    ticket_id:        ticketId,
    sender_id:        auth.userId,
    sender_role:      'plume_admin' as MessageSenderRole,
    content:          `[Clôture admin] ${note}`,
    is_internal:      true,
    visibility_level: 'plume_only',
  })

  // Audit trail — best-effort (la table peut ne pas exister sur certains envs).
  if (current?.status) {
    const { error: histError } = await supabase.from('ticket_status_history').insert({
      ticket_id:  ticketId,
      old_status: requestStatusToSavStatus(current.status),
      new_status: 'closed' as TicketStatus,
      changed_by: auth.userId,
      note:       `Clôture admin : ${note}`,
    })
    if (histError) console.warn('ticket_status_history insert failed:', histError.message)
  }

  revalidatePath('/plume')
  revalidatePath(`/client/ticket/${ticketId}`)
  revalidatePath(`/school/ticket/${ticketId}`)
  revalidatePath(`/workshop/ticket/${ticketId}`)
  return { success: true }
}

/**
 * Relance email de l'école : envoie une notification "rappel" via Resend
 * (réutilise `send-email-resend` Edge Function comme les autres emails SAV).
 * Best-effort — log un warning si l'école n'a pas d'email connu.
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
    return { error: { _form: ["Aucune école assignée à ce ticket"] } }
  }

  const school = await getPartnerSchoolById(ticket.school_id)
  if (!school?.email) {
    return { error: { _form: ["L'école n'a pas d'email enregistré dans partner_schools"] } }
  }

  const ticketRef = ticket.ticket_number ?? `#${ticketId.slice(0, 8).toUpperCase()}`
  const fullName  = `${ticket.first_name ?? ''} ${ticket.last_name ?? ''}`.trim() || 'le client'
  const wing      = `${ticket.product_brand ?? ''} ${ticket.product_model ?? ''}`.trim() || 'l\'aile'
  const daysOpen  = Math.max(0, Math.floor((Date.now() - new Date(ticket.created_at).getTime()) / 86_400_000))

  const html = `
    <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px">
      <p style="font-size:12px;color:#9333ea;letter-spacing:.08em;text-transform:uppercase;margin:0">Plume HQ — relance</p>
      <h1 style="font-size:20px;color:#0f172a;margin:8px 0 16px">Ticket SAV ${ticketRef} en attente</h1>
      <p style="color:#334155;line-height:1.55">Bonjour,</p>
      <p style="color:#334155;line-height:1.55">
        Le ticket SAV de ${fullName} pour ${wing} a été ouvert il y a <strong>${daysOpen} jour${daysOpen > 1 ? 's' : ''}</strong>
        et n'a pas encore été pris en charge par votre école.
      </p>
      <p style="color:#334155;line-height:1.55">
        Merci de prendre quelques minutes pour le traiter dans votre espace École :
      </p>
      <p style="margin:24px 0">
        <a href="https://sav.plumeparagliders.com/school/ticket/${ticketId}"
           style="background:#f59e0b;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:600">
          Ouvrir le ticket ${ticketRef}
        </a>
      </p>
      <p style="font-size:12px;color:#94a3b8;margin-top:32px">— L'équipe Plume</p>
    </div>
  `

  try {
    const { error } = await supabase.functions.invoke('send-email-resend', {
      body: {
        to:         school.email,
        subject:    `Plume SAV — Relance ticket ${ticketRef} en attente depuis ${daysOpen} j`,
        html,
        email_type: 'sav_notification',
      },
    })
    if (error) return { error: { _form: [`Erreur envoi email (${error.message})`] } }
  } catch (e) {
    return { error: { _form: [`Erreur envoi email (${e instanceof Error ? e.message : String(e)})`] } }
  }

  // Trace de la relance — visible Plume uniquement.
  await supabase.from('ticket_messages').insert({
    ticket_id:        ticketId,
    sender_id:        auth.userId,
    sender_role:      'plume_admin' as MessageSenderRole,
    content:          `[Relance école] Email envoyé à ${school.email} (ticket ouvert depuis ${daysOpen} j).`,
    is_internal:      true,
    visibility_level: 'plume_only',
  })

  revalidatePath('/plume')
  return { success: true }
}
