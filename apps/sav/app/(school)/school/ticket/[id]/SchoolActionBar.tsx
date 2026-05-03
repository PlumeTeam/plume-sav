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
    { label: 'Commencer l\'inspection', newStatus: 'processing', variant: 'primary' },
    { label: 'Rejeter', newStatus: 'rejected', variant: 'danger' },
  ],
  processing: [
    { label: 'Approuver la réparation', newStatus: 'approved', variant: 'primary' },
    { label: 'Rejeter', newStatus: 'rejected', variant: 'danger' },
  ],
  approved: [
    { label: 'Marquer comme réparé', newStatus: 'completed', variant: 'primary' },
  ],
}

export function SchoolActionBar({ ticketId, currentStatus }: SchoolActionBarProps) {
  const [isPending, startTransition] = useTransition()
  const [showMessageForm, setShowMessageForm] = useState(false)
  const [isInternal, setIsInternal] = useState(false)
  const [content, setContent] = useState('')
  const [error, setError] = useState<string | null>(null)

  const transitions = STATUS_TRANSITIONS[currentStatus] ?? []

  function handleStatusChange(newStatus: RequestStatus) {
    startTransition(async () => {
      const fd = new FormData()
      fd.set('ticketId', ticketId)
      fd.set('newStatus', newStatus)
      const result = await updateTicketStatusAction(fd)
      if (result?.error) setError("Erreur lors de la mise à jour du statut.")
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
      if (result?.error) {
        setError("Erreur lors de l'envoi.")
      } else {
        setContent('')
        setShowMessageForm(false)
        setError(null)
      }
    })
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {/* Status actions */}
      {transitions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {transitions.map(({ label, newStatus, variant }) => (
            <button
              key={newStatus}
              onClick={() => handleStatusChange(newStatus)}
              disabled={isPending}
              className={`rounded-xl px-4 py-2.5 text-sm font-medium disabled:opacity-50 ${
                variant === 'primary'
                  ? 'bg-slate-900 text-white'
                  : variant === 'danger'
                  ? 'bg-red-600 text-white'
                  : 'border border-slate-200 bg-white text-slate-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Message button */}
      {!showMessageForm && (
        <button
          onClick={() => setShowMessageForm(true)}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700"
        >
          Envoyer un message
        </button>
      )}

      {/* Message form */}
      {showMessageForm && (
        <form onSubmit={handleSendMessage} className="space-y-3 rounded-2xl bg-slate-50 p-4">
          <div className="flex items-center gap-2">
            <input
              id="internal"
              type="checkbox"
              checked={isInternal}
              onChange={(e) => setIsInternal(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            <label htmlFor="internal" className="text-sm text-slate-600">
              Commentaire interne (non visible par le client)
            </label>
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={isInternal ? 'Note interne…' : 'Message au client…'}
            rows={3}
            className="field-input resize-none"
            required
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending || !content.trim()}
              className="btn-primary flex-1 disabled:opacity-50"
            >
              {isPending ? 'Envoi…' : 'Envoyer'}
            </button>
            <button
              type="button"
              onClick={() => { setShowMessageForm(false); setError(null) }}
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
