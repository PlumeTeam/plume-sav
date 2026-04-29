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
  client: 'Client',
  school: 'École',
  workshop: 'Atelier',
  plume_admin: 'Plume',
}

export function CommentThread({
  messages,
  ownRoles = ['client'],
  showInternalBadge = false,
  emptyText = "Aucun message pour l'instant.",
}: CommentThreadProps) {
  if (messages.length === 0) {
    return <p className="text-sm text-slate-400">{emptyText}</p>
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
                  ? 'bg-slate-900 text-white rounded-br-sm'
                  : 'bg-slate-100 text-slate-800 rounded-bl-sm'
              }`}
            >
              {!isOwn && (
                <p className="mb-1 text-xs font-medium text-slate-500">
                  {ROLE_LABELS[msg.sender_role] ?? msg.sender_role}
                  {showInternalBadge && msg.is_internal && (
                    <span className="ml-2 rounded bg-amber-100 px-1 py-0.5 text-amber-700">
                      Interne
                    </span>
                  )}
                </p>
              )}
              {isOwn && showInternalBadge && msg.is_internal && (
                <p className="mb-1 text-xs text-slate-400">Commentaire interne</p>
              )}
              <p className="text-sm leading-relaxed">{msg.content}</p>
              <p className={`mt-1 text-right text-xs ${isOwn ? 'text-slate-400' : 'text-slate-400'}`}>
                {formatDateTime(msg.created_at)}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
