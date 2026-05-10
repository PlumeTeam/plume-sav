'use client'

import { useEffect, useState } from 'react'

type ScanState =
  | { status: 'idle' }
  | { status: 'scanning' }
  | { status: 'manual' }
  | { status: 'mismatch'; scanned: string }

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

/**
 * Modale de scan flashcode bloquante avant une action.
 *
 * Module Traçabilité Flashcode v1 — vue pros (école / atelier / Plume HQ).
 * Premier preview : pas de vraie caméra, juste l'UX et la vérification du
 * serial. À chaque transition de garde de l'aile (réception, début de check,
 * génération bon d'envoi), le pro doit scanner le QR cousu sur l'aile pour
 * confirmer que c'est bien la bonne avant que l'action serveur s'exécute.
 *
 * Étapes suivantes (PR à venir) :
 *  - Intégrer html5-qrcode pour le vrai scan caméra
 *  - Persister chaque scan dans la table wing_scans (Supabase) avec le
 *    couple (role, type) approprié — ex: ('school', 'reception')
 *  - Refuser le scan si le serial ne matche pas (au lieu d'avertir + autoriser)
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
  const [manualInput, setManualInput] = useState('')

  // Reset à chaque ouverture
  useEffect(() => {
    if (open) {
      setState({ status: 'idle' })
      setManualInput('')
    }
  }, [open])

  if (!open) return null

  function checkSerial(scanned: string, method: 'camera' | 'demo' | 'manual') {
    if (!expectedSerial || method === 'demo') {
      // Mode démo ou pas de vérif → on passe
      onScanSuccess(method)
      return
    }
    const a = scanned.trim().toUpperCase()
    const b = expectedSerial.trim().toUpperCase()
    if (a === b) {
      onScanSuccess(method)
    } else {
      setState({ status: 'mismatch', scanned })
    }
  }

  function startScan() {
    setState({ status: 'scanning' })
    // TODO html5-qrcode. Ici on simule un scan qui matche l'expectedSerial.
    setTimeout(() => {
      checkSerial(expectedSerial ?? 'PLM-DEMO-2026-00001', 'camera')
    }, 800)
  }

  function runDemoScan() {
    checkSerial(expectedSerial ?? 'PLM-DEMO-2026-00001', 'demo')
  }

  function submitManual() {
    if (!manualInput.trim()) return
    checkSerial(manualInput, 'manual')
  }

  const isScanning = state.status === 'scanning'

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

        {state.status === 'manual' ? (
          <>
            <p className="text-xs text-slate-500">
              Saisissez le n° de série gravé sur la plaque d&apos;identification de l&apos;aile.
              {expectedSerial && (
                <>
                  {' '}Attendu : <code className="font-mono text-[11px] text-brand-ink">{expectedSerial}</code>
                </>
              )}
            </p>
            <input
              type="text"
              autoFocus
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitManual()}
              placeholder="PLM-XXXX-YYYY-NNNNN"
              className="mt-3 w-full rounded-xl border-2 border-brand-stone bg-white p-3 font-mono text-sm uppercase tracking-wide outline-none focus:border-brand-gold"
            />
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={submitManual}
                disabled={!manualInput.trim()}
                className="flex-1 rounded-xl bg-brand-gold px-4 py-2.5 text-sm font-semibold text-white shadow-plume disabled:cursor-not-allowed disabled:opacity-50"
              >
                Valider
              </button>
              <button
                type="button"
                onClick={() => setState({ status: 'idle' })}
                className="rounded-xl border-2 border-brand-stone bg-white px-4 py-2.5 text-sm font-medium text-brand-ink"
              >
                Retour
              </button>
            </div>
          </>
        ) : (
          <>
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

            {state.status === 'mismatch' && (
              <div className="mb-3 rounded-lg border-l-4 border-red-400 bg-red-50 px-3 py-2 text-xs text-red-800">
                ⚠️ Serial scanné <code className="font-mono">{state.scanned}</code> — différent du serial du ticket
                {expectedSerial && (
                  <> (<code className="font-mono">{expectedSerial}</code>)</>
                )}. Vérifiez que vous scannez bien l&apos;aile concernée par ce ticket.
              </div>
            )}

            {expectedSerial && state.status === 'idle' && (
              <p className="mb-3 rounded-lg bg-brand-cream px-3 py-2 text-xs text-slate-600">
                Aile attendue : <code className="font-mono text-brand-ink">{expectedSerial}</code>
              </p>
            )}

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={startScan}
                disabled={isScanning}
                className="w-full rounded-xl bg-brand-gold px-4 py-3 text-sm font-semibold text-white shadow-plume disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isScanning ? 'Activation caméra…' : '📷 Activer la caméra'}
              </button>
              <button
                type="button"
                onClick={runDemoScan}
                disabled={isScanning}
                className="w-full rounded-xl border-2 border-dashed border-amber-400 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-800 disabled:cursor-not-allowed disabled:opacity-60"
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
          </>
        )}
      </div>
    </div>
  )
}
