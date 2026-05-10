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
  diagnosisSchema,
  schoolChecklistSchema,
  schoolResolutionSchema,
} from '../schemas'
import { sendClientStepUpdateEmail, type ClientStepEmail, type TicketEmailContext } from '../email'
import {
  requestStatusToSavStatus,
  resolutionToRequestStatus,
} from './_helpers'
import { advanceTicketStep } from './_step-advance'

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
