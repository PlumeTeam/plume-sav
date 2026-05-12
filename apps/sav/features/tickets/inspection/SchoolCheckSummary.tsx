import {
  readSchoolCheckPayload,
  FABRIC_CONDITION_LABELS,
  LINES_CONDITION_LABELS,
  RISERS_CONDITION_LABELS,
  TEAR_SIZE_LABELS,
  SEAM_DISTANCE_LABELS,
  YESNO_LABELS,
  YESNOIDK_LABELS,
  INFLATION_SURFACE_LABELS,
  INFLATION_SYMMETRY_LABELS,
  INFLATION_TENDENCY_LABELS,
  type FabricCondition,
  type LinesCondition,
  type RisersCondition,
  type Phase1,
  type Phase2,
} from './steps'
import { formatDateTime } from '../utils'

// Vue synthétique côté atelier — relit le payload V2 stocké dans
// service_requests.school_checklist et le rend en mode lecture seule avec
// un code couleur vert/jaune/rouge par observation, pour donner au technicien
// un aperçu rapide de la sévérité avant d'attaquer le diagnostic technique.

type Severity = 'green' | 'amber' | 'red' | 'neutral'

const SEVERITY_DOT: Record<Severity, string> = {
  green:   'bg-emerald-500',
  amber:   'bg-amber-500',
  red:     'bg-red-500',
  neutral: 'bg-slate-300',
}

const SEVERITY_BADGE: Record<Severity, string> = {
  green:   'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200',
  amber:   'bg-amber-50 text-amber-800 ring-1 ring-amber-200',
  red:     'bg-red-50 text-red-800 ring-1 ring-red-200',
  neutral: 'bg-slate-50 text-slate-600 ring-1 ring-slate-200',
}

function fabricSeverity(v: FabricCondition | undefined): Severity {
  if (!v) return 'neutral'
  return v === 'good' ? 'green' : v === 'worn' ? 'amber' : 'red'
}
function linesSeverity(v: LinesCondition | undefined): Severity {
  if (!v) return 'neutral'
  return v === 'good' ? 'green' : v === 'worn' ? 'amber' : 'red'
}
function risersSeverity(v: RisersCondition | undefined): Severity {
  if (!v) return 'neutral'
  return v === 'good' ? 'green' : v === 'worn' ? 'amber' : 'red'
}

interface SchoolCheckSummaryProps {
  /** Raw value of service_requests.school_checklist (Json) */
  raw: unknown
}

