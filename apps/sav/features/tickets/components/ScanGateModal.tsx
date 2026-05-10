'use client'

import { useEffect, useState } from 'react'
import { QRCameraScanner } from './QRCameraScanner'

type ScanState =
  | { status: 'idle' }
  | { status: 'scanning' }                                          // caméra ouverte
  | { status: 'manual-warning' }                                    // avertissement avant manuel
  | { status: 'manual-step1'; reason: string }                      // saisie + raison
  | { status: 'manual-step2'; reason: string; serial1: string }     // re-saisie
  | { status: 'mismatch'; scanned: string; method: 'camera' | 'manual' }

interface ScanGateModalProps {
  open:           boolean
  onClose:        () => void
  /** Lancé quand l'aile est confirmée scannée. La méthode renseigne le futur audit log wing_scans. */
  onScanSuccess:  (method: 'camera' | 'demo' | 'manual') => void
  /** Numéro de série attendu (pour vérification anti-erreur). Si null, accepte tout scan. */
  expectedSerial: string | null
  /** Titre contextualisé (ex: "Réception du colis", "Avant le check", "Bon d'envoi atelier"). */
  title:          string
  /** Sous-titre court qui explique pourquoi le scan est requis. */
  subtitle:       string
}

const MANUAL_REASONS = [
  { value: 'qr_damaged', label: 'QR code abîmé / illisible' },
  { value: 'qr_missing', label: 'QR code manquant ou décousu' },
  { value: 'pre_flashcode', label: 'Aile pré-flashcode (avant 2026)' },
  { value: 'no_camera', label: 'Pas de caméra disponible' },
] as const

/**
 * Modale de scan flashcode bloquante avant une action (école / atelier / Plume HQ).
 *
 * Module Traçabilité Flashcode v2 — caméra réelle + friction manuelle.
 * Le scan caméra (html5-qrcode) est le chemin par défaut. Le fallback manuel
 * impose une raison + double saisie pour éviter qu'on contourne le scan
 * automatiquement.
 *
 * Étapes suivantes (PR à venir) :
 *  - Persister chaque scan dans la table wing_scans (Supabase) avec le couple
 *    (role, type) approprié — ex: ('school', 'reception')
 *  - Logger la raison du fallback manuel pour suivi qualité
 *  - Mode démo gaté par NEXT_PUBLIC_VERCEL_ENV !== 'production'
 */
