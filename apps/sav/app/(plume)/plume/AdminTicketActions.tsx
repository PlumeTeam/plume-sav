'use client'

import { useState, useTransition } from 'react'
import {
  adminReassignSchoolAction,
  adminCloseTicketAction,
  adminRemindSchoolAction,
} from '@/features/tickets/actions'
import type { TicketWithPhotos } from '@/features/tickets/types'
import type { PartnerSchool } from '@/features/tickets/queries'

interface AdminTicketActionsProps {
  ticket:             TicketWithPhotos
  schools:            PartnerSchool[]
  currentSchoolLabel: string | null
  onClose:            () => void
}

type Pane = 'menu' | 'reassign' | 'close' | 'remind'

export function AdminTicketActions({
  ticket,
  schools,
  currentSchoolLabel,
  onClose,
}: AdminTicketActionsProps) {
  const [pane, setPane]         = useState<Pane>('menu')
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'error'; msg: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  // Réassignation : sélection d'école + raison
  const [newSchoolId, setNewSchoolId] = useState('')
  const [reason, setReason]           = useState('')

  // Clôture : note obligatoire
  const [closeNote, setCloseNote] = useState('')

  const ticketRef = ticket.ticket_number ?? `#${ticket.id.slice(0, 8).toUpperCase()}`

  function close() {
    setFeedback(null)
    setPane('menu')
    onClose()
  }

  function handleReassign(e: React.FormEvent) {
    e.preventDefault()
    if (!newSchoolId || newSchoolId === ticket.school_id) {
      setFeedback({ type: 'error', msg: 'Choisissez une école différente.' })
      return
    }
    startTransition(async () => {
      const fd = new FormData()
      fd.set('ticketId', ticket.id)
      fd.set('schoolId', newSchoolId)
      fd.set('reason',   reason)
      const r = await adminReassignSchoolAction(fd)
      if (r?.error) {
        const formErrors = (r.error as { _form?: string[] })._form
        setFeedback({ type: 'error', msg: formErrors?.[0] ?? 'Erreur réassignation.' })
      } else {
        setFeedback({ type: 'ok', msg: 'Ticket réassigné.' })
        setTimeout(close, 900)
      }
    })
  }

  function handleClose(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const fd = new FormData()
      fd.set('ticketId', ticket.id)
      fd.set('note',     closeNote)
      const r = await adminCloseTicketAction(fd)
      if (r?.error) {
        const formErrors = (r.error as { _form?: string[] })._form
        setFeedback({ type: 'error', msg: formErrors?.[0] ?? 'Erreur clôture.' })
      } else {
        setFeedback({ type: 'ok', msg: 'Ticket clôturé.' })
        setTimeout(close, 900)
      }
    })
  }

  function handleRemind() {
    startTransition(async () => {
      const fd = new FormData()
      fd.set('ticketId', ticket.id)
      const r = await adminRemindSchoolAction(fd)
      if (r?.error) {
        const formErrors = (r.error as { _form?: string[] })._form
        setFeedback({ type: 'error', msg: formErrors?.[0] ?? 'Erreur envoi.' })
      } else {
        setFeedback({ type: 'ok', msg: 'Email de relance envoyé.' })
        setTimeout(close, 1100)
      }
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 sm:items-center"
      onClick={(e) => { if (e.target === e.currentTarget) close() }}
      role="dialog"
      aria-modal="true"
      aria-label={`Actions admin pour ${ticketRef}`}
    >
      <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-soft">
        <div className="mb-3 flex items-baseline justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-gold">Actions admin</p>
            <p className="font-mono text-xs text-slate-500">{ticketRef}</p>
          </div>
          <button
            type="button"
            onClick={close}
            className="rounded-full px-2 py-1 text-sm text-slate-400 hover:bg-brand-cream"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        {feedback && (
          <p className={`mb-3 rounded-xl px-3 py-2 text-sm ${
            feedback.type === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
          }`}>
            {feedback.msg}
          </p>
        )}

        {pane === 'menu' && (
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setPane('reassign')}
              className="flex w-full items-center justify-between rounded-2xl border border-brand-stone bg-white p-3 text-left text-sm transition-colors hover:bg-brand-cream"
            >
              <div>
                <p className="font-medium text-brand-ink">🏫 Réassigner à une autre école</p>
                <p className="text-xs text-slate-500">
                  {currentSchoolLabel ? `Actuellement : ${currentSchoolLabel}` : 'Aucune école assignée'}
                </p>
              </div>
              <span aria-hidden>→</span>
            </button>

            <button
              type="button"
              onClick={() => setPane('remind')}
              className="flex w-full items-center justify-between rounded-2xl border border-brand-stone bg-white p-3 text-left text-sm transition-colors hover:bg-brand-cream"
            >
              <div>
                <p className="font-medium text-brand-ink">📧 Relancer l&apos;école par email</p>
                <p className="text-xs text-slate-500">Rappel automatique pour traiter le ticket</p>
              </div>
              <span aria-hidden>→</span>
            </button>

            <button
              type="button"
              onClick={() => setPane('close')}
              className="flex w-full items-center justify-between rounded-2xl border border-red-200 bg-white p-3 text-left text-sm transition-colors hover:bg-red-50"
            >
              <div>
                <p className="font-medium text-red-700">🔒 Fermer manuellement</p>
                <p className="text-xs text-red-600/70">Ticket → terminé. Note obligatoire.</p>
              </div>
              <span aria-hidden className="text-red-700">→</span>
            </button>
          </div>
        )}

        {pane === 'reassign' && (
          <form onSubmit={handleReassign} className="space-y-3">
            <button
              type="button"
              onClick={() => { setPane('menu'); setFeedback(null) }}
              className="text-xs text-slate-500 hover:underline"
            >
              ← Retour
            </button>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Nouvelle école</label>
              <select
                value={newSchoolId}
                onChange={(e) => setNewSchoolId(e.target.value)}
                className="field-input"
                required
              >
                <option value="">— Choisir une école —</option>
                {schools.map((s) => (
                  <option
                    key={s.id}
                    value={s.id}
                    disabled={s.id === ticket.school_id}
                  >
                    {s.name}{s.city ? ` · ${s.city}` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Motif (visible Plume HQ uniquement)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="field-input resize-none"
                placeholder="Ex. l'école initiale a fermé, déménagement, demande client…"
                required
                minLength={3}
                maxLength={2000}
              />
            </div>
            <button type="submit" disabled={isPending} className="btn-primary w-full">
              {isPending ? 'Réassignation…' : 'Réassigner'}
            </button>
          </form>
        )}

        {pane === 'close' && (
          <form onSubmit={handleClose} className="space-y-3">
            <button
              type="button"
              onClick={() => { setPane('menu'); setFeedback(null) }}
              className="text-xs text-slate-500 hover:underline"
            >
              ← Retour
            </button>
            <div className="rounded-2xl bg-red-50 p-3 text-xs text-red-700">
              Cette action passe le ticket en <strong>terminé</strong>. Action visible côté client.
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Note de clôture (obligatoire)
              </label>
              <textarea
                value={closeNote}
                onChange={(e) => setCloseNote(e.target.value)}
                rows={3}
                className="field-input resize-none"
                placeholder="Ex. doublon avec ticket #ABC123, demande retirée par le client…"
                required
                minLength={3}
                maxLength={2000}
              />
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? 'Clôture…' : 'Fermer le ticket'}
            </button>
          </form>
        )}

        {pane === 'remind' && (
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => { setPane('menu'); setFeedback(null) }}
              className="text-xs text-slate-500 hover:underline"
            >
              ← Retour
            </button>
            <p className="rounded-2xl bg-amber-50 p-3 text-sm text-amber-900">
              Un email de relance sera envoyé à l&apos;adresse de contact de
              {currentSchoolLabel ? <> <strong>{currentSchoolLabel}</strong></> : ' l\'école assignée'}.
            </p>
            <button
              type="button"
              onClick={handleRemind}
              disabled={isPending}
              className="btn-primary w-full"
            >
              {isPending ? 'Envoi…' : 'Envoyer la relance'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
