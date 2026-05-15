'use server'

import { revalidatePath } from 'next/cache'
import type { Database } from '@plume/db'
import { createClient } from '@/lib/supabase/server'
import {
  countPreviousSavClaims,
  getPartnerSchoolById,
  getPartnerWorkshopById,
  getPlumeSettings,
} from '../queries'
import { computeWarrantyTier } from '../utils'
import type {
  RequestStatus,
  RequestType,
  ServiceType,
} from '../types'
import { attachTicketPhotosSchema, createTicketSchema } from '../schemas'

type ServiceRequestInsert = Database['public']['Tables']['service_requests']['Insert']
import { resolveClientIdentity } from '@/features/auth/identity'
import {
  sendClientConfirmationEmail,
  sendSchoolNotificationEmail,
  type TicketEmailContext,
} from '../email'
import {
  buildRichDescription,
  deriveServiceType,
  PROBLEM_CATEGORY_LABELS,
} from './_helpers'

// Maps RequestType → ServiceType (table partagée). Surchargé après par
// deriveServiceType quand on a une catégorie de problème explicite.
function requestTypeToServiceType(type: RequestType): ServiceType {
  switch (type) {
    case 'repair':                return 'repair'
    case 'inspection':            return 'revision'
    case 'manufacturing_defect':  return 'sav'
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

  const identity = await resolveClientIdentity(supabase, user)

  const {
    requestType,
    wingBrand, wingModel, wingSize, wingSerial, wingColor,
    purchaseDate, flightHours, problemCategory, problemDescription,
    urgency, photoPaths, schoolId, workshopId,
    referentSchoolId: _ignoredReferentId,
    schoolChangeReasonCode, schoolChangeReasonNote, deliveryMethod,
    wingBehaviors, wingHistory, clientMessage,
  } = parsed.data

  // Pour repair/inspection ou manufacturing_defect hors garantie : le ticket
  // est routé directement vers un atelier. Le `school_id` reste null et
  // `assigned_workshop_id` est renseigné dès la création.
  const routesToWorkshop = !!workshopId && !schoolId
  // Source de vérité = partner_workshops (DB). Si la table est down/RLS,
  // getPartnerWorkshopById renvoie le fallback Plume Embrun pour son propre
  // UUID. Pour tout autre id absent côté DB on refuse — pas de fake atelier.
  const workshop = workshopId
    ? await getPartnerWorkshopById(workshopId)
    : null
  if (workshopId && !workshop) {
    return { error: { _form: ["Atelier inconnu — choisissez un atelier du réseau partenaire"] } }
  }

  // Pour les routes 'école', on garde l'ancien comportement.
  const persistedSchoolId = schoolId
    ? (schoolId.startsWith('plume-default-') ? null : schoolId)
    : null

  // Service type — préfère deriveServiceType quand on a une catégorie explicite
  // (manufacturing_defect avec category), sinon fallback sur le RequestType.
  const serviceType: ServiceType = problemCategory
    ? deriveServiceType(problemCategory)
    : requestTypeToServiceType(requestType)

  // Description — pour inspection on n'a pas de problemDescription saisie,
  // on construit à partir du wingHistory.
  const effectiveDescription = (problemDescription ?? '').trim() ||
    (requestType === 'inspection'
      ? `Demande de contrôle de l'aile ${wingBrand} ${wingModel}.`
      : 'Demande SAV')

  const richDescription = buildRichDescription({
    // Quand on n'a pas de catégorie (repair/inspection), on omet le préfixe en
    // utilisant 'other' qui mappe sur "Comportement" — pas idéal pour repair.
    // On préfère afficher le type en tête.
    problemCategory: problemCategory ?? 'other',
    urgency,
    freeText:    effectiveDescription,
    wingBrand,
    wingModel,
    wingSize,
    wingColor,
    flightHours: flightHours ?? null,
    wingBehaviors,
    wingHistory,
  })

  // Calcul du tier de garantie figé sur le ticket. On compte les SAV
  // précédents pour le même n° de série (excluant ceux déjà out_of_warranty)
  // et on applique la politique courante depuis plume_settings.
  const policy = await getPlumeSettings()
  const previousClaimCount = await countPreviousSavClaims(wingSerial)
  const warranty = computeWarrantyTier({
    purchaseDate,
    previousClaimCount,
    warrantyStandardYears: policy.warrantyStandardYears,
    warrantyExtendedYears: policy.warrantyExtendedYears,
    maxSavClaimsStandard:  policy.maxSavClaimsStandard,
    maxSavClaimsExtended:  policy.maxSavClaimsExtended,
  })

  // Insert payload — colonnes du live DB.
  const insertPayload: ServiceRequestInsert = {
    user_id:        user.id,
    client_id:      user.id,
    first_name:     identity.firstName,
    last_name:      identity.lastName,
    email:          identity.email,
    phone:          identity.phone,
    service_type:   serviceType,
    // 'pending_workshop' pour routage direct client → atelier (repair /
    // inspection / defect hors garantie) — sinon la RLS atelier filtre le
    // ticket dehors. Flow école classique : 'pending'.
    status:         routesToWorkshop ? 'pending_workshop' : 'pending',
    product_brand:  wingBrand,
    product_model:  wingModel,
    serial_number:  wingSerial,
    description:    richDescription,
    urgency_level:  urgency === 'urgent' ? 2 : 1,
    purchase_date:  purchaseDate,
    request_type:   requestType,
    // École référente / qui traite (seulement si flow école).
    referent_school_id:        persistedSchoolId,
    school_id:                 persistedSchoolId,
    school_change_reason_code: schoolChangeReasonCode ?? null,
    school_change_reason_note: schoolChangeReasonNote ?? null,
    delivery_method:           deliveryMethod,
    // Garantie figée à la création — cf. computeWarrantyTier ci-dessus
    warranty_tier:        warranty.tier,
    sav_claim_number:     warranty.claimNumber,
    warranty_expires_at:  warranty.expiresAt,
    // Routing direct atelier (repair / inspection / defect hors garantie).
    // workshop.id = UUID Supabase partner_workshops (assigned_workshop_id est text
    // côté DB partagée mais on n'y stocke plus que des UUID valides).
    assigned_workshop_id:    workshop?.id    ?? null,
    assigned_workshop_label: workshop?.label ?? null,
    workshop_assigned_at:    workshop ? new Date().toISOString() : null,
    workshop_assigned_by:    workshop ? user.id : null,
  }

  const { data: ticket, error: ticketError } = await supabase
    .from('service_requests')
    .insert(insertPayload)
    .select('id')
    .single<{ id: string }>()

  if (ticketError || !ticket) {
    console.error('createTicketAction error:', ticketError)
    const detail = ticketError?.message ? ` (${ticketError.message})` : ''
    return { error: { _form: [`Erreur lors de l'envoi de la demande${detail}`] } }
  }

  // Photos (best-effort).
  // `uploaded_by` est OBLIGATOIRE : la RLS sec_client_insert_own_ticket
  // exige `uploaded_by = auth.uid()` (sinon insert rejeté en silence).
  if (photoPaths.length > 0) {
    const photoRows = photoPaths.map((p, idx) => ({
      ticket_id:    ticket.id,
      storage_path: p.storagePath,
      photo_type:   p.photoType,
      caption:      p.caption ?? null,
      sort_order:   idx,
      uploaded_by:  user.id,
    }))
    const { error: photoError } = await supabase.from('ticket_photos').insert(photoRows)
    if (photoError) console.warn('Photo insert failed:', photoError.message)
  }

  // Audit trail
  const { error: histError } = await supabase.from('ticket_status_history').insert({
    ticket_id:  ticket.id,
    old_status: null,
    new_status: 'submitted',
    changed_by: user.id,
  })
  if (histError) console.error('[SAV] ticket_status_history insert failed:', histError.message)

  // First chat message
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

  // Email notifications — pour l'instant, on n'envoie l'email école que si le
  // ticket est routé vers une école. Le routing direct atelier n'a pas encore
  // de notification email dédiée (à venir dans une PR séparée).
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
        name:       schoolDetail?.name ?? workshop?.label ?? 'Votre destinataire',
        email:      schoolDetail?.email ?? null,
        city:       schoolDetail?.city ?? workshop?.city ?? null,
      },
      wing: {
        brand:      wingBrand,
        model:      wingModel,
        size:       wingSize,
        color:      wingColor,
        serial:     wingSerial,
      },
      problemLabel:   problemCategory
        ? PROBLEM_CATEGORY_LABELS[problemCategory] ?? problemCategory
        : requestType === 'inspection' ? 'Contrôle' : 'Réparation',
      description:    richDescription,
      urgency,
      deliveryMethod,
      clientMessage:  trimmedClientMessage || undefined,
    }

    const promises: Array<Promise<{ ok: boolean; error?: string }>> = [
      sendClientConfirmationEmail(supabase, emailCtx),
    ]
    if (!routesToWorkshop && persistedSchoolId) {
      promises.push(sendSchoolNotificationEmail(supabase, emailCtx))
    }

    const results = await Promise.allSettled(promises)
    for (const [i, r] of results.entries()) {
      const which = i === 0 ? 'client' : 'school'
      if (r.status === 'rejected') {
        console.warn(`[createTicketAction] ${which} email threw:`, r.reason)
      } else if (!r.value.ok) {
        console.warn(`[createTicketAction] ${which} email skipped/failed:`, r.value.error)
      }
    }
  } catch (e) {
    console.warn('[createTicketAction] email dispatch threw:', e)
  }

  revalidatePath('/client')
  return { ok: true as const, ticketId: ticket.id }
}

