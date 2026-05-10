'use client'

import { useState } from 'react'
import type { ClientWing } from '../../queries'
import { QRCameraScanner } from '../QRCameraScanner'

type ScanState =
  | { status: 'idle' }
  | { status: 'scanning' }                                // caméra ouverte
  | { status: 'manual-warning' }                          // avertissement avant saisie manuelle
  | { status: 'manual-step1'; reason: string }            // saisie du serial + raison
  | { status: 'manual-step2'; reason: string; serial1: string } // re-saisie pour confirmation
  | { status: 'success'; serial: string; method: 'camera' | 'demo' | 'manual' }
  | { status: 'error'; message: string }

interface WingScanCardProps {
  wings: ClientWing[]
  selectedSerial: string | null
  onScanResolved: (wing: ClientWing, method: 'camera' | 'demo' | 'manual') => void
}

const MANUAL_REASONS = [
  { value: 'qr_damaged', label: 'QR code abîmé / illisible' },
  { value: 'qr_missing', label: 'QR code manquant ou décousu' },
  { value: 'pre_flashcode', label: 'Aile achetée avant le QR cousu' },
  { value: 'no_camera', label: 'Pas de caméra disponible' },
] as const

/**
 * Bloc de scan flashcode (QR code cousu sur l'aile / le sac).
 *
 * Module Traçabilité Flashcode v2 — vue client avec vraie caméra.
 *
 * Workflow :
 *  1. État idle : viewport décorative + 3 boutons (caméra / démo / manuel)
 *  2. Caméra : ouverture du vrai scanner via html5-qrcode → onDecode
 *  3. Manuel (laborieux) : avertissement → saisie + raison → re-saisie pour
 *     confirmation. Le but est de pousser au scan caméra par défaut.
 *  4. Démo : succès factice instantané (mode présentation)
 *
 * Étapes suivantes (PR à venir) :
 *  - Persister chaque scan dans la table wing_scans (Supabase) avec la méthode
 *  - Logger la raison du fallback manuel pour suivi qualité
 *  - Gating prod du bouton démo via NEXT_PUBLIC_VERCEL_ENV !== 'production'
 */
