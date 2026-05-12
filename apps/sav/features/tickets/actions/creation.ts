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
import { createTicketSchema } from '../schemas'
import { resolveClientIdentity } from '@/features/auth/identity'
import {
  sendClientConfirmationEmail,
  sendSchoolNotificationEmail,
  type TicketEmailContext,
} from '../email'
import {
  buildRichDescription,
  deriveServiceType,
  requestStatusToSavStatus,
  PROBLEM_CATEGORY_LABELS,
} from './_helpers'

export async function createTicketAction(input: unknown) {
  const parsed = createTicketSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: { _form: ['Non authentifiÃ©'] } }

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
  // We use it for the school that actually handles the ticket â€” i.e. the one
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

  // Insert payload â€” restricted to columns that actually exist in
  // public.service_requests on the live DB. NOT NULL columns covered:
  // user_id, service_type, first_name, last_name, email, phone, description.
  const insertPayload = {
    user_id:        user.id,
    client_id:      user.id,
    first_name:     identity.firstName,
    last_name:      identity.lastName,
    email:          identity.email,
    phone:          identity.phone, // '' when unknown â€” column is NOT NULL
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
    // school_id mirrors referent_school_id â€” c'est la colonne utilisÃ©e par
    // la RLS pour scoper les tickets par Ã©cole. Doit rester en sync (cf.
    // applySchoolResolutionAction qui ne touche pas Ã  school_id quand
    // l'Ã©cole escalade vers un atelier).
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

  // Photos: separate ticket_photos table (best-effort â€” failure shouldn't
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

  // Audit trail (best-effort â€” table may not exist on legacy envs)
  const { error: histError } = await supabase.from('ticket_status_history').insert({
    ticket_id:  ticket.id,
    old_status: null,
    new_status: 'submitted',
    changed_by: user.id,
  })
  if (histError) console.error('[SAV] ticket_status_history insert failed:', histError.message)

  // First chat message â€” posts the client's personalised message as the
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
      channel:          'school_client',
    })
    if (msgError) console.warn('client message insert failed:', msgError.message)
  }

  // Email notifications (best-effort) â€” never block ticket creation.
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
        name:       schoolDetail?.name ?? 'Votre Ã©cole partenaire',
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


