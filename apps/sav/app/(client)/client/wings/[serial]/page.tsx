import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  getClientWingBySerial,
  getTicketsForWingSerial,
  getPartnerSchoolById,
} from '@/features/tickets/queries'
import {
  formatAge,
  formatDate,
  resolveWarrantyTierForDisplay,
} from '@/features/tickets/utils'
import { WarrantyTierBadge } from '@/features/tickets/components/WarrantyTierBadge'
import {
  readSchoolCheckPayload,
  FABRIC_CONDITION_LABELS,
} from '@/features/tickets/inspection/steps'
import type { TicketWithPhotos, SchoolResolution } from '@/features/tickets/types'

interface PageProps { params: { serial: string } }

export const dynamic = 'force-dynamic'

export default async function WingCarnetPage({ params }: PageProps) {
  // Le router donne déjà la valeur décodée mais on reste défensif (ex: serials avec /)
  const serial = decodeURIComponent(params.serial)

  const wing = await getClientWingBySerial(serial)
  if (!wing) notFound()

  const [tickets, school] = await Promise.all([
    getTicketsForWingSerial(serial),
    wing.partner_school_id ? getPartnerSchoolById(wing.partner_school_id) : Promise.resolve(null),
  ])

  // Comme dans WingCard, on utilise registered_at comme proxy de purchase_date
  // (la table customer_wings n'a pas encore de colonne purchase_date dédiée).
  const warrantyTier = resolveWarrantyTierForDisplay(null, wing.registered_at)
  const ageLabel     = formatAge(wing.registered_at)
  const subtitle     = [wing.size && `Taille ${wing.size}`, wing.color_name].filter(Boolean).join(' · ')

  return (
    <div className="min-h-screen">
      <header className="bg-brand-cream">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 pt-4 pb-3">
          <Link
            href="/client"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-brand-ink hover:bg-white"
            aria-label="Retour"
          >
            ←
          </Link>
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-wider text-slate-500">Carnet d&apos;entretien</p>
            <p className="truncate text-sm font-semibold text-brand-ink">{wing.product_label}</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-4 p-4 pb-12">
        {/* ── Identification de l'aile ─────────────────────────── */}
        <section className="rounded-3xl bg-gradient-to-br from-brand-navy via-brand-navy to-brand-ink px-5 py-6 text-white shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-gold">
            Mon aile
          </p>
          <h1 className="mt-1 font-display text-2xl font-bold">{wing.product_label}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-white/70">{subtitle}</p>}
          <p className="mt-3 font-mono text-[11px] text-white/60">{wing.serial_number}</p>
        </section>

        {/* ── Garantie & âge ─────────────────────────────────── */}
        <section className="card p-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="section-title">Garantie</h2>
            <WarrantyTierBadge tier={warrantyTier} size="sm" compact />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <InfoBlock label="Date d'achat" value={formatDate(wing.registered_at)} />
            <InfoBlock label="Âge de l'aile" value={ageLabel ?? '—'} />
          </div>

          {warrantyTier === 'out_of_warranty' && (
            <p className="mt-4 text-xs text-slate-600">
              Garantie standard expirée. Vous pouvez continuer à utiliser la
              plateforme SAV gratuitement — chaque intervention reste consignée
              dans ce carnet.
            </p>
          )}

          {school && (
            <p className="mt-4 text-xs text-slate-500">
              École référente : <span className="font-medium text-brand-ink">{school.name}</span>
            </p>
          )}
        </section>

        {/* ── Historique des interventions SAV ──────────────── */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="section-title">Historique SAV</h2>
            {tickets.length > 0 && (
              <span className="text-xs text-slate-400">
                {tickets.length} intervention{tickets.length > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {tickets.length === 0 ? (
            <div className="card border-dashed px-4 py-8 text-center">
              <p className="text-3xl" aria-hidden>✨</p>
              <p className="mt-2 text-sm font-medium text-brand-ink">
                Aucune intervention — aile en excellent état
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Quand vous ferez une demande SAV, elle apparaîtra ici comme dans
                un carnet de santé.
              </p>
            </div>
          ) : (
            <ol className="space-y-3">
              {tickets.map((t) => (
                <li key={t.id}>
                  <CarnetEntry ticket={t} />
                </li>
              ))}
            </ol>
          )}
        </section>

        <div className="pt-2">
          <Link href="/client" className="btn-secondary w-full">
            Retour à mes ailes
          </Link>
        </div>
      </main>
    </div>
  )
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-brand-cream/60 px-4 py-3 ring-1 ring-brand-stone">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-brand-ink">{value}</p>
    </div>
  )
}

// Décrit la résolution finale d'un ticket SAV. On combine `school_resolution`
// et le statut pour couvrir les cas où l'école a clos seule, l'atelier a réparé,
// ou le ticket est encore en cours.
const RESOLUTION_LABELS: Record<SchoolResolution | 'in_progress' | 'workshop_repaired' | 'cancelled', { label: string; emoji: string; tone: string }> = {
  resolved_by_school:        { label: 'Réparé à l\'école',         emoji: '🏫', tone: 'bg-emerald-50 text-emerald-800 ring-emerald-200' },
  normal_behavior_explained: { label: 'Pas de problème — expliqué', emoji: '👍', tone: 'bg-emerald-50 text-emerald-800 ring-emerald-200' },
  escalated_to_workshop:     { label: 'Envoyé à l\'atelier',       emoji: '🛠️', tone: 'bg-violet-50 text-violet-800 ring-violet-200' },
  escalated_to_plume:        { label: 'Escaladé chez Plume',       emoji: '⭐', tone: 'bg-violet-50 text-violet-800 ring-violet-200' },
  workshop_advice_requested: { label: 'Avis atelier (à distance)', emoji: '💬', tone: 'bg-sky-50 text-sky-800 ring-sky-200' },
  reflection:                { label: 'En réflexion école',         emoji: '🤔', tone: 'bg-amber-50 text-amber-800 ring-amber-200' },
  workshop_repaired:         { label: 'Réparé en atelier',         emoji: '🛠️', tone: 'bg-emerald-50 text-emerald-800 ring-emerald-200' },
  in_progress:               { label: 'En cours',                  emoji: '⏳', tone: 'bg-sky-50 text-sky-800 ring-sky-200' },
  cancelled:                 { label: 'Annulé',                    emoji: '✕', tone: 'bg-slate-50 text-slate-700 ring-slate-200' },
}

function deriveResolutionKey(t: TicketWithPhotos): keyof typeof RESOLUTION_LABELS {
  if (t.status === 'cancelled' || t.status === 'rejected') return 'cancelled'
  if (t.status === 'completed' && t.workshop_repair_done_at) return 'workshop_repaired'
  if (t.school_resolution) return t.school_resolution
  if (t.status === 'completed') return 'resolved_by_school'
  return 'in_progress'
}

const PROBLEM_LABELS: Record<string, string> = {
  tear:         'Déchirure',
  fabric_issue: 'Tissu',
  line_issue:   'Suspente',
  riser_issue:  'Élévateur',
  porosity:     'Porosité',
  buckle_issue: 'Boucle',
  other:        'Autre',
}

function CarnetEntry({ ticket }: { ticket: TicketWithPhotos }) {
  const resolutionKey = deriveResolutionKey(ticket)
  const resolution    = RESOLUTION_LABELS[resolutionKey]
  const problemLabel  = ticket.problem_category ? (PROBLEM_LABELS[ticket.problem_category] ?? ticket.problem_category) : 'Demande SAV'
  const ticketRef     = ticket.ticket_number ?? `#${ticket.id.slice(0, 8).toUpperCase()}`

  // Tente de lire le checklist école pour exposer un résumé "porosité / état général".
  const checkPayload = readSchoolCheckPayload(ticket.school_checklist)
  const fabric       = checkPayload?.phase1?.fabricCondition

  return (
    <Link
      href={`/client/ticket/${ticket.id}`}
      className="block rounded-card border border-brand-stone bg-white p-4 transition-colors hover:border-brand-gold/40 hover:bg-brand-cream/30"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-slate-500">{formatDate(ticket.created_at)}</p>
          <p className="mt-0.5 truncate text-sm font-semibold text-brand-ink">
            {problemLabel}
          </p>
          <p className="mt-0.5 truncate font-mono text-[11px] text-slate-400">{ticketRef}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${resolution.tone}`}>
          <span aria-hidden className="mr-1">{resolution.emoji}</span>
          {resolution.label}
        </span>
      </div>

      {/* Détails extraits de l'inspection école si présents. */}
      {fabric && (
        <p className="mt-2 text-xs text-slate-500">
          État du tissu (école) : <span className="font-medium text-brand-ink">{FABRIC_CONDITION_LABELS[fabric]}</span>
        </p>
      )}

      {/* Atelier ayant traité le ticket si on l'a sous la main. */}
      {ticket.assigned_workshop_label && (
        <p className="mt-1 text-xs text-slate-500">
          Atelier : <span className="font-medium text-brand-ink">{ticket.assigned_workshop_label}</span>
        </p>
      )}

      {ticket.school_resolution_note && (
        <p className="mt-2 line-clamp-2 text-xs italic text-slate-600">
          « {ticket.school_resolution_note} »
        </p>
      )}
    </Link>
  )
}
