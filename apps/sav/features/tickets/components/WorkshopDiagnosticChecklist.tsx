'use client'

import { useMemo, useState, useTransition } from 'react'
import { saveWorkshopFullChecklistAction } from '@/features/tickets/actions'
import {
  emptyWorkshopChecklist,
  porositySeverity,
  shouldShowBettsometer,
  TEAR_RESISTANCE_MIN_G,
  POROSITY_LABELS,
  POROSITY_EMOJI,
  OVERALL_STATE_LABELS,
  RUPTURE_LINE_LABELS,
  progressIdentification,
  progressCanopy,
  progressRisers,
  progressLines,
  progressTrim,
  progressConclusion,
  type WorkshopChecklistPayload,
  type Instrument,
  type PorositySeverity,
  type VisualPanel,
  type RuptureTest,
  type RuptureLineKey,
  type BinaryGoodDefect,
  type SectionProgress,
  type OverallState,
  type RiserGeneralState,
  type SpeedSystemState,
} from '../workshop-checklist'

interface Props {
  ticketId:        string
  /** Payload v2 lu sur le ticket (workshop_checklist). null si jamais saisi. */
  initial:         WorkshopChecklistPayload | null
  /** Pré-rempli depuis le profil de l'inspecteur connecté. */
  defaultInspectorName: string
}

type SectionKey = 'identification' | 'canopy' | 'risers' | 'lines' | 'trim' | 'conclusion'

const SECTION_LABELS: Record<SectionKey, { idx: number; title: string; emoji: string }> = {
  identification: { idx: 1, title: 'Identification',     emoji: '🪪' },
  canopy:         { idx: 2, title: 'Calotte (voile)',    emoji: '🪂' },
  risers:         { idx: 3, title: 'Élévateurs',         emoji: '🎚️' },
  lines:          { idx: 4, title: 'Suspentes',          emoji: '🧵' },
  trim:           { idx: 5, title: 'Trim et réglages',   emoji: '📐' },
  conclusion:     { idx: 6, title: 'Conclusion',         emoji: '🏁' },
}

const SEVERITY_BADGE: Record<PorositySeverity, string> = {
  new:       'bg-emerald-50 text-emerald-800 ring-emerald-200',
  good:      'bg-emerald-50 text-emerald-800 ring-emerald-200',
  worn:      'bg-amber-50 text-amber-800 ring-amber-200',
  very_worn: 'bg-orange-50 text-orange-800 ring-orange-200',
  critical:  'bg-red-50 text-red-800 ring-red-200',
}

