'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  type InspectionStep,
  type InspectionAnswer,
  type InspectionPayload,
  SEVERITY_OPTIONS,
} from './steps'
import { saveSchoolChecklistAction } from '@/features/tickets/actions'

interface CheckWizardProps {
  ticketId:    string
  ticketHref:  string
  flowKind:    'visual' | 'behavior'
  steps:       InspectionStep[]
  initial:     InspectionPayload | null
}

type WizardScreen = 'step' | 'review'

export function CheckWizard({
  ticketId,
  ticketHref,
  flowKind,
  steps,
  initial,
}: CheckWizardProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [answers, setAnswers] = useState<Record<string, InspectionAnswer>>(() => initial?.answers ?? {})
  const [stepIdx, setStepIdx] = useState<number>(0)
  const [screen, setScreen] = useState<WizardScreen>('step')
  const [globalNote, setGlobalNote] = useState<string>(initial?.notes ?? '')
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'error'; msg: string } | null>(null)

  const totalSteps = steps.length
  // Add 1 for the review screen
  const totalScreens = totalSteps + 1
  const currentScreen = screen === 'step' ? stepIdx + 1 : totalScreens
  const pct = (currentScreen / totalScreens) * 100

  const currentStep = steps[stepIdx]

  function setAnswer(stepId: string, partial: Partial<InspectionAnswer>) {
    setAnswers((prev) => ({
      ...prev,
      [stepId]: { value: partial.value ?? prev[stepId]?.value ?? '', note: partial.note ?? prev[stepId]?.note },
    }))
  }

  function next() {
    if (screen === 'review') return
    if (stepIdx < totalSteps - 1) {
      setStepIdx(stepIdx + 1)
    } else {
      setScreen('review')
    }
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function back() {
    if (screen === 'review') {
      setScreen('step')
      setStepIdx(totalSteps - 1)
    } else if (stepIdx > 0) {
      setStepIdx(stepIdx - 1)
    } else {
      router.push(ticketHref)
    }
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleSubmit() {
    startTransition(async () => {
      const payload: InspectionPayload = {
        answers,
        completedAt: new Date().toISOString(),
        notes: globalNote.trim() || undefined,
        // Legacy "checkedIds" derived from yes-answers so the old flat UI still
        // shows ticks if anyone reverts to it.
        checkedIds: Object.entries(answers)
          .filter(([, a]) => a.value === 'yes')
          .map(([id]) => id),
      }

      // The action expects FormData with checkedIds[] and a notes string.
      // We stuff the structured payload into the notes field as JSON to keep a
      // single source of truth in school_checklist column without changing the action.
      // (Better: extend the action to accept a JSON body — TODO once ship pressure drops.)
      const fd = new FormData()
      fd.set('ticketId', ticketId)
      ;(payload.checkedIds ?? []).forEach((id) => fd.append('checkedIds', id))
      // Embed structured payload in the note field so reads can recover it.
      fd.set('notes', JSON.stringify({ __wizard__: true, ...payload }))

      const r = await saveSchoolChecklistAction(fd)
      if (r?.error) {
        const err = r.error as Record<string, string[] | undefined>
        const msg = err._form?.[0] ?? 'Erreur lors de la sauvegarde.'
        setFeedback({ type: 'error', msg })
      } else {
        setFeedback({ type: 'ok', msg: '✓ Check enregistré.' })
        setTimeout(() => router.push(ticketHref), 700)
      }
    })
  }

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div>
        <div className="mb-2 flex items-baseline justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-navy/60">
            Étape {currentScreen}/{totalScreens}
          </p>
          <p className="text-sm font-semibold text-brand-ink">
            {screen === 'review' ? 'Récapitulatif' : `Question ${stepIdx + 1}`}
          </p>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-brand-stone">
          <div
            className="h-full rounded-full bg-brand-coral transition-all duration-500 ease-out"
            style={{ width: `${pct}%` }}
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={totalScreens}
            aria-valuenow={currentScreen}
          />
        </div>
      </div>

      {screen === 'step' && currentStep && (
        <StepCard
          step={currentStep}
          answer={answers[currentStep.id]}
          onChange={(partial) => setAnswer(currentStep.id, partial)}
          onBack={back}
          onNext={next}
          stepIdx={stepIdx}
          totalSteps={totalSteps}
        />
      )}

      {screen === 'review' && (
        <ReviewCard
          flowKind={flowKind}
          steps={steps}
          answers={answers}
          globalNote={globalNote}
          onGlobalNoteChange={setGlobalNote}
          onBack={back}
          onSubmit={handleSubmit}
          isPending={isPending}
          feedback={feedback}
        />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Per-step screen
// ─────────────────────────────────────────────────────────────────────────────

interface StepCardProps {
  step:       InspectionStep
  answer:     InspectionAnswer | undefined
  onChange:   (partial: Partial<InspectionAnswer>) => void
  onBack:     () => void
  onNext:     () => void
  stepIdx:    number
  totalSteps: number
}

function StepCard({ step, answer, onChange, onBack, onNext, stepIdx, totalSteps }: StepCardProps) {
  const value = answer?.value ?? ''
  const note  = answer?.note  ?? ''

  // Validation for "next" — every step requires an answer
  const valid = step.kind === 'freetext'
    ? value.trim().length > 0
    : value.length > 0

  return (
    <div className="card animate-slide-up p-5">
      <h2 className="font-display text-xl font-bold text-brand-ink">{step.title}</h2>
      {step.hint && <p className="mt-2 text-sm text-slate-500">{step.hint}</p>}

      <div className="mt-5 space-y-3">
        {step.kind === 'yesno' && (
          <YesNoNa value={value} onChange={(v) => onChange({ value: v })} yesHint={step.yesHint} />
        )}

        {step.kind === 'severity' && (
          <SeverityChoice value={value} onChange={(v) => onChange({ value: v })} />
        )}

        {step.kind === 'freetext' && (
          <textarea
            value={value}
            onChange={(e) => onChange({ value: e.target.value })}
            rows={5}
            maxLength={2000}
            autoFocus
            placeholder={step.placeholder ?? 'Votre réponse…'}
            className="field-input resize-y"
          />
        )}

        {/* Optional note for yesno / severity */}
        {step.kind !== 'freetext' && (
          <details className="rounded-xl bg-brand-cream p-3 text-sm text-slate-600">
            <summary className="cursor-pointer text-xs font-medium text-brand-ink">
              + Ajouter une note (optionnel)
            </summary>
            <textarea
              value={note}
              onChange={(e) => onChange({ note: e.target.value })}
              rows={3}
              maxLength={1000}
              placeholder="Précisions, mesures, contexte…"
              className="field-input mt-2 resize-none"
            />
          </details>
        )}
      </div>

      <div className="mt-6 flex gap-3">
        <button type="button" onClick={onBack} className="btn-secondary flex-1">
          {stepIdx === 0 ? '← Annuler' : '← Précédent'}
        </button>
        <button type="button" onClick={onNext} disabled={!valid} className="btn-primary flex-[2]">
          {stepIdx === totalSteps - 1 ? 'Récapitulatif' : 'Continuer'}
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// YES / NO / N/A selector
// ─────────────────────────────────────────────────────────────────────────────

const YESNO_OPTIONS = [
  { value: 'yes', emoji: '✓', label: 'Oui',     tone: 'emerald' },
  { value: 'no',  emoji: '✕', label: 'Non',     tone: 'red'     },
  { value: 'na',  emoji: '—', label: 'N/A',     tone: 'slate'   },
] as const

function YesNoNa({ value, onChange, yesHint }: { value: string; onChange: (v: string) => void; yesHint?: string }) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2">
        {YESNO_OPTIONS.map((opt) => {
          const isSelected = value === opt.value
          const tone = isSelected
            ? opt.tone === 'emerald' ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
            : opt.tone === 'red'     ? 'border-red-500 bg-red-50 text-red-900'
            :                          'border-slate-500 bg-slate-50 text-slate-900'
            : 'border-brand-stone bg-white text-brand-ink hover:border-brand-coral/40'
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`flex flex-col items-center gap-1 rounded-2xl border-2 py-4 text-sm font-semibold transition-all active:scale-[0.97] ${tone}`}
            >
              <span className="text-2xl" aria-hidden>{opt.emoji}</span>
              {opt.label}
            </button>
          )
        })}
      </div>
      {value === 'yes' && yesHint && (
        <p className="rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
          💡 {yesHint}
        </p>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Severity 3-choice
// ─────────────────────────────────────────────────────────────────────────────

function SeverityChoice({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      {SEVERITY_OPTIONS.map((opt) => {
        const isSelected = value === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex w-full items-start gap-3 rounded-2xl border-2 p-4 text-left transition-all active:scale-[0.99] ${
              isSelected
                ? 'border-brand-coral bg-brand-coral/10 shadow-plume'
                : 'border-brand-stone bg-white hover:border-brand-coral/40'
            }`}
          >
            <span aria-hidden className="text-2xl">{opt.emoji}</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-brand-ink">{opt.label}</p>
              <p className="mt-0.5 text-xs text-slate-500">{opt.description}</p>
            </div>
          </button>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Review screen
// ─────────────────────────────────────────────────────────────────────────────

interface ReviewCardProps {
  flowKind:           'visual' | 'behavior'
  steps:              InspectionStep[]
  answers:            Record<string, InspectionAnswer>
  globalNote:         string
  onGlobalNoteChange: (s: string) => void
  onBack:             () => void
  onSubmit:           () => void
  isPending:          boolean
  feedback:           { type: 'ok' | 'error'; msg: string } | null
}

function ReviewCard({
  flowKind, steps, answers, globalNote, onGlobalNoteChange,
  onBack, onSubmit, isPending, feedback,
}: ReviewCardProps) {
  const allAnswered = useMemo(
    () => steps.every((s) => {
      const v = answers[s.id]?.value
      return s.kind === 'freetext' ? !!v?.trim() : !!v
    }),
    [steps, answers]
  )

  return (
    <div className="card animate-slide-up p-5">
      <h2 className="font-display text-xl font-bold text-brand-ink">Récapitulatif du check</h2>
      <p className="mt-1 text-sm text-slate-500">
        Diagnostic {flowKind === 'visual' ? 'visuel' : 'comportement'} — vérifiez vos réponses puis validez.
      </p>

      <ul className="mt-4 divide-y divide-brand-stone/50">
        {steps.map((step) => (
          <li key={step.id} className="flex items-start justify-between gap-4 py-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-brand-ink">{step.title}</p>
              {answers[step.id]?.note && (
                <p className="mt-1 text-xs text-slate-500">{answers[step.id]?.note}</p>
              )}
            </div>
            <span className="shrink-0 text-sm font-semibold text-brand-coral">
              {formatAnswer(step, answers[step.id])}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-5">
        <label className="mb-1.5 block text-sm font-medium text-brand-ink">
          Synthèse globale (optionnel)
        </label>
        <textarea
          value={globalNote}
          onChange={(e) => onGlobalNoteChange(e.target.value)}
          rows={3}
          maxLength={2000}
          placeholder="Résumé pour l'atelier ou pour vos archives…"
          className="field-input resize-none"
        />
      </div>

      {!allAnswered && (
        <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
          ⚠️ Certaines questions n&apos;ont pas de réponse. Revenez en arrière pour compléter avant de valider.
        </p>
      )}

      {feedback && (
        <p className={`mt-4 rounded-xl px-3 py-2 text-sm ${
          feedback.type === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
        }`}>
          {feedback.msg}
        </p>
      )}

      <div className="mt-6 flex gap-3">
        <button type="button" onClick={onBack} className="btn-secondary flex-1" disabled={isPending}>
          ← Modifier
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={isPending || !allAnswered}
          className="btn-primary flex-[2]"
        >
          {isPending ? 'Sauvegarde…' : 'Valider le check'}
        </button>
      </div>
    </div>
  )
}

function formatAnswer(step: InspectionStep, a: InspectionAnswer | undefined): string {
  if (!a?.value) return '—'
  if (step.kind === 'yesno') {
    return a.value === 'yes' ? '✓ Oui' : a.value === 'no' ? '✕ Non' : '— N/A'
  }
  if (step.kind === 'severity') {
    const opt = SEVERITY_OPTIONS.find((o) => o.value === a.value)
    return opt ? `${opt.emoji} ${opt.label}` : a.value
  }
  // freetext — show truncated
  return a.value.length > 30 ? `"${a.value.slice(0, 30)}…"` : `"${a.value}"`
}
