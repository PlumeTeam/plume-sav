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
import { generateShippingLabelSchema } from '../schemas'

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
