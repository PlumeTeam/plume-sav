'use client'

import { useTransition, useState } from 'react'
import { updateTicketStatusAction, addRoleMessageAction } from '@/features/tickets/actions'
import type { RequestStatus } from '@/features/tickets/types'

interface SchoolActionBarProps {
  ticketId: string
  currentStatus: RequestStatus
}

const STATUS_TRANSITIONS: Partial<Record<RequestStatus, Array<{ label: string; newStatus: RequestStatus; variant: 'primary' | 'secondary' | 'danger' }>>> = {
  pending: [
    { label: "Commencer l'inspection", newStatus: 'processing', variant: 'primary' },
    { label: 'Rejeter',                 newStatus: 'rejected',   variant: 'danger'  },
  ],
  processing: [
    { label: 'Approuver pour réparation', newStatus: 'approved', variant: 'primary' },
    { label: 'Rejeter',                    newStatus: 'rejected', variant: 'danger'  },
  ],
  approved: [
    { label: 'Marquer comme réparé', newStatus: 'completed', variant: 'primary' },
  ],
}

export function SchoolActionBar({ ticketId, currentStatus }: SchoolActionBarProps) {
  const [isPending, startTransition]   = useTransition()
  const [showMessageForm, setShowMessageForm] = useState(false)
  const [isInternal, setIsInternal]    = useState(false)
  const [content, setContent]          = useState('')
  const [feedback, setFeedback]        = useState<{ type: 'error' | 'ok'; msg: string } | null>(null)

  const transitions = STATUS_TRANSITIONS[currentStatus] ?? []

  function handleStatusChange(newStatus: RequestStatus) {
    startTransition(async () => {
      const fd = new FormData()
      fd.set('ticketId', ticketId)
      fd.set('newStatus', newStatus)
      const result = await updateTicketStatusAction(fd)
      if (result?.error) setFeedback({ type: 'error', msg: 'Erreur lors de la mise à jour.' })
      else setFeedback({ type: 'ok', msg: 'Statut mis à jour.' })
    })
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return
    startTransition(async () => {
      const fd = new FormData()
      fd.set('ticketId', ticketId)
      fd.set('content', content)
      fd.set('isInternal', String(isInternal))
      fd.set('senderRole', 'school')
      const result = await addRoleMessageAction(fd)
      if (result?.error) setFeedback({ type: 'error', msg: "Erreur lors de l'envoi." })
      else {
        setContent('')
        setShowMessageForm(false)
        setFeedback({ type: 'ok', msg: 'Message envoyé.' })
      }
    })
  }

  return (
    <div className="space-y-3">
      {feedback && (
        <p className={`rounded-xl px-3 py-2 text-sm ${
          feedback.type === 'ok'
            ? 'bg-emerald-50 text-emerald-700'
            : 'bg-red-50 text-red-700'
        }`}>
          {feedback.msg}
        </p>
      )}

      {transitions.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {transitions.map(({ label, newStatus, variant }) => (
            <button
              key={newStatus}
              onClick={() => handleStatusChange(newStatus)}
              disabled={isPending}
              className={
                variant === 'primary' ? 'btn-primary' :
                variant === 'danger'  ? 'btn-danger'  :
                'btn-secondary'
              }
            >
              {label}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-500">Aucune action disponible à ce stade.</p>
      )}

      {!showMessageForm && (
        <button
          onClick={() => setShowMessageForm(true)}
          className="btn-secondary w-full"
        >
          ✉️ Envoyer un message
        </button>
      )}

      {showMessageForm && (
        <form onSubmit={handleSendMessage} className="space-y-3 rounded-2xl bg-brand-cream p-4">
          <label className="flex items-center gap-2 text-sm text-brand-ink">
            <input
              type="checkbox"
              checked={isInternal}
              onChange={(e) => setIsInternal(e.target.checked)}
              className="h-4 w-4 rounded border-brand-stone text-brand-coral focus:ring-brand-coral"
            />
            Commentaire interne (non visible par le client)
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={isInternal ? 'Note interne…' : 'Message au client…'}
            rows={3}
            className="field-input resize-none"
            required
          />
          <div className="flex gap-2">
            <button type="submit" disabled={isPending || !content.trim()} className="btn-primary flex-1">
              {isPending ? 'Envoi…' : 'Envoyer'}
            </button>
            <button
              type="button"
              onClick={() => { setShowMessageForm(false); setFeedback(null) }}
              className="btn-secondary flex-1"
            >
              Annuler
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
