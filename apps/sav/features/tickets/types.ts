import type { Database, TicketStatus, ProblemCategory, UrgencyLevel, PhotoType, MessageSenderRole } from '@plume/db'

export type Ticket = Database['public']['Tables']['service_requests']['Row']
export type TicketInsert = Database['public']['Tables']['service_requests']['Insert']
export type TicketPhoto = Database['public']['Tables']['ticket_photos']['Row']
export type TicketMessage = Database['public']['Tables']['ticket_messages']['Row']
export type TicketStatusHistory = Database['public']['Tables']['ticket_status_history']['Row']

export type { TicketStatus, ProblemCategory, UrgencyLevel, PhotoType, MessageSenderRole }

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
