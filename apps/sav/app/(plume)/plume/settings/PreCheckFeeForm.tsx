'use client'

import { useState, useTransition } from 'react'
import { updatePreCheckFeeAction } from '@/features/settings/actions'

interface Props {
  currentFee: number
}

export function PreCheckFeeForm({ currentFee }: Props) {
  const [isPending, startTransition] = useTransition()
  const [value, setValue] = useState(String(currentFee))
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'error'; msg: string } | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const fd = new FormData()
      fd.set('feeEur', value)
      const r = await updatePreCheckFeeAction(fd)
      if (r && 'error' in r && r.error) {
        const flat = r.error as Record<string, string[] | undefined>
        const msg = flat._form?.[0] ?? flat.feeEur?.[0] ?? 'Erreur'
        setFeedback({ type: 'error', msg })
      } else {
        setFeedback({ type: 'ok', msg: 'Tarif mis à jour.' })
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">
          Tarif pré-check (€)
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            step="0.01"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="field-input max-w-[160px]"
            required
          />
          <span className="text-sm text-slate-500">€ HT</span>
        </div>
      </div>

      {feedback && (
        <p className={`rounded-xl px-3 py-2 text-sm ${
          feedback.type === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
        }`}>
          {feedback.msg}
        </p>
      )}

      <button type="submit" disabled={isPending} className="btn-primary">
        {isPending ? 'Sauvegarde…' : 'Enregistrer'}
      </button>
    </form>
  )
}
