'use client'

import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

interface QRCameraScannerProps {
  /** Callback quand un QR code est dÃ©codÃ© avec succÃ¨s. */
  onDecode: (text: string) => void
  /** Callback si l'utilisateur stoppe ou si la camÃ©ra n'est pas dispo. */
  onCancel: () => void
}

type CamState =
  | { kind: 'starting' }
  | { kind: 'running' }
  | { kind: 'denied' }     // permission refusÃ©e
  | { kind: 'unavailable' } // pas de camÃ©ra ou pas en HTTPS
  | { kind: 'error'; message: string }

const REGION_ID = 'qr-camera-region'

/**
 * Vrai scanner camÃ©ra QR code via html5-qrcode.
 *
 * Module TraÃ§abilitÃ© Flashcode v4 â€” camÃ©ra rÃ©elle robuste.
 *
 * IMPORTANT â€” chargement :
 *   Ce composant DOIT Ãªtre chargÃ© via `next/dynamic` avec `ssr: false` cÃ´tÃ©
 *   parent (cf. WingScanCard, ScanGateModal). L'import statique de html5-qrcode
 *   au top de ce fichier est OK uniquement parce que le composant lui-mÃªme
 *   n'est jamais rendu cÃ´tÃ© serveur.
 *
 *   Pourquoi pas dynamic-import dans useEffect : Ã§a consommait le "user
 *   gesture" pendant le `await import(...)`, et certains browsers (Safari)
 *   refusent la permission camÃ©ra si on a perdu le user gesture initial.
 *
 * Limitations :
 *  - NÃ©cessite HTTPS (sauf localhost). Vercel sert tout en HTTPS donc OK.
 *  - L'utilisateur doit autoriser l'accÃ¨s camÃ©ra. Refus â†’ message dÃ©diÃ©.
 */
