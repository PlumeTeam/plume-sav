'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { ReactNode } from 'react'
import { ScanGateModal } from '@/features/tickets/components/ScanGateModal'
import { SchoolCheckBriefing } from './SchoolCheckBriefing'

interface SchoolCheckGateProps {
  ticketId:    string
  ticketHref:  string
  /** N° de série de l'aile pour vérif au scan flashcode (anti-mauvaise aile). */
  wingSerial:  string | null
  children:    ReactNode
}

type GateStep = 'scan' | 'briefing' | 'unlocked'

/**
 * Gate bloquant l'accès à la page check tant que l'école n'a pas (1) scanné
 * le QR cousu sur l'aile concernée par le ticket, puis (2) lu le rappel sur
 * son rôle de filtre N1 et explicitement accepté de commencer.
 *
 * Module Traçabilité Flashcode — règle d'or : "Scan obligatoire pour ouvrir
 * un check / diagnostic" (cf. Bible §23.7). Le briefing pédagogique en plus
 * sert à rappeler que l'école n'est PAS attendue comme expert technique.
 *
 * Workflow en 2 étapes :
 *  1. step='scan'      → ScanGateModal force ouvert
 *     - Scan réussi    → step='briefing'
 *     - Fermeture modal sans scan → retour à la page ticket
 *  2. step='briefing'  → page d'info SchoolCheckBriefing
 *     - Click "J'ai compris" → step='unlocked'
 *     - Click "Retour"       → retour à la page ticket
 *  3. step='unlocked'  → children rendu (CheckWizard)
 *
 * Étape suivante (PR à venir) : persister scan_type='check_open' dans
 * wing_scans + tracer l'acknowledgement du briefing pour audit qualité.
 */
export function SchoolCheckGate({ ticketId: _ticketId, ticketHref, wingSerial, children }: SchoolCheckGateProps) {
  const router = useRouter()
  const [step, setStep] = useState<GateStep>('scan')

  if (step === 'unlocked') {
    return <>{children}</>
  }

  if (step === 'briefing') {
    return (
      <SchoolCheckBriefing
        onContinue={() => setStep('unlocked')}
        onCancel={() => router.push(ticketHref)}
      />
    )
  }

  // step === 'scan'
  return (
    <>
      {/* Placeholder visuel pendant que le scan est demandé — évite un fond
          blanc pur. */}
      <div className="rounded-card border-2 border-dashed border-brand-stone bg-white p-8 text-center">
        <p className="text-2xl">🔒</p>
        <p className="mt-2 text-sm font-semibold text-brand-ink">
          Scan flashcode requis
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Pour ouvrir le check, scannez le QR cousu sur l&apos;aile (ou son sac).
          Cela garantit que vous travaillez sur la bonne aile.
        </p>
      </div>

      <ScanGateModal
        open={true}
        onClose={() => router.push(ticketHref)}
        onScanSuccess={() => setStep('briefing')}
        expectedSerial={wingSerial}
        title="Avant le check"
        subtitle="Scannez l'aile pour ouvrir le wizard de diagnostic sur le bon ticket."
      />
    </>
  )
}
