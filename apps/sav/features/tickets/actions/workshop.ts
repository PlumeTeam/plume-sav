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
import { workshopChecklistSchema } from '../schemas'
import { sendClientStepUpdateEmail, type ClientStepEmail, type TicketEmailContext } from '../email'
import { requestStatusToSavStatus } from './_helpers'
import { advanceTicketStep } from './_step-advance'

export async function saveWorkshopChecklistAction(formData: FormData) {
  const parsed = workshopChecklistSchema.safeParse({
    ticketId:   formData.get('ticketId'),
    checkedIds: formData.getAll('checkedIds'),
    notes:      formData.get('notes') || undefined,
  })
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: { _form: ['Non authentifiÃ©'] } }

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
 * Ã‰tape 5 â€” L'atelier commence le diagnostic technique.
 * wing_received_workshop â†’ workshop_diagnosing
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
 * Ã‰tape 6 â€” La rÃ©paration dÃ©marre.
 * workshop_diagnosing â†’ workshop_repairing
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
 * Ã‰tape 7 â€” L'atelier a fini la rÃ©paration.
 * workshop_repairing â†’ workshop_done
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
 * Ã‰tape 8 â€” L'atelier renvoie l'aile (au client direct ou via l'Ã©cole).
 * workshop_done â†’ wing_returned
 *
 * `recipient` est consignÃ© dans la note d'audit pour traÃ§abilitÃ©.
 */

