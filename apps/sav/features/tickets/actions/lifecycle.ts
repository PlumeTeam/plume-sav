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


