import type {
  RequestStatus,
  SchoolResolution,
  ServiceType,
  TicketStatus,
  WizardProblemCategory,
} from '../types'

// Maps school resolution outcome → request_status the ticket transitions into.
// Aligned with the new step pipeline (migration 20260509000000).
export function resolutionToRequestStatus(r: SchoolResolution): RequestStatus {
  switch (r) {
    case 'resolved_by_school':         return 'school_resolved'      // école clôt sur place
    case 'normal_behavior_explained':  return 'school_resolved'      // idem — pas de réparation
    case 'escalated_to_workshop':      return 'escalated_to_workshop' // visible par l'atelier
    case 'escalated_to_plume':         return 'processing'            // reste ouvert, Plume reprend
    case 'workshop_advice_requested':  return 'processing'            // école garde l'aile, demande un avis
    case 'reflection':                 return 'processing'            // école n'a pas encore décidé
    default: {
      const _exhaustive: never = r
      return 'processing'
    }
  }
}

// Maps SAV problem category to the shared-platform service_type enum.
// 'porosity' is excluded from the client wizard (staff-only diagnosis), so
// the wizard never reaches this function with that value. 'fabric_issue'
// is wizard-only ("Tissu") and behaves like the other physical-damage
// categories — it routes to 'repair'.
export function deriveServiceType(category: WizardProblemCategory): ServiceType {
  if (['tear', 'fabric_issue', 'line_issue', 'riser_issue'].includes(category)) return 'repair'
  return 'sav'
}

// Maps the request_status (used by UI + actions) to the SAV ticket_status enum
// so both columns stay in sync. Read by status_history triggers + cross-app queries.
export function requestStatusToSavStatus(status: RequestStatus): TicketStatus {
  switch (status) {
    case 'pending':                 return 'submitted'
    case 'pending_workshop':        return 'submitted'
    case 'school_acknowledged':     return 'submitted'
    case 'wing_received_school':    return 'in_review'
    case 'school_checking':         return 'in_review'
    case 'processing':              return 'in_review'
    case 'approved':                return 'diagnosed'
    case 'school_resolved':         return 'closed'
    case 'escalated_to_workshop':   return 'diagnosed'
    case 'wing_received_workshop':  return 'in_review'
    case 'workshop_diagnosing':     return 'in_review'
    case 'workshop_repairing':      return 'repair_in_progress'
    case 'workshop_done':           return 'repaired'
    case 'wing_returned':           return 'shipped'
    case 'completed':               return 'closed'
    case 'rejected':                return 'rejected'
    case 'cancelled':               return 'closed'
    default:                        return 'submitted'
  }
}

export const PROBLEM_CATEGORY_LABELS: Record<WizardProblemCategory, string> = {
  tear:         'Déchirure',
  fabric_issue: 'Tissu',
  line_issue:   'Suspente',
  riser_issue:  'Élévateur',
  buckle_issue: 'Boucle',
  porosity:     'Porosité',
  other:        'Comportement',
}

export const BEHAVIOR_LABELS_BY_ID: Record<string, string> = {
  not_straight:    'Aile qui ne vole pas droit',
  too_fragile:     'Aile trop fragile',
  lazy_inflation:  'Aile trop paresseuse au gonflage',
  closes_easily:   'Aile qui ferme facilement',
  unstable:        'Aile instable en turbulence',
  brake_issue:     'Problème de freins',
  speed_issue:     'Vitesse anormale',
  other_behavior:  'Autre comportement inhabituel',
}

export const WATER_CONTACT_LABELS: Record<string, string> = {
  none:  'Non',
  fresh: 'Eau douce',
  salt:  'Eau salée',
}

export const SURFACE_CONTACT_LABELS: Record<string, string> = {
  sand:  'Sable / dunes',
  snow:  'Neige',
  other: 'Autre',
}

export const CONDITION_LABELS: Record<string, string> = {
  excellent: 'Excellent',
  good:      'Bon',
  worn:      'Usé',
  bad:       'Mauvais',
}

