'use client'

import { useState, useTransition } from 'react'
import { addRoleMessageAction } from '@/features/tickets/actions'

interface WorkshopMessageComposerProps {
  ticketId: string
}

/**
 * Lightweight always-visible composer for the workshop conversation page.
 * Posts a public (visibility=all) message from the workshop role. The richer
 * WorkshopActionBar (diagnosis, internal notes, channel picker) lives on the
 * full ticket page — this composer is the chat-only fast path.
 */
export function WorkshopMessageComposer({ ticketId }: WorkshopMessageComposerProps) {
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
      fd.set('senderRole',      'workshop')
      fd.set('visibilityLevel', 'all')

      const r = await addRoleMessageAction(fd)
      if (r?.error) {
        const err = r.error as Record<string, string[] | undefined>
        const msg = err._form?.[0] ?? err.content?.[0] ?? "Erreur lors de l'envoi."
        setFeedback({ type: 'error', msg })
      } else {
        setContent('')
        setFeedback({ type: 'ok', msg: 'Message envoyé.' })
        setTimeout(() => setFeedback(null), 2400)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex items-end gap-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={2}
          placeholder="Écrire un message…"
          className="field-input flex-1 resize-none"
          required
          maxLength={5000}
          disabled={isPending}
        />
        <button
          type="submit"
          disabled={isPending || !content.trim()}
          aria-label="Envoyer le message"
          className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-brand-gold text-white shadow-plume disabled:opacity-50 hover:bg-brand-gold/90 transition-colors"
        >
          {isPending ? '…' : '↑'}
        </button>
      </div>
      {feedback && (
        <p
          role="status"
          className={`rounded-xl px-3 py-2 text-xs animate-fade-in ${
            feedback.type === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
          }`}
        >
          {feedback.type === 'ok' ? '✓ ' : ''}{feedback.msg}
        </p>
      )}
    </form>
  )
}
