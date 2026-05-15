'use client'

import { useState, useTransition, type ReactNode } from 'react'
import { addRoleMessageAction } from '@/features/tickets/actions'
import { CommentThread } from './CommentThread'
import type { MessageChannel } from '../channels'
import type { TicketMessage, MessageSenderRole } from '../types'

type Visibility = 'all' | 'school_plume' | 'workshop_plume' | 'plume_only'

interface ComposerConfig {
  senderRole:      MessageSenderRole
  visibilityLevel: Visibility
  placeholder:     string
  submitLabel:     string
  helperText:      string
  /**
   * Quand renseigné, le composer écrit `channel` côté DB (système 5 canaux).
   * Si absent, on retombe sur l'ancien fonctionnement basé sur visibility_level.
   */
  channel?:        MessageChannel
  /** Désactive le composer + raison affichée. */
  disabledReason?: string
}

export interface TicketChannel {
  id:        string
  label:     string
  emoji:     string
  /**
   * Filtre legacy par visibility_level. Conservé pour rétrocompat — les nouveaux
   * canaux passent par `channel`.
   */
  visibility?: Visibility
  /** Filtre 5-canaux : utilisé en priorité sur `visibility` quand fourni. */
  channel?:  MessageChannel
  /**
   * Filtre legacy (channel = NULL) à inclure dans ce canal. Permet de
   * conserver l'historique des messages pré-migration 5-canaux dans le
   * bon onglet (ex : école/client antérieurs au 2026-05-12 → onglet école).
   */
  legacyVisibility?: Visibility
  /** When true, ignore messages flagged `is_internal` even on this channel. */
  excludeInternal?: boolean
  /** Message ids hoisted out of the thread (e.g. spotlight card on top). */
  excludeMessageIds?: string[]
  /** When null, the channel is read-only (no composer). */
  composer:  ComposerConfig | null
  /** Optional block rendered between the selector and the conversation. */
  banner?:   ReactNode
  /** Optional block rendered above the thread (e.g. spotlight). */
  spotlight?: ReactNode
  /** Empty thread placeholder. */
  emptyText?: string
  /**
   * When set, replaces the default conversation card + composer with custom
   * JSX. Used when a channel needs richer state than the standard thread —
   * e.g. school's workshop channel inlines a workshop picker before the chat.
   */
  body?: ReactNode
}

interface Props {
  ticketId:           string
  messages:           TicketMessage[]
  channels:           TicketChannel[]
  ownRoles:           MessageSenderRole[]
  showInternalBadge?: boolean
}

function matchesChannel(m: TicketMessage, c: TicketChannel): boolean {
  if (c.channel) {
    const ch = (m as TicketMessage & { channel?: MessageChannel | null }).channel ?? null
    const direct = ch === c.channel
    const legacy = ch === null
      && c.legacyVisibility !== undefined
      && m.visibility_level === c.legacyVisibility
    if (!direct && !legacy) return false
  } else if (c.visibility) {
    if (m.visibility_level !== c.visibility) return false
  }
  if (c.excludeInternal && m.is_internal)  return false
  if (c.excludeMessageIds?.includes(m.id)) return false
  return true
}

/**
 * Sous-onglets de canaux de messagerie pour un même ticket. Chaque canal
 * filtre la liste `messages` via son `filter` et expose un composer qui pousse
 * un nouveau message avec la bonne `visibility_level`. Réutilisé côté école
 * (2 canaux : Client / Atelier) et côté atelier (2 canaux : Client / École),
 * garantit que la liste des messages reste cohérente avec le canal sur lequel
 * on poste. Seul l'atelier communique avec Plume HQ (via `workshop_plume`).
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

  const counts = new Map(channels.map((c) => [c.id, messages.filter((m) => matchesChannel(m, c)).length]))
  const visible = messages.filter((m) => matchesChannel(m, active))

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

      {active.body ? (
        active.body
      ) : (
        <>
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
        </>
      )}
    </div>
  )
}

function ChannelComposer({ ticketId, cfg }: { ticketId: string; cfg: ComposerConfig }) {
  const [isPending, startTransition] = useTransition()
  const [content, setContent]   = useState('')
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'error'; msg: string } | null>(null)

  if (cfg.disabledReason) {
    return (
      <div className="card border-dashed p-5 text-center">
        <p className="text-sm text-slate-500">{cfg.disabledReason}</p>
      </div>
    )
  }

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
      if (cfg.channel) fd.set('channel', cfg.channel)

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
