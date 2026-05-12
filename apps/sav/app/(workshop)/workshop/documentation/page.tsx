import Link from 'next/link'

export const dynamic = 'force-static'

export default function WorkshopDocumentationPage() {
  return (
    <main className="space-y-4 px-4 py-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-brand-ink">Documentation Plume</h1>
          <p className="mt-1 text-sm text-slate-500">
            Ressources techniques : plans, spécifications et manuels de réparation.
          </p>
        </div>
        <Link
          href="/workshop"
          className="rounded-xl border border-brand-stone bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-brand-gold/40 hover:text-brand-ink"
        >
          ← Tickets
        </Link>
      </header>

      <div className="card border-dashed px-4 py-12 text-center">
        <p className="text-4xl" aria-hidden>📚</p>
        <p className="mt-4 text-base font-semibold text-brand-ink">Contenu à venir</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
          Cette section accueillera bientôt les plans, fiches techniques et procédures
          de réparation officielles fournies par Plume Paragliders.
        </p>
      </div>
    </main>
  )
}
