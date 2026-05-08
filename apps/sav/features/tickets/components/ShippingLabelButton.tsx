'use client'

import { useState, useTransition } from 'react'
import { generateSavShippingLabelAction } from '../actions'
import type { ClientShippingAddress, ShipmentLeg, WorkshopReturnDestination } from '../types'

// ─────────────────────────────────────────────────────────────────────────────
// Bouton "Générer mon bon de transport" — réutilisé sur les 3 legs.
//
// Comportements :
//  - Si `initialLabelUrl` est non-null → affiche directement le lien de
//    téléchargement + le numéro de tracking (état "déjà généré").
//  - Sinon : bouton primaire qui appelle l'action ; selon le retour :
//      * `needsAddress` → déplie un formulaire inline (rue/CP/ville/pays)
//        et ré-appelle l'action après soumission. Concerne `client_to_school`.
//      * `pendingAdminApproval` → affiche un message "en attente Plume".
//        Concerne `client_to_school` quand l'utilisateur a déjà ≥ 2 SAV.
//      * `error` → affiche le message en rouge.
//      * `ok` → affiche le lien de téléchargement.
// ─────────────────────────────────────────────────────────────────────────────

interface ShippingLabelButtonProps {
  ticketId:                  string
  leg:                       ShipmentLeg
  /** Étiquette précédemment générée — le composant l'affiche directement si présente. */
  initialTracking:           string | null
  initialLabelUrl:           string | null
  /** Adresse déjà capturée (client_to_school uniquement). Skip le formulaire si présente. */
  initialAddress?:           ClientShippingAddress | null
  /** false ⇒ approbation admin en attente — composant affiche le placeholder dédié. */
  autoApproved?:             boolean
  /** Destination par défaut pour workshop_to_return. */
  defaultReturnDestination?: WorkshopReturnDestination | null
  /** Texte du bouton primaire. Défaut adapté au leg. */
  triggerLabel?:             string
  /** Sous-titre explicatif sous le bouton. */
  hint?:                     string
}

const DEFAULT_TRIGGER_LABEL: Record<ShipmentLeg, string> = {
  client_to_school:   'Générer mon bon de transport',
  school_to_workshop: "Générer le bon école → atelier",
  workshop_to_return: 'Générer le bon de transport retour',
}

