import type { TicketStatus } from './types'

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

export function getSupabasePublicUrl(storagePath: string): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) return storagePath
  return `${url}/storage/v1/object/public/ticket-photos/${storagePath}`
}

// Timeline steps for the Domino's-style tracker
export const TIMELINE_STEPS: Array<{ status: TicketStatus; label: string }> = [
  { status: 'submitted',          label: 'Ticket envoyé' },
  { status: 'in_review',          label: "Inspection école" },
  { status: 'diagnosed',          label: 'Diagnostiqué' },
  { status: 'repair_in_progress', label: 'En réparation' },
  { status: 'repaired',           label: 'Réparé' },
  { status: 'shipped',            label: 'Expédié' },
  { status: 'closed',             label: 'Clôturé' },
]

const STATUS_ORDER: TicketStatus[] = [
  'draft', 'submitted', 'in_review', 'diagnosed',
  'repair_in_progress', 'repaired', 'shipped', 'closed',
]

export function getStatusStep(status: TicketStatus): number {
  return STATUS_ORDER.indexOf(status)
}
