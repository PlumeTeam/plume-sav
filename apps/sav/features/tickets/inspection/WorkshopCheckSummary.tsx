import {
  porositySeverity,
  TEAR_RESISTANCE_MIN_G,
  POROSITY_LABELS,
  POROSITY_EMOJI,
  OVERALL_STATE_LABELS,
  RUPTURE_LINE_LABELS,
  type WorkshopChecklistPayload,
  type PorositySeverity,
  type VisualPanel,
  type RiserGeneralState,
  type SpeedSystemState,
  type BinaryGoodDefect,
} from '../workshop-checklist'
import { formatDateTime } from '../utils'
import {
  SummarySection,
  SummaryRow,
  SummaryNote,
  VerdictBanner,
  type Severity,
} from './SeverityBlocks'

// Vue synthétique read-only du diagnostic technique atelier — relit le payload
// v2 stocké dans service_requests.workshop_checklist et le rend en mode lecture
// seule, code couleur vert/jaune/rouge par observation. Pendant atelier de
// SchoolCheckSummary (vue École) : même grammaire visuelle (SeverityBlocks).

type Finding = { label: string; value: string; severity: Severity }

const INSTRUMENT_LABELS: Record<'jdc' | 'kretschmer', string> = {
  jdc:        'JDC',
  kretschmer: 'Kretschmer',
}
const RISER_STATE_LABELS: Record<RiserGeneralState, string> = {
  good:    'Bon',
  worn:    'Usé',
  damaged: 'Abîmé',
}
const SPEED_SYSTEM_LABELS: Record<SpeedSystemState, string> = {
  ok: 'Opérationnel',
  ko: 'Défaillant',
  na: 'Non applicable',
}

// ── Mapping sévérité ──────────────────────────────────────────────────────────

function porositySev(p: PorositySeverity | null): Severity {
  if (p === null) return 'neutral'
  if (p === 'new' || p === 'good') return 'green'
  if (p === 'critical') return 'red'
  return 'amber' // worn, very_worn
}
function goodDefectSev(v: BinaryGoodDefect | null): Severity {
  return v === null ? 'neutral' : v === 'good' ? 'green' : 'red'
}
function riserStateSev(v: RiserGeneralState | null): Severity {
  return v === null ? 'neutral' : v === 'good' ? 'green' : v === 'worn' ? 'amber' : 'red'
}
function speedSev(v: SpeedSystemState | null): Severity {
  return v === null || v === 'na' ? 'neutral' : v === 'ok' ? 'green' : 'red'
}

// ── Helpers de collecte ───────────────────────────────────────────────────────

/** Booléen. `pol` = polarité : 'ok' (vrai = conforme), 'defect' (vrai = défaut),
 *  'info' (vrai = à signaler sans être critique). */
function pushBool(arr: Finding[], label: string, v: boolean | null, pol: 'ok' | 'defect' | 'info'): void {
  if (v === null) return
  const severity: Severity =
    pol === 'ok'     ? (v ? 'green' : 'red')
    : pol === 'defect' ? (v ? 'red' : 'green')
    : (v ? 'amber' : 'green')
  arr.push({ label, value: v ? 'Oui' : 'Non', severity })
}
function pushGoodDefect(arr: Finding[], label: string, v: BinaryGoodDefect | null): void {
  if (v === null) return
  arr.push({ label, value: v === 'good' ? 'Bon' : 'Défaut', severity: goodDefectSev(v) })
}
function pushNum(arr: Finding[], label: string, v: number | null, unit: string, severity: Severity): void {
  if (v === null) return
  arr.push({ label, value: `${v} ${unit}`, severity })
}

function visualPanelFindings(prefix: string, p: VisualPanel): Finding[] {
  const out: Finding[] = []
  pushBool(out, `${prefix} — déchirures`,           p.tears,           'defect')
  pushBool(out, `${prefix} — zones étirées`,        p.stretchedZones,  'defect')
  pushBool(out, `${prefix} — usure`,                p.wear,            'defect')
  pushBool(out, `${prefix} — défaut d'enduction`,   p.coatingDefect,   'defect')
  pushBool(out, `${prefix} — réparations antérieures`, p.previousRepairs, 'info')
  return out
}

// ── Composant ─────────────────────────────────────────────────────────────────

