'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { ReactNode } from 'react'
import { ScanGateModal } from '@/features/tickets/components/ScanGateModal'

interface SchoolCheckGateProps {
  ticketId:    string
  ticketHref:  string
  /** N° de série de l'aile pour vérif au scan flashcode (anti-mauvaise aile). */
  wingSerial:  string | null
  children:    ReactNode
}

/**
 * Gate de scan flashcode bloquant l'accès à la page check tant que l'école
 * n'a pas scanné le QR cousu sur l'aile concernée par le ticket.
 *
 * Module Traçabilité Flashcode — règle d'or : "Scan obligatoire pour ouvrir
 * un check / diagnostic" (cf. Bible §23.7). Auparavant le scan était demandé
 * via le bouton "Lancer le check" du SchoolStepPanel, mais on pouvait y
 * échapper en arrivant directement sur l'URL /school/ticket/[id]/check
 * (tab Check ou lien direct). Ce gate ferme la faille.
 *
 * Workflow :
 *  - Mount → modal ouvert d'office sur "scanning" possible
 *  - Scan réussi → unlock le wizard (children rendu)
 *  - Fermeture modal sans scan → retour à la page ticket
 *
 * Étape suivante (PR à venir) : persister chaque scan dans wing_scans
 * avec scan_type='check_open' au moment du unlock.
 */
export function SchoolCheckGate({ ticketId: _ticketId, ticketHref, wingSerial, children }: SchoolCheckGateProps) {
  const router = useRouter()
  const [unlocked, setUnlocked] = useState(false)

  if (unlocked) {
    return <>{children}</>
  }

  return (
    <>
      {/* Placeholder visuel pendant que le scan est demandé — évite un fond
          blanc pur. Les couleurs reprennent celles du wizard, pour ne pas
          surprendre l'utilisateur quand le scan se ferme. */}
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
        onScanSuccess={() => setUnlocked(true)}
        expectedSerial={wingSerial}
        title="Avant le check"
        subtitle="Scannez l'aile pour ouvrir le wizard de diagnostic sur le bon ticket."
      />
    </>
  )
}
