import Link from 'next/link'
import { getPreCheckFeeEur } from '@/features/settings/queries'
import { PreCheckFeeForm } from './PreCheckFeeForm'

export const dynamic = 'force-dynamic'

export default async function PlumeSettingsPage() {
  const currentFee = await getPreCheckFeeEur()

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-gold">Plume HQ</p>
          <h1 className="mt-0.5 font-display text-2xl font-bold text-brand-ink">Réglages SAV</h1>
        </div>
        <Link href="/plume" className="btn-secondary text-xs px-4 py-2">← Dashboard</Link>
      </header>

      <section className="card p-5">
        <h2 className="section-title mb-1">Pré-check atelier</h2>
        <p className="mb-4 text-sm text-slate-600">
          Tarif fixe (€) facturé à Plume pour un pré-check (~1h) quand l&apos;atelier
          n&apos;a pas pu trancher à la simple réception de l&apos;aile. Le tarif est
          figé sur le ticket au moment de la clôture du pré-check, donc une modif
          ici n&apos;affecte pas les tickets déjà traités.
        </p>
        <PreCheckFeeForm currentFee={currentFee} />
      </section>
    </main>
  )
}
