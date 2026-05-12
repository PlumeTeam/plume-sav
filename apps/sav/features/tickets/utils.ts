import type { RequestStatus, Ticket, WarrantyStatus } from './types'

export function formatDate(isoDate: string | null): string {
  if (!isoDate) return '—'
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(isoDate))
}

export function formatDateTime(isoDate: string | null): string {
  if (!isoDate) return '—'
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(isoDate))
}

// T6 — Calcul de garantie pur (pas d'I/O).
//  - purchaseDate manquant / non parsable → null (impossible à statuer)
//  - sinon : sous garantie si maintenant ≤ purchaseDate + warrantyMonths
export function computeWarrantyStatus(
  purchaseDate: string | null | undefined,
  warrantyMonths: number,
  now: Date = new Date(),
): WarrantyStatus | null {
  if (!purchaseDate) return null
  const purchase = new Date(purchaseDate)
  if (Number.isNaN(purchase.getTime())) return null
  const cutoff = new Date(purchase)
  cutoff.setMonth(cutoff.getMonth() + warrantyMonths)
  return now.getTime() <= cutoff.getTime() ? 'under_warranty' : 'out_of_warranty'
}

// Décision auto en fonction du seuil. Pas de garde-fou métier ici — la
// Server Action revalidera et figera la décision avec le seuil courant.
export function computeRepairDecision(
  estimatedCostEur: number,
  thresholdEur: number,
): 'repair' | 'replacement' {
  return estimatedCostEur <= thresholdEur ? 'repair' : 'replacement'
}

export function getSupabasePublicUrl(storagePath: string): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) return storagePath
  return `${url}/storage/v1/object/public/tickets/${storagePath}`
}

// ─── Pipeline d'étapes SAV ──────────────────────────────────────────────────
//
// Ordre canonique du parcours d'un ticket SAV. La timeline du client + le
// stepper école/atelier dérivent de cette liste — seul le set affiché varie
// (haut niveau pour le badge, complet pour la timeline cliente).
//
// Branches :
//  - happy path : pending → school_ack → wing_received_school → school_checking
//                 → school_resolved (si école résout) → completed
//  - escalade   : pending → ... → escalated_to_workshop → wing_received_workshop
//                 → workshop_diagnosing → workshop_repairing → workshop_done
//                 → wing_returned → completed

const STATUS_ORDER: RequestStatus[] = [
  'pending',
  'school_acknowledged',
  'wing_received_school',
  'school_checking',
  'processing',
  'approved',
  'school_resolved',
  'escalated_to_workshop',
  'wing_received_workshop',
  'workshop_pre_checking',
  'workshop_diagnosing',
  'workshop_repairing',
  'workshop_done',
  'wing_returned',
  'completed',
]

// High-level étapes — utilisées par le badge et la TicketTimeline (école/atelier).
// On groupe les sous-étapes pour rester lisible.
export const TIMELINE_STEPS: Array<{ status: RequestStatus; label: string }> = [
  { status: 'pending',                label: 'En attente'  },
  { status: 'school_acknowledged',    label: 'Vue école'   },
  { status: 'wing_received_school',   label: 'Aile reçue'  },
  { status: 'school_checking',        label: 'Diagnostic'  },
  { status: 'escalated_to_workshop',  label: 'Vers atelier'},
  { status: 'workshop_repairing',     label: 'Réparation'  },
  { status: 'completed',              label: 'Terminé'     },
]

const TIMELINE_INDEX_BY_STATUS: Partial<Record<RequestStatus, number>> = {
  pending:                 0,
  school_acknowledged:     1,
  wing_received_school:    2,
  school_checking:         3,
  processing:              3,
  approved:                3,
  school_resolved:         6, // école a clôturé → on saute à "Terminé"
  escalated_to_workshop:   4,
  wing_received_workshop:  4,
  workshop_pre_checking:   4,
  workshop_diagnosing:     4,
  workshop_repairing:      5,
  workshop_done:           5,
  wing_returned:           6,
  completed:               6,
}

export function getStatusStep(status: RequestStatus): number {
  return TIMELINE_INDEX_BY_STATUS[status] ?? 0
}

// Compares two statuses on the canonical pipeline. Returns true if `a` is
// at the same position or further along than `b`. Used by Server Actions to
// guard against double-clicks rewinding state.
export function statusGte(a: RequestStatus, b: RequestStatus): boolean {
  const ia = STATUS_ORDER.indexOf(a)
  const ib = STATUS_ORDER.indexOf(b)
  if (ia === -1 || ib === -1) return false
  return ia >= ib
}

// ─── Journey timeline (côté client) ─────────────────────────────────────────
//
// Liste détaillée des étapes utilisée par ClientJourneyTimeline. Chaque step
// expose la colonne timestamp qui le matérialise sur la ligne service_requests.

type TicketTimestamps = Pick<
  Ticket,
  | 'created_at'
  | 'school_acknowledged_at'
  | 'wing_received_school_at'
  | 'school_resolved_at'
  | 'escalated_to_workshop_at'
  | 'wing_received_workshop_at'
  | 'workshop_diagnosis_at'
  | 'workshop_repair_done_at'
  | 'wing_returned_at'
  | 'delivery_method'
