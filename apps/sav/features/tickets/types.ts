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
  value: ProblemCategory
  label: string
  description: string
  emoji: string
}> = [
  { value: 'tear',         label: 'Déchirure',            description: 'Accroc, coupure ou déchirure du tissu',     emoji: '🪡' },
  { value: 'line_issue',   label: 'Suspente',             description: 'Suspente cassée, emmêlée ou usée',          emoji: '🧵' },
  { value: 'riser_issue',  label: 'Élévateur',            description: "Problème d'élévateur ou poulie",           emoji: '🔗' },
  { value: 'buckle_issue', label: 'Boucle',               description: 'Boucle défectueuse ou cassée',             emoji: '🔒' },
  { value: 'porosity',     label: 'Porosité',             description: 'Tissu poreux, aile vieillissante',          emoji: '💨' },
  { value: 'other',        label: 'Autre',                description: 'Autre problème non listé',                  emoji: '❓' },
]

export const STATUS_CONFIG: Partial<Record<RequestStatus, { label: string; color: string; bg: string }>> = {
  pending:    { label: 'En attente',      color: 'text-amber-700',  bg: 'bg-amber-100' },
  PENDING:    { label: 'En attente',      color: 'text-amber-700',  bg: 'bg-amber-100' },
  processing: { label: 'En cours',        color: 'text-blue-700',   bg: 'bg-blue-100' },
  approved:   { label: 'Approuvé',        color: 'text-green-700',  bg: 'bg-green-100' },
  completed:  { label: 'Terminé',         color: 'text-green-700',  bg: 'bg-green-100' },
  rejected:   { label: 'Rejeté',          color: 'text-red-700',    bg: 'bg-red-100' },
  cancelled:  { label: 'Annulé',          color: 'text-slate-500',  bg: 'bg-slate-100' },
  SUCCESS:    { label: 'Réussi',          color: 'text-green-700',  bg: 'bg-green-100' },
  ERROR:      { label: 'Erreur',          color: 'text-red-700',    bg: 'bg-red-100' },
}
