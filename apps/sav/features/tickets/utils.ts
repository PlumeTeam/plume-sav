import type { TicketStatus, WingBehaviorValue } from './types'
import { WING_BEHAVIORS } from './types'

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

export function getWingBehaviorLabel(value: WingBehaviorValue): string {
  return WING_BEHAVIORS.find((b) => b.value === value)?.label ?? value
}

// Composes problem_description for "wing_behavior" tickets so the SAV team sees
// the structured behavior list + free-text + base description in one field.
export function composeWingBehaviorDescription(args: {
  behaviors: WingBehaviorValue[]
  behaviorOther: string
  description: string
}): string {
  const lines: string[] = ["Comportement de l'aile signalé :"]
  if (args.behaviors.length > 0) {
    for (const b of args.behaviors) {
      lines.push(`- ${getWingBehaviorLabel(b)}`)
    }
  }
  const otherTrimmed = args.behaviorOther.trim()
  if (otherTrimmed.length > 0) {
    lines.push(`- Autre : ${otherTrimmed}`)
  }
  const descTrimmed = args.description.trim()
  if (descTrimmed.length > 0) {
    lines.push('', 'Contexte / informations complémentaires :', descTrimmed)
  }
  return lines.join('\n')
}
