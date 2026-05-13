'use client'

import { useState, type ReactNode } from 'react'

export type DiagnosticView = 'workshop' | 'school' | 'client'

interface DiagnosticViewSwitcherProps {
  workshop: ReactNode
  school:   ReactNode
  client:   ReactNode
}

/**
 * Sélecteur en pills pour les 3 vues du diagnostic côté atelier :
 *  - Atelier  (par défaut) : checklist + form du technicien
 *  - École              : check structuré école + note d'escalade
 *  - Client             : déclaration du pilote + photos uploadées
 */
export function DiagnosticViewSwitcher({
  workshop,
  school,
  client,
}: DiagnosticViewSwitcherProps) {
  const [view, setView] = useState<DiagnosticView>('workshop')

  const basePill =
    'flex-1 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/60 sm:flex-initial sm:px-4 sm:py-2 sm:text-sm'
  const activePill = 'bg-brand-gold text-brand-ink shadow-sm'
  const idlePill =
    'bg-white text-slate-500 hover:text-brand-ink hover:bg-brand-cream/60'

  return (
    <>
      <div
        role="tablist"
        aria-label="Source du diagnostic"
        className="flex gap-1.5 rounded-full bg-brand-cream/60 p-1 ring-1 ring-brand-stone"
      >
        <button
          type="button"
          role="tab"
          aria-selected={view === 'workshop'}
          aria-controls="diag-panel-workshop"
          id="diag-tab-workshop"
          onClick={() => setView('workshop')}
          className={`${basePill} ${view === 'workshop' ? activePill : idlePill}`}
        >
          <span className="mr-1" aria-hidden>🛠️</span>Atelier
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={view === 'school'}
          aria-controls="diag-panel-school"
          id="diag-tab-school"
          onClick={() => setView('school')}
          className={`${basePill} ${view === 'school' ? activePill : idlePill}`}
        >
          <span className="mr-1" aria-hidden>🏫</span>École
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={view === 'client'}
          aria-controls="diag-panel-client"
          id="diag-tab-client"
          onClick={() => setView('client')}
          className={`${basePill} ${view === 'client' ? activePill : idlePill}`}
        >
          <span className="mr-1" aria-hidden>👤</span>Client
        </button>
      </div>

      <div
        id="diag-panel-workshop"
        role="tabpanel"
        aria-labelledby="diag-tab-workshop"
        hidden={view !== 'workshop'}
        className="space-y-3"
      >
        {view === 'workshop' && workshop}
      </div>

      <div
        id="diag-panel-school"
        role="tabpanel"
        aria-labelledby="diag-tab-school"
        hidden={view !== 'school'}
        className="space-y-3"
      >
        {view === 'school' && school}
      </div>

      <div
        id="diag-panel-client"
        role="tabpanel"
        aria-labelledby="diag-tab-client"
        hidden={view !== 'client'}
        className="space-y-3"
      >
        {view === 'client' && client}
      </div>
    </>
  )
}
