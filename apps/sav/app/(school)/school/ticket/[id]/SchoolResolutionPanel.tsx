'use client'

import { useState, useTransition } from 'react'
import dynamic from 'next/dynamic'
import { applySchoolResolutionAction } from '@/features/tickets/actions'
import { PARTNER_WORKSHOPS } from '@/features/tickets/constants'
import type { SchoolResolution } from '@/features/tickets/types'

// Only affiliated workshops are exposed in the school decision flow.
const AFFILIATED_WORKSHOPS = PARTNER_WORKSHOPS.filter((w) => w.affiliated)

const WorkshopMapPicker = dynamic(
  () => import('@/features/tickets/components/WorkshopMapPicker'),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[320px] items-center justify-center rounded-2xl bg-brand-cream text-sm text-slate-400">
        Chargement de la carte…
      </div>
    ),
  }
)

interface SchoolResolutionPanelProps {
  ticketId:              string
  currentResolution:     SchoolResolution | null
  assignedWorkshopLabel: string | null
  isPlumeUrgent?:        boolean
}

// Top-of-panel choice. The user picks ONE.
// Each choice maps to a (resolution, isPlumeUrgent, level1Sub) trio.
type ChoiceKey =
  | 'level_1'              // école/client (resolved_by_school | normal_behavior_explained)
  | 'level_2'              // atelier standard
  | 'level_3_undetermined' // atelier sans alerte — contrôle approfondi
  | 'level_4'              // atelier + alerte Plume

type Level1Sub = 'resolved_by_school' | 'normal_behavior_explained'

const UNDETERMINED_NOTE =
  "L'école n'a pas pu diagnostiquer, un contrôle approfondi est nécessaire."

const PRIMARY_CHOICES: Array<{
  key:         ChoiceKey
  emoji:       string
  label:       string
  description: string
  border:      string
  bg:          string
}> = [
  {
    key:         'level_1',
    emoji:       '🟢',
    label:       'Niveau 1 — Mineur',
    description: "Résolu par l'école : petit SAV, conseil ou comportement normal expliqué.",
    border:      'border-emerald-300',
    bg:          'bg-emerald-50',
  },
  {
    key:         'level_3_undetermined',
    emoji:       '🟠',
    label:       'Niveau 2 — Indéterminé',
    description: "On ne sait pas si c'est grave : on envoie à l'atelier pour contrôle approfondi (sans alerte).",
    border:      'border-orange-300',
    bg:          'bg-orange-50',
  },
  {
    key:         'level_2',
    emoji:       '🟡',
    label:       'Niveau 3 — Important',
    description: "Défaut identifié, on envoie l'aile à un atelier du réseau.",
    border:      'border-amber-300',
    bg:          'bg-amber-50',
  },
  {
    key:         'level_4',
    emoji:       '🔴',
    label:       'Niveau 4 — Grave',
    description: "Défaut de sécurité : on envoie à l'atelier ET on alerte Plume HQ immédiatement.",
    border:      'border-red-400',
    bg:          'bg-red-50',
  },
]

const LEVEL1_SUBS: Array<{ value: Level1Sub; emoji: string; label: string; description: string }> = [
  { value: 'resolved_by_school',
    emoji: '🛠️', label: 'Petit SAV fait',
    description: "Ripstop, réglage, intervention rapide réalisée sur place." },
  { value: 'normal_behavior_explained',
    emoji: '💬', label: 'Comportement normal expliqué',
    description: "Aile conforme, j'ai expliqué au client." },
]

