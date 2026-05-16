'use client'

import { useState, type ReactNode } from 'react'

type Tab = 'wings' | 'history' | 'messages'

interface ClientHomeTabsProps {
  wingsSection: ReactNode
  ticketsSection: ReactNode
  messagesSection: ReactNode
  /** When > 0, shows a small red pill next to "Mes demandes SAV" with the count. */
  historyBadge?: number
  /** When > 0, shows a small red pill next to "Messages" with the count. */
  messagesBadge?: number
}

export function ClientHomeTabs({
  wingsSection,
  ticketsSection,
  messagesSection,
  historyBadge = 0,
  messagesBadge = 0,
}: ClientHomeTabsProps) {
  const [tab, setTab] = useState<Tab>('wings')

  const baseBtn =
    'flex-1 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/60'
  const activeBtn = 'bg-brand-gold text-brand-ink shadow-sm'
  const idleBtn =
    'border border-brand-stone bg-white text-slate-500 hover:text-brand-ink hover:border-brand-gold/40'

  return (
    <>
      <div
        role="tablist"
        aria-label="Sections"
        className="flex gap-2 rounded-2xl bg-brand-cream/60 p-1 ring-1 ring-brand-stone"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'wings'}
          aria-controls="panel-wings"
          id="tab-wings"
          onClick={() => setTab('wings')}
          className={`${baseBtn} ${tab === 'wings' ? activeBtn : idleBtn}`}
        >
          Mes ailes
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'history'}
          aria-controls="panel-history"
          id="tab-history"
          onClick={() => setTab('history')}
          className={`${baseBtn} relative inline-flex items-center justify-center gap-2 ${tab === 'history' ? activeBtn : idleBtn}`}
        >
          <span>Mes demandes SAV</span>
          {historyBadge > 0 && (
            <span
              aria-label={`${historyBadge} message${historyBadge > 1 ? 's' : ''} non lu${historyBadge > 1 ? 's' : ''}`}
              className="inline-flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white"
            >
              {historyBadge > 9 ? '9+' : historyBadge}
            </span>
          )}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'messages'}
          aria-controls="panel-messages"
          id="tab-messages"
          onClick={() => setTab('messages')}
          className={`${baseBtn} relative inline-flex items-center justify-center gap-2 ${tab === 'messages' ? activeBtn : idleBtn}`}
        >
          <span>Messages</span>
          {messagesBadge > 0 && (
            <span
              aria-label={`${messagesBadge} message${messagesBadge > 1 ? 's' : ''} non lu${messagesBadge > 1 ? 's' : ''}`}
              className="inline-flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white"
            >
              {messagesBadge > 9 ? '9+' : messagesBadge}
            </span>
          )}
        </button>
      </div>

      <div
        id="panel-wings"
        role="tabpanel"
        aria-labelledby="tab-wings"
        hidden={tab !== 'wings'}
      >
        {tab === 'wings' && wingsSection}
      </div>

      <div
        id="panel-history"
        role="tabpanel"
        aria-labelledby="tab-history"
        hidden={tab !== 'history'}
      >
        {tab === 'history' && ticketsSection}
      </div>

      <div
        id="panel-messages"
        role="tabpanel"
        aria-labelledby="tab-messages"
        hidden={tab !== 'messages'}
      >
        {tab === 'messages' && messagesSection}
      </div>
    </>
  )
}
