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
import type { MessageSenderRole, TicketStatus, ServiceType, ProblemCategory, WizardProblemCategory } from './types'
import type { RequestStatus } from './types'
import { composeWingBehaviorDescription } from './utils'

// Maps SAV problem category to the shared-platform service_type enum
function deriveServiceType(category: WizardProblemCategory): ServiceType {
  if (['tear', 'line_issue', 'riser_issue', 'buckle_issue'].includes(category)) return 'repair'
  if (category === 'porosity') return 'revision'
  // wing_behavior + other → generic SAV
  return 'sav'
}

// Normalizes the wizard category to a value accepted by the DB problem_category enum.
// 'wing_behavior' is a wizard-only category and is folded into 'other' on save.
function normalizeProblemCategory(category: WizardProblemCategory): ProblemCategory {
  if (category === 'wing_behavior') return 'other'
  return category
}

// Maps SAV workflow status (ticket_status) to shared-platform status (request_status)
function savStatusToRequestStatus(savStatus: TicketStatus): RequestStatus {
  switch (savStatus) {
    case 'repaired':
    case 'shipped':
    case 'closed':
      return 'completed'
    case 'rejected':
      return 'rejected'
    default:
      return 'processing'
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
    urgency, photoPaths, wingBehaviors, wingBehaviorOther,
  } = parsed.data

  const serviceType = deriveServiceType(problemCategory)
  const dbProblemCategory = normalizeProblemCategory(problemCategory)
  const finalDescription = problemCategory === 'wing_behavior'
    ? composeWingBehaviorDescription({
        behaviors: wingBehaviors,
        behaviorOther: wingBehaviorOther,
        description: problemDescription,
      })
    : problemDescription

  const { data: ticket, error: ticketError } = await supabase
    .from('service_requests')
    .insert({
      // Colonnes identity — satisfait les contraintes originales et la RLS SAV
      user_id: user.id,
      client_id: user.id,
      email: user.email ?? null,
      // Champ requis NOT NULL de la table originale
      service_type: serviceType,
      // Statuts : request_status (cross-app) + ticket_status (workflow SAV)
      status: 'pending',
      sav_status: 'submitted',
      // Colonnes originales en double pour compatibilité cross-app
      product_brand: wingBrand,
      product_model: wingModel,
      serial_number: wingSerial,
      description: finalDescription,
      // Colonnes SAV spécifiques
      wing_brand: wingBrand,
      wing_model: wingModel,
      wing_size: wingSize,
      wing_serial_number: wingSerial,
      wing_color: wingColor,
      purchase_date: purchaseDate,
      flight_hours_estimate: flightHours ?? null,
      problem_category: dbProblemCategory,
      problem_description: finalDescription,
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
    .select('sav_status')
    .eq('id', ticketId)
    .single()
    .returns<{ sav_status: TicketStatus }>()

  if (fetchError || !current) return { error: { _form: ['Ticket introuvable'] } }

  const { error: updateError } = await supabase
    .from('service_requests')
    .update({
      sav_status: newStatus,
      status: savStatusToRequestStatus(newStatus),
    })
    .eq('id', ticketId)

  if (updateError) return { error: { _form: ['Erreur lors de la mise à jour'] } }

  await supabase.from('ticket_status_history').insert({
    ticket_id: ticketId,
    old_status: current.sav_status,
    new_status: newStatus,
    changed_by: user.id,
    note: note ?? null,
  })

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
