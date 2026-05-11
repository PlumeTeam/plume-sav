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
 * Module Traçabilité Flashcode v4 — caméra réelle robuste.
 *
 * IMPORTANT — chargement :
 *   Ce composant DOIT être chargé via `next/dynamic` avec `ssr: false` côté
 *   parent (cf. WingScanCard, ScanGateModal). L'import statique de html5-qrcode
 *   au top de ce fichier est OK uniquement parce que le composant lui-même
 *   n'est jamais rendu côté serveur.
 *
 *   Pourquoi pas dynamic-import dans useEffect : ça consommait le "user
 *   gesture" pendant le `await import(...)`, et certains browsers (Safari)
 *   refusent la permission caméra si on a perdu le user gesture initial.
 *
 * Limitations :
 *  - Nécessite HTTPS (sauf localhost). Vercel sert tout en HTTPS donc OK.
 *  - L'utilisateur doit autoriser l'accès caméra. Refus → message dédié.
 */
export function QRCameraScanner({ onDecode, onCancel }: QRCameraScannerProps) {
  const [state, setState] = useState<CamState>({ kind: 'starting' })
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const decodedRef = useRef(false) // anti double-decode pendant l'arrêt
  const mountedRef = useRef(true)
  // Ref sur le conteneur React-stable qui WRAPPE le div manipulé par
  // html5-qrcode. On vide son innerHTML au cleanup pour éviter le crash
  // 'removeChild — node is not a child of this node' qui arrivait quand
  // React essayait de démonter des nœuds déjà déplacés par html5-qrcode.
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    mountedRef.current = true

    // Petit tick pour s'assurer que le <div id={REGION_ID}> est bien dans le
    // DOM avant qu'Html5Qrcode tente de l'attacher.
    const timer = setTimeout(() => {
      if (!mountedRef.current) return
      startCamera()
    }, 50)

    async function startCamera() {
      try {
        const el = document.getElementById(REGION_ID)
        if (!el) {
          if (mountedRef.current) {
            setState({ kind: 'error', message: 'Région scanner introuvable' })
          }
          return
        }

        // Détection préliminaire : navigator.mediaDevices.getUserMedia existe-t-il ?
        if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
          if (mountedRef.current) {
            setState({ kind: 'unavailable' })
          }
          return
        }

        const scanner = new Html5Qrcode(REGION_ID, /* verbose */ false)
        scannerRef.current = scanner

        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.333,
        }
        const onScan = (decodedText: string) => {
          if (decodedRef.current) return
          decodedRef.current = true
          scanner
            .stop()
            .catch(() => { /* déjà arrêté */ })
            .finally(() => onDecode(decodedText))
        }
        const onFrame = () => { /* frames sans QR — ignorer */ }

        // ── Stratégie de sélection caméra robuste sur PC + mobile ─────────
        // Sur mobile : on veut la back camera (facingMode: 'environment').
        // Sur PC : pas de back cam → 'environment' peut throw OverconstrainedError
        // (Firefox surtout, mais aussi Chrome/Edge avec certains drivers webcam).
        // → On énumère d'abord les caméras et on choisit la mieux adaptée par ID.
        let started = false
        try {
          const cameras = await Html5Qrcode.getCameras()
          console.log('[QRCameraScanner] cameras détectées:', cameras)

          if (!cameras || cameras.length === 0) {
            if (mountedRef.current) setState({ kind: 'unavailable' })
            return
          }

          // Cherche une caméra "back/rear/environment" par label, sinon prend la 1re
          const backCam = cameras.find((c) =>
            /back|rear|environment|arri[eè]re/i.test(c.label),
          )
          const chosen = backCam ?? cameras[0]
          if (!chosen) {
            if (mountedRef.current) setState({ kind: 'unavailable' })
            return
          }

          await scanner.start(chosen.id, config, onScan, onFrame)
          started = true
        } catch (camErr) {
          // Fallback : si l'énumération ou le démarrage par ID a échoué,
          // on retente avec une contrainte molle facingMode (sans 'exact')
          // — laisse le browser choisir n'importe quelle caméra dispo.
          console.warn('[QRCameraScanner] énumération échouée, fallback facingMode:', camErr)
          await scanner.start({ facingMode: 'environment' }, config, onScan, onFrame)
          started = true
        }

        if (!mountedRef.current) {
          if (started) {
            scanner.stop().catch(() => { /* ignore */ })
          }
          return
        }
        setState({ kind: 'running' })
      } catch (err) {
        if (!mountedRef.current) return
        const msg = err instanceof Error ? err.message : String(err)
        const name = err instanceof Error ? err.name : ''
        // Log pour debug (visible dans la console browser)
        console.error('[QRCameraScanner] start failed:', { name, msg, err })

        // Détection des cas usuels — utilise err.name (DOMException) ET msg
        if (name === 'NotAllowedError' || /permission|denied|notallowed/i.test(msg)) {
          setState({ kind: 'denied' })
        } else if (
          name === 'NotFoundError' ||
          name === 'OverconstrainedError' ||
          name === 'NotReadableError' ||
          name === 'AbortError' ||
          /notfound|nodevice|notreadable|overconstrained|navigator|mediadevices|secure|requested device|busy/i.test(msg)
        ) {
          setState({ kind: 'unavailable' })
        } else {
          setState({ kind: 'error', message: msg || 'Erreur inconnue (voir console F12)' })
        }
      }
    }

    return () => {
      mountedRef.current = false
      clearTimeout(timer)
      const s = scannerRef.current
      const container = containerRef.current
      scannerRef.current = null

      // Cleanup en 2 temps pour éviter le crash 'removeChild':
      //   1. On arrête le scanner si actif (async, sans bloquer)
      //   2. On vide MANUELLEMENT le contenu du conteneur de manière
      //      synchrone, AVANT que React tente de démonter les nœuds que
      //      html5-qrcode a injectés (vidéo, canvas, etc.). React ne voit
      //      plus que le conteneur vide → pas de removeChild sur des nœuds
      //      disparus.
      const stopPromise = s && typeof s.isScanning === 'boolean' && s.isScanning
        ? s.stop().catch(() => { /* déjà arrêté */ })
        : Promise.resolve()

      // clear() retire l'élément vidéo proprement. Si ça échoue (déjà
      // détaché), on tombe sur le innerHTML='' qui suit.
      stopPromise
        .then(() => s?.clear?.())
        .catch(() => { /* ignore */ })

      // Wipe synchrone du conteneur — c'est ce qui résout le crash.
      if (container) {
        try {
          container.innerHTML = ''
        } catch { /* ignore */ }
      }
    }
  }, [onDecode])

  return (
    <div className="space-y-3">
      {/* Conteneur React-stable. Le div #qr-camera-region (manipulé par
          html5-qrcode) est un enfant — React ne touche jamais aux nœuds
          internes que la lib y injecte/retire. Cleanup synchrone via
          containerRef.innerHTML='' (cf. useEffect) pour éviter le crash
          'removeChild' au démontage. */}
      <div
        ref={containerRef}
        className="relative aspect-[4/3] overflow-hidden rounded-xl bg-black"
      >
        <div
          id={REGION_ID}
          className="absolute inset-0"
        />
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
              Aucune caméra détectée sur cet appareil, ou le browser ne donne pas accès. Sur ordinateur, essayez avec votre webcam ou ouvrez le site sur votre téléphone.
            </p>
          </div>
        )}
        {state.kind === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-brand-ink/95 p-4 text-center text-sm text-white">
            <p className="font-semibold">⚠️ Erreur scanner</p>
            <p className="break-all text-xs text-white/70">{state.message}</p>
          </div>
        )}
      </div>

      <p className="text-center text-xs text-slate-500">
        {state.kind === 'running'
          ? 'Cadrez le QR cousu sur l\'aile ou sur le sac — détection automatique.'
          : state.kind === 'starting'
            ? 'Préparation du scanner…'
            : 'Vous pouvez fermer ce scanner et tenter une saisie manuelle.'}
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

// Default export pour être compatible avec next/dynamic
export default QRCameraScanner
