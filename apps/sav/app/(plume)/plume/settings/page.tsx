import Link from 'next/link'
import { getPlumeSettings } from '@/features/tickets/queries'
import { PreCheckFeeForm } from './PreCheckFeeForm'
import { WarrantyPolicyForm } from './WarrantyPolicyForm'

export const dynamic = 'force-dynamic'

export default async function PlumeSettingsPage() {
  const settings = await getPlumeSettings()

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
        <PreCheckFeeForm currentFee={settings.preCheckFeeEur} />
      </section>

      <section className="card p-5">
        <h2 className="section-title mb-1">Politique de garantie</h2>
        <p className="mb-4 text-sm text-slate-600">
          Durées, quotas SAV, plafonds réparation et éléments couverts par la
          garantie étendue. Le tier (standard / étendue / hors garantie) est
          calculé automatiquement à la création d&apos;un ticket et figé dessus —
          modifier ces paramètres n&apos;affecte que les tickets créés ensuite.
        </p>
        <WarrantyPolicyForm
          initial={{
            warrantyStandardYears:        settings.warrantyStandardYears,
            warrantyExtendedYears:        settings.warrantyExtendedYears,
            maxSavClaimsStandard:         settings.maxSavClaimsStandard,
            maxSavClaimsExtended:         settings.maxSavClaimsExtended,
            repairThresholdStandardEur:   settings.repairReplacementThresholdEur,
            repairThresholdExtendedEur:   settings.repairThresholdExtendedEur,
            extendedCoversPreCheck:                settings.extendedCoversPreCheck,
            extendedCoversSchoolWorkshopShipping:  settings.extendedCoversSchoolWorkshopShipping,
            extendedCoversRepair:                  settings.extendedCoversRepair,
            extendedCoversReplacement:             settings.extendedCoversReplacement,
          }}
        />
      </section>
    </main>
  )
}
