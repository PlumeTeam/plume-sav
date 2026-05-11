'use client'

import { useState, useTransition, type ReactNode } from 'react'
import { addRoleMessageAction } from '@/features/tickets/actions'
import { CommentThread } from './CommentThread'
import type { TicketMessage, MessageSenderRole } from '../types'

type Visibility = 'all' | 'school_plume' | 'workshop_plume' | 'plume_only'

interface ComposerConfig {
  senderRole:      MessageSenderRole
  visibilityLevel: Visibility
  placeholder:     string
  submitLabel:     string
  helperText:      string
}

export interface TicketChannel {
  id:        string
  label:     string
  emoji:     string
  /** Predicate to pick messages belonging to this channel. */
  filter:    (m: TicketMessage) => boolean
  /** When null, the channel is read-only (no composer). */
  composer:  ComposerConfig | null
  /** Optional block rendered between the selector and the conversation. */
  banner?:   ReactNode
  /** Optional block rendered above the thread (e.g. spotlight). */
  spotlight?: ReactNode
  /** Empty thread placeholder. */
  emptyText?: string
}

interface Props {
  ticketId:           string
  messages:           TicketMessage[]
  channels:           TicketChannel[]
  ownRoles:           MessageSenderRole[]
  showInternalBadge?: boolean
}

/**
 * Sous-onglets de canaux de messagerie pour un même ticket. Chaque canal
 * filtre la liste `messages` via son `filter` et expose un composer qui pousse
 * un nouveau message avec la bonne `visibility_level`. Réutilisé côté école
 * (3 canaux : Client / Atelier / Plume HQ) et côté atelier (2 canaux :
 * Client / École), garantit que la liste des messages reste cohérente avec
 * le canal sur lequel on poste.
 */
export function TicketChannelSwitch({
  ticketId,
  messages,
  channels,
  ownRoles,
  showInternalBadge,
}: Props) {
  const firstId = channels[0]?.id ?? ''
  const [activeId, setActiveId] = useState<string>(firstId)
  const active = channels.find((c) => c.id === activeId) ?? channels[0]
  if (!active) return null

  const counts = new Map(channels.map((c) => [c.id, messages.filter(c.filter).length]))
  const visible = messages.filter(active.filter)

  return (
    <div className="space-y-3">
      <div
        role="tablist"
        aria-label="Canaux de messagerie"
        className="flex gap-1.5 rounded-2xl bg-white p-1 ring-1 ring-brand-stone"
      >
        {channels.map((c) => {
          const isActive = c.id === activeId
          const count = counts.get(c.id) ?? 0
          return (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveId(c.id)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-[13px] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/60 ${
                isActive
                  ? 'bg-brand-gold text-brand-ink shadow-sm'
                  : 'text-slate-500 hover:text-brand-ink hover:bg-brand-cream/50'
              }`}
            >
              <span aria-hidden>{c.emoji}</span>
              <span className="truncate">{c.label}</span>
              {count > 0 && (
                <span
                  className={`ml-0.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-semibold ${
                    isActive ? 'bg-brand-ink/15 text-brand-ink' : 'bg-brand-cream text-brand-ink'
                  }`}
                  aria-label={`${count} message${count > 1 ? 's' : ''}`}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {active.banner}

      {active.spotlight}

      <section className="card p-5">
        <h2 className="section-title mb-4 flex items-center gap-2">
          <span aria-hidden>{active.emoji}</span>
          <span>{active.label}</span>
        </h2>
        <CommentThread
          messages={visible}
          ownRoles={ownRoles}
          showInternalBadge={showInternalBadge}
          emptyText={active.emptyText ?? 'Aucun message dans ce canal pour le moment.'}
        />
      </section>

      {active.composer && (
        <ChannelComposer key={active.id} ticketId={ticketId} cfg={active.composer} />
      )}
    </div>
  )
}

function ChannelComposer({ ticketId, cfg }: { ticketId: string; cfg: ComposerConfig }) {
  const [isPending, startTransition] = useTransition()
  const [content, setContent]   = useState('')
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'error'; msg: string } | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return
    startTransition(async () => {
      const fd = new FormData()
      fd.set('ticketId',        ticketId)
      fd.set('content',         content.trim())
      fd.set('isInternal',      cfg.visibilityLevel === 'all' ? 'false' : 'true')
      fd.set('senderRole',      cfg.senderRole)
      fd.set('visibilityLevel', cfg.visibilityLevel)

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
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-sm font-semibold text-brand-ink">{cfg.submitLabel}</p>
        <p className="text-[11px] text-slate-500">{cfg.helperText}</p>
      </div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        maxLength={5000}
        placeholder={cfg.placeholder}
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
      <button
        type="submit"
        disabled={isPending || !content.trim()}
        className="btn-primary w-full sm:w-auto"
      >
        {isPending ? 'Envoi…' : cfg.submitLabel}
      </button>
    </form>
  )
}
