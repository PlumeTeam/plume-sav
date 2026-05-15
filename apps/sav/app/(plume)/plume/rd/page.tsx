import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function PlumeRDPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-gold">
          Plume HQ
        </p>
        <h1 className="font-display text-3xl font-bold text-brand-ink">Données R&amp;D</h1>
        <p className="text-sm text-slate-500">
          Analyse du vieillissement des ailes — fonctionnalité en développement.
        </p>
      </header>

      <section className="rounded-3xl border border-dashed border-brand-stone bg-brand-cream/40 p-8">
        <div className="space-y-4 text-sm leading-relaxed text-brand-ink">
          <div className="flex items-start gap-3">
            <span aria-hidden className="text-3xl">🔬</span>
            <div>
              <p className="text-base font-semibold">En construction</p>
              <p className="mt-1 text-sm text-slate-600">
                Cette section agrégera les données de porosité, résistance et
                défauts par modèle et par ancienneté, alimentées par les
                checklists école et atelier de chaque ticket SAV.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-3">
            <PlaceholderTile
              emoji="📈"
              title="Porosité par modèle"
              description="Évolution de la porosité moyenne en fonction de l'âge de l'aile."
            />
            <PlaceholderTile
              emoji="🪡"
              title="Défauts récurrents"
              description="Fréquence des déchirures, suspentes & élévateurs par modèle."
            />
            <PlaceholderTile
              emoji="⏳"
              title="Vieillissement"
              description="Distribution des cas SAV par ancienneté de l'aile."
            />
          </div>
        </div>
      </section>

      <div className="text-center">
        <Link href="/plume" className="btn-secondary inline-flex">
          ← Retour au dashboard
        </Link>
      </div>
    </main>
  )
}

function PlaceholderTile({
  emoji,
  title,
  description,
}: {
  emoji: string
  title: string
  description: string
}) {
  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-brand-stone">
      <p className="text-2xl" aria-hidden>{emoji}</p>
      <p className="mt-2 text-sm font-semibold text-brand-ink">{title}</p>
      <p className="mt-1 text-xs text-slate-500">{description}</p>
    </div>
  )
}
