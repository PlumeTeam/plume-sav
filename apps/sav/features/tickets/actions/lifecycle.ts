'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserRoles } from '@/features/auth/queries'
import { PARTNER_WORKSHOPS } from '../constants'
import { getPartnerSchoolById } from '../queries'
import type {
  ClientShippingAddress,
  CloserRole,
  ClosureOutcome,
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
import { CLOSURE_OUTCOME_LABELS } from '../types'
import { closeTicketSchema } from '../schemas'
import { sendClientStepUpdateEmail, type ClientStepEmail, type TicketEmailContext } from '../email'
import { requestStatusToSavStatus } from './_helpers'
import { advanceTicketStep } from './_step-advance'

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
 * Ã‰tape 2 â€” L'Ã©cole a rÃ©ceptionnÃ© l'aile (en main propre ou par poste).
 * school_acknowledged â†’ wing_received_school
 */

export async function markWingReturnedAction(formData: FormData) {
  const ticketId = String(formData.get('ticketId') ?? '')
  if (!ticketId) return { error: { _form: ['Identifiant manquant'] } }
  const recipient = String(formData.get('recipient') ?? '')
  // recipient est requis et doit Ãªtre 'school' ou 'client' â€” refuse explicitement
  // les valeurs forgÃ©es (anti-injection) plutÃ´t que de fallback silencieusement.
  if (recipient !== 'school' && recipient !== 'client') {
    return { error: { _form: ['Destination invalide â€” choisissez Ã©cole ou client'] } }
  }
  const note = recipient === 'school'
    ? "Aile renvoyÃ©e Ã  l'Ã©cole partenaire"
    : 'Aile renvoyÃ©e directement au client'
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
 * Ã‰tape finale â€” ClÃ´ture du ticket. Disponible depuis :
 *  - wing_returned (parcours atelier complet)
 *  - school_resolved (parcours Ã©cole-only)
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
// Cloture explicite d'un ticket (T7)
// ============================================================
//
// Bouton "Cloturer le ticket" present dans les espaces ecole / atelier /
// Plume HQ. Le client n'a JAMAIS le droit de cloturer (verification de
// role ci-dessous). Contrairement a `markTicketCompletedAction` qui ne
// fonctionne qu'aux statuts terminaux, `closeTicketAction` accepte
// n'importe quel statut non-cloture : permet a l'ecole/atelier/Plume de
// cloturer meme a mi-parcours (cas remplacement direct, annulation
// client, demande non valide...).
//
// La cloture est idempotente : un appel sur un ticket deja cloture renvoie
// success sans modifier les colonnes closed_by / closed_at (1ere cloture
// fait foi pour la tracabilite).

const CLOSER_ROLE_TO_SENDER: Record<CloserRole, MessageSenderRole> = {
  school:      'school',
  workshop:    'workshop',
  plume_admin: 'plume_admin',
}

/**
 * Determine le role de cloture a partir des roles user. Plume HQ a priorite
 * (un admin Plume peut cloturer depuis n'importe quel espace). Sinon on
 * privilegie workshop puis school. Le client est explicitement rejete.
 */
function pickCloserRole(roles: readonly string[]): CloserRole | null {
  if (roles.includes('plume_admin')) return 'plume_admin'
  if (roles.includes('workshop'))    return 'workshop'
  if (roles.includes('school'))      return 'school'
  return null
}

export async function closeTicketAction(formData: FormData) {
  const parsed = closeTicketSchema.safeParse({
    ticketId: formData.get('ticketId'),
    outcome:  formData.get('outcome'),
    note:     formData.get('note') || undefined,
  })
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: { _form: ['Non authentifie'] } }

  const roles      = await getCurrentUserRoles()
  const closerRole = pickCloserRole(roles)
  if (!closerRole) {
    return {
      error: {
        _form: ["Action reservee a l'ecole, l'atelier ou Plume HQ. Le client ne peut pas cloturer un ticket."],
      },
    }
  }

  const { ticketId, outcome, note } = parsed.data

  const { data: current, error: fetchError } = await supabase
    .from('service_requests')
    .select('id, status, closed_at, first_name, last_name, email, referent_school_id')
    .eq('id', ticketId)
    .single()
    .returns<{
      id:                 string
      status:             RequestStatus
      closed_at:          string | null
      first_name:         string | null
      last_name:          string | null
      email:              string | null
      referent_school_id: string | null
    }>()

  if (fetchError || !current) {
    return { error: { _form: ['Demande introuvable'] } }
  }

  // Idempotence : si le ticket est deja cloture, renvoie success sans toucher
  // closed_by / closed_at (la 1ere cloture fait foi pour la tracabilite).
  if (current.closed_at) {
    return { success: true as const, alreadyClosed: true as const }
  }

  const now = new Date().toISOString()

  const update: Partial<TicketUpdate> = {
    status:          'completed',
    sav_status:      'closed',
    completion_date: now,
    closed_by:       user.id,
    closed_at:       now,
    closed_by_role:  closerRole,
    closure_outcome: outcome,
    closure_note:    note ?? null,
  }

  const { error: updateError } = await supabase
    .from('service_requests')
    .update(update)
    .eq('id', ticketId)

  if (updateError) {
    return { error: { _form: [`Erreur lors de la cloture (${updateError.message})`] } }
  }

  // Audit trail (best-effort)
  const { error: histError } = await supabase.from('ticket_status_history').insert({
    ticket_id:  ticketId,
    old_status: requestStatusToSavStatus(current.status),
    new_status: 'closed' as TicketStatus,
    changed_by: user.id,
    note:       `Cloture (${CLOSURE_OUTCOME_LABELS[outcome]})${note ? ` - ${note}` : ''}`,
  })
  if (histError) console.error('[SAV] ticket_status_history insert failed:', histError.message)

  // Message public - informe le client de la cloture + raison. Visibilite
  // 'all' pour que le client le voie dans son thread.
  await supabase.from('ticket_messages').insert({
    ticket_id:        ticketId,
    sender_id:        user.id,
    sender_role:      CLOSER_ROLE_TO_SENDER[closerRole],
    content:          `[Ticket cloture - ${CLOSURE_OUTCOME_LABELS[outcome]}]${note ? `\n${note}` : ''}`,
    is_internal:      false,
    visibility_level: 'all',
  })

  // Notification email client (best-effort)
  if (current.email) {
    try {
      const schoolDetail = current.referent_school_id
        ? await getPartnerSchoolById(current.referent_school_id)
        : null
      const ref = `#${current.id.slice(0, 8).toUpperCase()}`
      const r = await sendClientStepUpdateEmail(supabase, 'completed', {
        ticketId:    current.id,
        ticketRef:   ref,
        clientFirst: current.first_name ?? 'Pilote',
        clientEmail: current.email,
        schoolName:  schoolDetail?.name ?? null,
      })
      if (!r.ok) console.warn('[closeTicketAction] completion email skipped:', r.error)
    } catch (e) {
      console.warn('[closeTicketAction] completion email threw:', e)
    }
  }

  revalidatePath(`/client/ticket/${ticketId}`)
  revalidatePath(`/school/ticket/${ticketId}`)
  revalidatePath(`/workshop/ticket/${ticketId}`)
  revalidatePath('/client')
  revalidatePath('/school')
  revalidatePath('/workshop')
  revalidatePath('/plume')

  return {
    success:      true as const,
    closedByRole: closerRole,
    outcome,
  }
}

// ============================================================
// Bons de transport GLS (migration 20260510000000)
// ============================================================
//
// Trois legs de transport peuvent Ãªtre dÃ©clenchÃ©s :
//   1. client_to_school   â€” par le client, aprÃ¨s choix "envoi postal"
//   2. school_to_workshop â€” par l'Ã©cole, aprÃ¨s escalade vers atelier
//   3. workshop_to_return â€” par l'atelier, aprÃ¨s rÃ©paration
//
// La gÃ©nÃ©ration elle-mÃªme est, pour l'instant, simulÃ©e (placeholder).
// Le cÃ¢blage vers l'API GLS rÃ©elle (via une edge function wrapper qui
// peut lire les secrets GLS_*) est documentÃ© en Phase 4 â€” voir le PR.
//
// Anti-abus : un client a droit Ã  1 SAV gratuit par annÃ©e civile. Ã€
// partir du 2Ã¨me ticket, le leg client_to_school passe en validation
// admin (auto_approved_shipping = false) avant que l'Ã©tiquette ne soit
// gÃ©nÃ©rÃ©e. Les autres legs (Ã©cole/atelier) ne sont jamais bloquÃ©s.


