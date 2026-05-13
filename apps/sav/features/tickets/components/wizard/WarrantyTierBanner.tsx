'use client'

import type { PlumeSettings } from '../../queries'
import type { WarrantyTier } from '../../types'
import { computeWarrantyTier } from '../../utils'
import { useWizardStore } from '../../store'
import { WarrantyTierBadge } from '../WarrantyTierBadge'

/**
 * Banner d'info "tier de garantie" affiché en haut des étapes du wizard
 * client, à partir de la sélection de l'aile. Le tier est calculé en
 * preview côté client à partir de la date d'achat + plume_settings —
 * le quota SAV (max_sav_claims_*) ne peut pas être pris en compte ici
 * sans appel DB, on assume `previousClaimCount = 0` pour le preview.
 * Le serveur recalculera la valeur définitive à la création (cf.
 * createTicketAction → computeWarrantyTier avec countPreviousSavClaims).
 */
export function WarrantyTierBanner({ policy }: { policy: PlumeSettings }) {
  const { wingInfo } = useWizardStore()
  if (!wingInfo.purchaseDate) return null

  const { tier } = computeWarrantyTier({
    purchaseDate:          wingInfo.purchaseDate,
    previousClaimCount:    0,
    warrantyStandardYears: policy.warrantyStandardYears,
    warrantyExtendedYears: policy.warrantyExtendedYears,
    maxSavClaimsStandard:  policy.maxSavClaimsStandard,
    maxSavClaimsExtended:  policy.maxSavClaimsExtended,
  })

  // Standard = couverture totale → pas de message. On affiche juste le
  // badge dans les étapes qui l'utilisent ailleurs.
  if (tier === 'standard' || tier === 'plume_override') {
    return (
      <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl bg-emerald-50 px-4 py-3 ring-1 ring-emerald-200">
        <span className="text-sm font-medium text-emerald-900">
          Votre aile est sous garantie Plume — tout est pris en charge.
        </span>
        <WarrantyTierBadge tier={tier} size="sm" compact />
      </div>
    )
  }

  if (tier === 'extended') {
    return (
      <ExtendedBanner tier={tier} />
    )
  }

  return <OutOfWarrantyBanner tier={tier} />
}

function ExtendedBanner({ tier }: { tier: WarrantyTier }) {
  return (
    <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-amber-900">
          Garantie étendue
        </p>
        <WarrantyTierBadge tier={tier} size="sm" compact />
      </div>
      <p className="mt-1 text-xs leading-relaxed text-amber-800/90">
        Votre aile est encore sous garantie étendue. Le transport <strong>client → école</strong>
        {' '}est à votre charge — Plume prend en charge la suite sous conditions
        (cf. politique de garantie).
      </p>
    </div>
  )
}

function OutOfWarrantyBanner({ tier }: { tier: WarrantyTier }) {
  return (
    <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-red-900">
          Votre aile n&apos;est plus sous garantie
        </p>
        <WarrantyTierBadge tier={tier} size="sm" compact />
      </div>
      <p className="mt-1 text-xs leading-relaxed text-red-800/90">
        <strong>Le transport et la réparation sont à votre charge.</strong> Vous pouvez
        toujours envoyer votre aile à votre école, qui la transmettra à un atelier
        partenaire pour un devis.
      </p>
    </div>
  )
}
