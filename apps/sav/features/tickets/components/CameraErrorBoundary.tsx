'use client'

import { Component, type ReactNode } from 'react'

interface Props {
  /** Affiché à la place du scanner si une erreur React remonte. */
  fallback?: ReactNode
  /** Bouton "Réessayer" → reset complet du boundary (re-mount du child). */
  onRetry?: () => void
  /** Bouton "Saisie manuelle" → ouvre le flow manuel à la place. */
  onSwitchToManual?: () => void
  children: ReactNode
}

interface State {
  hasError: boolean
  errorMessage: string
}

/**
 * Error Boundary local autour du QRCameraScanner.
 *
 * Pourquoi : html5-qrcode peut throw de plusieurs manières non couvrables par un
 * try/catch async (events DOM internes, exceptions synchrones du constructeur,
 * unhandled rejections en microtask). Sans ce boundary, ces erreurs remontent
 * jusqu'à `app/error.tsx` → "Une erreur est survenue" plein écran et toute la
 * page client est perdue.
 *
 * Ce boundary contient le dégât : seul le bloc scanner affiche un message,
 * le wizard reste utilisable, et l'utilisateur peut basculer en saisie manuelle.
 */
export class CameraErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, errorMessage: '' }

  static getDerivedStateFromError(err: unknown): State {
    const msg = err instanceof Error ? err.message : String(err)
    return { hasError: true, errorMessage: msg }
  }

  componentDidCatch(error: unknown, info: { componentStack?: string | null }) {
    // Log structuré pour debug — visible dans console F12 + dans les runtime
    // logs Vercel via console.error.
    console.error('[CameraErrorBoundary] crash scanner caméra:', {
      error,
      stack: info?.componentStack,
    })
  }

  handleRetry = () => {
    this.setState({ hasError: false, errorMessage: '' })
    this.props.onRetry?.()
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    if (this.props.fallback) {
      return this.props.fallback
    }

    return (
      <div className="rounded-xl border-2 border-red-300 bg-red-50 p-4 text-sm">
        <p className="font-semibold text-red-800">⚠️ Le scanner caméra a planté</p>
        <p className="mt-1 text-xs text-red-700">
          Le module caméra n&apos;a pas pu s&apos;ouvrir correctement sur votre
          appareil. Détail technique :
        </p>
        <code className="mt-2 block break-all rounded bg-white/60 px-2 py-1 font-mono text-[11px] text-red-900">
          {this.state.errorMessage || 'erreur inconnue'}
        </code>
        <p className="mt-2 text-xs text-red-700">
          Vous pouvez réessayer, ou continuer en saisie manuelle.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={this.handleRetry}
            className="flex-1 rounded-xl bg-brand-gold px-4 py-2 text-sm font-semibold text-white shadow-plume"
          >
            Réessayer le scan
          </button>
          {this.props.onSwitchToManual && (
            <button
              type="button"
              onClick={this.props.onSwitchToManual}
              className="rounded-xl border-2 border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-800"
            >
              Saisie manuelle
            </button>
          )}
        </div>
      </div>
    )
  }
}
