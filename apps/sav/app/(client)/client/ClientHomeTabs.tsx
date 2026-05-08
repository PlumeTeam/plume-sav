'use client'

import { useState, type ReactNode } from 'react'

type Tab = 'wings' | 'history'

interface ClientHomeTabsProps {
  wingsSection: ReactNode
  ticketsSection: ReactNode
}

export function ClientHomeTabs({ wingsSection, ticketsSection }: ClientHomeTabsProps) {
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
          className={`${baseBtn} ${tab === 'history' ? activeBtn : idleBtn}`}
        >
          Historique
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
    </>
  )
}