export function WorkshopDiagnosticChecklist({ ticketId, initial, defaultInspectorName }: Props) {
  const [state, setState] = useState<WorkshopChecklistPayload>(() => {
    if (initial) return initial
    const blank = emptyWorkshopChecklist()
    blank.conclusion.inspectorName = defaultInspectorName
    return blank
  })
  const [openSection, setOpenSection] = useState<SectionKey | null>('identification')
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'error'; msg: string } | null>(null)

  function update<K extends keyof WorkshopChecklistPayload>(section: K, patch: Partial<WorkshopChecklistPayload[K]>) {
    setState((s) => ({ ...s, [section]: { ...(s[section] as object), ...patch } }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFeedback(null)
    const payload: WorkshopChecklistPayload = {
      ...state,
      conclusion: {
        ...state.conclusion,
        completedAt: new Date().toISOString(),
      },
    }
    startTransition(async () => {
      const fd = new FormData()
      fd.set('ticketId', ticketId)
      fd.set('payload',  JSON.stringify(payload))
      const r = await saveWorkshopFullChecklistAction(fd)
      if (r?.error) {
        const err = r.error as Record<string, string[] | undefined>
        setFeedback({ type: 'error', msg: err._form?.[0] ?? 'Erreur de sauvegarde.' })
      } else {
        setState(payload)
        setFeedback({ type: 'ok', msg: '✓ Checklist sauvegardée.' })
      }
    })
  }

  // Progressions par section pour le badge accordéon
  const progress: Record<SectionKey, SectionProgress> = useMemo(() => ({
    identification: progressIdentification(state.identification),
    canopy:         progressCanopy(state.canopy),
    risers:         progressRisers(state.risers),
    lines:          progressLines(state.lines),
    trim:           progressTrim(state.trim),
    conclusion:     progressConclusion(state.conclusion),
  }), [state])

  function renderSection(key: SectionKey, content: React.ReactNode) {
    const meta = SECTION_LABELS[key]
    const isOpen = openSection === key
    const prog = progress[key]
    const complete = prog.filled >= prog.total
    return (
      <section className="rounded-2xl border border-brand-stone bg-white">
        <button
          type="button"
          onClick={() => setOpenSection((s) => (s === key ? null : key))}
          className="flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left hover:bg-brand-cream/40"
          aria-expanded={isOpen}
        >
          <span className="flex min-w-0 items-center gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-cream text-xs font-bold text-brand-ink">
              {meta.idx}
            </span>
            <span className="flex items-center gap-1.5 text-sm font-semibold text-brand-ink">
              <span aria-hidden>{meta.emoji}</span>
              {meta.title}
            </span>
          </span>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
            complete
              ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
              : 'bg-slate-50 text-slate-600 ring-1 ring-slate-200'
          }`}>
            {prog.filled}/{prog.total}{complete ? ' ✓' : ''}
          </span>
        </button>
        {isOpen && <div className="space-y-4 border-t border-brand-stone/60 px-4 py-4">{content}</div>}
      </section>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {renderSection('identification', (
        <>
          <YesNoRow
            label="Étiquette de certification présente et lisible"
            value={state.identification.certificationLabelPresent}
            onChange={(v) => update('identification', { certificationLabelPresent: v })}
          />
          <YesNoRow
            label="Numéro de série vérifié (scan QR au pré-check)"
            value={state.identification.serialNumberVerified}
            onChange={(v) => update('identification', { serialNumberVerified: v })}
          />
        </>
      ))}

      {renderSection('canopy', (
        <CanopySection state={state} update={update} />
      ))}

      {renderSection('risers', (
        <RisersSection state={state.risers} onChange={(patch) => update('risers', patch)} />
      ))}

      {renderSection('lines', (
        <LinesSection state={state.lines} onChange={(patch) => update('lines', patch)} />
      ))}

      {renderSection('trim', (
        <TrimSection state={state.trim} onChange={(patch) => update('trim', patch)} />
      ))}

      {renderSection('conclusion', (
        <ConclusionSection state={state.conclusion} onChange={(patch) => update('conclusion', patch)} />
      ))}

      {feedback && (
        <p className={`rounded-xl px-3 py-2 text-sm ${
          feedback.type === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
        }`}>
          {feedback.msg}
        </p>
      )}

      <button type="submit" disabled={isPending} className="btn-primary w-full sm:w-auto">
        {isPending ? 'Sauvegarde…' : 'Sauvegarder la checklist'}
      </button>
    </form>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Section 2 — Calotte (porosité, bettsometer, visuel, nervures)
// ────────────────────────────────────────────────────────────────────────────
function CanopySection({
  state,
  update,
}: {
  state: WorkshopChecklistPayload
  update: <K extends keyof WorkshopChecklistPayload>(section: K, patch: Partial<WorkshopChecklistPayload[K]>) => void
}) {
  const c = state.canopy
  const showBetts = shouldShowBettsometer(c.porosity.measurements, c.porosity.instrument)

  function setPorosity(patch: Partial<WorkshopChecklistPayload['canopy']['porosity']>) {
    update('canopy', { porosity: { ...c.porosity, ...patch } })
  }
  function setMeasurement(key: keyof WorkshopChecklistPayload['canopy']['porosity']['measurements'], v: number | null) {
    setPorosity({ measurements: { ...c.porosity.measurements, [key]: v } })
  }
  function setTear(patch: Partial<WorkshopChecklistPayload['canopy']['tearResistance']>) {
    update('canopy', { tearResistance: { ...c.tearResistance, ...patch } })
  }
  function setRibs(patch: Partial<WorkshopChecklistPayload['canopy']['internalRibs']>) {
    update('canopy', { internalRibs: { ...c.internalRibs, ...patch } })
  }

  return (
    <>
      {/* 2.1 Porosité */}
      <SubSection title="2.1 Porosité">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Instrument utilisé</label>
          <div className="flex gap-2">
            {(['jdc', 'kretschmer'] as const).map((inst) => (
              <button
                key={inst}
                type="button"
                onClick={() => setPorosity({ instrument: inst })}
                className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
                  c.porosity.instrument === inst
                    ? 'border-brand-gold bg-brand-gold/10 text-brand-ink'
                    : 'border-brand-stone bg-white text-slate-600 hover:bg-brand-cream/40'
                }`}
              >
                {inst === 'jdc' ? 'JDC' : 'Kretschmer'}
              </button>
            ))}
          </div>
        </div>

        {([
          ['centralCell',  'Cellule centrale'],
          ['cell5Left',    '5ᵉ cellule gauche'],
          ['cell5Right',   '5ᵉ cellule droite'],
          ['cell10Left',   '10ᵉ cellule gauche'],
          ['cell10Right',  '10ᵉ cellule droite'],
          ['trailingEdge', 'Bord de fuite'],
        ] as const).map(([key, label]) => {
          const value = c.porosity.measurements[key]
          const sev = porositySeverity(value, c.porosity.instrument)
          return (
            <div key={key} className="flex flex-wrap items-end gap-3">
              <div className="min-w-[200px] flex-1">
                <label className="mb-1 block text-xs font-medium text-slate-600">{label}</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={value ?? ''}
                    onChange={(e) => setMeasurement(key, e.target.value === '' ? null : Number(e.target.value))}
                    className="field-input max-w-[140px]"
                    placeholder="—"
                  />
                  <span className="text-xs text-slate-500">s</span>
                </div>
              </div>
              {sev && <PorosityBadge severity={sev} />}
            </div>
          )
        })}
      </SubSection>

      {/* 2.2 Résistance déchirure (Bettsometer) — conditionnel */}
      {showBetts && (
        <SubSection title="2.2 Résistance déchirure (Bettsometer)">
          <p className="text-xs text-amber-800">
            Déclenché parce qu&apos;une mesure est sous le seuil critique de
            porosité — la tenue mécanique du tissu doit être vérifiée.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <NumberField
              label="Extrados (g)"
              value={c.tearResistance.extradosG}
              onChange={(v) => setTear({ extradosG: v })}
              suffix="g"
            />
            <NumberField
              label="Intrados (g)"
              value={c.tearResistance.intradosG}
              onChange={(v) => setTear({ intradosG: v })}
              suffix="g"
            />
          </div>
          <p className="text-[11px] text-slate-500">
            Seuil minimal Plume : <strong>{TEAR_RESISTANCE_MIN_G}&nbsp;g</strong>. En-dessous, contacter Plume.
          </p>
        </SubSection>
      )}

      {/* 2.3 Inspection visuelle */}
      <SubSection title="2.3 Inspection visuelle">
        <VisualPanelEdit
          title="Extrados"
          value={c.visualExtrados}
          onChange={(patch) => update('canopy', { visualExtrados: { ...c.visualExtrados, ...patch } })}
        />
        <VisualPanelEdit
          title="Intrados"
          value={c.visualIntrados}
          onChange={(patch) => update('canopy', { visualIntrados: { ...c.visualIntrados, ...patch } })}
        />
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Nervures internes</p>
          <GoodDefectRow label="Coutures"  value={c.internalRibs.seams}          onChange={(v) => setRibs({ seams: v })} />
          <GoodDefectRow label="Cloisons"  value={c.internalRibs.partitions}     onChange={(v) => setRibs({ partitions: v })} />
          <GoodDefectRow label="Renforts"  value={c.internalRibs.reinforcements} onChange={(v) => setRibs({ reinforcements: v })} />
        </div>
      </SubSection>
    </>
  )
}

