'use client'

import { useState, type ReactNode } from 'react'

type Tab = 'state' | 'messages' | 'infos'

interface ClientTicketTabsProps {
  state:    ReactNode
  messages: ReactNode
  infos:    ReactNode
  /** Total visible messages — surfaced as a badge on the Messages tab. */
  messagesCount: number
  /** When > 0, surfaced as a red dot (unread school/workshop replies). */
  unreadCount?: number
}

/**
 * Client-side tab control aligned with SchoolTicketTabs design — segment
 * control on top, active panel below. Conditional render (panels are
 * hidden + content unmounted when not active) keeps the page light.
 */
export function ClientTicketTabs({
  state,
  messages,
  infos,
  messagesCount,
  unreadCount = 0,
}: ClientTicketTabsProps) {
  const [tab, setTab] = useState<Tab>('state')

  const baseBtn =
    'flex flex-1 items-center justify-center gap-1.5 rounded-2xl px-2 py-2.5 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/60 sm:gap-2 sm:px-3 sm:text-sm'
  const activeBtn = 'bg-brand-gold text-brand-ink shadow-sm'
  const idleBtn =
    'border border-brand-stone bg-white text-slate-500 hover:text-brand-ink hover:border-brand-gold/40'

  return (
    <>
      <div
        role="tablist"
        aria-label="Sections de la demande SAV"
        className="flex gap-1.5 rounded-2xl bg-brand-cream/60 p-1 ring-1 ring-brand-stone sm:gap-2"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'state'}
          aria-controls="panel-state"
          id="tab-state"
          onClick={() => setTab('state')}
          className={`${baseBtn} ${tab === 'state' ? activeBtn : idleBtn}`}
        >
          <span aria-hidden>📍</span>
          <span>État</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'messages'}
          aria-controls="panel-messages"
          id="tab-messages"
          onClick={() => setTab('messages')}
          className={`${baseBtn} ${tab === 'messages' ? activeBtn : idleBtn}`}
        >
          <span aria-hidden>💬</span>
          <span>Messages</span>
          {unreadCount > 0 ? (
            <span
              className="ml-0.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-semibold text-white"
              aria-label={`${unreadCount} non lu${unreadCount > 1 ? 's' : ''}`}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          ) : messagesCount > 0 ? (
            <span
              className={`ml-0.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-semibold ${
                tab === 'messages' ? 'bg-brand-ink/15 text-brand-ink' : 'bg-brand-gold/20 text-brand-ink'
              }`}
              aria-label={`${messagesCount} message${messagesCount > 1 ? 's' : ''}`}
            >
              {messagesCount}
            </span>
          ) : null}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'infos'}
          aria-controls="panel-infos"
          id="tab-infos"
          onClick={() => setTab('infos')}
          className={`${baseBtn} ${tab === 'infos' ? activeBtn : idleBtn}`}
        >
          <span aria-hidden>📋</span>
          <span>Déclaration</span>
        </button>
      </div>

      <div
        id="panel-state"
        role="tabpanel"
        aria-labelledby="tab-state"
        hidden={tab !== 'state'}
        className="space-y-3"
      >
        {tab === 'state' && state}
      </div>

      <div
        id="panel-messages"
        role="tabpanel"
        aria-labelledby="tab-messages"
        hidden={tab !== 'messages'}
        className="space-y-3"
      >
        {tab === 'messages' && messages}
      </div>



      <div
        id="panel-infos"
        role="tabpanel"
        aria-labelledby="tab-infos"
        hidden={tab !== 'infos'}
        className="space-y-3"
      >
        {tab === 'infos' && infos}
      </div>
    </>
  )
}