export function QRCameraScanner({ onDecode, onCancel }: QRCameraScannerProps) {
  const [state, setState] = useState<CamState>({ kind: 'starting' })
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const decodedRef = useRef(false) // anti double-decode pendant l'arrÃªt
  const mountedRef = useRef(true)
  // Ref sur le conteneur React-stable qui WRAPPE le div manipulÃ© par
  // html5-qrcode. On vide son innerHTML au cleanup pour Ã©viter le crash
  // 'removeChild â€” node is not a child of this node' qui arrivait quand
  // React essayait de dÃ©monter des nÅ“uds dÃ©jÃ  dÃ©placÃ©s par html5-qrcode.
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
            setState({ kind: 'error', message: 'RÃ©gion scanner introuvable' })
          }
          return
        }

        // DÃ©tection prÃ©liminaire : navigator.mediaDevices.getUserMedia existe-t-il ?
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
          qrbox: { width: 220, height: 220 }, disableFlip: false,
          aspectRatio: 1.333,
        }
        const onScan = (decodedText: string) => {
          if (decodedRef.current) return
          decodedRef.current = true
          scanner
            .stop()
            .catch(() => { /* dÃ©jÃ  arrÃªtÃ© */ })
            .finally(() => onDecode(decodedText))
        }
        const onFrame = () => { /* frames sans QR â€” ignorer */ }

        // â”€â”€ StratÃ©gie de sÃ©lection camÃ©ra robuste sur PC + mobile â”€â”€â”€â”€â”€â”€â”€â”€â”€
        // Sur mobile : on veut la back camera (facingMode: 'environment').
        // Sur PC : pas de back cam â†’ 'environment' peut throw OverconstrainedError
        // (Firefox surtout, mais aussi Chrome/Edge avec certains drivers webcam).
        // â†’ On Ã©numÃ¨re d'abord les camÃ©ras et on choisit la mieux adaptÃ©e par ID.
        let started = false
        try {
          const cameras = await Html5Qrcode.getCameras()
          console.log('[QRCameraScanner] cameras dÃ©tectÃ©es:', cameras)

          if (!cameras || cameras.length === 0) {
            if (mountedRef.current) setState({ kind: 'unavailable' })
            return
          }

          // Cherche une camÃ©ra "back/rear/environment" par label, sinon prend la 1re
          const backCam = cameras.find((c) =>
            /back|rear|environment|arri[eÃ¨]re/i.test(c.label),
          )
          const chosen = backCam ?? cameras[0]
          if (!chosen) {
            if (mountedRef.current) setState({ kind: 'unavailable' })
            return
          }

          await scanner.start(chosen.id, config, onScan, onFrame)
          started = true
        } catch (camErr) {
          // Fallback : si l'Ã©numÃ©ration ou le dÃ©marrage par ID a Ã©chouÃ©,
          // on retente avec une contrainte molle facingMode (sans 'exact')
          // â€” laisse le browser choisir n'importe quelle camÃ©ra dispo.
          console.warn('[QRCameraScanner] Ã©numÃ©ration Ã©chouÃ©e, fallback facingMode:', camErr)
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

        // DÃ©tection des cas usuels â€” utilise err.name (DOMException) ET msg
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

      // Cleanup en 2 temps pour Ã©viter le crash 'removeChild':
      //   1. On arrÃªte le scanner si actif (async, sans bloquer)
      //   2. On vide MANUELLEMENT le contenu du conteneur de maniÃ¨re
      //      synchrone, AVANT que React tente de dÃ©monter les nÅ“uds que
      //      html5-qrcode a injectÃ©s (vidÃ©o, canvas, etc.). React ne voit
      //      plus que le conteneur vide â†’ pas de removeChild sur des nÅ“uds
      //      disparus.
      const stopPromise = s && typeof s.isScanning === 'boolean' && s.isScanning
        ? s.stop().catch(() => { /* dÃ©jÃ  arrÃªtÃ© */ })
        : Promise.resolve()

      // clear() retire l'Ã©lÃ©ment vidÃ©o proprement. Si Ã§a Ã©choue (dÃ©jÃ 
      // dÃ©tachÃ©), on tombe sur le innerHTML='' qui suit.
      stopPromise
        .then(() => s?.clear?.())
        .catch(() => { /* ignore */ })

      // Wipe synchrone du conteneur â€” c'est ce qui rÃ©sout le crash.
      if (container) {
        try {
          container.innerHTML = ''
        } catch { /* ignore */ }
      }
    }
  }, [onDecode])

  return (
    <div className="space-y-3">
      {/* Conteneur React-stable. Le div #qr-camera-region (manipulÃ© par
          html5-qrcode) est un enfant â€” React ne touche jamais aux nÅ“uds
          internes que la lib y injecte/retire. Cleanup synchrone via
          containerRef.innerHTML='' (cf. useEffect) pour Ã©viter le crash
          'removeChild' au dÃ©montage. */}
      <div
        ref={containerRef}
        className="relative aspect-[4/3] overflow-hidden rounded-xl bg-black [&_#qr-shaded-region]:!hidden"
      >
        <div
          id={REGION_ID}
          className="absolute inset-0"
        />
        {/* Overlay de cadrage gold autour de la zone qrbox */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center" style={{ zIndex: 10 }}>
          <div className="h-[220px] w-[220px] rounded-lg border-[3px] border-brand-gold shadow-[0_0_20px_rgba(212,175,55,0.4)]" />
        </div>
        {state.kind === 'starting' && (
          <div className="absolute inset-0 flex items-center justify-center bg-brand-ink/90 text-sm text-brand-gold">
            Activation de la camÃ©raâ€¦
          </div>
        )}
        {state.kind === 'denied' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-brand-ink/95 p-4 text-center text-sm text-white">
            <p className="font-semibold">ðŸš« Permission camÃ©ra refusÃ©e</p>
            <p className="text-xs text-white/70">
              Autorisez l&apos;accÃ¨s camÃ©ra dans les paramÃ¨tres du site, puis recliquez sur Â« Activer la camÃ©ra Â».
            </p>
          </div>
        )}
        {state.kind === 'unavailable' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-brand-ink/95 p-4 text-center text-sm text-white">
            <p className="font-semibold">ðŸ“µ CamÃ©ra indisponible</p>
            <p className="text-xs text-white/70">
              Aucune camÃ©ra dÃ©tectÃ©e sur cet appareil, ou le browser ne donne pas accÃ¨s. Sur ordinateur, essayez avec votre webcam ou ouvrez le site sur votre tÃ©lÃ©phone.
            </p>
          </div>
        )}
        {state.kind === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-brand-ink/95 p-4 text-center text-sm text-white">
            <p className="font-semibold">âš ï¸ Erreur scanner</p>
            <p className="break-all text-xs text-white/70">{state.message}</p>
          </div>
        )}
      </div>

      <p className="text-center text-xs text-slate-500">
        {state.kind === 'running'
          ? 'Cadrez le QR cousu sur l\'aile ou sur le sac â€” dÃ©tection automatique.'
          : state.kind === 'starting'
            ? 'PrÃ©paration du scannerâ€¦'
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

// Default export pour Ãªtre compatible avec next/dynamic
export default QRCameraScanner



