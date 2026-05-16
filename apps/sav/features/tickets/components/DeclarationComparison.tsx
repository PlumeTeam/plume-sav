'use client'

import { useState, type ReactNode } from 'react'

export interface ComparisonPanel {
  id:        string
  /** Titre complet — header de colonne en md+. */
  title:     string
  /** Libellé court pour l'onglet mobile. Défaut : `title`. */
  tabLabel?: string
  emoji?:    string
  content:   ReactNode
}

interface DeclarationComparisonProps {
  panels:          ComparisonPanel[]
  /** Panel actif par défaut sur mobile. Défaut : premier panel. Sans effet
   *  en md+ où toutes les colonnes sont affichées simultanément. */
  defaultPanelId?: string
}

/**
 * Vue comparative des déclarations d'un ticket SAV (client / école / atelier).
 *  - 0 panel  : rien.
 *  - 1 panel  : contenu rendu nu (ni onglet ni titre de colonne).
 *  - 2-3 panels : md+ → colonnes côte à côte (grid 2 ou 3) ; mobile → onglets.
 *
 * Partagée par les pages ticket école et atelier (cette dernière sert aussi
 * la vue Plume admin, qui n'a pas de page ticket dédiée).
 */
export function DeclarationComparison({ panels, defaultPanelId }: DeclarationComparisonProps) {
  const fallbackId = panels[0]?.id ?? ''
  const [tab, setTab] = useState<string>(
    defaultPanelId && panels.some((p) => p.id === defaultPanelId) ? defaultPanelId : fallbackId,
  )

  if (panels.length === 0) return null
  if (panels.length === 1) return <>{panels[0]!.content}</>

  const activeId = panels.some((p) => p.id === tab) ? tab : fallbackId
  const gridCols = panels.length >= 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'

  const baseBtn =
    'flex flex-1 items-center justify-center gap-1.5 rounded-2xl px-2 py-2.5 text-[13px] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/60'
  const activeBtn = 'bg-brand-gold text-brand-ink shadow-sm'
  const idleBtn =
    'border border-brand-stone bg-white text-slate-500 hover:text-brand-ink hover:border-brand-gold/40'

  return (
    <div className="space-y-3">
      {/* Sélecteur — mobile uniquement (md+ affiche toutes les colonnes). */}
      <div
        role="tablist"
        aria-label="Comparaison des déclarations"
        className="flex gap-1.5 rounded-2xl bg-brand-cream/60 p-1 ring-1 ring-brand-stone md:hidden"
      >
        {panels.map((p) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={p.id === activeId}
            onClick={() => setTab(p.id)}
            className={`${baseBtn} ${p.id === activeId ? activeBtn : idleBtn}`}
          >
            {p.emoji && <span aria-hidden>{p.emoji}</span>}
            <span>{p.tabLabel ?? p.title}</span>
          </button>
        ))}
      </div>

      <div className={`grid grid-cols-1 gap-4 md:items-start ${gridCols}`}>
        {panels.map((p) => (
          <section
            key={p.id}
            className={p.id === activeId ? 'space-y-3' : 'hidden space-y-3 md:block'}
          >
            <h3 className="hidden items-center gap-1.5 text-sm font-semibold text-brand-ink md:flex">
              {p.emoji && <span aria-hidden>{p.emoji}</span>}
              <span>{p.title}</span>
            </h3>
            {p.content}
          </section>
        ))}
      </div>
    </div>
  )
}
