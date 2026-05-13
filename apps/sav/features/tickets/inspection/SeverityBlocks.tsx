// Atomes de rendu partagés pour les "sections sévérité" utilisées côté
// atelier (vue École via SchoolCheckSummary, vue Client via ClientHistorySummary).
// Single source of truth pour le style : carte arrondie blanche, label gauche
// gris, badge coloré à droite, mêmes 4 niveaux green / amber / red / neutral.

export type Severity = 'green' | 'amber' | 'red' | 'neutral'

export const SEVERITY_DOT: Record<Severity, string> = {
  green:   'bg-emerald-500',
  amber:   'bg-amber-500',
  red:     'bg-red-500',
  neutral: 'bg-slate-300',
}

export const SEVERITY_BADGE: Record<Severity, string> = {
  green:   'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200',
  amber:   'bg-amber-50 text-amber-800 ring-1 ring-amber-200',
  red:     'bg-red-50 text-red-800 ring-1 ring-red-200',
  neutral: 'bg-slate-50 text-slate-600 ring-1 ring-slate-200',
}

export function SummarySection({
  title,
  skipped,
  children,
}: {
  title:    string
  skipped?: boolean
  children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl border border-brand-stone bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-navy/70">{title}</p>
        {skipped && (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
            phase passée
          </span>
        )}
      </div>
      {!skipped && <div className="mt-3 space-y-2">{children}</div>}
    </section>
  )
}

export function SummaryRow({
  label,
  value,
  severity,
}: {
  label:    string
  value:    string
  severity: Severity
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-xs text-slate-500">{label}</p>
      <span
        className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium ${SEVERITY_BADGE[severity]}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${SEVERITY_DOT[severity]}`} aria-hidden />
        {value}
      </span>
    </div>
  )
}

export function SummaryNote({ label, text }: { label: string; text: string }) {
  return (
    <div className="rounded-xl bg-brand-cream/60 px-3 py-2">
      <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-brand-ink">{text}</p>
    </div>
  )
}

// Bandeau verdict global — gros badge coloré + dot + label + counts ·.
// Renvoie déjà null quand il n'y a rien à afficher (counts tous à 0).
export function VerdictBanner({
  verdict,
  label,
  counts,
}: {
  verdict: Severity
  label:   string
  counts:  { red: number; amber: number; green: number }
}) {
  return (
    <div className={`flex items-center gap-3 rounded-2xl px-4 py-3 ${SEVERITY_BADGE[verdict]}`}>
      <span className={`h-3 w-3 flex-shrink-0 rounded-full ${SEVERITY_DOT[verdict]}`} aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{label}</p>
        <p className="mt-0.5 text-xs opacity-80">
          {counts.red > 0 && <span>{counts.red} critique{counts.red > 1 ? 's' : ''}</span>}
          {counts.red > 0 && (counts.amber > 0 || counts.green > 0) && <span> · </span>}
          {counts.amber > 0 && <span>{counts.amber} vigilance{counts.amber > 1 ? 's' : ''}</span>}
          {counts.amber > 0 && counts.green > 0 && <span> · </span>}
          {counts.green > 0 && <span>{counts.green} OK</span>}
        </p>
      </div>
    </div>
  )
}