export type WingHistoryInput = {
  flightHours?:        string
  flightCount?:        string
  alreadyRepaired?:    'yes' | 'no' | null
  repairDescription?:  string
  waterContact?:       'none' | 'fresh' | 'salt' | null
  treeContact?:        'yes' | 'no' | null
  surfaceContact?:     Array<'sand' | 'snow' | 'other'>
  surfaceContactNote?: string
  generalCondition?:   'excellent' | 'good' | 'worn' | 'bad' | null
}

export function formatWingHistory(h: WingHistoryInput | undefined): string[] {
  if (!h) return []
  const lines: string[] = []
  if (h.flightHours)     lines.push(`  • Heures de vol : ${h.flightHours} h`)
  if (h.flightCount)     lines.push(`  • Nombre de vols : ${h.flightCount}`)
  if (h.alreadyRepaired === 'yes') {
    const repairLine = h.repairDescription
      ? `  • Déjà réparée : oui — ${h.repairDescription}`
      : `  • Déjà réparée : oui`
    lines.push(repairLine)
  } else if (h.alreadyRepaired === 'no') {
    lines.push('  • Déjà réparée : non')
  }
  if (h.waterContact) {
    lines.push(`  • Contact avec l'eau : ${WATER_CONTACT_LABELS[h.waterContact] ?? h.waterContact}`)
  }
  if (h.treeContact === 'yes') {
    lines.push('  • Arbrissage : Oui')
  } else if (h.treeContact === 'no') {
    lines.push('  • Arbrissage : Non')
  }
  if (h.surfaceContact && h.surfaceContact.length > 0) {
    const surfaces = h.surfaceContact
      .map((v) => SURFACE_CONTACT_LABELS[v] ?? v)
      .join(', ')
    const note = h.surfaceContact.includes('other') && h.surfaceContactNote
      ? ` (${h.surfaceContactNote})`
      : ''
    lines.push(`  • Sable/neige/dunes : ${surfaces}${note}`)
  }
  if (h.generalCondition) {
    lines.push(`  • État général : ${CONDITION_LABELS[h.generalCondition] ?? h.generalCondition}`)
  }
  return lines
}

// The DB only has a single `description` TEXT column for narrative — no dedicated
// problem_category, wing_size, wing_color, flight_hours, etc. We fold all the
// wizard metadata into a structured prefix the school can read, then append the
// client's free text.
export function buildRichDescription(input: {
  problemCategory: WizardProblemCategory
  urgency:         'normal' | 'urgent'
  freeText:        string
  wingBrand?:      string
  wingModel?:      string
  wingSize?:       string
  wingColor?:      string
  flightHours?:    number | null
  wingBehaviors?:  string[]
  wingHistory?:    WingHistoryInput
}): string {
  const lines: string[] = []
  lines.push(`[Catégorie] ${PROBLEM_CATEGORY_LABELS[input.problemCategory] ?? input.problemCategory}`)
  lines.push(`[Urgence] ${input.urgency === 'urgent' ? 'Urgent' : 'Normal'}`)

  const aile = [input.wingBrand, input.wingModel, input.wingSize && `Taille ${input.wingSize}`, input.wingColor]
    .filter(Boolean).join(' — ')
  if (aile) lines.push(`[Aile] ${aile}`)

  if (input.flightHours != null) {
    lines.push(`[Heures de vol] ${input.flightHours} h`)
  }

  if (input.wingBehaviors && input.wingBehaviors.length > 0) {
    const labels = input.wingBehaviors
      .map((id) => BEHAVIOR_LABELS_BY_ID[id] ?? id)
      .join(', ')
    lines.push(`[Comportements] ${labels}`)
  }

  const historyLines = formatWingHistory(input.wingHistory)
  if (historyLines.length > 0) {
    lines.push('[Historique aile]')
    lines.push(...historyLines)
  }

  return `${lines.join('\n')}\n\n---\n\n${input.freeText}`
}
