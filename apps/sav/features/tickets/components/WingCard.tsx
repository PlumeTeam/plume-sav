'use client'

import { useRouter } from 'next/navigation'
import { useWizardStore } from '../store'
import type { ClientWing } from '../queries'

interface WingCardProps {
  wing: ClientWing
}

export function WingCard({ wing }: WingCardProps) {
  const router = useRouter()
  const { reset, setWingInfo, setProblem } = useWizardStore()

  function handleCreateTicket() {
    const modelName = (wing.product_model || '')
      .split('-')
      .filter(Boolean)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
    // Prefill purchase date from registration date (best-effort; client can edit)
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
    // Seed the referent school from the wing so StepSchool can default to
    // "Envoi à votre école" instead of dropping the user on the map.
    // StepWingInfo doesn't re-fire its own selectWing() when the wing is
    // already auto-selected via wingInfo.wingSerial, so this is the only
    // place this gets set on the WingCard → wizard path.
    setProblem({
      referentSchoolId:       wing.partner_school_id ?? null,
      partnerSchoolId:        undefined,
      schoolChangeReasonCode: undefined,
      schoolChangeReasonNote: undefined,
    })
    router.push('/client/new-ticket')
  }

  const year = new Date(wing.registered_at).getFullYear()
  const subtitle = [wing.size && `Taille ${wing.size}`, wing.color_name].filter(Boolean).join(' · ')

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
        <span className="shrink-0 rounded-full bg-brand-cream px-2.5 py-1 text-[11px] font-semibold text-brand-navy ring-1 ring-brand-stone">
          {year}
        </span>
      </div>
      <button
        type="button"
        onClick={handleCreateTicket}
        className="mt-4 w-full rounded-2xl border border-brand-stone bg-brand-cream py-2.5 text-sm font-semibold text-brand-ink transition-colors hover:bg-brand-gold/10 hover:border-brand-gold/40"
      >
        Envoyer une demande SAV
      </button>
    </div>
  )
}
