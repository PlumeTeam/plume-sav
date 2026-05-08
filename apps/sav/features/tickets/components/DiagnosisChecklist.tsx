'use client'

import { useState, useTransition } from 'react'
import type { ChecklistItem } from '../constants'

interface DiagnosisChecklistProps {
  ticketId:        string
  items:           ChecklistItem[]
  initialChecked:  string[]
  initialNotes:    string
  /** Called inside a transition — must be a Server Action returning {error?, success?} */
  saveAction:      (formData: FormData) => Promise<{ error?: unknown; success?: boolean }>
  /** Tone of the save button — coral for school, navy for workshop */
  variant?:        'coral' | 'navy'
  /** Optional extra section, e.g. "Notes complémentaires" placeholder */
  notesPlaceholder?: string
  notesLabel?:       string
  title?:            string
}

export function DiagnosisChecklist({
  ticketId,
  items,
  initialChecked,
  initialNotes,
  saveAction,
  variant = 'coral',
  notesPlaceholder = 'Notes complémentaires (optionnel)…',
  notesLabel       = 'Notes',
  title,
}: DiagnosisChecklistProps) {
  const [isPending, startTransition] = useTransition()
  const [checked, setChecked] = useState<string[]>(initialChecked)
  const [notes,   setNotes]   = useState<string>(initialNotes)
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'error'; msg: string } | null>(null)

  function toggle(id: string) {
    setChecked((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const fd = new FormData()
      fd.set('ticketId', ticketId)
      checked.forEach((id) => fd.append('checkedIds', id))
      if (notes.trim()) fd.set('notes', notes.trim())

      const result = await saveAction(fd)
      if (result?.error) {
        setFeedback({ type: 'error', msg: 'Erreur lors de la sauvegarde.' })
      } else {
        setFeedback({ type: 'ok', msg: '✓ Checklist sauvegardée.' })
        setTimeout(() => setFeedback(null), 2400)
      }
    })
  }

  const buttonClass = variant === 'navy' ? 'btn-navy w-full' : 'btn-primary w-full'
  const allDone = items.length > 0 && items.every((i) => checked.includes(i.id))

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-baseline justify-between">
        {title && <h3 className="text-sm font-semibold text-brand-ink">{title}</h3>}
        <span className="text-xs text-slate-500">
          {checked.length}/{items.length}
          {allDone && ' · ✓ complet'}
        </span>
      </div>

      <ul className="space-y-2">
        {items.map((item) => {
          const isChecked = checked.includes(item.id)
          return (
            <li key={item.id}>
              <label
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${
                  isChecked
                    ? 'border-emerald-300 bg-emerald-50'
                    : 'border-brand-stone bg-white hover:bg-brand-cream'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggle(item.id)}
                  className="mt-0.5 h-4 w-4 rounded border-brand-stone text-brand-gold focus:ring-brand-gold"
                />
                <span className="flex-1 text-sm text-brand-ink">
                  {item.label}
                  {item.hint && (
                    <span className="mt-0.5 block text-xs font-normal text-slate-500">{item.hint}</span>
                  )}
                </span>
              </label>
            </li>
          )
        })}
      </ul>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">{notesLabel}</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="field-input resize-none"
          placeholder={notesPlaceholder}
          maxLength={5000}
        />
      </div>

      {feedback && (
        <p className={`rounded-xl px-3 py-2 text-sm ${
          feedback.type === 'ok'
            ? 'bg-emerald-50 text-emerald-700'
            : 'bg-red-50 text-red-700'
        }`}>
          {feedback.msg}
        </p>
      )}

      <button type="submit" disabled={isPending} className={buttonClass}>
        {isPending ? 'Sauvegarde…' : 'Sauvegarder la checklist'}
      </button>
    </form>
  )
}