> & { status: RequestStatus; school_resolution: Ticket['school_resolution'] }

export type JourneyState = 'done' | 'current' | 'upcoming'

export interface JourneyStep {
  id:        string
  label:     string
  helpText?: string
  emoji:     string
  /** Timestamp ISO si l'étape est franchie, null sinon. */
  at:        string | null
  state:     JourneyState
  /** Some steps share their timestamp with the next one (e.g. "Envoi" /
   *  "Aile reçue") — hiding the date avoids visual redundancy. */
  hideTimestamp?: boolean
}

// Construit la liste des étapes effectivement applicables au ticket.
// La branche "atelier" n'apparaît que si le ticket a été escaladé, sinon on
// affiche la branche "résolu par l'école". Le client voit donc une timeline
// adaptée à son histoire.
export function buildJourneySteps(t: TicketTimestamps): JourneyStep[] {
  const isEscalated =
    t.school_resolution === 'escalated_to_workshop' ||
    !!t.escalated_to_workshop_at ||
    statusGte(t.status, 'escalated_to_workshop')

  const isSchoolResolved =
    t.school_resolution === 'resolved_by_school' ||
    t.school_resolution === 'normal_behavior_explained' ||
    t.status === 'school_resolved'

  const steps: Array<{
    id: string; label: string; helpText?: string; emoji: string; at: string | null; hideTimestamp?: boolean;
  }> = []

  const isPostal = t.delivery_method === 'postal'

  steps.push({ id: 'sent',                 label: 'Demande envoyée',          emoji: '📨', at: t.created_at })
  // Postal-only: extra "in transit" step between sent and reception. Same
  // timestamp as `wing_received_school` (we don't have a distinct shipped_at
  // column), but we hide the date here so the user doesn't see it twice.
  if (isPostal) {
    steps.push({ id: 'to_school',          label: 'Envoi de l\'aile',         emoji: '🚚', at: t.wing_received_school_at, hideTimestamp: true })
  }
  steps.push({ id: 'school_acknowledged',  label: 'Vue par l\'école',         emoji: '👀', at: t.school_acknowledged_at })
  steps.push({ id: 'wing_received_school', label: 'Aile reçue par l\'école',  emoji: '📥', at: t.wing_received_school_at })
  steps.push({
    id:    'school_decision',
    label: isSchoolResolved
      ? 'Résolu par l\'école'
      : isEscalated
        ? 'Décision : envoi atelier'
        : 'Diagnostic école',
    emoji: isSchoolResolved ? '✅' : isEscalated ? '🛠️' : '🔍',
    at:    t.school_resolved_at ?? t.escalated_to_workshop_at,
  })

  if (isEscalated) {
    steps.push({ id: 'sent_to_workshop',     label: 'Envoyée à l\'atelier', emoji: '📦', at: t.escalated_to_workshop_at })
    steps.push({ id: 'wing_received_workshop', label: 'Reçue par l\'atelier', emoji: '🏭', at: t.wing_received_workshop_at })
    steps.push({ id: 'workshop_diagnosing',  label: 'Diagnostic atelier',   emoji: '🔬', at: t.workshop_diagnosis_at })
    steps.push({ id: 'workshop_repair_done', label: 'Réparation terminée',  emoji: '🛠️', at: t.workshop_repair_done_at })
    steps.push({ id: 'wing_returned',        label: 'Aile renvoyée',        emoji: '✈️', at: t.wing_returned_at })
  }

  // Détermination du state :
  //  - dernière étape avec un timestamp = current
  //  - étapes précédentes = done
  //  - étapes suivantes = upcoming
  // Si `completed` est atteint ou si l'école a résolu sans escalade, la
  // dernière étape est marquée "done" (pas "current").
  const isClosed = t.status === 'completed' || (isSchoolResolved && !isEscalated)
  const lastDoneIdx = (() => {
    let last = -1
    for (let i = 0; i < steps.length; i++) {
      if (steps[i]!.at) last = i
    }
    return last
  })()

  const result: JourneyStep[] = steps.map((s, i) => ({
    ...s,
    state:
      i < lastDoneIdx                ? 'done'    :
      i === lastDoneIdx              ? (isClosed ? 'done' : 'current') :
      'upcoming',
  }))

  // Override: `to_school` (postal-only step) shares its timestamp with
  // `wing_received_school`, but the standard lastDoneIdx algo can't tell
  // that "no timestamp = in transit" — it would either mark it done (when a
  // later step has a timestamp) or upcoming (when nothing later has one).
  // Force the right state from the actual reception column.
  const toSchoolIdx = result.findIndex((s) => s.id === 'to_school')
  if (toSchoolIdx !== -1) {
    const isReceived = !!t.wing_received_school_at
    if (isReceived) {
      result[toSchoolIdx]!.state = 'done'
    } else {
      result[toSchoolIdx]!.state = 'current'
      // The step right before (sent) was 'current' by default — promote it
      // to 'done' so the timeline shows a single in-progress step.
      if (toSchoolIdx > 0 && result[toSchoolIdx - 1]!.state === 'current') {
        result[toSchoolIdx - 1]!.state = 'done'
      }
    }
  }

  return result
}
