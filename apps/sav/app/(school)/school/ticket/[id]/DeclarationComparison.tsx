'use client'

import { useState, type ReactNode } from 'react'

interface DeclarationComparisonProps {
  clientPanel: ReactNode
  schoolPanel: ReactNode
}

/**
 * Vue comparative de l'onglet « Déclaration » côté école : déclaration du
 * client vs état des lieux de l'école. En md+ les deux panneaux sont affichés
 * côte à côte (grid 2 colonnes) ; sur mobile un sélecteur bascule entre les
 * deux. Le sélecteur est masqué en md+, les titres de colonne masqués sur
 * mobile (le sélecteur fait office de titre).
 */
export function DeclarationComparison({ clientPanel, schoolPanel }: DeclarationComparisonProps) {
  const [tab, setTab] = useState<'client' | 'school'>('client')

  const baseBtn =
    'flex flex-1 items-center justify-center gap-1.5 rounded-2xl px-2 py-2.5 text-[13px] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/60'
  const activeBtn = 'bg-brand-gold text-brand-ink shadow-sm'
  const idleBtn =
    'border border-brand-stone bg-white text-slate-500 hover:text-brand-ink hover:border-brand-gold/40'

  return (
    <div className="space-y-3">
      {/* Sélecteur — mobile uniquement (md+ affiche les 2 colonnes). */}
      <div
        role="tablist"
        aria-label="Comparaison des déclarations"
        className="flex gap-1.5 rounded-2xl bg-brand-cream/60 p-1 ring-1 ring-brand-stone md:hidden"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'client'}
          onClick={() => setTab('client')}
          className={`${baseBtn} ${tab === 'client' ? activeBtn : idleBtn}`}
        >
          <span aria-hidden>📝</span>
          <span>Déclaration client</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'school'}
          onClick={() => setTab('school')}
          className={`${baseBtn} ${tab === 'school' ? activeBtn : idleBtn}`}
        >
          <span aria-hidden>🔍</span>
          <span>État des lieux école</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:items-start">
        <section className={tab === 'client' ? 'space-y-3' : 'hidden space-y-3 md:block'}>
          <h3 className="hidden items-center gap-1.5 text-sm font-semibold text-brand-ink md:flex">
            <span aria-hidden>📝</span> Déclaration client
          </h3>
          {clientPanel}
        </section>
        <section className={tab === 'school' ? 'space-y-3' : 'hidden space-y-3 md:block'}>
          <h3 className="hidden items-center gap-1.5 text-sm font-semibold text-brand-ink md:flex">
            <span aria-hidden>🔍</span> État des lieux école
          </h3>
          {schoolPanel}
        </section>
      </div>
    </div>
  )
}