export function ShippingLabelButton({
  ticketId,
  leg,
  initialTracking,
  initialLabelUrl,
  initialAddress = null,
  autoApproved = true,
  defaultReturnDestination = null,
  triggerLabel,
  hint,
}: ShippingLabelButtonProps) {
  const [isPending, startTransition] = useTransition()
  const [tracking,  setTracking]  = useState<string | null>(initialTracking)
  const [labelUrl,  setLabelUrl]  = useState<string | null>(initialLabelUrl)
  const [address,   setAddress]   = useState<ClientShippingAddress | null>(initialAddress)

  const [showAddressForm, setShowAddressForm] = useState(false)
  const [pendingApproval, setPendingApproval] = useState(!autoApproved && !initialLabelUrl)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Form fields (shown when needsAddress)
  const [street,     setStreet]     = useState(address?.street     ?? '')
  const [postalCode, setPostalCode] = useState(address?.postalCode ?? '')
  const [city,       setCity]       = useState(address?.city       ?? '')
  const [country,    setCountry]    = useState(address?.country    ?? 'FR')

  const [returnDest, setReturnDest] = useState<WorkshopReturnDestination>(
    defaultReturnDestination ?? 'school'
  )

  function buildFormData(opts: { withAddress?: boolean } = {}): FormData {
    const fd = new FormData()
    fd.set('ticketId', ticketId)
    fd.set('leg', leg)
    if (leg === 'workshop_to_return') {
      fd.set('returnDestination', returnDest)
    }
    if (opts.withAddress && leg === 'client_to_school') {
      fd.set('address', JSON.stringify({ street, postalCode, city, country }))
    }
    return fd
  }

  async function handleGenerate(opts: { withAddress?: boolean } = {}) {
    setErrorMsg(null)
    startTransition(async () => {
      const r = await generateSavShippingLabelAction(buildFormData(opts))

      if ('error' in r) {
        const formErrors = (r.error as { _form?: string[] })._form
        setErrorMsg(formErrors?.[0] ?? "Erreur lors de la génération")
        return
      }

      if ('needsAddress' in r) {
        setShowAddressForm(true)
        return
      }

      if ('pendingAdminApproval' in r) {
        setPendingApproval(true)
        setShowAddressForm(false)
        return
      }

      // Success
      setTracking(r.trackingNumber)
      setLabelUrl(r.labelUrl)
      if (r.address) setAddress(r.address)
      setShowAddressForm(false)
      setPendingApproval(false)
    })
  }

  // ── État final : étiquette déjà générée ──────────────────────────────────
  if (tracking && labelUrl) {
    return (
      <div className="rounded-card border border-emerald-200 bg-emerald-50/50 p-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-emerald-900">
          <span aria-hidden>📦</span>
          Bon de transport généré
        </p>
        <p className="mt-1 break-all font-mono text-xs text-emerald-800/80">
          Tracking&nbsp;: {tracking}
        </p>
        <a
          href={labelUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary mt-3 inline-flex w-full items-center justify-center gap-2 sm:w-auto"
        >
          ⬇ Télécharger l&apos;étiquette
        </a>
      </div>
    )
  }

  // ── État : en attente de validation admin Plume (anti-abus) ──────────────
  if (pendingApproval) {
    return (
      <div className="rounded-card border border-amber-200 bg-amber-50 p-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-amber-900">
          <span aria-hidden>⏳</span>
          En attente de validation Plume
        </p>
        <p className="mt-1 text-xs text-amber-800/80">
          Vous avez déjà créé un SAV cette année — l&apos;équipe Plume valide votre demande
          avant que le bon de transport ne soit généré. Vous serez prévenu par email.
        </p>
      </div>
    )
  }

  // ── Formulaire adresse (client_to_school first time) ─────────────────────
  if (showAddressForm) {
    const canSubmit =
      street.trim().length >= 3 &&
      postalCode.trim().length >= 2 &&
      city.trim().length >= 1 &&
      country.trim().length === 2

    return (
      <form
        onSubmit={(e) => { e.preventDefault(); if (canSubmit) handleGenerate({ withAddress: true }) }}
        className="space-y-3 rounded-card border border-brand-stone bg-brand-cream/50 p-4"
      >
        <p className="text-sm font-semibold text-brand-ink">
          📮 Confirmez votre adresse de retrait
        </p>
        <p className="text-xs text-slate-600">
          GLS viendra chercher votre aile à cette adresse. Elle sera enregistrée pour
          les éventuels renvois.
        </p>

        <div>
          <label className="mb-1 block text-xs text-slate-500">Rue + numéro</label>
          <input
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            className="field-input"
            placeholder="12 rue des Aiglons"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs text-slate-500">Code postal</label>
            <input
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              className="field-input"
              placeholder="74000"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">Ville</label>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="field-input"
              placeholder="Annecy"
              required
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs text-slate-500">Pays (ISO-2)</label>
          <input
            value={country}
            onChange={(e) => setCountry(e.target.value.toUpperCase().slice(0, 2))}
            className="field-input uppercase"
            placeholder="FR"
            maxLength={2}
            required
          />
        </div>

        {errorMsg && (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{errorMsg}</p>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => { setShowAddressForm(false); setErrorMsg(null) }}
            className="btn-secondary flex-1"
            disabled={isPending}
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={!canSubmit || isPending}
            className="btn-primary flex-1"
          >
            {isPending ? 'Génération…' : 'Confirmer et générer'}
          </button>
        </div>
      </form>
    )
  }

  // ── État initial : bouton primaire ───────────────────────────────────────
  const label = triggerLabel ?? DEFAULT_TRIGGER_LABEL[leg]

  return (
    <div className="space-y-2">
      {leg === 'workshop_to_return' && (
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="text-slate-500">Destination&nbsp;:</span>
          <label className="flex items-center gap-1.5">
            <input
              type="radio"
              name={`return-dest-${ticketId}`}
              value="school"
              checked={returnDest === 'school'}
              onChange={() => setReturnDest('school')}
              className="h-3.5 w-3.5 accent-brand-gold"
            />
            <span>École partenaire</span>
          </label>
          <label className="flex items-center gap-1.5">
            <input
              type="radio"
              name={`return-dest-${ticketId}`}
              value="client"
              checked={returnDest === 'client'}
              onChange={() => setReturnDest('client')}
              className="h-3.5 w-3.5 accent-brand-gold"
            />
            <span>Client direct</span>
          </label>
        </div>
      )}

      <button
        type="button"
        onClick={() => handleGenerate()}
        disabled={isPending}
        className="btn-primary inline-flex w-full items-center justify-center gap-2 sm:w-auto"
      >
        {isPending ? 'Génération…' : `📦 ${label}`}
      </button>

      {hint && <p className="text-xs text-slate-500">{hint}</p>}

      {errorMsg && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{errorMsg}</p>
      )}
    </div>
  )
}
