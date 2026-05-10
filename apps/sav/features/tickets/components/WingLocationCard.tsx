// "Statut de l'aile" — anti-chronological list of location changes.
// One row per location event, newest first, with a "📍 Actuellement"
// banner pinning the current location.

import { formatDateTime } from '../utils'
import type { Ticket } from '../types'

type Position =
  | 'client'
  | 'transit_to_school'
  | 'school'
  | 'transit_to_workshop'
  | 'workshop'
  | 'transit_back'
  | 'returned'

interface LocationEvent {
  id:        string
  position:  Position
  emoji:     string
  /** Short status: "Avec vous", "Reçue par l'école", … */
  label:     string
  /** Optional context (school name, GLS tracking, …) */
  detail?:   string | null
  trackingNumber?: string | null
  trackingUrl?:    string | null
  at:        string | null
}

const POSITION_BADGES: Record<Position, { emoji: string; label: string; cls: string }> = {
  client:               { emoji: '🏠', label: 'Avec vous',                 cls: 'bg-brand-gold/15 text-brand-ink ring-brand-gold/40' },
  transit_to_school:    { emoji: '🚚', label: 'En transit vers l\'école',   cls: 'bg-sky-50      text-sky-800   ring-sky-200' },
  school:               { emoji: '🏫', label: 'Avec l\'école',              cls: 'bg-emerald-50  text-emerald-800 ring-emerald-200' },
  transit_to_workshop:  { emoji: '🚚', label: 'En transit vers l\'atelier', cls: 'bg-sky-50      text-sky-800   ring-sky-200' },
  workshop:             { emoji: '🛠️', label: 'Avec l\'atelier',            cls: 'bg-violet-50   text-violet-800 ring-violet-200' },
  transit_back:         { emoji: '🚚', label: 'En transit retour',          cls: 'bg-sky-50      text-sky-800   ring-sky-200' },
  returned:             { emoji: '✈️', label: 'Renvoyée',                   cls: 'bg-emerald-50  text-emerald-800 ring-emerald-200' },
}

function buildGlsUrl(tracking: string | null): string | null {
  if (!tracking) return null
  return `https://gls-group.com/track/${encodeURIComponent(tracking)}`
}

export function buildLocationEvents(ticket: Ticket, schoolName?: string | null): LocationEvent[] {
  const events: LocationEvent[] = []

  // 1) Always: started with the client.
  events.push({
    id:       'created',
    position: 'client',
    emoji:    '🏠',
    label:    'Avec vous',
    detail:   'Demande créée',
    at:       ticket.created_at,
  })

  // 2) En transit client → école (only when postal AND label generated).
  if (ticket.delivery_method === 'postal' && ticket.client_school_label_url) {
    events.push({
      id:             'transit_to_school',
      position:       'transit_to_school',
      emoji:          '🚚',
      label:          'En transit vers l\'école',
      detail:         'Bon de transport généré',
      trackingNumber: ticket.client_school_tracking,
      trackingUrl:    buildGlsUrl(ticket.client_school_tracking),
      // No own timestamp — surface as the only undated event when newest.
      at:             null,
    })
  }

  // 3) Avec l'école.
  if (ticket.wing_received_school_at) {
    events.push({
      id:       'received_school',
      position: 'school',
      emoji:    '🏫',
      label:    'Reçue par l\'école',
      detail:   schoolName ?? null,
      at:       ticket.wing_received_school_at,
    })
  }

  // 4) En transit école → atelier.
  if (ticket.escalated_to_workshop_at) {
    events.push({
      id:             'transit_to_workshop',
      position:       'transit_to_workshop',
      emoji:          '🚚',
      label:          'Envoyée à l\'atelier',
      detail:         ticket.assigned_workshop_label ?? null,
      trackingNumber: ticket.school_workshop_tracking,
      trackingUrl:    buildGlsUrl(ticket.school_workshop_tracking),
      at:             ticket.escalated_to_workshop_at,
    })
  }

  // 5) Avec l'atelier.
  if (ticket.wing_received_workshop_at) {
    events.push({
      id:       'received_workshop',
      position: 'workshop',
      emoji:    '🛠️',
      label:    'Reçue par l\'atelier',
      detail:   ticket.assigned_workshop_label ?? null,
      at:       ticket.wing_received_workshop_at,
    })
  }

  // 6) Repair done → en transit retour (or directly returned).
  if (ticket.workshop_repair_done_at && !ticket.wing_returned_at) {
    events.push({
      id:             'transit_back',
      position:       'transit_back',
      emoji:          '🚚',
      label:          'En transit retour',
      detail:         ticket.workshop_return_destination === 'client' ? 'Direction : chez vous' : 'Direction : votre école',
      trackingNumber: ticket.workshop_return_tracking,
      trackingUrl:    buildGlsUrl(ticket.workshop_return_tracking),
      at:             ticket.workshop_repair_done_at,
    })
  }

  // 7) Returned.
  if (ticket.wing_returned_at) {
    events.push({
      id:       'returned',
      position: 'returned',
      emoji:    '✈️',
      label:    'Renvoyée',
      detail:   ticket.workshop_return_destination === 'client' ? 'Vers chez vous' : 'Vers l\'école',
      at:       ticket.wing_returned_at,
    })
  }

  return events
}

interface WingLocationCardProps {
  ticket:     Ticket
  schoolName?: string | null
}

export function WingLocationCard({ ticket, schoolName }: WingLocationCardProps) {
  const events = buildLocationEvents(ticket, schoolName)
  const reversed = [...events].reverse() // newest first
  const current  = reversed[0]
  const badge    = current ? POSITION_BADGES[current.position] : null

  return (
    <section className="card p-5">
      <h2 className="section-title mb-4">Statut de l&apos;aile</h2>

      {/* Current location pinned at the top */}
      {current && badge && (
        <div className={`mb-5 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ring-1 ${badge.cls}`}>
          <span aria-hidden>📍 Actuellement :</span>
          <span aria-hidden>{badge.emoji}</span>
          <span>{badge.label}</span>
        </div>
      )}

      <ol className="relative space-y-4">
        <span aria-hidden className="absolute left-[15px] top-3 bottom-3 w-px bg-brand-stone" />

        {reversed.map((evt, idx) => {
          const isMostRecent = idx === 0
          return (
            <li key={evt.id} className="relative flex items-start gap-3">
              <span
                aria-hidden
                className={`relative z-[1] flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm ring-2 ${
                  isMostRecent
                    ? 'bg-brand-gold text-white ring-brand-gold/30'
                    : 'bg-white text-slate-500 ring-brand-stone'
                }`}
              >
                {evt.emoji}
              </span>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className={`text-sm ${isMostRecent ? 'font-semibold text-brand-ink' : 'text-brand-ink'}`}>
                  {evt.label}
                </p>
                {evt.detail && (
                  <p className="text-xs text-slate-500">{evt.detail}</p>
                )}
                {evt.trackingNumber && evt.trackingUrl && (
                  <a
                    href={evt.trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-brand-gold hover:underline"
                  >
                    Suivi GLS · {evt.trackingNumber} ↗
                  </a>
                )}
                <p className="mt-1 text-[11px] text-slate-400">
                  {evt.at ? formatDateTime(evt.at) : 'Date d\'envoi non communiquée'}
                </p>
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
