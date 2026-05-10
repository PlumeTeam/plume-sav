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
 * Étape 2 — L'école a réceptionné l'aile (en main propre ou par poste).
 * school_acknowledged → wing_received_school
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

