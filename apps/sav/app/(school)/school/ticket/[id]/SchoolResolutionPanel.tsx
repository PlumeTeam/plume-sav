'use client'

import { useState, useTransition } from 'react'
import { applySchoolResolutionAction } from '@/features/tickets/actions'
import { PARTNER_WORKSHOPS } from '@/features/tickets/constants'
import type { SchoolResolution } from '@/features/tickets/types'

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
  | 'level_3'              // atelier + alerte Plume
  | 'workshop_advice'      // demander un avis distance
  | 'reflection'           // mettre en réflexion

type Level1Sub = 'resolved_by_school' | 'normal_behavior_explained'

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
    label:       'Niveau 1 — Défaut mineur',
    description: "On gère entre l'école et le client. Petit SAV, conseil ou comportement normal expliqué.",
    border:      'border-emerald-300',
    bg:          'bg-emerald-50',
  },
  {
    key:         'level_2',
    emoji:       '🟡',
    label:       'Niveau 2 — Défaut important',
    description: "On envoie l'aile à un atelier du réseau pour réparation.",
    border:      'border-amber-300',
    bg:          'bg-amber-50',
  },
  {
    key:         'level_3',
    emoji:       '🔴',
    label:       'Niveau 3 — Défaut grave',
    description: "On envoie à l'atelier ET on alerte Plume HQ immédiatement (sécurité).",
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
      case 'level_1':         return { resolution: level1Sub,                  needsWorkshop: false, isPlumeUrgent: false }
      case 'level_2':         return { resolution: 'escalated_to_workshop',    needsWorkshop: true,  isPlumeUrgent: false }
      case 'level_3':         return { resolution: 'escalated_to_workshop',    needsWorkshop: true,  isPlumeUrgent: true  }
      case 'workshop_advice': return { resolution: 'workshop_advice_requested',needsWorkshop: true,  isPlumeUrgent: false }
      case 'reflection':      return { resolution: 'reflection',               needsWorkshop: false, isPlumeUrgent: false }
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
      if (note.trim()) fd.set('note', note.trim())
      if (payload.needsWorkshop) {
        const ws = PARTNER_WORKSHOPS.find((w) => w.id === workshopId)
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
      {/* PRIMARY CHOICES — 3 levels */}
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
                  : 'border-brand-stone bg-white hover:border-brand-coral/40'
              }`}
            >
              <span aria-hidden className="text-2xl">{c.emoji}</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-brand-ink">{c.label}</p>
                <p className="mt-0.5 text-xs text-slate-600">{c.description}</p>
              </div>
              <span className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${
                isSelected ? 'border-brand-coral bg-brand-coral text-white'
                           : 'border-brand-stone bg-white text-transparent'
              }`} aria-hidden>✓</span>
            </button>
          )
        })}
      </div>

      {/* SECONDARY ACTIONS — advice + reflection */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setChoice('workshop_advice')}
          className={`flex items-start gap-2 rounded-xl border p-3 text-left text-sm transition-colors ${
            choice === 'workshop_advice'
              ? 'border-brand-coral bg-brand-coral/5'
              : 'border-brand-stone bg-white hover:border-brand-coral/40'
          }`}
        >
          <span aria-hidden>💬</span>
          <span className="flex-1">
            <span className="block font-medium text-brand-ink">Demander un avis à l&apos;atelier</span>
            <span className="block text-xs text-slate-500">Avis distance, sans envoyer l&apos;aile.</span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => setChoice('reflection')}
          className={`flex items-start gap-2 rounded-xl border p-3 text-left text-sm transition-colors ${
            choice === 'reflection'
              ? 'border-brand-coral bg-brand-coral/5'
              : 'border-brand-stone bg-white hover:border-brand-coral/40'
          }`}
        >
          <span aria-hidden>⏸️</span>
          <span className="flex-1">
            <span className="block font-medium text-brand-ink">Mettre en réflexion</span>
            <span className="block text-xs text-slate-500">Décision plus tard.</span>
          </span>
        </button>
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
                    ? 'border-brand-coral bg-brand-coral/5'
                    : 'border-brand-stone bg-white hover:border-brand-coral/40'
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
        <div className="animate-slide-up">
          <label className="mb-1.5 block text-sm font-medium text-brand-ink">
            {choice === 'workshop_advice' ? 'Atelier consulté' : 'Atelier de destination'}
          </label>
          <select
            value={workshopId}
            onChange={(e) => setWorkshopId(e.target.value)}
            className="field-input"
            required
          >
            <option value="">Sélectionner un atelier…</option>
            {PARTNER_WORKSHOPS.map((w) => (
              <option key={w.id} value={w.id}>
                {w.label} — {w.region}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* LEVEL 3 WARNING */}
      {choice === 'level_3' && (
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
            {choice === 'workshop_advice' ? 'Question pour l\'atelier'
             : choice === 'reflection'    ? 'Pourquoi en réflexion ? (optionnel)'
             :                              'Note de résolution (optionnel)'}
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder={
              choice === 'workshop_advice' ? "Décrivez le problème + ce sur quoi vous avez besoin d'un avis."
              : choice === 'reflection'    ? "Ce qui vous fait hésiter, ce que vous attendez…"
              : choice === 'level_3'       ? "Synthèse pour l'atelier ET pour Plume HQ."
              :                              "Synthèse de la résolution."
            }
            className="field-input resize-none"
            required={choice === 'workshop_advice'}
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
        Vous constatez ce que vous voyez — vous ne certifiez rien. Préférez l&apos;avis ou la réflexion en cas de doute.
      </p>
    </form>
  )
}

function labelForChoice(c: ChoiceKey): string {
  switch (c) {
    case 'level_1':         return '✅ Valider — niveau 1 (école gère)'
    case 'level_2':         return '🟡 Envoyer à l\'atelier (niveau 2)'
    case 'level_3':         return '🚨 Envoyer à l\'atelier + alerter Plume (niveau 3)'
    case 'workshop_advice': return "💬 Demander un avis à l'atelier"
    case 'reflection':      return "⏸️ Mettre en réflexion"
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
    case 'escalated_to_workshop':      return { emoji: '🟡', label: 'Niveau 2 — Envoyé à l\'atelier',           bg: 'bg-amber-50',   text: 'text-amber-900'   }
    case 'escalated_to_plume':         return { emoji: '🦅', label: 'Cas exceptionnel — escaladé à Plume HQ',   bg: 'bg-violet-50',  text: 'text-violet-900'  }
    case 'workshop_advice_requested':  return { emoji: '💬', label: 'Avis demandé à l\'atelier',                bg: 'bg-sky-50',     text: 'text-sky-900'     }
    case 'reflection':                 return { emoji: '⏸️', label: 'En réflexion',                              bg: 'bg-slate-100',  text: 'text-slate-800'   }
  }
}
