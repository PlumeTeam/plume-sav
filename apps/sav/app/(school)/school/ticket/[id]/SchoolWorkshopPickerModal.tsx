'use client'

import { useState, useTransition } from 'react'
import dynamic from 'next/dynamic'
import { assignWorkshopForCommunicationAction } from '@/features/tickets/actions'
import type { PartnerWorkshop } from '@/features/tickets/constants'

// Leaflet ne doit pas tourner côté serveur (accès window/document).
const WorkshopMapPicker = dynamic(
  () => import('@/features/tickets/components/WorkshopMapPicker'),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[280px] items-center justify-center rounded-2xl bg-brand-cream text-sm text-slate-400">
        Chargement de la carte…
      </div>
    ),
  }
)

interface SchoolWorkshopPickerModalProps {
  open:               boolean
  onClose:            () => void
  ticketId:           string
  workshops:          PartnerWorkshop[]
  /** Atelier déjà assigné — présélectionné dans le picker. */
  currentWorkshopId:  string | null
}

/**
 * Modal "Choix de l'atelier" (étape 5 du parcours école).
 *
 * Réutilisée pour la sélection initiale ET le changement d'atelier après un
 * refus. assignWorkshopForCommunicationAction remet `workshop_accepted` à NULL
 * côté serveur — le nouvel atelier doit donc re-valider la demande.
 */
export function SchoolWorkshopPickerModal({
  open,
  onClose,
  ticketId,
  workshops,
  currentWorkshopId,
}: SchoolWorkshopPickerModalProps) {
  const [pickedId, setPickedId] = useState<string>(currentWorkshopId ?? '')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  function handleSubmit() {
    setError(null)
    const ws = workshops.find((w) => w.id === pickedId)
    if (!ws) {
      setError('Sélectionnez un atelier.')
      return
    }
    startTransition(async () => {
      const fd = new FormData()
      fd.set('ticketId',      ticketId)
      fd.set('workshopId',    ws.id)
      fd.set('workshopLabel', ws.label)
      const r = await assignWorkshopForCommunicationAction(fd)
      if (r && 'error' in r && r.error) {
        const err = r.error as Record<string, string[] | undefined>
        setError(err._form?.[0] ?? err.workshopId?.[0] ?? "Erreur lors de l'assignation.")
        return
      }
      onClose()
    })
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="workshop-picker-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-xl sm:rounded-3xl">
        <div className="flex items-start justify-between gap-3 border-b border-brand-stone px-5 py-4">
          <div>
            <h2 id="workshop-picker-title" className="text-base font-semibold text-brand-ink">
              🛠️ Choix de l&apos;atelier
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Sélectionnez l&apos;atelier partenaire qui prendra en charge l&apos;aile.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-brand-cream hover:text-brand-ink"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3 overflow-y-auto px-5 py-4">
          <WorkshopMapPicker
            workshops={workshops}
            selectedId={pickedId || null}
            onSelect={setPickedId}
          />

          <div className="space-y-2">
            {workshops.map((w) => {
              const isSelected = pickedId === w.id
              return (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => setPickedId(w.id)}
                  className={`flex w-full items-start gap-3 rounded-xl border-2 p-3 text-left transition-all active:scale-[0.99] ${
                    isSelected
                      ? 'border-brand-gold bg-brand-gold/10 shadow-plume'
                      : 'border-brand-stone bg-white hover:border-brand-gold/40'
                  }`}
                >
                  <span aria-hidden className="text-2xl">🛠️</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-brand-ink">{w.label}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {[w.city, w.region].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  {isSelected && <span className="text-lg text-brand-gold" aria-hidden>✓</span>}
                </button>
              )
            })}
          </div>

          {error && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}
        </div>

        <div className="border-t border-brand-stone px-5 py-4">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending || !pickedId}
            className="btn-primary w-full"
          >
            {isPending ? 'Assignation…' : "Assigner cet atelier"}
          </button>
        </div>
      </div>
    </div>
  )
}
