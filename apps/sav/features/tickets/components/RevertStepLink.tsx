'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { revertToStepAction } from '@/features/tickets/actions'
import type { RequestStatus } from '@/features/tickets/types'

interface RevertStepLinkProps {
  ticketId:     string
  /** Statut auquel revenir (étape ciblée). */
  targetStatus: RequestStatus
  /** Libellé de l'étape — affiché dans la confirmation et l'audit. */
  stepLabel:    string
}

/**
 * Petit lien discret sous le timestamp d'une étape validée. Permet à
 * l'utilisateur (école ou atelier) de revenir à cette étape, ce qui :
 *  - remet le ticket au statut correspondant
 *  - efface les saisies des étapes postérieures (timestamps, résolutions,
 *    décisions atelier)
 *  - laisse une trace dans ticket_status_history
 *
 * Confirmation native (window.confirm) — suffisant pour une action peu
 * fréquente, évite de pop-up une modale lourde.
 */
export function RevertStepLink({ ticketId, targetStatus, stepLabel }: RevertStepLinkProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    if (typeof window === 'undefined') return
    const ok = window.confirm(
      `Voulez-vous revenir à l'étape « ${stepLabel} » ?\n\n` +
      `Cela effacera la saisie des étapes suivantes (timestamps, ` +
      `décisions, résolutions). Une trace est conservée dans l'historique.`,
    )
    if (!ok) return

    startTransition(async () => {
      const fd = new FormData()
      fd.set('ticketId',     ticketId)
      fd.set('targetStatus', targetStatus)
      fd.set('stepLabel',    stepLabel)
      const r = await revertToStepAction(fd)
      if (r?.error) {
        const msg = r.error._form?.[0] ?? 'Erreur lors du retour en arrière.'
        window.alert(msg)
        return
      }
      router.refresh()
    })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="mt-1 text-[11px] font-medium text-slate-400 underline-offset-2 hover:text-brand-gold hover:underline disabled:opacity-50"
    >
      {isPending ? '…' : '↩︎ Modifier'}
    </button>
  )
}
