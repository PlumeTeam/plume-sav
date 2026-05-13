'use client'

import { useState, type ReactNode } from 'react'

export type WorkshopTicketTab = 'state' | 'diagnostic' | 'messages'

interface WorkshopTicketTabsProps {
  state:      ReactNode
  diagnostic: ReactNode
  messages:   ReactNode
  /** Total visible messages — surfaced as a badge on the Messages tab. */
  messagesCount: number
}

export function WorkshopTicketTabs({
  state,
  diagnostic,
  messages,
  messagesCount,
}: WorkshopTicketTabsProps) {
  const [tab, setTab] = useState<WorkshopTicketTab>('state')

  const baseBtn =
    'flex flex-1 items-center justify-center gap-1.5 rounded-2xl px-2 py-2.5 text-[13px] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/60'
  const activeBtn = 'bg-brand-gold text-brand-ink shadow-sm'
  const idleBtn =
    'border border-brand-stone bg-white text-slate-500 hover:text-brand-ink hover:border-brand-gold/40'

  return (
    <>
      <div
        role="tablist"
        aria-label="Sections du ticket"
        className="flex gap-1.5 rounded-2xl bg-brand-cream/60 p-1 ring-1 ring-brand-stone"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'state'}
          aria-controls="panel-workshop-state"
          id="tab-workshop-state"
          onClick={() => setTab('state')}
          className={`${baseBtn} ${tab === 'state' ? activeBtn : idleBtn}`}
        >
          <span aria-hidden>📋</span>
          <span>État</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'diagnostic'}
          aria-controls="panel-workshop-diagnostic"
          id="tab-workshop-diagnostic"
          onClick={() => setTab('diagnostic')}
          className={`${baseBtn} ${tab === 'diagnostic' ? activeBtn : idleBtn}`}
        >
          <span aria-hidden>🛠️</span>
          <span>Diagnostic</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'messages'}
          aria-controls="panel-workshop-messages"
          id="tab-workshop-messages"
          onClick={() => setTab('messages')}
          className={`${baseBtn} ${tab === 'messages' ? activeBtn : idleBtn}`}
        >
          <span aria-hidden>💬</span>
          <span>Messages</span>
          {messagesCount > 0 && (
            <span
              className={`ml-0.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-semibold ${
                tab === 'messages'
                  ? 'bg-brand-ink/15 text-brand-ink'
                  : 'bg-brand-gold/20 text-brand-ink'
              }`}
              aria-label={`${messagesCount} message${messagesCount > 1 ? 's' : ''}`}
            >
              {messagesCount}
            </span>
          )}
        </button>
      </div>

      <div
        id="panel-workshop-state"
        role="tabpanel"
        aria-labelledby="tab-workshop-state"
        hidden={tab !== 'state'}
        className="space-y-3"
      >
        {tab === 'state' && state}
      </div>

      <div
        id="panel-workshop-diagnostic"
        role="tabpanel"
        aria-labelledby="tab-workshop-diagnostic"
        hidden={tab !== 'diagnostic'}
        className="space-y-3"
      >
        {tab === 'diagnostic' && diagnostic}
      </div>

      <div
        id="panel-workshop-messages"
        role="tabpanel"
        aria-labelledby="tab-workshop-messages"
        hidden={tab !== 'messages'}
        className="space-y-3"
      >
        {tab === 'messages' && messages}
      </div>
    </>
  )
}