export function WorkshopCheckSummary({ payload }: { payload: WorkshopChecklistPayload }) {
  const { identification, canopy, risers, lines, trim, conclusion } = payload

  // Identification
  const idF: Finding[] = []
  pushBool(idF, 'Étiquette de certification présente', identification.certificationLabelPresent, 'ok')
  pushBool(idF, 'Numéro de série vérifié',             identification.serialNumberVerified,      'ok')

  // Porosité
  const instr = canopy.porosity.instrument
  const m = canopy.porosity.measurements
  const poroF: Finding[] = []
  const poroMeasures: Array<[string, number | null]> = [
    ['Cellule centrale',     m.centralCell],
    ['Cellule 5 — gauche',   m.cell5Left],
    ['Cellule 5 — droite',   m.cell5Right],
    ['Cellule 10 — gauche',  m.cell10Left],
    ['Cellule 10 — droite',  m.cell10Right],
    ['Bord de fuite',        m.trailingEdge],
  ]
  for (const [label, val] of poroMeasures) {
    if (val === null) continue
    const sev = porositySeverity(val, instr)
    poroF.push({
      label,
      value:    sev ? `${val}s · ${POROSITY_EMOJI[sev]} ${POROSITY_LABELS[sev]}` : `${val}s`,
      severity: porositySev(sev),
    })
  }

  // Voilure — résistance déchirement + nervures internes
  const canopyF: Finding[] = []
  const tr = canopy.tearResistance
  pushNum(canopyF, 'Résistance extrados', tr.extradosG, 'g',
    tr.extradosG === null ? 'neutral' : tr.extradosG >= TEAR_RESISTANCE_MIN_G ? 'green' : 'red')
  pushNum(canopyF, 'Résistance intrados', tr.intradosG, 'g',
    tr.intradosG === null ? 'neutral' : tr.intradosG >= TEAR_RESISTANCE_MIN_G ? 'green' : 'red')
  pushGoodDefect(canopyF, 'Coutures nervures internes', canopy.internalRibs.seams)
  pushGoodDefect(canopyF, 'Cloisons internes',          canopy.internalRibs.partitions)
  pushGoodDefect(canopyF, 'Renforts internes',          canopy.internalRibs.reinforcements)

  // Voilure — inspection visuelle extrados / intrados
  const visualF = [
    ...visualPanelFindings('Extrados', canopy.visualExtrados),
    ...visualPanelFindings('Intrados', canopy.visualIntrados),
  ]
  const visualNotes: Array<{ label: string; text: string }> = []
  if (canopy.visualExtrados.previousRepairsDetail.trim()) {
    visualNotes.push({ label: 'Réparations extrados', text: canopy.visualExtrados.previousRepairsDetail })
  }
  if (canopy.visualIntrados.previousRepairsDetail.trim()) {
    visualNotes.push({ label: 'Réparations intrados', text: canopy.visualIntrados.previousRepairsDetail })
  }

  // Élévateurs
  const risersF: Finding[] = []
  if (risers.generalState) {
    risersF.push({
      label: 'État général',
      value: RISER_STATE_LABELS[risers.generalState],
      severity: riserStateSev(risers.generalState),
    })
  }
  pushBool(risersF, 'Coutures',              risers.seams,          'ok')
  pushBool(risersF, 'Maillons fermés',       risers.maillonsClosed, 'ok')
  if (risers.speedSystem) {
    risersF.push({
      label: 'Accélérateur',
      value: SPEED_SYSTEM_LABELS[risers.speedSystem],
      severity: speedSev(risers.speedSystem),
    })
  }
  pushBool(risersF, 'Poulies de frein',      risers.brakePulleys,   'ok')
  pushBool(risersF, 'Longueurs conformes',   risers.lengthsConform, 'ok')
  pushNum(risersF,  'Écart de longueur',     risers.lengthsDeviation, 'mm', 'neutral')

  // Suspentes — tests de rupture + visuel
  const linesF: Finding[] = []
  for (const t of lines.ruptureTests) {
    linesF.push({
      label:    `Rupture ${RUPTURE_LINE_LABELS[t.line]}`,
      value:    `${t.ruptureValue ?? '—'} daN${t.conform === null ? '' : t.conform ? ' · conforme' : ' · non conforme'}`,
      severity: t.conform === null ? 'neutral' : t.conform ? 'green' : 'red',
    })
  }
  pushGoodDefect(linesF, 'Coutures suspentes', lines.visual.seams)
  pushBool(linesF, 'Gaines intactes',     lines.visual.sheathsIntact,  'ok')
  pushBool(linesF, 'Zones d\'usure',      lines.visual.wearZones,      'defect')
  pushBool(linesF, 'Longueurs conformes', lines.visual.lengthsConform, 'ok')
  pushNum(linesF,  'Écart maximal',       lines.visual.maxDeviation, 'mm', 'neutral')
  const linesNotes: Array<{ label: string; text: string }> = []
  if (lines.visual.wearLocation.trim()) {
    linesNotes.push({ label: 'Localisation de l\'usure', text: lines.visual.wearLocation })
  }

  // Trim et réglages
  const trimF: Finding[] = []
  pushBool(trimF, 'Inspection à plat',     trim.flatInspection,  'ok')
  pushBool(trimF, 'Longueur des freins',   trim.brakeLength,     'ok')
  pushNum(trimF,  'Écart longueur frein',  trim.brakeLengthDeviation, 'mm', 'neutral')
  pushBool(trimF, 'Gonflage au sol',       trim.groundInflation, 'ok')
  const trimNotes: Array<{ label: string; text: string }> = []
  if (trim.flatInspectionNote.trim())  trimNotes.push({ label: 'Notes inspection à plat', text: trim.flatInspectionNote })
  if (trim.groundInflationNote.trim()) trimNotes.push({ label: 'Notes gonflage au sol',   text: trim.groundInflationNote })

  // Conclusion
  const conclF: Finding[] = []
  if (conclusion.overallState) {
    conclF.push({
      label:    'État général de l\'aile',
      value:    OVERALL_STATE_LABELS[conclusion.overallState],
      severity: conclusion.overallState === 'not_airworthy' ? 'red'
        : conclusion.overallState === 'very_worn' ? 'amber' : 'green',
    })
  }
  if (conclusion.repairsDone !== null) {
    conclF.push({
      label:    'Réparations effectuées',
      value:    conclusion.repairsDone ? 'Oui' : 'Non',
      severity: 'neutral',
    })
  }
  const conclNotes: Array<{ label: string; text: string }> = []
  if (conclusion.repairsDoneDetail.trim()) conclNotes.push({ label: 'Détail des réparations', text: conclusion.repairsDoneDetail })
  if (conclusion.generalRemarks.trim())    conclNotes.push({ label: 'Remarques générales',    text: conclusion.generalRemarks })

  // Verdict global = pire signal rencontré, toutes sections confondues.
  const all = [...idF, ...poroF, ...canopyF, ...visualF, ...risersF, ...linesF, ...trimF, ...conclF]
  const verdict: Severity =
    all.some((f) => f.severity === 'red')   ? 'red'
    : all.some((f) => f.severity === 'amber') ? 'amber'
    : all.some((f) => f.severity === 'green') ? 'green' : 'neutral'
  const verdictLabel: Record<Severity, string> = {
    red:     'Signaux critiques détectés',
    amber:   'Points de vigilance',
    green:   'Aucun défaut majeur relevé',
    neutral: 'Diagnostic incomplet',
  }
  const counts = {
    red:   all.filter((f) => f.severity === 'red').length,
    amber: all.filter((f) => f.severity === 'amber').length,
    green: all.filter((f) => f.severity === 'green').length,
  }

  return (
    <div className="space-y-4">
      <VerdictBanner verdict={verdict} label={verdictLabel[verdict]} counts={counts} />

      {/* Méta — inspecteur + date */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
        {conclusion.inspectorName?.trim() && (
          <span>
            🛠️ Diagnostic effectué par <strong className="text-brand-ink">{conclusion.inspectorName.trim()}</strong>
          </span>
        )}
        {conclusion.completedAt && <span>🕓 {formatDateTime(conclusion.completedAt)}</span>}
      </div>

      <Block title="Identification" findings={idF} />

      {instr && poroF.length === 0 ? (
        <SummarySection title="Porosité">
          <SummaryRow label="Instrument" value={INSTRUMENT_LABELS[instr]} severity="neutral" />
        </SummarySection>
      ) : poroF.length > 0 ? (
        <SummarySection title="Porosité">
          {instr && <SummaryRow label="Instrument" value={INSTRUMENT_LABELS[instr]} severity="neutral" />}
          {poroF.map((f, i) => <SummaryRow key={`poro-${i}`} {...f} />)}
        </SummarySection>
      ) : null}

      <Block title="Voilure — résistance & structure" findings={canopyF} />
      <Block title="Voilure — inspection visuelle"     findings={visualF} notes={visualNotes} />
      <Block title="Élévateurs"                        findings={risersF} />
      <Block title="Suspentes"                         findings={linesF}  notes={linesNotes} />
      <Block title="Trim et réglages"                  findings={trimF}   notes={trimNotes} />
      <Block title="Conclusion"                        findings={conclF}  notes={conclNotes} />
    </div>
  )
}

function Block({
  title,
  findings,
  notes = [],
}: {
  title:    string
  findings: Finding[]
  notes?:   Array<{ label: string; text: string }>
}) {
  if (findings.length === 0 && notes.length === 0) return null
  return (
    <SummarySection title={title}>
      {findings.map((f, i) => <SummaryRow key={`f-${i}`} {...f} />)}
      {notes.map((n, i) => <SummaryNote key={`n-${i}`} label={n.label} text={n.text} />)}
    </SummarySection>
  )
}
