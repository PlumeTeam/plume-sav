import type { Database, TicketStatus, RequestStatus, ServiceType, ProblemCategory, UrgencyLevel, PhotoType, MessageSenderRole } from '@plume/db'

export type Ticket = Database['public']['Tables']['service_requests']['Row']
export type TicketInsert = Database['public']['Tables']['service_requests']['Insert']
export type TicketPhoto = Database['public']['Tables']['ticket_photos']['Row']
export type TicketMessage = Database['public']['Tables']['ticket_messages']['Row']
export type TicketStatusHistory = Database['public']['Tables']['ticket_status_history']['Row']

export type { TicketStatus, RequestStatus, ServiceType, ProblemCategory, UrgencyLevel, PhotoType, MessageSenderRole }

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
  problemCategory: ProblemCategory | ''
  problemDescription: string
  urgency: UrgencyLevel
  wingBehaviors?: string[] // IDs from WING_BEHAVIOR_TYPES, used when problemCategory is 'other'
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

// Categories shown in the client wizard. 'porosity' is intentionally excluded:
// it's not something a client can self-diagnose — the workshop reports it after
// inspection. The DB enum still includes it for staff-side use.
export const PROBLEM_CATEGORIES: Array<{
  value: Exclude<ProblemCategory, 'porosity'>
  label: string
  description: string
  emoji: string
}> = [
  { value: 'tear',         label: 'Déchirure',  description: 'Accroc, coupure ou déchirure du tissu', emoji: '🪡' },
  { value: 'line_issue',   label: 'Suspente',   description: 'Suspente cassée, emmêlée ou usée',      emoji: '🧵' },
  { value: 'riser_issue',  label: 'Élévateur',  description: "Problème d'élévateur ou poulie",        emoji: '🔗' },
  { value: 'buckle_issue', label: 'Boucle',     description: 'Boucle défectueuse ou cassée',          emoji: '🔒' },
  { value: 'other',        label: 'Autre',      description: 'Autre problème non listé',              emoji: '❓' },
]

export const WING_BEHAVIOR_TYPES = [
  { id: 'not_straight',     label: 'Aile qui ne vole pas droit' },
  { id: 'too_fragile',      label: 'Aile trop fragile' },
  { id: 'lazy_inflation',   label: 'Aile trop paresseuse au gonflage' },
  { id: 'closes_easily',    label: 'Aile qui ferme facilement (fermetures asymétriques, frontales)' },
  { id: 'unstable',         label: 'Aile instable en turbulence' },
  { id: 'brake_issue',      label: 'Problème de freins (trop durs, trop mous, course trop longue/courte)' },
  { id: 'speed_issue',      label: 'Vitesse anormale (trop lente ou trop rapide)' },
  { id: 'other_behavior',   label: 'Autre comportement inhabituel' },
] as const

export const STATUS_CONFIG: Partial<Record<RequestStatus, { label: string; color: string; bg: string }>> = {
  pending:    { label: 'À traiter',  color: 'text-amber-800',   bg: 'bg-amber-100' },
  PENDING:    { label: 'À traiter',  color: 'text-amber-800',   bg: 'bg-amber-100' },
  processing: { label: 'En cours',   color: 'text-sky-800',     bg: 'bg-sky-100' },
  approved:   { label: 'Approuvé',   color: 'text-violet-800',  bg: 'bg-violet-100' },
  completed:  { label: 'Terminé',    color: 'text-emerald-800', bg: 'bg-emerald-100' },
  rejected:   { label: 'Rejeté',     color: 'text-red-800',     bg: 'bg-red-100' },
  cancelled:  { label: 'Annulé',     color: 'text-slate-600',   bg: 'bg-slate-100' },
  SUCCESS:    { label: 'Réussi',     color: 'text-emerald-800', bg: 'bg-emerald-100' },
  ERROR:      { label: 'Erreur',     color: 'text-red-800',     bg: 'bg-red-100' },
}
