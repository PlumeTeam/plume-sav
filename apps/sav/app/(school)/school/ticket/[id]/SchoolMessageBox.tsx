'use client'

import { useState, useTransition } from 'react'
import { addRoleMessageAction } from '@/features/tickets/actions'

interface SchoolMessageBoxProps {
  ticketId: string
}

export function SchoolMessageBox({ ticketId }: SchoolMessageBoxProps) {
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [isInternal, setIsInternal] = useState(false)
  const [content, setContent] = useState('')
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'error'; msg: string } | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return
    startTransition(async () => {
      const fd = new FormData()
      fd.set('ticketId',   ticketId)
      fd.set('content',    content)
      fd.set('isInternal', String(isInternal))
      fd.set('senderRole', 'school')

      const result = await addRoleMessageAction(fd)
      if (result?.error) setFeedback({ type: 'error', msg: 'Erreur lors de l’envoi.' })
      else {
        setContent('')
        setOpen(false)
        setFeedback({ type: 'ok', msg: '✓ Message envoyé.' })
        setTimeout(() => setFeedback(null), 2400)
      }
    })
  }

  if (!open) {
    return (
      <div className="space-y-2">
        {feedback && (
          <p className={`rounded-xl px-3 py-2 text-sm ${
            feedback.type === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
          }`}>{feedback.msg}</p>
        )}
        <button onClick={() => setOpen(true)} className="btn-secondary w-full">
          ✉️ Écrire un message
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl bg-brand-cream p-4">
      <label className="flex items-center gap-2 text-sm text-brand-ink">
        <input
          type="checkbox"
          checked={isInternal}
          onChange={(e) => setIsInternal(e.target.checked)}
          className="h-4 w-4 rounded border-brand-stone text-brand-coral focus:ring-brand-coral"
        />
        Note interne (non visible par le client)
      </label>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={isInternal ? 'Note interne école…' : 'Message au client…'}
        rows={3}
        className="field-input resize-none"
        required
      />
      <div className="flex gap-2">
        <button type="submit" disabled={isPending || !content.trim()} className="btn-primary flex-1">
          {isPending ? 'Envoi…' : 'Envoyer'}
        </button>
        <button type="button" onClick={() => { setOpen(false); setFeedback(null) }} className="btn-secondary flex-1">
          Annuler
        </button>
      </div>
      {feedback && (
        <p className={`rounded-xl px-3 py-2 text-sm ${
          feedback.type === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
        }`}>{feedback.msg}</p>
      )}
    </form>
  )
}
