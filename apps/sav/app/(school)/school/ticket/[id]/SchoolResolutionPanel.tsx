'use client'

import { useState, useTransition } from 'react'
import { applySchoolResolutionAction } from '@/features/tickets/actions'
import { SCHOOL_RESOLUTIONS, PARTNER_WORKSHOPS } from '@/features/tickets/constants'
import type { SchoolResolution } from '@/features/tickets/types'

interface SchoolResolutionPanelProps {
  ticketId: string
  currentResolution: SchoolResolution | null
  assignedWorkshopLabel: string | null
}

export function SchoolResolutionPanel({
  ticketId,
  currentResolution,
  assignedWorkshopLabel,
}: SchoolResolutionPanelProps) {
  const [isPending, startTransition] = useTransition()
  const [selected, setSelected] = useState<SchoolResolution | null>(currentResolution)
  const [workshopId, setWorkshopId] = useState<string>('')
  const [note, setNote] = useState('')
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'error'; msg: string } | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selected) return

    if (selected === 'escalated_to_workshop' && !workshopId) {
      setFeedback({ type: 'error', msg: 'Choisissez un atelier dans la liste.' })
      return
    }

    startTransition(async () => {
      const fd = new FormData()
      fd.set('ticketId', ticketId)
      fd.set('resolution', selected)
      if (note.trim()) fd.set('note', note.trim())

      if (selected === 'escalated_to_workshop') {
        const ws = PARTNER_WORKSHOPS.find((w) => w.id === workshopId)
        fd.set('workshopId',    workshopId)
        fd.set('workshopLabel', ws?.label ?? workshopId)
      }

      const result = await applySchoolResolutionAction(fd)
      if (result?.error) {
        setFeedback({ type: 'error', msg: 'Erreur lors de la résolution.' })
      } else {
        setFeedback({ type: 'ok', msg: '✓ Résolution enregistrée.' })
      }
    })
  }

  // If a resolution has already been applied, show a read-only summary.
  if (currentResolution) {
    const cfg = SCHOOL_RESOLUTIONS.find((r) => r.value === currentResolution)
    return (
      <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
        <p className="font-semibold">
          {cfg?.emoji} {cfg?.label ?? currentResolution}
        </p>
        {assignedWorkshopLabel && (
          <p className="mt-1 text-xs">Atelier assigné : <strong>{assignedWorkshopLabel}</strong></p>
        )}
        <p className="mt-2 text-xs text-emerald-800/80">
          Cette décision est verrouillée. Pour la corriger, contactez Plume HQ.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        {SCHOOL_RESOLUTIONS.map((r) => {
          const isSelected = selected === r.value
          return (
            <button
              key={r.value}
              type="button"
              onClick={() => setSelected(r.value)}
              className={`flex w-full items-start gap-3 rounded-2xl border-2 p-4 text-left transition-all active:scale-[0.99] ${
                isSelected
                  ? 'border-brand-coral bg-brand-coral/10 shadow-plume'
                  : 'border-brand-stone bg-white hover:border-brand-coral/40'
              }`}
            >
              <span className="text-2xl" aria-hidden>{r.emoji}</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-brand-ink">{r.label}</p>
                <p className="mt-0.5 text-xs text-slate-500">{r.description}</p>
              </div>
              <span className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${
                isSelected
                  ? 'border-brand-coral bg-brand-coral text-white'
                  : 'border-brand-stone bg-white text-transparent'
              }`} aria-hidden>✓</span>
            </button>
          )
        })}
      </div>

      {selected === 'escalated_to_workshop' && (
        <div className="animate-slide-up">
          <label className="mb-1.5 block text-sm font-medium text-brand-ink">
            Atelier partenaire
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
          <p className="mt-1 text-xs text-slate-500">
            L&apos;atelier choisi recevra le ticket dans sa file de réparation.
          </p>
        </div>
      )}

      {selected && (
        <div className="animate-slide-up">
          <label className="mb-1.5 block text-sm font-medium text-brand-ink">
            Note de résolution {selected === 'normal_behavior_explained' && '(explication donnée au client)'}
            {selected === 'escalated_to_workshop' && '(synthèse pour l\'atelier)'}
            {selected === 'escalated_to_plume'   && '(contexte pour Plume HQ)'}
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder={
              selected === 'resolved_by_school'        ? 'Ex : ripstop posé sur déchirure 8 cm bord d\'attaque, vérifié symétrie OK.' :
              selected === 'normal_behavior_explained' ? 'Ex : aile parfaitement symétrique, comportement cohérent avec le profil pilote (passage 2-liner).' :
              selected === 'escalated_to_workshop'     ? 'Ex : suspicion porosité — pas d\'outil pour mesurer. Voile en bon état visuel par ailleurs.' :
                                                          'Ex : malfaçon cousue à l\'envers visible sur photo 3, à remonter au constructeur.'
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
        disabled={isPending || !selected}
        className="btn-primary w-full"
      >
        {isPending ? 'Application…' : selected ? `Appliquer : ${SCHOOL_RESOLUTIONS.find(r => r.value === selected)?.label}` : 'Choisir une résolution'}
      </button>

      <p className="text-center text-xs text-slate-400">
        Vous constatez ce que vous voyez — vous ne certifiez rien. Préférez l&apos;escalation en cas de doute.
      </p>
    </form>
  )
}
