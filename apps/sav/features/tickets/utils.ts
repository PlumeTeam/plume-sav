import type { RequestStatus } from './types'

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
  return `${url}/storage/v1/object/public/tickets/${storagePath}`
}

// Timeline steps for the Domino's-style tracker
export const TIMELINE_STEPS: Array<{ status: RequestStatus; label: string }> = [
  { status: 'pending',    label: 'En attente' },
  { status: 'processing', label: 'En cours' },
  { status: 'approved',   label: 'Approuvé' },
  { status: 'completed',  label: 'Terminé' },
]

const STATUS_ORDER: RequestStatus[] = [
  'pending', 'processing', 'approved', 'completed',
]

export function getStatusStep(status: RequestStatus): number {
  return STATUS_ORDER.indexOf(status)
}
