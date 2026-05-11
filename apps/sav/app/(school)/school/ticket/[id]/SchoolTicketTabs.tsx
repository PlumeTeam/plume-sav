'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'

export type SchoolTicketTab = 'state' | 'declaration' | 'messages' | 'check'

interface SchoolTabsContextValue {
  setTab: (tab: SchoolTicketTab) => void
}

const SchoolTabsContext = createContext<SchoolTabsContextValue | null>(null)

/** Hook pour qu'un enfant (ex: SchoolStepPanel) puisse changer l'onglet actif. */
export function useSchoolTabs() {
  return useContext(SchoolTabsContext)
}

interface SchoolTicketTabsProps {
  state:        ReactNode
  declaration:  ReactNode
  messages:     ReactNode
  check:        ReactNode
  /** Total visible messages — surfaced as a badge on the Messages tab. */
  messagesCount: number
  /** When true, hint that the check has been completed (visual ✓ on the Check tab). */
  checkValidated: boolean
}

export function SchoolTicketTabs({
  state,
  declaration,
  messages,
  check,
  messagesCount,
  checkValidated,
}: SchoolTicketTabsProps) {
  const [tab, setTab] = useState<SchoolTicketTab>('state')

  const baseBtn =
    'flex flex-1 items-center justify-center gap-1.5 rounded-2xl px-2 py-2.5 text-[13px] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/60'
  const activeBtn = 'bg-brand-gold text-brand-ink shadow-sm'
  const idleBtn =
    'border border-brand-stone bg-white text-slate-500 hover:text-brand-ink hover:border-brand-gold/40'

  return (
    <SchoolTabsContext.Provider value={{ setTab }}>
      <div
        role="tablist"
        aria-label="Sections du ticket"
        className="flex gap-1.5 rounded-2xl bg-brand-cream/60 p-1 ring-1 ring-brand-stone"
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
          <span aria-hidden>📋</span>
          <span>État</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'declaration'}
          aria-controls="panel-declaration"
          id="tab-declaration"
          onClick={() => setTab('declaration')}
          className={`${baseBtn} ${tab === 'declaration' ? activeBtn : idleBtn}`}
        >
          <span aria-hidden>📝</span>
          <span>Déclaration</span>
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
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'check'}
          aria-controls="panel-check"
          id="tab-check"
          onClick={() => setTab('check')}
          className={`${baseBtn} ${tab === 'check' ? activeBtn : idleBtn}`}
        >
          <span aria-hidden>🔍</span>
          <span>Check aile</span>
          {checkValidated && (
            <span
              className="ml-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[11px] font-bold text-white"
              aria-label="Check validé"
            >
              ✓
            </span>
          )}
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
        id="panel-declaration"
        role="tabpanel"
        aria-labelledby="tab-declaration"
        hidden={tab !== 'declaration'}
        className="space-y-3"
      >
        {tab === 'declaration' && declaration}
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
        id="panel-check"
        role="tabpanel"
        aria-labelledby="tab-check"
        hidden={tab !== 'check'}
        className="space-y-3"
      >
        {tab === 'check' && check}
      </div>
    </SchoolTabsContext.Provider>
  )
}
