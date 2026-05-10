'use client'

import { useState } from 'react'
import type { ClientWing } from '../../queries'

type ScanState =
  | { status: 'idle' }
  | { status: 'scanning' }
  | { status: 'manual' }
  | { status: 'success'; serial: string; method: 'camera' | 'demo' | 'manual' }
  | { status: 'error'; message: string }

interface WingScanCardProps {
  wings: ClientWing[]
  selectedSerial: string | null
  onScanResolved: (wing: ClientWing, method: 'camera' | 'demo' | 'manual') => void
}

/**
 * Bloc de scan flashcode (QR code cousu sur l'aile / le sac).
 *
 * Module Traçabilité Flashcode v1 — vue client.
 * Premier preview : pas de vraie caméra, juste l'UX et la mécanique de
 * pré-sélection d'aile à partir d'un n° de série. Le bouton "Test sans
 * flashcode" sélectionne la première aile de la liste pour le mode démo.
 *
 * Étapes suivantes (PR à venir) :
 *  - Intégrer html5-qrcode pour le vrai scan caméra
 *  - Persister chaque scan dans la table wing_scans (Supabase)
 *  - Mettre à jour wings.physical_state à la transition
 */
export function WingScanCard({ wings, selectedSerial, onScanResolved }: WingScanCardProps) {
  // Toujours démarrer en idle pour que la viewport caméra soit visible.
  // Si une aile est déjà sélectionnée (brouillon en cours), on pré-remplit
  // juste le champ manuel — mais le scan reste accessible.
  const [state, setState] = useState<ScanState>({ status: 'idle' })
  const [manualInput, setManualInput] = useState(selectedSerial ?? '')

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

  function startScan() {
    setState({ status: 'scanning' })
    // TODO: brancher html5-qrcode. Pour l'instant on simule un scan réussi
    // après 800ms (le temps de voir l'animation).
    setTimeout(() => {
      const first = wings[0]
      if (first) resolveSerial(first.serial_number, 'camera')
      // Mode démo / pas d'aile enregistrée : succès factice pour que l'UX
      // soit visible même sur un compte vierge.
      else setState({ status: 'success', serial: 'PLM-DEMO-2026-00001', method: 'camera' })
    }, 800)
  }

  function runDemoScan() {
    const first = wings[0]
    if (first) resolveSerial(first.serial_number, 'demo')
    // Mode démo / pas d'aile enregistrée : succès factice.
    else setState({ status: 'success', serial: 'PLM-DEMO-2026-00001', method: 'demo' })
  }

  function submitManualSerial() {
    if (!manualInput.trim()) return
    resolveSerial(manualInput, 'manual')
  }

  function reset() {
    setState({ status: 'idle' })
    setManualInput('')
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

  // ── Manual entry state ────────────────────────────────────────────────────
  if (state.status === 'manual') {
    return (
      <div className="rounded-2xl border-2 border-brand-stone bg-white p-4">
        <p className="text-sm font-semibold text-brand-ink">Saisie manuelle du n° de série</p>
        <p className="mt-1 text-xs text-slate-500">
          Le n° est gravé sur la plaque d&apos;identification à l&apos;intérieur d&apos;un caisson.
          Format Plume : <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[11px]">PLM-MODELE-ANNEE-NUMERO</code>
        </p>
        <input
          type="text"
          autoFocus
          value={manualInput}
          onChange={(e) => setManualInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submitManualSerial()}
          placeholder="PLM-ARIA-2025-00142"
          className="mt-3 w-full rounded-xl border-2 border-brand-stone bg-white p-3 font-mono text-sm uppercase tracking-wide outline-none focus:border-brand-gold"
        />
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={submitManualSerial}
            disabled={!manualInput.trim()}
            className="flex-1 rounded-xl bg-brand-gold px-4 py-2.5 text-sm font-semibold text-white shadow-plume disabled:cursor-not-allowed disabled:opacity-50"
          >
            Valider le n° de série
          </button>
          <button
            type="button"
            onClick={reset}
            className="rounded-xl border-2 border-brand-stone bg-white px-4 py-2.5 text-sm font-medium text-brand-ink"
          >
            Annuler
          </button>
        </div>
      </div>
    )
  }

  // ── Idle / scanning / error state ─────────────────────────────────────────
  const isScanning = state.status === 'scanning'
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

      {/* Viewport scan animée */}
      <div className="relative my-3 aspect-[4/3] overflow-hidden rounded-xl bg-gradient-to-br from-brand-ink to-slate-800">
        <div
          className={`absolute inset-[14%] rounded-lg border-[3px] border-brand-gold shadow-[0_0_20px_rgba(212,175,55,0.4)] ${
            isScanning ? 'animate-pulse' : ''
          }`}
        />
        <div
          className="absolute left-[18%] right-[18%] h-[2px] bg-brand-gold shadow-[0_0_8px_#d4af37,0_0_16px_#d4af37]"
          style={{ top: '50%' }}
        />
        <div className="absolute inset-0 flex items-center justify-center font-mono text-5xl text-white/15 pointer-events-none select-none">▦</div>
        {isScanning && (
          <div className="absolute bottom-3 left-0 right-0 text-center text-xs font-medium text-brand-gold">
            Scan en cours…
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="mb-3 rounded-lg border-l-4 border-red-400 bg-red-50 px-3 py-2 text-xs text-red-800">
          ⚠️ {errorMessage}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={startScan}
          disabled={isScanning}
          className="w-full rounded-xl bg-brand-gold px-4 py-3 text-sm font-semibold text-white shadow-plume transition-all hover:brightness-105 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isScanning ? 'Activation caméra…' : '📷 Activer la caméra'}
        </button>

        <button
          type="button"
          onClick={runDemoScan}
          disabled={isScanning}
          className="w-full rounded-xl border-2 border-dashed border-amber-400 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-800 transition-all hover:bg-amber-100 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        >
          🧪 Test sans flashcode <span className="font-normal opacity-70">(mode démo)</span>
        </button>

        <button
          type="button"
          onClick={() => setState({ status: 'manual' })}
          className="w-full rounded-xl bg-transparent px-4 py-2 text-sm font-medium text-brand-ink/70 underline-offset-4 hover:text-brand-ink hover:underline"
        >
          Saisir le n° de série manuellement
        </button>
      </div>
    </div>
  )
}