// ────────────────────────────────────────────────────────────────────────────
// Attach photos to a ticket (transactional wizard flow)
// ────────────────────────────────────────────────────────────────────────────
//
// Le wizard SAV client crée d'abord le ticket (createTicketAction sans
// photos), puis upload les photos vers Storage avec le ticket_id en
// préfixe de path. Cette action insère les entrées ticket_photos
// correspondantes. Si l'utilisateur ferme le navigateur entre l'upload
// et l'insert DB, les fichiers orphelins portent le ticket_id dans leur
// chemin et restent identifiables pour un cleanup ultérieur (l'ancien
// flow stockait sous `<userId>/<timestamp>` sans lien avec un ticket,
// d'où des photos orphelines impossibles à associer).
export async function attachTicketPhotosAction(input: unknown) {
  const parsed = attachTicketPhotosSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const { ticketId, photos } = parsed.data

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: { _form: ['Non authentifié'] } }

  // Vérifie que le ticket appartient bien au user — un client ne peut
  // attacher des photos qu'à ses propres tickets. La RLS sur ticket_photos
  // pose déjà le garde-fou via le join service_requests.client_id, mais
  // on échoue tôt avec un message explicite plutôt que sur une erreur DB
  // énigmatique.
  const { data: ticket, error: ticketErr } = await supabase
    .from('service_requests')
    .select('id, client_id')
    .eq('id', ticketId)
    .single()
    .returns<{ id: string; client_id: string | null }>()
  if (ticketErr || !ticket) {
    return { error: { _form: ['Ticket introuvable'] } }
  }
  if (ticket.client_id !== user.id) {
    return { error: { _form: ['Vous ne pouvez pas modifier ce ticket'] } }
  }

  // `uploaded_by` est OBLIGATOIRE : la RLS sec_client_insert_own_ticket
  // exige `uploaded_by = auth.uid()` — sans cette colonne, l'insert est
  // rejeté en silence par la RLS.
  const photoRows = photos.map((p, idx) => ({
    ticket_id:    ticketId,
    storage_path: p.storagePath,
    photo_type:   p.photoType,
    caption:      p.caption ?? null,
    sort_order:   idx,
    uploaded_by:  user.id,
  }))
  const { error: insertError } = await supabase.from('ticket_photos').insert(photoRows)
  if (insertError) {
    return { error: { _form: [`Erreur lors de l'enregistrement des photos (${insertError.message})`] } }
  }

  revalidatePath(`/client/ticket/${ticketId}`)
  revalidatePath('/client')
  return { ok: true as const, count: photoRows.length }
}