export function SchoolCheckSummary({ raw }: SchoolCheckSummaryProps) {
  const payload = readSchoolCheckPayload(raw)
  if (!payload) return null

  const { phase1, phase2, inspectorName, completedAt, globalNote } = payload

  const findings: Array<{ label: string; value: string; severity: Severity }> = []

  // ── Phase 1 — Inspection visuelle ────────────────────────────────────────
  if (phase1.visibleDamage) {
    findings.push({
      label:    'Dommages visibles',
      value:    YESNO_LABELS[phase1.visibleDamage],
      severity: phase1.visibleDamage === 'yes' ? 'red' : 'green',
    })
  }
  if (phase1.fabricCondition) {
    findings.push({
      label:    'État du tissu',
      value:    FABRIC_CONDITION_LABELS[phase1.fabricCondition],
      severity: fabricSeverity(phase1.fabricCondition),
    })
  }
  if (phase1.visibleTears) {
    findings.push({
      label:    'Déchirures visibles',
      value:    YESNO_LABELS[phase1.visibleTears],
      severity: phase1.visibleTears === 'yes' ? 'red' : 'green',
    })
  }
  if (phase1.visibleTears === 'yes' && phase1.tearSize) {
    findings.push({
      label:    'Taille déchirure',
      value:    TEAR_SIZE_LABELS[phase1.tearSize],
      severity: phase1.tearSize === 'gt15' ? 'red' : phase1.tearSize === '10to15' ? 'amber' : 'amber',
    })
  }
  if (phase1.visibleTears === 'yes' && phase1.seamDistance) {
    findings.push({
      label:    'Distance à la couture',
      value:    SEAM_DISTANCE_LABELS[phase1.seamDistance],
      severity: phase1.seamDistance === 'close' ? 'red' : 'green',
    })
  }
  if (phase1.openSeams) {
    findings.push({
      label:    'Coutures ouvertes',
      value:    YESNO_LABELS[phase1.openSeams],
      severity: phase1.openSeams === 'yes' ? 'red' : 'green',
    })
  }
  if (phase1.linesCondition) {
    findings.push({
      label:    'Suspentes',
      value:    LINES_CONDITION_LABELS[phase1.linesCondition],
      severity: linesSeverity(phase1.linesCondition),
    })
  }
  if (phase1.maillonsInverted) {
    findings.push({
      label:    'Maillons inversés',
      value:    YESNOIDK_LABELS[phase1.maillonsInverted],
      severity: phase1.maillonsInverted === 'yes' ? 'red' : phase1.maillonsInverted === 'no' ? 'green' : 'amber',
    })
  }
  if (phase1.risersCondition) {
    findings.push({
      label:    'Élévateurs',
      value:    RISERS_CONDITION_LABELS[phase1.risersCondition],
      severity: risersSeverity(phase1.risersCondition),
    })
  }

  // ── Phase 2 — Check gonflage ─────────────────────────────────────────────
  const phase2Findings: typeof findings = []
  if (!phase2.skipped) {
    if (phase2.inflationSurfaceConsistency) {
      phase2Findings.push({
        label:    'État de surface',
        value:    INFLATION_SURFACE_LABELS[phase2.inflationSurfaceConsistency],
        severity:
          phase2.inflationSurfaceConsistency === 'yes' ? 'green' :
          phase2.inflationSurfaceConsistency === 'no'  ? 'red'   : 'amber',
      })
    } else if (phase2.inflationSymmetry) {
      phase2Findings.push({
        label:    'Symétrie (legacy)',
        value:    INFLATION_SYMMETRY_LABELS[phase2.inflationSymmetry],
        severity:
          phase2.inflationSymmetry === 'yes' ? 'green' :
          phase2.inflationSymmetry === 'no'  ? 'red'   : 'amber',
      })
    }
    if (phase2.inflationTendency) {
      phase2Findings.push({
        label:    'Comportement gonflage',
        value:    INFLATION_TENDENCY_LABELS[phase2.inflationTendency],
        severity:
          phase2.inflationTendency === 'none'   ? 'green' :
          phase2.inflationTendency === 'unsure' ? 'amber' : 'red',
      })
    } else if (phase2.inflationNormalBehavior) {
      phase2Findings.push({
        label:    'Comportement (legacy)',
        value:    YESNO_LABELS[phase2.inflationNormalBehavior],
        severity: phase2.inflationNormalBehavior === 'yes' ? 'green' : 'red',
      })
    }
  }

  // ── Verdict global : couleur dérivée du pire signal ─────────────────────
  const all = [...findings, ...phase2Findings]
  const verdict: Severity =
    all.some((f) => f.severity === 'red')   ? 'red'   :
    all.some((f) => f.severity === 'amber') ? 'amber' :
    all.some((f) => f.severity === 'green') ? 'green' : 'neutral'

  const verdictLabel: Record<Severity, string> = {
    red:     'Signaux critiques détectés',
    amber:   'Points de vigilance',
    green:   'Aucun défaut signalé',
    neutral: 'Diagnostic incomplet',
  }

  const counts = {
    red:   all.filter((f) => f.severity === 'red').length,
    amber: all.filter((f) => f.severity === 'amber').length,
    green: all.filter((f) => f.severity === 'green').length,
  }

  return (
    <div className="space-y-4">
      {/* Verdict global */}
      <div className={`flex items-center gap-3 rounded-2xl px-4 py-3 ${SEVERITY_BADGE[verdict]}`}>
        <span className={`h-3 w-3 flex-shrink-0 rounded-full ${SEVERITY_DOT[verdict]}`} aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{verdictLabel[verdict]}</p>
          <p className="mt-0.5 text-xs opacity-80">
            {counts.red > 0 && <span>{counts.red} critique{counts.red > 1 ? 's' : ''}</span>}
            {counts.red > 0 && (counts.amber > 0 || counts.green > 0) && <span> · </span>}
            {counts.amber > 0 && <span>{counts.amber} vigilance{counts.amber > 1 ? 's' : ''}</span>}
            {counts.amber > 0 && counts.green > 0 && <span> · </span>}
            {counts.green > 0 && <span>{counts.green} OK</span>}
          </p>
        </div>
      </div>

      {/* Méta — inspecteur + date */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
        {inspectorName?.trim() && (
          <span>👤 Check effectué par <strong className="text-brand-ink">{inspectorName.trim()}</strong></span>
        )}
        {completedAt && (
          <span>🕓 {formatDateTime(completedAt)}</span>
        )}
      </div>

      {/* Inspection visuelle */}
      {findings.length > 0 && (
        <SummarySection title="Inspection visuelle">
          {findings.map((f, i) => (
            <SummaryRow key={`p1-${i}`} {...f} />
          ))}
          {phase1.damageDescription && (
            <SummaryNote label="Description des dommages" text={phase1.damageDescription} />
          )}
          {phase1.tearsNote && (
            <SummaryNote label="Notes déchirures" text={phase1.tearsNote} />
          )}
          {phase1.openSeamsNote && (
            <SummaryNote label="Notes coutures" text={phase1.openSeamsNote} />
          )}
          {phase1.linesNote && (
            <SummaryNote label="Notes suspentes" text={phase1.linesNote} />
          )}
          {phase1.risersNote && (
            <SummaryNote label="Notes élévateurs" text={phase1.risersNote} />
          )}
          {phase1.maillonsNote && (
            <SummaryNote label="Notes maillons" text={phase1.maillonsNote} />
          )}
        </SummarySection>
      )}

      {/* Check gonflage */}
      <SummarySection
        title="Check gonflage"
        skipped={phase2.skipped}
      >
        {!phase2.skipped && (
          <>
            {phase2Findings.map((f, i) => (
              <SummaryRow key={`p2-${i}`} {...f} />
            ))}
            {phase2.inflationNotes && (
              <SummaryNote label="Remarques gonflage" text={phase2.inflationNotes} />
            )}
            {phase2.inflationPhotoPaths && phase2.inflationPhotoPaths.length > 0 && (
              <p className="text-xs text-slate-500">
                📷 {phase2.inflationPhotoPaths.length} photo{phase2.inflationPhotoPaths.length > 1 ? 's' : ''} jointe{phase2.inflationPhotoPaths.length > 1 ? 's' : ''} au check
              </p>
            )}
          </>
        )}
      </SummarySection>

      {/* Avis global de l'école */}
      {globalNote?.trim() && (
        <div className="rounded-2xl border border-brand-stone bg-brand-cream/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-navy/70">
            Avis global de l&apos;école
          </p>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-brand-ink">
            {globalNote.trim()}
          </p>
        </div>
      )}
    </div>
  )
}

function SummarySection({
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

function SummaryRow({ label, value, severity }: { label: string; value: string; severity: Severity }) {
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

function SummaryNote({ label, text }: { label: string; text: string }) {
  return (
    <div className="rounded-xl bg-brand-cream/60 px-3 py-2">
      <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-brand-ink">{text}</p>
    </div>
  )
}
