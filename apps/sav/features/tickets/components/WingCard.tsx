'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useWizardStore } from '../store'
import { WarrantyTierBadge } from './WarrantyTierBadge'
import { REQUEST_TYPE_CONFIG } from '../types'
import type { RequestType } from '../types'
import { formatAge, formatDate, resolveWarrantyTierForDisplay } from '../utils'
import type { ClientWing } from '../queries'

interface WingCardProps {
  wing: ClientWing
}

const REQUEST_BUTTONS: Array<{ type: RequestType }> = [
  { type: 'repair' },
  { type: 'inspection' },
  { type: 'manufacturing_defect' },
]

export function WingCard({ wing }: WingCardProps) {
  const router = useRouter()
  const { reset, setWingInfo, setProblem } = useWizardStore()

  function handleCreateTicket(requestType: RequestType) {
    const modelName = (wing.product_model || '')
      .split('-')
      .filter(Boolean)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
    const purchaseDate = wing.registered_at
      ? new Date(wing.registered_at).toISOString().split('T')[0]!
      : ''
    reset()
    setWingInfo({
      wingBrand:    'Plume',
      wingModel:    modelName,
      wingSize:     wing.size ?? '',
      wingSerial:   wing.serial_number,
      wingColor:    wing.color_name ?? '',
      purchaseDate,
      flightHours:  '',
    })
    setProblem({
      referentSchoolId:       wing.partner_school_id ?? null,
      partnerSchoolId:        undefined,
      schoolChangeReasonCode: undefined,
      schoolChangeReasonNote: undefined,
    })
    router.push(`/client/new-ticket?type=${requestType}`)
  }

  const subtitle = [wing.size && `Taille ${wing.size}`, wing.color_name].filter(Boolean).join(' · ')

  // Pas de purchase_date dédié sur customer_wings — on prend la date
  // d'enregistrement comme meilleur proxy (c'est ce qui prefill le wizard).
  const warrantyTier = resolveWarrantyTierForDisplay(null, wing.registered_at)
  const age = formatAge(wing.registered_at)

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-brand-ink">{wing.product_label}</p>
          {subtitle && (
            <p className="mt-0.5 truncate text-xs text-slate-500">{subtitle}</p>
          )}
          <p className="mt-1 font-mono text-xs text-slate-400">{wing.serial_number}</p>
        </div>
        <WarrantyTierBadge tier={warrantyTier} size="sm" compact />
      </div>

      <p className="mt-3 text-xs text-slate-500">
        Achetée le <span className="font-medium text-brand-ink">{formatDate(wing.registered_at)}</span>
        {age && <span className="text-slate-400"> — {age}</span>}
      </p>

      <Link
        href={`/client/wings/${encodeURIComponent(wing.serial_number)}`}
        className="mt-4 block rounded-2xl border border-brand-stone bg-white py-2.5 text-center text-sm font-semibold text-brand-ink transition-colors hover:bg-brand-cream hover:border-brand-gold/40"
      >
        Carnet d&apos;entretien
      </Link>

      {/* 3 boutons SAV — un par type de demande */}
      <div className="mt-2 grid grid-cols-1 gap-2">
        {REQUEST_BUTTONS.map(({ type }) => {
          const cfg = REQUEST_TYPE_CONFIG[type]
          return (
            <button
              key={type}
              type="button"
              onClick={() => handleCreateTicket(type)}
              className="flex items-center gap-3 rounded-2xl border border-brand-stone bg-white px-3 py-2.5 text-left transition-all hover:-translate-y-0.5 hover:border-brand-gold/40 hover:bg-brand-gold/5 active:scale-[0.99]"
            >
              <span aria-hidden className="text-xl leading-none">{cfg.emoji}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-brand-ink">{cfg.label}</p>
                <p className="truncate text-xs text-slate-500">{cfg.description}</p>
              </div>
              <span aria-hidden className="text-slate-300">›</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
