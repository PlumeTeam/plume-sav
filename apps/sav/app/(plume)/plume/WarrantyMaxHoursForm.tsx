'use client'

import { useState, useTransition } from 'react'
import { updateWarrantyMaxHoursAction } from '@/features/settings/actions'

interface Props {
  currentMaxHours: number
}

export function WarrantyMaxHoursForm({ currentMaxHours }: Props) {
  const [isPending, startTransition] = useTransition()
  const [value, setValue] = useState(String(currentMaxHours))
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'error'; msg: string } | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFeedback(null)
    startTransition(async () => {
      const fd = new FormData()
      fd.set('maxHours', value)
      const r = await updateWarrantyMaxHoursAction(fd)
      if (r && 'error' in r && r.error) {
        const flat = r.error as Record<string, string[] | undefined>
        const msg = flat._form?.[0] ?? flat.maxHours?.[0] ?? 'Erreur'
        setFeedback({ type: 'error', msg })
      } else {
        setFeedback({ type: 'ok', msg: 'Plafond mis à jour.' })
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label htmlFor="warranty-max-hours" className="mb-1 block text-xs font-medium text-slate-600">
          Heures de vol max avant fin de garantie
        </label>
        <div className="flex items-center gap-2">
          <input
            id="warranty-max-hours"
            type="number"
            min="0"
            step="1"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="field-input max-w-[160px]"
            required
          />
          <span className="text-sm text-slate-500">heures</span>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Au-delà de ce seuil, l&apos;aile sera considérée hors garantie quelle que soit la date d&apos;achat.
        </p>
      </div>

      {feedback && (
        <p
          role={feedback.type === 'error' ? 'alert' : 'status'}
          className={`rounded-xl px-3 py-2 text-sm ${
            feedback.type === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
          }`}
        >
          {feedback.msg}
        </p>
      )}

      <button type="submit" disabled={isPending} className="btn-primary">
        {isPending ? 'Sauvegarde…' : 'Enregistrer'}
      </button>
    </form>
  )
}
