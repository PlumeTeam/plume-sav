import { formatDateTime } from '../utils'
import type { TicketMessage } from '../types'

interface CommentThreadProps {
  messages: TicketMessage[]
  /** Roles whose messages appear on the right (own messages) */
  ownRoles?: string[]
  /** If true, shows internal badge on is_internal messages */
  showInternalBadge?: boolean
  emptyText?: string
}

const ROLE_LABELS: Record<string, string> = {
  client:      'Client',
  school:      'École',
  workshop:    'Atelier',
  plume_admin: 'Plume',
}

export function CommentThread({
  messages,
  ownRoles = ['client'],
  showInternalBadge = false,
  emptyText = "Aucun message pour l'instant.",
}: CommentThreadProps) {
  if (messages.length === 0) {
    return (
      <p className="rounded-xl bg-brand-cream/60 p-3 text-sm text-slate-500">{emptyText}</p>
    )
  }

  return (
    <div className="space-y-3">
      {messages.map((msg) => {
        const isOwn = ownRoles.includes(msg.sender_role)
        return (
          <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                isOwn
                  ? 'bg-brand-coral text-white rounded-br-sm'
                  : 'bg-brand-cream text-brand-ink ring-1 ring-brand-stone rounded-bl-sm'
              }`}
            >
              {!isOwn && (
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {ROLE_LABELS[msg.sender_role] ?? msg.sender_role}
                  {showInternalBadge && msg.is_internal && (
                    <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-amber-800 normal-case tracking-normal">
                      Interne
                    </span>
                  )}
                </p>
              )}
              {isOwn && showInternalBadge && msg.is_internal && (
                <p className="mb-1 text-[11px] uppercase tracking-wider opacity-70">Note interne</p>
              )}
              <p className="whitespace-pre-line text-sm leading-relaxed">{msg.content}</p>
              <p className="mt-1 text-right text-[11px] opacity-60">{formatDateTime(msg.created_at)}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
