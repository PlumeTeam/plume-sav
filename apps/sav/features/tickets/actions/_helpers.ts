import type {
  RequestStatus,
  SchoolResolution,
  ServiceType,
  TicketStatus,
  WizardProblemCategory,
} from '../types'

// Maps school resolution outcome â†’ request_status the ticket transitions into.
// Aligned with the new step pipeline (migration 20260509000000).
export function resolutionToRequestStatus(r: SchoolResolution): RequestStatus {
  switch (r) {
    case 'resolved_by_school':         return 'school_resolved'      // Ã©cole clÃ´t sur place
    case 'normal_behavior_explained':  return 'school_resolved'      // idem â€” pas de rÃ©paration
    case 'escalated_to_workshop':      return 'escalated_to_workshop' // visible par l'atelier
    case 'escalated_to_plume':         return 'processing'            // reste ouvert, Plume reprend
    case 'workshop_advice_requested':  return 'processing'            // Ã©cole garde l'aile, demande un avis
    case 'reflection':                 return 'processing'            // Ã©cole n'a pas encore dÃ©cidÃ©
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
// categories â€” it routes to 'repair'.
export function deriveServiceType(category: WizardProblemCategory): ServiceType {
  if (['tear', 'fabric_issue', 'line_issue', 'riser_issue'].includes(category)) return 'repair'
  return 'sav'
}

// Maps the request_status (used by UI + actions) to the SAV ticket_status enum
// so both columns stay in sync. Read by status_history triggers + cross-app queries.
export function requestStatusToSavStatus(status: RequestStatus): TicketStatus {
  switch (status) {
    case 'pending':                 return 'submitted'
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
  tear:         'DÃ©chirure',
  fabric_issue: 'Tissu',
  line_issue:   'Suspente',
  riser_issue:  'Ã‰lÃ©vateur',
  buckle_issue: 'Boucle',
  porosity:     'PorositÃ©',
  other:        'Comportement',
}

export const BEHAVIOR_LABELS_BY_ID: Record<string, string> = {
  not_straight:    'Aile qui ne vole pas droit',
  too_fragile:     'Aile trop fragile',
  lazy_inflation:  'Aile trop paresseuse au gonflage',
  closes_easily:   'Aile qui ferme facilement',
  unstable:        'Aile instable en turbulence',
  brake_issue:     'ProblÃ¨me de freins',
  speed_issue:     'Vitesse anormale',
  other_behavior:  'Autre comportement inhabituel',
}

export const WATER_CONTACT_LABELS: Record<string, string> = {
  none:  'Non',
  fresh: 'Eau douce',
  salt:  'Eau salÃ©e',
}

export const SURFACE_CONTACT_LABELS: Record<string, string> = {
  none:  'Non',
  sand:  'Sable / dunes',
  snow:  'Neige',
  other: 'Autre',
}

export const CONDITION_LABELS: Record<string, string> = {
  excellent: 'Excellent',
  good:      'Bon',
  worn:      'UsÃ©',
  bad:       'Mauvais',
}

export type WingHistoryInput = {
  flightHours?:        string
  flightCount?:        string
  alreadyRepaired?:    'yes' | 'no' | null
  repairDescription?:  string
  waterContact?:       'none' | 'fresh' | 'salt' | null
  treeContact?:        'yes' | 'no' | null
  surfaceContact?:     'none' | 'sand' | 'snow' | 'other' | null
  surfaceContactNote?: string
  generalCondition?:   'excellent' | 'good' | 'worn' | 'bad' | null
}

export function formatWingHistory(h: WingHistoryInput | undefined): string[] {
  if (!h) return []
  const lines: string[] = []
  if (h.flightHours)     lines.push(`  â€¢ Heures de vol : ${h.flightHours} h`)
  if (h.flightCount)     lines.push(`  â€¢ Nombre de vols : ${h.flightCount}`)
  if (h.alreadyRepaired === 'yes') {
    const repairLine = h.repairDescription
      ? `  â€¢ DÃ©jÃ  rÃ©parÃ©e : oui â€” ${h.repairDescription}`
      : `  â€¢ DÃ©jÃ  rÃ©parÃ©e : oui`
    lines.push(repairLine)
  } else if (h.alreadyRepaired === 'no') {
    lines.push('  â€¢ DÃ©jÃ  rÃ©parÃ©e : non')
  }
  if (h.waterContact) {
    lines.push(`  â€¢ Contact avec l'eau : ${WATER_CONTACT_LABELS[h.waterContact] ?? h.waterContact}`)
  }
  if (h.treeContact === 'yes') {
    lines.push('  â€¢ Arbrissage : Oui')
  } else if (h.treeContact === 'no') {
    lines.push('  â€¢ Arbrissage : Non')
  }
  if (h.surfaceContact) {
    const surface = SURFACE_CONTACT_LABELS[h.surfaceContact] ?? h.surfaceContact
    const note = h.surfaceContact === 'other' && h.surfaceContactNote
      ? ` (${h.surfaceContactNote})`
      : ''
    lines.push(`  â€¢ Sable/neige/dunes : ${surface}${note}`)
  }
  if (h.generalCondition) {
    lines.push(`  â€¢ Ã‰tat gÃ©nÃ©ral : ${CONDITION_LABELS[h.generalCondition] ?? h.generalCondition}`)
  }
  return lines
}

// The DB only has a single `description` TEXT column for narrative â€” no dedicated
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
  lines.push(`[CatÃ©gorie] ${PROBLEM_CATEGORY_LABELS[input.problemCategory] ?? input.problemCategory}`)
  lines.push(`[Urgence] ${input.urgency === 'urgent' ? 'Urgent' : 'Normal'}`)

  const aile = [input.wingBrand, input.wingModel, input.wingSize && `Taille ${input.wingSize}`, input.wingColor]
    .filter(Boolean).join(' â€” ')
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