export function SchoolResolutionPanel({
  ticketId,
  currentResolution,
  assignedWorkshopLabel,
  isPlumeUrgent = false,
}: SchoolResolutionPanelProps) {
  const [isPending, startTransition] = useTransition()
  const [choice, setChoice] = useState<ChoiceKey | null>(null)
  const [level1Sub, setLevel1Sub] = useState<Level1Sub>('resolved_by_school')
  const [workshopId, setWorkshopId] = useState<string>('')
  const [note, setNote] = useState('')
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'error'; msg: string } | null>(null)

  // ── Read-only summary if a final or transient decision already exists ────
  if (currentResolution) {
    return <ReadOnlySummary
      resolution={currentResolution}
      assignedWorkshopLabel={assignedWorkshopLabel}
      isPlumeUrgent={isPlumeUrgent}
    />
  }

  function resolveSubmissionPayload(): {
    resolution:    SchoolResolution
    needsWorkshop: boolean
    isPlumeUrgent: boolean
  } | null {
    switch (choice) {
      case 'level_1':              return { resolution: level1Sub,               needsWorkshop: false, isPlumeUrgent: false }
      case 'level_2':              return { resolution: 'escalated_to_workshop', needsWorkshop: true,  isPlumeUrgent: false }
      case 'level_3_undetermined': return { resolution: 'escalated_to_workshop', needsWorkshop: true,  isPlumeUrgent: false }
      case 'level_4':              return { resolution: 'escalated_to_workshop', needsWorkshop: true,  isPlumeUrgent: true  }
      default: return null
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload = resolveSubmissionPayload()
    if (!payload) return
    if (payload.needsWorkshop && !workshopId) {
      setFeedback({ type: 'error', msg: 'Choisissez un atelier dans la liste.' })
      return
    }

    startTransition(async () => {
      const fd = new FormData()
      fd.set('ticketId',   ticketId)
      fd.set('resolution', payload.resolution)
      // Niveau 3 (Indéterminé) : on préfixe la note avec un message système pour
      // que l'atelier sache que l'école n'a pas pu diagnostiquer.
      const trimmedNote = note.trim()
      const finalNote =
        choice === 'level_3_undetermined'
          ? trimmedNote
            ? `${UNDETERMINED_NOTE}\n\n${trimmedNote}`
            : UNDETERMINED_NOTE
          : trimmedNote
      if (finalNote) fd.set('note', finalNote)
      if (payload.needsWorkshop) {
        const ws = AFFILIATED_WORKSHOPS.find((w) => w.id === workshopId)
        fd.set('workshopId',    workshopId)
        fd.set('workshopLabel', ws?.label ?? workshopId)
      }
      if (payload.isPlumeUrgent) fd.set('isPlumeUrgent', 'true')

      const r = await applySchoolResolutionAction(fd)
      if (r?.error) {
        const err = r.error as Record<string, string[] | undefined>
        const msg = err._form?.[0] ?? err.workshopId?.[0] ?? 'Erreur lors de la résolution.'
        setFeedback({ type: 'error', msg })
      } else {
        setFeedback({ type: 'ok', msg: '✓ Décision enregistrée.' })
      }
    })
  }

  const submission   = choice ? resolveSubmissionPayload() : null
  const showWorkshop = submission?.needsWorkshop === true
  const showLevel1Sub = choice === 'level_1'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* PRIMARY CHOICES — 4 levels */}
      <div className="space-y-2">
        {PRIMARY_CHOICES.map((c) => {
          const isSelected = choice === c.key
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => setChoice(c.key)}
              className={`flex w-full items-start gap-3 rounded-2xl border-2 p-4 text-left transition-all active:scale-[0.99] ${
                isSelected
                  ? `${c.border} ${c.bg} shadow-soft`
                  : 'border-brand-stone bg-white hover:border-brand-gold/40'
              }`}
            >
              <span aria-hidden className="text-2xl">{c.emoji}</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-brand-ink">{c.label}</p>
                <p className="mt-0.5 text-xs text-slate-600">{c.description}</p>
              </div>
              <span className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${
                isSelected ? 'border-brand-gold bg-brand-gold text-white'
                           : 'border-brand-stone bg-white text-transparent'
              }`} aria-hidden>✓</span>
            </button>
          )
        })}
      </div>

      {/* LEVEL 1 SUB-CHOICE */}
      {showLevel1Sub && (
        <div className="animate-slide-up space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-navy/60">
            Comment avez-vous géré ?
          </p>
          {LEVEL1_SUBS.map((s) => {
            const isSel = level1Sub === s.value
            return (
              <button
                key={s.value}
                type="button"
                onClick={() => setLevel1Sub(s.value)}
                className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors ${
                  isSel
                    ? 'border-brand-gold bg-brand-gold/5'
                    : 'border-brand-stone bg-white hover:border-brand-gold/40'
                }`}
              >
                <span aria-hidden className="text-xl">{s.emoji}</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-brand-ink">{s.label}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{s.description}</p>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* WORKSHOP PICKER */}
      {showWorkshop && (
        <div className="animate-slide-up space-y-3">
          <label className="mb-1.5 block text-sm font-medium text-brand-ink">
            Atelier de destination
          </label>

          <WorkshopMapPicker
            workshops={AFFILIATED_WORKSHOPS}
            selectedId={workshopId || null}
            onSelect={setWorkshopId}
          />

          {/* Liste textuelle (fallback / clavier) */}
          <div className="space-y-2">
            {AFFILIATED_WORKSHOPS.map((w) => {
              const isSelected = workshopId === w.id
              return (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => setWorkshopId(w.id)}
                  className={`flex w-full items-start gap-3 rounded-xl border-2 p-3 text-left transition-all active:scale-[0.99] ${
                    isSelected
                      ? 'border-brand-gold bg-brand-gold/10 shadow-plume'
                      : 'border-brand-stone bg-white hover:border-brand-gold/40'
                  }`}
                >
                  <span aria-hidden className="text-2xl">🛠️</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-brand-ink">{w.label}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{w.city} · {w.region}</p>
                  </div>
                  {isSelected && <span className="text-brand-gold text-lg" aria-hidden>✓</span>}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* LEVEL 3 INFO — message auto pour l'atelier */}
      {choice === 'level_3_undetermined' && (
        <div className="rounded-2xl border-2 border-orange-300 bg-orange-50 p-4 text-sm text-orange-900 animate-slide-up">
          <p className="font-semibold">🟠 Contrôle approfondi demandé</p>
          <p className="mt-1 text-xs">
            Un message sera transmis à l&apos;atelier : « {UNDETERMINED_NOTE} »
          </p>
        </div>
      )}

      {/* LEVEL 4 WARNING */}
      {choice === 'level_4' && (
        <div className="rounded-2xl border-2 border-red-300 bg-red-50 p-4 text-sm text-red-900 animate-slide-up">
          <p className="font-semibold">⚠️ Alerte Plume HQ</p>
          <p className="mt-1 text-xs">
            Une notification urgente sera envoyée à l&apos;équipe Plume. À utiliser pour
            les défauts qui touchent à la sécurité (suspentes, structure, malfaçon visible).
          </p>
        </div>
      )}

      {/* NOTE — only shown after a choice is made */}
      {choice && (
        <div className="animate-slide-up">
          <label className="mb-1.5 block text-sm font-medium text-brand-ink">
            Note de résolution (optionnel)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder={
              choice === 'level_4'              ? "Synthèse pour l'atelier ET pour Plume HQ."
              : choice === 'level_3_undetermined' ? "Détails complémentaires pour l'atelier (optionnel)."
              :                                   "Synthèse de la résolution."
            }
            className="field-input resize-none"
          />
        </div>
      )}

      {feedback && (
        <p className={`rounded-xl px-3 py-2 text-sm ${
          feedback.type === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
        }`}>
          {feedback.msg}
        </p>
      )}

      <button
        type="submit"
        disabled={!choice || isPending}
        className="btn-primary w-full"
      >
        {isPending ? 'Application…' : choice ? labelForChoice(choice) : 'Choisir une décision'}
      </button>

      <p className="text-center text-xs text-slate-400">
        Vous constatez ce que vous voyez — vous ne certifiez rien. En cas de doute, choisissez le niveau 2 (Indéterminé).
      </p>
    </form>
  )
}

function labelForChoice(c: ChoiceKey): string {
  switch (c) {
    case 'level_1':              return '✅ Valider — niveau 1 (école gère)'
    case 'level_3_undetermined': return "🟠 Envoyer à l'atelier pour contrôle (niveau 2)"
    case 'level_2':              return "🟡 Envoyer à l'atelier (niveau 3)"
    case 'level_4':              return "🚨 Envoyer à l'atelier + alerter Plume (niveau 4)"
  }
}

// ── Read-only summary ──────────────────────────────────────────────────────

function ReadOnlySummary({
  resolution,
  assignedWorkshopLabel,
  isPlumeUrgent,
}: {
  resolution:            SchoolResolution
  assignedWorkshopLabel: string | null
  isPlumeUrgent:         boolean
}) {
  const meta = resolutionMeta(resolution)

  return (
    <div className={`rounded-2xl px-4 py-3 text-sm ${meta.bg} ${meta.text}`}>
      <p className="font-semibold">{meta.emoji} {meta.label}</p>
      {assignedWorkshopLabel && (
        <p className="mt-1 text-xs">
          Atelier {resolution === 'workshop_advice_requested' ? 'consulté' : 'assigné'} : <strong>{assignedWorkshopLabel}</strong>
        </p>
      )}
      {isPlumeUrgent && (
        <p className="mt-2 rounded-lg bg-red-100 px-2 py-1 text-xs font-semibold text-red-900">
          🚨 Alerte Plume HQ déclenchée
        </p>
      )}
      {(resolution === 'workshop_advice_requested' || resolution === 'reflection') && (
        <p className="mt-2 text-xs opacity-80">
          ℹ️ État transitoire — vous pourrez prendre une décision finale après.
        </p>
      )}
      <p className="mt-2 text-xs opacity-70">
        Pour modifier cette décision, contactez Plume HQ.
      </p>
    </div>
  )
}

function resolutionMeta(r: SchoolResolution): { emoji: string; label: string; bg: string; text: string } {
  switch (r) {
    case 'resolved_by_school':         return { emoji: '🟢', label: 'Niveau 1 — Petit SAV fait',                bg: 'bg-emerald-50', text: 'text-emerald-900' }
    case 'normal_behavior_explained':  return { emoji: '🟢', label: 'Niveau 1 — Comportement normal expliqué',  bg: 'bg-emerald-50', text: 'text-emerald-900' }
    case 'escalated_to_workshop':      return { emoji: '🟡', label: "Envoyé à l'atelier",                       bg: 'bg-amber-50',   text: 'text-amber-900'   }
    case 'escalated_to_plume':         return { emoji: '🦅', label: 'Cas exceptionnel — escaladé à Plume HQ',   bg: 'bg-violet-50',  text: 'text-violet-900'  }
    case 'workshop_advice_requested':  return { emoji: '💬', label: "Avis demandé à l'atelier",                 bg: 'bg-sky-50',     text: 'text-sky-900'     }
    case 'reflection':                 return { emoji: '⏸️', label: 'En réflexion',                              bg: 'bg-slate-100',  text: 'text-slate-800'   }
  }
}
