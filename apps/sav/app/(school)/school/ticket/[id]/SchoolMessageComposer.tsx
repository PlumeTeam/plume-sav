'use client'

import { useState, useTransition } from 'react'
import { addRoleMessageAction } from '@/features/tickets/actions'

interface SchoolMessageComposerProps {
  ticketId: string
}

/**
 * Always-visible composer used inside the Messages tab. Posts a public
 * (visibility=all) message from the school role, so the client sees it in
 * their thread and the rest of the Plume team can read it too. Mirrors the
 * inline ClientComposer that used to live inside SchoolActions.tsx, but
 * without the toggle/click-to-open layer — the tab UX makes the composer
 * the focal action of the panel.
 */
export function SchoolMessageComposer({ ticketId }: SchoolMessageComposerProps) {
  const [isPending, startTransition] = useTransition()
  const [content, setContent] = useState('')
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'error'; msg: string } | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return
    startTransition(async () => {
      const fd = new FormData()
      fd.set('ticketId',        ticketId)
      fd.set('content',         content.trim())
      fd.set('isInternal',      'false')
      fd.set('senderRole',      'school')
      fd.set('visibilityLevel', 'all')

      const r = await addRoleMessageAction(fd)
      if (r?.error) {
        const err = r.error as Record<string, string[] | undefined>
        const msg = err._form?.[0] ?? err.content?.[0] ?? "Erreur lors de l'envoi."
        setFeedback({ type: 'error', msg })
      } else {
        setContent('')
        setFeedback({ type: 'ok', msg: '✓ Message envoyé.' })
        setTimeout(() => setFeedback(null), 2000)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-3 p-5">
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-semibold text-brand-ink">Répondre au client</p>
        <p className="text-[11px] text-slate-500">
          Visible par le client &amp; toute l&apos;équipe Plume
        </p>
      </div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        maxLength={5000}
        placeholder="Question, mise à jour, demande de précision…"
        className="field-input resize-none"
        required
      />
      {feedback && (
        <p
          className={`rounded-xl px-3 py-2 text-sm ${
            feedback.type === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
          }`}
        >
          {feedback.msg}
        </p>
      )}
      <button type="submit" disabled={isPending || !content.trim()} className="btn-primary w-full sm:w-auto">
        {isPending ? 'Envoi…' : 'Envoyer au client'}
      </button>
    </form>
  )
}
