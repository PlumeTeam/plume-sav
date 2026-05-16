'use client'

import { useEffect, useRef } from 'react'
import { markTicketReadByClientAction } from '@/features/tickets/messages-actions'

/**
 * Re-déclenche le mark-as-read côté client après le rendu de la page de
 * conversation.
 *
 * La page marque déjà le ticket lu au rendu serveur (écriture DB garantie),
 * mais un `revalidatePath` appelé pendant un rendu de page ne purge PAS le
 * Router Cache côté client : au retour sur `/client` le dashboard restait
 * servi depuis ce cache, et les badges rouges des onglets « Mes demandes SAV »
 * / « Messages » restaient figés tant qu'on ne forçait pas un hard refresh.
 *
 * Invoquée ici comme Server Action déclenchée par le client, l'action exécute
 * `revalidatePath('/client', 'layout')` dans un contexte qui, lui, purge le
 * Router Cache → le dashboard est re-fetché et les badges reflètent l'état lu.
 *
 * Rendu `null` — purement un effet de bord.
 */
export function MarkTicketRead({ ticketId }: { ticketId: string }) {
  const handled = useRef<string | null>(null)

  useEffect(() => {
    if (handled.current === ticketId) return
    handled.current = ticketId
    void markTicketReadByClientAction(ticketId)
  }, [ticketId])

  return null
}
