import type { Database, TicketStatus, RequestStatus, ServiceType, ProblemCategory, UrgencyLevel, PhotoType, MessageSenderRole } from '@plume/db'

export type Ticket = Database['public']['Tables']['service_requests']['Row']
export type TicketInsert = Database['public']['Tables']['service_requests']['Insert']
export type TicketPhoto = Database['public']['Tables']['ticket_photos']['Row']
export type TicketMessage = Database['public']['Tables']['ticket_messages']['Row']
export type TicketStatusHistory = Database['public']['Tables']['ticket_status_history']['Row']

export type { TicketStatus, RequestStatus, ServiceType, ProblemCategory, UrgencyLevel, PhotoType, MessageSenderRole }

// Wizard-only category set: extends the DB enum with `wing_behavior`,
// which is normalized to the DB `other` category at save time. The
// selected behavior tags are serialized into problem_description.
export type WizardProblemCategory = ProblemCategory | 'wing_behavior'

export type TicketWithPhotos = Ticket & {
  ticket_photos: TicketPhoto[]
}

export type TicketWithHistory = Ticket & {
  ticket_status_history: TicketStatusHistory[]
}

export type TicketDetail = Ticket & {
  ticket_photos: TicketPhoto[]
  ticket_status_history: TicketStatusHistory[]
  ticket_messages: TicketMessage[]
}

// Wizard step data types (client-side only)
export interface WizardWingInfo {
  wingBrand: string
  wingModel: string
  wingSize: string
  wingSerial: string
  wingColor: string
  purchaseDate: string
  flightHours: string
}

export interface WizardProblem {
  problemCategory: WizardProblemCategory | ''
  problemDescription: string
  urgency: UrgencyLevel
  // Multi-select behavior tags — only relevant when problemCategory === 'wing_behavior'
  wingBehaviors: WingBehaviorValue[]
  wingBehaviorOther: string
}

export interface WizardPhoto {
  dataUrl: string
  photoType: PhotoType
  caption: string
  fileName: string
}

export const WING_BRANDS = [
  'Plume', 'Ozone', 'Advance', 'Niviuk', 'Nova', 'Gin', 'BGD',
  'Skywalk', 'U-Turn', 'Gradient', 'Triple Seven', 'Sup Air', 'Autre',
] as const

export const PROBLEM_CATEGORIES: Array<{
  value: WizardProblemCategory
  label: string
  description: string
  emoji: string
}> = [
  { value: 'tear',          label: 'Déchirure',            description: 'Accroc, coupure ou déchirure du tissu',     emoji: '🪡' },
  { value: 'line_issue',    label: 'Suspente',             description: 'Suspente cassée, emmêlée ou usée',          emoji: '🧵' },
  { value: 'riser_issue',   label: 'Élévateur',            description: "Problème d'élévateur ou poulie",           emoji: '🔗' },
  { value: 'buckle_issue',  label: 'Boucle',               description: 'Boucle défectueuse ou cassée',             emoji: '🔒' },
  { value: 'porosity',      label: 'Porosité',             description: 'Tissu poreux, aile vieillissante',          emoji: '💨' },
  { value: 'wing_behavior', label: "Comportement de l'aile", description: 'Vol, gonflage, freins, stabilité…',       emoji: '🪁' },
  { value: 'other',         label: 'Autre',                description: 'Autre problème non listé',                  emoji: '❓' },
]

// Diagnostic checklist shown when "Comportement de l'aile" is selected.
// `value` is a stable machine-readable id; `label` is the FR text shown to the user
// and serialized into problem_description on save.
export type WingBehaviorValue =
  | 'not_straight'
  | 'too_fragile'
  | 'sluggish_inflation'
  | 'collapses_easily'
  | 'unstable_turbulence'
  | 'brake_issue'
  | 'abnormal_speed'

export const WING_BEHAVIORS: Array<{ value: WingBehaviorValue; label: string }> = [
  { value: 'not_straight',         label: "Aile qui ne vole pas droit" },
  { value: 'too_fragile',          label: 'Aile trop fragile' },
  { value: 'sluggish_inflation',   label: 'Aile trop paresseuse au gonflage' },
  { value: 'collapses_easily',     label: 'Aile qui ferme facilement (fermetures asymétriques, frontales)' },
  { value: 'unstable_turbulence',  label: 'Aile instable en turbulence' },
  { value: 'brake_issue',          label: 'Problème de freins (trop durs, trop mous, course trop longue/courte)' },
  { value: 'abnormal_speed',       label: 'Vitesse anormale (trop lente ou trop rapide)' },
]

// STATUS_CONFIG is keyed by TicketStatus (sav_status column — ticket_status enum)
export const STATUS_CONFIG: Record<TicketStatus, { label: string; color: string; bg: string }> = {
  draft:              { label: 'Brouillon',         color: 'text-slate-600',  bg: 'bg-slate-100' },
  submitted:          { label: 'Envoyé',            color: 'text-blue-700',   bg: 'bg-blue-100' },
  in_review:          { label: 'En révision',       color: 'text-amber-700',  bg: 'bg-amber-100' },
  diagnosed:          { label: 'Diagnostiqué',      color: 'text-purple-700', bg: 'bg-purple-100' },
  repair_in_progress: { label: 'En réparation',     color: 'text-orange-700', bg: 'bg-orange-100' },
  repaired:           { label: 'Réparé',            color: 'text-green-700',  bg: 'bg-green-100' },
  shipped:            { label: 'Expédié',           color: 'text-teal-700',   bg: 'bg-teal-100' },
  closed:             { label: 'Clôturé',           color: 'text-slate-500',  bg: 'bg-slate-100' },
  rejected:           { label: 'Rejeté',            color: 'text-red-700',    bg: 'bg-red-100' },
}
