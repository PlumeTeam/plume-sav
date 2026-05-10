'use client'

import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

interface QRCameraScannerProps {
  /** Callback quand un QR code est décodé avec succès. */
  onDecode: (text: string) => void
  /** Callback si l'utilisateur stoppe ou si la caméra n'est pas dispo. */
  onCancel: () => void
}

type CamState =
  | { kind: 'starting' }
  | { kind: 'running' }
  | { kind: 'denied' }     // permission refusée
  | { kind: 'unavailable' } // pas de caméra ou pas en HTTPS
  | { kind: 'error'; message: string }

const REGION_ID = 'qr-camera-region'

/**
 * Vrai scanner caméra QR code via html5-qrcode.
 *
 * Module Traçabilité Flashcode v2 — caméra réelle.
 * Utilise la caméra arrière (facingMode: 'environment') par défaut, fallback
 * caméra front si pas dispo. Affiche un viewport vidéo + overlay de cadrage.
 * Au scan réussi, stoppe automatiquement la caméra et appelle onDecode.
 *
 * Limitations :
 *  - Nécessite HTTPS (sauf localhost) — la caméra est bloquée par le browser
 *    sur HTTP standard. Vercel sert tout en HTTPS donc OK en prod/preview.
 *  - L'utilisateur doit autoriser l'accès caméra. Refus → onCancel + message.
 */
export function QRCameraScanner({ onDecode, onCancel }: QRCameraScannerProps) {
  const [state, setState] = useState<CamState>({ kind: 'starting' })
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const decodedRef = useRef(false) // anti double-decode pendant l'arrêt

  useEffect(() => {
    let cancelled = false

    async function start() {
      try {
        const scanner = new Html5Qrcode(REGION_ID, /* verbose */ false)
        scannerRef.current = scanner

        await scanner.start(
          { facingMode: 'environment' }, // back camera par défaut (mobile)
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.333,
          },
          (decodedText) => {
            if (decodedRef.current) return
            decodedRef.current = true
            scanner
              .stop()
              .catch(() => { /* déjà arrêté */ })
              .finally(() => onDecode(decodedText))
          },
          () => { /* frames sans QR — ignorer */ },
        )
        if (!cancelled) setState({ kind: 'running' })
      } catch (err) {
        if (cancelled) return
        const msg = err instanceof Error ? err.message : String(err)
        // Détection des cas usuels
        if (/permission|denied|notallowed/i.test(msg)) {
          setState({ kind: 'denied' })
        } else if (/notfound|nodevice|notreadable/i.test(msg)) {
          setState({ kind: 'unavailable' })
        } else {
          setState({ kind: 'error', message: msg })
        }
      }
    }

    start()

    return () => {
      cancelled = true
      const s = scannerRef.current
      if (s && s.isScanning) {
        s.stop().catch(() => { /* ignore */ })
      }
      scannerRef.current = null
    }
  }, [onDecode])

  return (
    <div className="space-y-3">
      <div
        id={REGION_ID}
        className="relative aspect-[4/3] overflow-hidden rounded-xl bg-black"
      >
        {/* Overlay de cadrage gold autour de la zone qrbox */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[62%] w-[62%] rounded-lg border-[3px] border-brand-gold shadow-[0_0_20px_rgba(212,175,55,0.4)]" />
        </div>
        {state.kind === 'starting' && (
          <div className="absolute inset-0 flex items-center justify-center bg-brand-ink/90 text-sm text-brand-gold">
            Activation de la caméra…
          </div>
        )}
        {state.kind === 'denied' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-brand-ink/95 p-4 text-center text-sm text-white">
            <p className="font-semibold">🚫 Permission caméra refusée</p>
            <p className="text-xs text-white/70">
              Autorisez l&apos;accès caméra dans les paramètres du site, puis recliquez sur « Activer la caméra ».
            </p>
          </div>
        )}
        {state.kind === 'unavailable' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-brand-ink/95 p-4 text-center text-sm text-white">
            <p className="font-semibold">📵 Caméra indisponible</p>
            <p className="text-xs text-white/70">
              Aucune caméra détectée, ou le site doit être en HTTPS pour y accéder.
            </p>
          </div>
        )}
        {state.kind === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-brand-ink/95 p-4 text-center text-sm text-white">
            <p className="font-semibold">⚠️ Erreur scanner</p>
            <p className="text-xs text-white/70">{state.message}</p>
          </div>
        )}
      </div>

      <p className="text-center text-xs text-slate-500">
        {state.kind === 'running'
          ? 'Cadrez le QR cousu sur l\'aile ou sur le sac — détection automatique.'
          : 'Préparation du scanner…'}
      </p>

      <button
        type="button"
        onClick={onCancel}
        className="w-full rounded-xl border-2 border-brand-stone bg-white px-4 py-2 text-sm font-medium text-brand-ink hover:bg-slate-50"
      >
        Annuler
      </button>
    </div>
  )
}