export function WingScanCard({ wings, selectedSerial: _selectedSerial, onScanResolved }: WingScanCardProps) {
  const [state, setState] = useState<ScanState>({ status: 'idle' })

  function findWingBySerial(serial: string): ClientWing | undefined {
    const normalized = serial.trim().toUpperCase()
    return wings.find((w) => w.serial_number.toUpperCase() === normalized)
  }

  function resolveSerial(serial: string, method: 'camera' | 'demo' | 'manual') {
    const wing = findWingBySerial(serial)
    if (!wing) {
      setState({
        status: 'error',
        message: `Aucune aile correspondant au n° "${serial}" sur votre compte.`,
      })
      return
    }
    setState({ status: 'success', serial, method })
    onScanResolved(wing, method)
  }

  function handleCameraDecode(decodedText: string) {
    const first = wings[0]
    if (first) resolveSerial(decodedText, 'camera')
    // Cas démo / pas d'aile : on accepte n'importe quel scan caméra
    else setState({ status: 'success', serial: decodedText, method: 'camera' })
  }

  function runDemoScan() {
    const first = wings[0]
    if (first) resolveSerial(first.serial_number, 'demo')
    else setState({ status: 'success', serial: 'PLM-DEMO-2026-00001', method: 'demo' })
  }

  function reset() {
    setState({ status: 'idle' })
  }

  // ── Success state ────────────────────────────────────────────────────────
  if (state.status === 'success') {
    const labelByMethod: Record<typeof state.method, string> = {
      camera: '📷 Scan flashcode',
      demo: '🧪 Test démo',
      manual: '✏️ Saisie manuelle',
    }
    return (
      <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              ✓ Aile identifiée — {labelByMethod[state.method]}
            </p>
            <p className="mt-1 truncate font-mono text-sm text-emerald-900">{state.serial}</p>
            <p className="mt-1 text-xs text-emerald-800/70">
              📍 État physique enregistré : <strong>chez vous</strong> (with_client)
            </p>
          </div>
          <button
            type="button"
            onClick={reset}
            className="shrink-0 rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-medium text-emerald-800 hover:bg-emerald-100"
          >
            Re-scanner
          </button>
        </div>
      </div>
    )
  }

  // ── Caméra ouverte ───────────────────────────────────────────────────────
  if (state.status === 'scanning') {
    return (
      <div className="rounded-2xl border-2 border-brand-gold/40 bg-gradient-to-br from-white to-brand-cream p-4">
        <p className="mb-3 text-sm font-semibold text-brand-ink">📷 Scanner en cours</p>
        <QRCameraScanner
          onDecode={handleCameraDecode}
          onCancel={reset}
        />
      </div>
    )
  }

  // ── Manual step 1 : avertissement ────────────────────────────────────────
  if (state.status === 'manual-warning') {
    return (
      <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-4">
        <p className="text-sm font-semibold text-amber-900">⚠️ Saisie manuelle</p>
        <p className="mt-1 text-xs text-amber-800">
          Le scan caméra est <strong>plus rapide et plus fiable</strong> — il évite les
          erreurs de saisie qui entraînent des ouvertures sur la mauvaise aile et
          ralentissent le SAV. Continuez en saisie manuelle uniquement si le QR
          n&apos;est vraiment pas utilisable.
        </p>
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
    )
  }

  // ── Manual step 1 : raison + saisie ──────────────────────────────────────
  if (state.status === 'manual-step1') {
    return (
      <ManualStep1
        initialReason={state.reason}
        onSubmit={(serial, reason) => setState({ status: 'manual-step2', reason, serial1: serial })}
        onBack={() => setState({ status: 'idle' })}
      />
    )
  }

  // ── Manual step 2 : re-saisie ────────────────────────────────────────────
  if (state.status === 'manual-step2') {
    return (
      <ManualStep2
        firstSerial={state.serial1}
        reason={state.reason}
        onConfirm={(s2) => {
          if (s2.trim().toUpperCase() !== state.serial1.trim().toUpperCase()) {
            setState({ status: 'error', message: 'Les deux saisies ne correspondent pas. Recommencez.' })
            return
          }
          resolveSerial(state.serial1, 'manual')
        }}
        onBack={() => setState({ status: 'manual-step1', reason: state.reason })}
      />
    )
  }

  // ── Idle / error state ───────────────────────────────────────────────────
  const errorMessage = state.status === 'error' ? state.message : null

  return (
    <div className="rounded-2xl border-2 border-brand-gold/40 bg-gradient-to-br from-white to-brand-cream p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-base">📷</span>
        <p className="text-sm font-semibold text-brand-ink">Scannez votre aile</p>
        <span className="ml-auto rounded-full bg-brand-gold px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
          Recommandé
        </span>
      </div>

      <p className="text-xs text-slate-600">
        Pour identifier votre aile sans erreur. Le QR code est cousu sur
        l&apos;<strong>étiquette intérieure d&apos;un caisson</strong> ou sur l&apos;
        <strong>étiquette de votre sac</strong>.
      </p>

      {/* Viewport décorative (pas la vraie caméra — celle-ci s'ouvre au clic) */}
      <div className="relative my-3 aspect-[4/3] overflow-hidden rounded-xl bg-gradient-to-br from-brand-ink to-slate-800">
        <div className="absolute inset-[14%] rounded-lg border-[3px] border-brand-gold shadow-[0_0_20px_rgba(212,175,55,0.4)]" />
        <div
          className="absolute left-[18%] right-[18%] h-[2px] bg-brand-gold shadow-[0_0_8px_#d4af37,0_0_16px_#d4af37]"
          style={{ top: '50%' }}
        />
        <div className="absolute inset-0 flex items-center justify-center font-mono text-5xl text-white/15 pointer-events-none select-none">▦</div>
      </div>

      {errorMessage && (
        <div className="mb-3 rounded-lg border-l-4 border-red-400 bg-red-50 px-3 py-2 text-xs text-red-800">
          ⚠️ {errorMessage}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => setState({ status: 'scanning' })}
          className="w-full rounded-xl bg-brand-gold px-4 py-3 text-sm font-semibold text-white shadow-plume hover:brightness-105 active:scale-[0.99]"
        >
          📷 Activer la caméra
        </button>

        <button
          type="button"
          onClick={runDemoScan}
          className="w-full rounded-xl border-2 border-dashed border-amber-400 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-800 hover:bg-amber-100"
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
    <div className="rounded-2xl border-2 border-brand-stone bg-white p-4">
      <p className="text-sm font-semibold text-brand-ink">Saisie manuelle — étape 1/2</p>
      <p className="mt-1 text-xs text-slate-500">
        Pour limiter les erreurs, on vous demande la raison du fallback manuel + une saisie + confirmation.
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
        <span className="mt-1 block text-[11px] text-slate-500">
          Plaque d&apos;identification à l&apos;intérieur d&apos;un caisson — format Plume <code>PLM-MODELE-ANNEE-NUMERO</code>
        </span>
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
  reason:      string
  onConfirm:   (serial2: string) => void
  onBack:      () => void
}

function ManualStep2({ firstSerial, reason: _reason, onConfirm, onBack }: ManualStep2Props) {
  const [serial2, setSerial2] = useState('')
  const matches = serial2.trim().toUpperCase() === firstSerial.trim().toUpperCase()

  return (
    <div className="rounded-2xl border-2 border-brand-stone bg-white p-4">
      <p className="text-sm font-semibold text-brand-ink">Saisie manuelle — étape 2/2</p>
      <p className="mt-1 text-xs text-slate-500">
        Re-saisissez le même n° pour confirmer. Pas de copier-coller — la deuxième
        saisie doit être faite à la main pour vérifier l&apos;exactitude.
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
