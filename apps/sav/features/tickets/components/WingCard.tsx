'use client'

import { useRouter } from 'next/navigation'
import { useWizardStore } from '../store'
import type { ClientWing } from '../queries'

interface WingCardProps {
  wing: ClientWing
}

export function WingCard({ wing }: WingCardProps) {
  const router = useRouter()
  const { reset, setWingInfo } = useWizardStore()

  function handleCreateTicket() {
    const modelName = wing.product_model
      .split('-')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
    reset()
    setWingInfo({
      wingBrand:   'Plume',
      wingModel:   modelName,
      wingSize:    wing.size   ?? '',
      wingSerial:  wing.serial_number,
      wingColor:   wing.color_name ?? '',
      purchaseDate: '',
      flightHours:  '',
    })
    router.push('/client/new-ticket')
  }

  const year = new Date(wing.registered_at).getFullYear()
  const subtitle = [wing.size && `Taille ${wing.size}`, wing.color_name].filter(Boolean).join(' · ')

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-slate-900">{wing.product_label}</p>
          {subtitle && (
            <p className="mt-0.5 truncate text-xs text-slate-500">{subtitle}</p>
          )}
          <p className="mt-1 font-mono text-xs text-slate-400">{wing.serial_number}</p>
        </div>
        <span className="shrink-0 rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-500">
          {year}
        </span>
      </div>
      <button
        type="button"
        onClick={handleCreateTicket}
        className="mt-3 w-full rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 active:bg-slate-100"
      >
        Créer un ticket SAV
      </button>
    </div>
  )
}
