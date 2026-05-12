'use client'

import { useState } from 'react'
import { CloseTicketDialog } from './CloseTicketDialog'
import type { CloserRole } from '@/features/tickets/types'

interface CloseTicketButtonProps {
  ticketId:    string
  ticketRef:   string
  closerRole:  CloserRole
  /** Désactive le bouton (ex: ticket déjà clôturé). */
  disabled?:   boolean
  /** Variante visuelle. 'primary' = bouton plein rouge (CTA principal),
   *  'ghost' = bouton léger texte rouge (action secondaire). */
  variant?:    'primary' | 'ghost'
  className?:  string
  /** Override du libellé du bouton. */
  label?:      string
}

/**
 * Bouton + dialog de clôture (T7). Encapsule l'état "open" pour éviter
 * que chaque page recrée la même mécanique.
 */
export function CloseTicketButton({
  ticketId,
  ticketRef,
  closerRole,
  disabled = false,
  variant = 'primary',
  className = '',
  label = 'Clôturer le ticket',
}: CloseTicketButtonProps) {
  const [open, setOpen] = useState(false)

  const base = 'inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50'
  const primary = 'bg-red-600 text-white hover:bg-red-700'
  const ghost   = 'border border-red-200 bg-white text-red-700 hover:bg-red-50'

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={disabled}
        className={`${base} ${variant === 'primary' ? primary : ghost} ${className}`}
        aria-label={`Clôturer le ticket ${ticketRef}`}
      >
        <span aria-hidden>🔒</span>
        {label}
      </button>
      <CloseTicketDialog
        ticketId={ticketId}
        ticketRef={ticketRef}
        closerRole={closerRole}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  )
}