function VisualPanelEdit({
  title, value, onChange,
}: {
  title: string
  value: VisualPanel
  onChange: (patch: Partial<VisualPanel>) => void
}) {
  return (
    <div className="space-y-2 rounded-xl bg-brand-cream/40 p-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
      <YesNoRow label="Trous / déchirures"      value={value.tears}           onChange={(v) => onChange({ tears: v })} dangerOnYes />
      <YesNoRow label="Zones étirées"            value={value.stretchedZones}  onChange={(v) => onChange({ stretchedZones: v })} dangerOnYes />
      <YesNoRow label="Usure"                    value={value.wear}            onChange={(v) => onChange({ wear: v })} dangerOnYes />
      <YesNoRow label="Défaut d'enduction"       value={value.coatingDefect}   onChange={(v) => onChange({ coatingDefect: v })} dangerOnYes />
      <YesNoRow label="Réparations antérieures"  value={value.previousRepairs} onChange={(v) => onChange({ previousRepairs: v })} />
      {value.previousRepairs === true && (
        <textarea
          value={value.previousRepairsDetail}
          onChange={(e) => onChange({ previousRepairsDetail: e.target.value })}
          rows={2}
          maxLength={2000}
          placeholder="Préciser les réparations antérieures…"
          className="field-input resize-none"
        />
      )}
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Section 3 — Élévateurs
// ────────────────────────────────────────────────────────────────────────────
function RisersSection({
  state, onChange,
}: {
  state: WorkshopChecklistPayload['risers']
  onChange: (patch: Partial<WorkshopChecklistPayload['risers']>) => void
}) {
  return (
    <>
      <ChoiceRow<RiserGeneralState>
        label="État général"
        value={state.generalState}
        options={[
          { value: 'good',    label: 'Bon',     tone: 'green' },
          { value: 'worn',    label: 'Usé',     tone: 'amber' },
          { value: 'damaged', label: 'Abîmé',   tone: 'red' },
        ]}
        onChange={(v) => onChange({ generalState: v })}
      />
      <YesNoRow label="Coutures solides"           value={state.seams}          onChange={(v) => onChange({ seams: v })} />
      <YesNoRow label="Maillons fermés et sécurisés" value={state.maillonsClosed} onChange={(v) => onChange({ maillonsClosed: v })} />
      <ChoiceRow<SpeedSystemState>
        label="Accélérateur fonctionnel"
        value={state.speedSystem}
        options={[
          { value: 'ok', label: 'Oui',  tone: 'green' },
          { value: 'ko', label: 'Non',  tone: 'red' },
          { value: 'na', label: 'N.A.', tone: 'neutral' },
        ]}
        onChange={(v) => onChange({ speedSystem: v })}
      />
      <YesNoRow label="Poulies de frein OK"       value={state.brakePulleys}    onChange={(v) => onChange({ brakePulleys: v })} />
      <YesNoRow label="Longueurs conformes"        value={state.lengthsConform}  onChange={(v) => onChange({ lengthsConform: v })} />
      {state.lengthsConform === false && (
        <NumberField
          label="Écart maximal mesuré"
          value={state.lengthsDeviation}
          onChange={(v) => onChange({ lengthsDeviation: v })}
          suffix="mm"
        />
      )}
    </>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Section 4 — Suspentes
// ────────────────────────────────────────────────────────────────────────────
function LinesSection({
  state, onChange,
}: {
  state: WorkshopChecklistPayload['lines']
  onChange: (patch: Partial<WorkshopChecklistPayload['lines']>) => void
}) {
  function toggleLine(line: RuptureLineKey) {
    const existing = state.ruptureTests.find((t) => t.line === line)
    if (existing) {
      onChange({ ruptureTests: state.ruptureTests.filter((t) => t.line !== line) })
    } else {
      const next: RuptureTest = { line, ruptureValue: null, conform: null }
      onChange({ ruptureTests: [...state.ruptureTests, next] })
    }
  }
  function updateTest(line: RuptureLineKey, patch: Partial<RuptureTest>) {
    onChange({
      ruptureTests: state.ruptureTests.map((t) => t.line === line ? { ...t, ...patch } : t),
    })
  }
  function setVisual(patch: Partial<WorkshopChecklistPayload['lines']['visual']>) {
    onChange({ visual: { ...state.visual, ...patch } })
  }

  return (
    <>
      <SubSection title="4.1 Test de rupture">
        <p className="text-xs text-slate-500">Sélectionner les suspentes testées (multi).</p>
        <div className="flex flex-wrap gap-2">
          {(Object.entries(RUPTURE_LINE_LABELS) as [RuptureLineKey, string][]).map(([key, label]) => {
            const active = state.ruptureTests.some((t) => t.line === key)
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleLine(key)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  active
                    ? 'border-brand-gold bg-brand-gold/10 text-brand-ink'
                    : 'border-brand-stone bg-white text-slate-600 hover:bg-brand-cream/40'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>
        {state.ruptureTests.length > 0 && (
          <div className="space-y-2">
            {state.ruptureTests.map((t) => (
              <div key={t.line} className="flex flex-wrap items-end gap-3 rounded-xl bg-brand-cream/40 p-3">
                <p className="min-w-[80px] text-sm font-medium text-brand-ink">{RUPTURE_LINE_LABELS[t.line]}</p>
                <NumberField
                  label="Rupture"
                  value={t.ruptureValue}
                  onChange={(v) => updateTest(t.line, { ruptureValue: v })}
                  suffix="daN"
                />
                <ChoiceRow<boolean>
                  label="Résultat"
                  value={t.conform}
                  options={[
                    { value: true,  label: 'Conforme',     tone: 'green' },
                    { value: false, label: 'Non conforme', tone: 'red' },
                  ]}
                  onChange={(v) => updateTest(t.line, { conform: v })}
                  compact
                />
              </div>
            ))}
          </div>
        )}
      </SubSection>

      <SubSection title="4.2 Inspection visuelle">
        <GoodDefectRow label="Coutures"           value={state.visual.seams}          onChange={(v) => setVisual({ seams: v })} />
        <YesNoRow      label="Gaines intactes"    value={state.visual.sheathsIntact}  onChange={(v) => setVisual({ sheathsIntact: v })} />
        <YesNoRow      label="Zones d'usure"       value={state.visual.wearZones}      onChange={(v) => setVisual({ wearZones: v })} dangerOnYes />
        {state.visual.wearZones === true && (
          <input
            type="text"
            value={state.visual.wearLocation}
            onChange={(e) => setVisual({ wearLocation: e.target.value })}
            placeholder="Localisation des zones d'usure…"
            className="field-input"
            maxLength={500}
          />
        )}
        <YesNoRow label="Longueurs conformes" value={state.visual.lengthsConform} onChange={(v) => setVisual({ lengthsConform: v })} />
        {state.visual.lengthsConform === false && (
          <NumberField
            label="Écart maximal"
            value={state.visual.maxDeviation}
            onChange={(v) => setVisual({ maxDeviation: v })}
            suffix="mm"
          />
        )}
      </SubSection>
    </>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Section 5 — Trim et réglages
// ────────────────────────────────────────────────────────────────────────────
function TrimSection({
  state, onChange,
}: {
  state: WorkshopChecklistPayload['trim']
  onChange: (patch: Partial<WorkshopChecklistPayload['trim']>) => void
}) {
  return (
    <>
      <YesNoRow label="Inspection à plat conforme" value={state.flatInspection} onChange={(v) => onChange({ flatInspection: v })} />
      <textarea
        value={state.flatInspectionNote}
        onChange={(e) => onChange({ flatInspectionNote: e.target.value })}
        rows={2}
        maxLength={2000}
        placeholder="Remarque sur l'inspection à plat…"
        className="field-input resize-none"
      />
      <YesNoRow label="Longueur des freins conforme" value={state.brakeLength} onChange={(v) => onChange({ brakeLength: v })} />
      {state.brakeLength === false && (
        <NumberField
          label="Écart freins"
          value={state.brakeLengthDeviation}
          onChange={(v) => onChange({ brakeLengthDeviation: v })}
          suffix="mm"
        />
      )}
      <YesNoRow label="Gonflage au sol conforme" value={state.groundInflation} onChange={(v) => onChange({ groundInflation: v })} />
      <textarea
        value={state.groundInflationNote}
        onChange={(e) => onChange({ groundInflationNote: e.target.value })}
        rows={2}
        maxLength={2000}
        placeholder="Remarque sur le gonflage…"
        className="field-input resize-none"
      />
    </>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Section 6 — Conclusion
// ────────────────────────────────────────────────────────────────────────────
function ConclusionSection({
  state, onChange,
}: {
  state: WorkshopChecklistPayload['conclusion']
  onChange: (patch: Partial<WorkshopChecklistPayload['conclusion']>) => void
}) {
  return (
    <>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">État général</label>
        <div className="flex flex-wrap gap-2">
          {(Object.entries(OVERALL_STATE_LABELS) as [OverallState, string][]).map(([key, label]) => {
            const tone =
              key === 'new' || key === 'good'    ? 'green'  :
              key === 'worn_ok'                  ? 'amber'  :
              key === 'very_worn'                ? 'orange' :
              'red'
            const active = state.overallState === key
            return (
              <button
                key={key}
                type="button"
                onClick={() => onChange({ overallState: key })}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  active ? toneActiveClass(tone) : 'border-brand-stone bg-white text-slate-600 hover:bg-brand-cream/40'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>
      <YesNoRow label="Réparations effectuées" value={state.repairsDone} onChange={(v) => onChange({ repairsDone: v })} />
      {state.repairsDone === true && (
        <textarea
          value={state.repairsDoneDetail}
          onChange={(e) => onChange({ repairsDoneDetail: e.target.value })}
          rows={3}
          maxLength={5000}
          placeholder="Détail des réparations effectuées…"
          className="field-input resize-none"
        />
      )}
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Remarques générales</label>
        <textarea
          value={state.generalRemarks}
          onChange={(e) => onChange({ generalRemarks: e.target.value })}
          rows={3}
          maxLength={5000}
          className="field-input resize-none"
          placeholder="Observations libres, recommandations au pilote, etc."
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Inspecteur</label>
        <input
          type="text"
          value={state.inspectorName}
          onChange={(e) => onChange({ inspectorName: e.target.value })}
          maxLength={200}
          className="field-input"
        />
      </div>
      {state.completedAt && (
        <p className="text-[11px] text-slate-500">
          Dernière sauvegarde : {new Date(state.completedAt).toLocaleString('fr-FR')}
        </p>
      )}
    </>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Atomes UI
// ────────────────────────────────────────────────────────────────────────────

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3 border-l-2 border-brand-stone/60 pl-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-brand-navy/70">{title}</p>
      {children}
    </div>
  )
}

function YesNoRow({
  label, value, onChange, dangerOnYes,
}: {
  label:    string
  value:    boolean | null
  onChange: (v: boolean) => void
  /** Quand true, l'option "Oui" est colorée rouge (le défaut). */
  dangerOnYes?: boolean
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <span className="text-sm text-brand-ink">{label}</span>
      <div className="flex gap-2">
        <ToggleChoice
          label="Oui"
          active={value === true}
          tone={dangerOnYes ? 'red' : 'green'}
          onClick={() => onChange(true)}
        />
        <ToggleChoice
          label="Non"
          active={value === false}
          tone={dangerOnYes ? 'green' : 'neutral'}
          onClick={() => onChange(false)}
        />
      </div>
    </div>
  )
}

function GoodDefectRow({
  label, value, onChange,
}: {
  label:    string
  value:    BinaryGoodDefect | null
  onChange: (v: BinaryGoodDefect) => void
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <span className="text-sm text-brand-ink">{label}</span>
      <div className="flex gap-2">
        <ToggleChoice label="Bon"    active={value === 'good'}   tone="green" onClick={() => onChange('good')} />
        <ToggleChoice label="Défaut" active={value === 'defect'} tone="red"   onClick={() => onChange('defect')} />
      </div>
    </div>
  )
}

function ChoiceRow<T extends string | boolean>({
  label, value, options, onChange, compact,
}: {
  label:    string
  value:    T | null
  options:  Array<{ value: T; label: string; tone: ToneKey }>
  onChange: (v: T) => void
  compact?: boolean
}) {
  return (
    <div className={compact ? 'min-w-[140px]' : 'flex flex-wrap items-center justify-between gap-3'}>
      <span className="text-sm text-brand-ink">{label}</span>
      <div className="mt-1 flex gap-2">
        {options.map((opt) => (
          <ToggleChoice
            key={String(opt.value)}
            label={opt.label}
            active={value === opt.value}
            tone={opt.tone}
            onClick={() => onChange(opt.value)}
          />
        ))}
      </div>
    </div>
  )
}

type ToneKey = 'green' | 'amber' | 'orange' | 'red' | 'neutral'

function ToggleChoice({
  label, active, tone, onClick,
}: {
  label:   string
  active:  boolean
  tone:    ToneKey
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
        active ? toneActiveClass(tone) : 'border-brand-stone bg-white text-slate-500 hover:bg-brand-cream/40'
      }`}
    >
      {label}
    </button>
  )
}

function toneActiveClass(tone: ToneKey): string {
  switch (tone) {
    case 'green':   return 'border-emerald-300 bg-emerald-50 text-emerald-800'
    case 'amber':   return 'border-amber-300 bg-amber-50 text-amber-800'
    case 'orange':  return 'border-orange-300 bg-orange-50 text-orange-800'
    case 'red':     return 'border-red-300 bg-red-50 text-red-800'
    case 'neutral': return 'border-slate-300 bg-slate-50 text-slate-700'
  }
}

function NumberField({
  label, value, onChange, suffix,
}: {
  label:    string
  value:    number | null
  onChange: (v: number | null) => void
  suffix?:  string
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-600">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={0}
          step={1}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
          className="field-input max-w-[140px]"
          placeholder="—"
        />
        {suffix && <span className="text-xs text-slate-500">{suffix}</span>}
      </div>
    </div>
  )
}

function PorosityBadge({ severity }: { severity: PorositySeverity }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${SEVERITY_BADGE[severity]}`}>
      <span aria-hidden>{POROSITY_EMOJI[severity]}</span>
      {POROSITY_LABELS[severity]}
    </span>
  )
}