export function ScanGateModal({
  open,
  onClose,
  onScanSuccess,
  expectedSerial,
  title,
  subtitle,
}: ScanGateModalProps) {
  const [state, setState] = useState<ScanState>({ status: 'idle' })

  // Reset à chaque ouverture
  useEffect(() => {
    if (open) setState({ status: 'idle' })
  }, [open])

  if (!open) return null

  function checkSerial(scanned: string, method: 'camera' | 'manual'): 'ok' | 'mismatch' {
    if (!expectedSerial) return 'ok'
    return scanned.trim().toUpperCase() === expectedSerial.trim().toUpperCase() ? 'ok' : 'mismatch'
  }

  function handleCameraDecode(decodedText: string) {
    if (checkSerial(decodedText, 'camera') === 'ok') {
      onScanSuccess('camera')
    } else {
      setState({ status: 'mismatch', scanned: decodedText, method: 'camera' })
    }
  }

  function runDemoScan() {
    // Mode démo : pas de vérif serial, succès direct
    onScanSuccess('demo')
  }

  function handleManualConfirm(serial2: string, serial1: string) {
    if (serial1.trim().toUpperCase() !== serial2.trim().toUpperCase()) {
      setState({ status: 'mismatch', scanned: serial2, method: 'manual' })
      return
    }
    if (checkSerial(serial1, 'manual') === 'ok') {
      onScanSuccess('manual')
    } else {
      setState({ status: 'mismatch', scanned: serial1, method: 'manual' })
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-base font-semibold text-brand-ink">📷 {title}</p>
            <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        {state.status === 'scanning' && (
          <QRCameraScanner
            onDecode={handleCameraDecode}
            onCancel={() => setState({ status: 'idle' })}
          />
        )}

        {state.status === 'manual-warning' && (
          <div>
            <div className="rounded-lg border-l-4 border-amber-400 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              ⚠️ Le scan caméra est plus rapide et plus fiable. Continuez en saisie manuelle uniquement si le QR n&apos;est vraiment pas utilisable.
            </div>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => setState({ status: 'idle' })}
                className="flex-1 rounded-xl bg-brand-gold px-4 py-2.5 text-sm font-semibold text-white shadow-plume"
              >
                ← Revenir au scan caméra
              </button>
              <button
                type="button"
                onClick={() => setState({ status: 'manual-step1', reason: '' })}
                className="rounded-xl border-2 border-amber-300 bg-white px-4 py-2.5 text-sm font-medium text-amber-900"
              >
                Continuer en manuel
              </button>
            </div>
          </div>
        )}

        {state.status === 'manual-step1' && (
          <ManualStep1
            initialReason={state.reason}
            onSubmit={(serial, reason) => setState({ status: 'manual-step2', reason, serial1: serial })}
            onBack={() => setState({ status: 'idle' })}
          />
        )}

        {state.status === 'manual-step2' && (
          <ManualStep2
            firstSerial={state.serial1}
            onConfirm={(s2) => handleManualConfirm(s2, state.serial1)}
            onBack={() => setState({ status: 'manual-step1', reason: state.reason })}
          />
        )}

        {state.status === 'mismatch' && (
          <div>
            <div className="rounded-lg border-l-4 border-red-400 bg-red-50 px-3 py-2 text-xs text-red-800">
              ⚠️ Serial scanné <code className="font-mono">{state.scanned}</code>
              {state.method === 'manual' ? ' — la double saisie ne correspond pas, ou' : ''} ne correspond pas au serial du ticket
              {expectedSerial && (
                <> (<code className="font-mono">{expectedSerial}</code>)</>
              )}.
              <br />Vérifiez que vous traitez bien la bonne aile pour ce ticket.
            </div>
            <button
              type="button"
              onClick={() => setState({ status: 'idle' })}
              className="mt-3 w-full rounded-xl bg-brand-gold px-4 py-2.5 text-sm font-semibold text-white shadow-plume"
            >
              Recommencer
            </button>
          </div>
        )}

        {state.status === 'idle' && (
          <>
            {expectedSerial && (
              <p className="mb-3 rounded-lg bg-brand-cream px-3 py-2 text-xs text-slate-600">
                💡 Aile attendue pour ce ticket — le scan vérifie automatiquement la correspondance.
              </p>
            )}
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setState({ status: 'scanning' })}
                className="w-full rounded-xl bg-brand-gold px-4 py-3 text-sm font-semibold text-white shadow-plume"
              >
                📷 Activer la caméra
              </button>
              <button
                type="button"
                onClick={runDemoScan}
                className="w-full rounded-xl border-2 border-dashed border-amber-400 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-800"
              >
                🧪 Test sans flashcode <span className="font-normal opacity-70">(mode démo)</span>
              </button>
              <button
                type="button"
                onClick={() => setState({ status: 'manual-warning' })}
                className="w-full rounded-xl bg-transparent px-4 py-2 text-xs font-medium text-slate-500 underline-offset-4 hover:text-slate-700 hover:underline"
              >
                QR illisible ? Saisir le n° de série manuellement
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Sous-composants pour les étapes manuelles (besoin de useState local)
// ─────────────────────────────────────────────────────────────────────────────

interface ManualStep1Props {
  initialReason: string
  onSubmit:      (serial: string, reason: string) => void
  onBack:        () => void
}

function ManualStep1({ initialReason, onSubmit, onBack }: ManualStep1Props) {
  const [reason, setReason] = useState(initialReason)
  const [serial, setSerial] = useState('')

  const canSubmit = reason !== '' && serial.trim().length >= 6

  return (
    <div>
      <p className="text-sm font-semibold text-brand-ink">Saisie manuelle — étape 1/2</p>
      <p className="mt-1 text-xs text-slate-500">
        Raison du fallback manuel + saisie du n° de série, puis confirmation à l&apos;étape suivante.
      </p>

      <label className="mt-3 block text-xs font-semibold text-brand-ink">
        Pourquoi pas le scan caméra ?
        <select
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="mt-1 w-full rounded-xl border-2 border-brand-stone bg-white p-2.5 text-sm outline-none focus:border-brand-gold"
        >
          <option value="">— Sélectionner une raison —</option>
          {MANUAL_REASONS.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </label>

      <label className="mt-3 block text-xs font-semibold text-brand-ink">
        N° de série gravé sur la plaque
        <input
          type="text"
          autoFocus
          autoComplete="off"
          spellCheck={false}
          value={serial}
          onChange={(e) => setSerial(e.target.value)}
          placeholder="PLM-XXXX-YYYY-NNNNN"
          className="mt-1 w-full rounded-xl border-2 border-brand-stone bg-white p-3 font-mono text-sm uppercase tracking-wide outline-none focus:border-brand-gold"
        />
      </label>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => onSubmit(serial, reason)}
          disabled={!canSubmit}
          className="flex-1 rounded-xl bg-brand-gold px-4 py-2.5 text-sm font-semibold text-white shadow-plume disabled:cursor-not-allowed disabled:opacity-50"
        >
          Continuer →
        </button>
        <button
          type="button"
          onClick={onBack}
          className="rounded-xl border-2 border-brand-stone bg-white px-4 py-2.5 text-sm font-medium text-brand-ink"
        >
          Annuler
        </button>
      </div>
    </div>
  )
}

interface ManualStep2Props {
  firstSerial: string
  onConfirm:   (serial2: string) => void
  onBack:      () => void
}

function ManualStep2({ firstSerial, onConfirm, onBack }: ManualStep2Props) {
  const [serial2, setSerial2] = useState('')
  const matches = serial2.trim().toUpperCase() === firstSerial.trim().toUpperCase()

  return (
    <div>
      <p className="text-sm font-semibold text-brand-ink">Saisie manuelle — étape 2/2</p>
      <p className="mt-1 text-xs text-slate-500">
        Re-saisissez le même n° à la main pour confirmer (le copier-coller est désactivé).
      </p>

      <label className="mt-3 block text-xs font-semibold text-brand-ink">
        Confirmation du n° de série
        <input
          type="text"
          autoFocus
          autoComplete="off"
          spellCheck={false}
          onPaste={(e) => e.preventDefault()}
          value={serial2}
          onChange={(e) => setSerial2(e.target.value)}
          placeholder="Re-saisir le n° à la main"
          className={`mt-1 w-full rounded-xl border-2 bg-white p-3 font-mono text-sm uppercase tracking-wide outline-none ${
            serial2 && !matches
              ? 'border-red-400 focus:border-red-500'
              : matches
                ? 'border-emerald-500 focus:border-emerald-600'
                : 'border-brand-stone focus:border-brand-gold'
          }`}
        />
        {serial2 && !matches && (
          <span className="mt-1 block text-[11px] text-red-700">
            ❌ Ne correspond pas à la première saisie.
          </span>
        )}
        {matches && (
          <span className="mt-1 block text-[11px] text-emerald-700">
            ✓ Correspond.
          </span>
        )}
      </label>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => onConfirm(serial2)}
          disabled={!matches}
          className="flex-1 rounded-xl bg-brand-gold px-4 py-2.5 text-sm font-semibold text-white shadow-plume disabled:cursor-not-allowed disabled:opacity-50"
        >
          Valider l&apos;aile
        </button>
        <button
          type="button"
          onClick={onBack}
          className="rounded-xl border-2 border-brand-stone bg-white px-4 py-2.5 text-sm font-medium text-brand-ink"
        >
          ← Retour
        </button>
      </div>
    </div>
  )
}
