'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { addRoleMessageAction } from '@/features/tickets/actions'

type Channel = 'client' | 'workshop'

interface SchoolActionsProps {
  ticketId:           string
  isCheckValidated:   boolean
}

export function SchoolActions({ ticketId, isCheckValidated }: SchoolActionsProps) {
  const [open, setOpen] = useState<Channel | null>(null)

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {/* Communiquer avec le client */}
        <button
          type="button"
          onClick={() => setOpen(open === 'client' ? null : 'client')}
          className={`card flex flex-col items-start gap-2 p-5 text-left transition-all hover:-translate-y-0.5 ${
            open === 'client' ? 'border-2 border-brand-coral bg-brand-coral/5 shadow-plume' : ''
          }`}
        >
          <span aria-hidden className="text-3xl">💬</span>
          <p className="text-sm font-semibold text-brand-ink">Communiquer avec le client</p>
          <p className="text-xs text-slate-500">
            Message visible par le client (et par toute l&apos;équipe Plume).
          </p>
        </button>

        {/* Communiquer avec l'atelier */}
        <button
          type="button"
          onClick={() => setOpen(open === 'workshop' ? null : 'workshop')}
          className={`card flex flex-col items-start gap-2 p-5 text-left transition-all hover:-translate-y-0.5 ${
            open === 'workshop' ? 'border-2 border-brand-coral bg-brand-coral/5 shadow-plume' : ''
          }`}
        >
          <span aria-hidden className="text-3xl">🛠️</span>
          <p className="text-sm font-semibold text-brand-ink">Communiquer avec l&apos;atelier</p>
          <p className="text-xs text-slate-500">
            Échange interne école ↔ atelier. Le client ne voit pas ce message.
          </p>
        </button>

        {/* Checker l'aile */}
        <Link
          href={`/school/ticket/${ticketId}/check`}
          className="card flex flex-col items-start gap-2 p-5 text-left transition-all hover:-translate-y-0.5"
        >
          <div className="flex w-full items-start justify-between">
            <span aria-hidden className="text-3xl">🔍</span>
            {isCheckValidated && (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                ✓ Check validé
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-brand-ink">Checker l&apos;aile</p>
          <p className="text-xs text-slate-500">
            {isCheckValidated
              ? 'Diagnostic réalisé. Cliquez pour voir ou modifier.'
              : 'Lancer la checklist de diagnostic.'}
          </p>
        </Link>
      </div>

      {open === 'client'   && <Composer key="client"   ticketId={ticketId} channel="client"   onClose={() => setOpen(null)} />}
      {open === 'workshop' && <Composer key="workshop" ticketId={ticketId} channel="workshop" onClose={() => setOpen(null)} />}
    </div>
  )
}

function Composer({
  ticketId,
  channel,
  onClose,
}: {
  ticketId: string
  channel:  Channel
  onClose:  () => void
}) {
  const [isPending, startTransition] = useTransition()
  const [content, setContent] = useState('')
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'error'; msg: string } | null>(null)

  const isWorkshop = channel === 'workshop'
  const visibility = isWorkshop ? 'workshop_plume' : 'all'

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return
    startTransition(async () => {
      const fd = new FormData()
      fd.set('ticketId',        ticketId)
      fd.set('content',         content.trim())
      fd.set('isInternal',      isWorkshop ? 'true' : 'false')
      fd.set('senderRole',      'school')
      fd.set('visibilityLevel', visibility)

      const r = await addRoleMessageAction(fd)
      if (r?.error) {
        const err = r.error as Record<string, string[] | undefined>
        const msg = err._form?.[0] ?? err.content?.[0] ?? 'Erreur lors de l\'envoi.'
        setFeedback({ type: 'error', msg })
      } else {
        setContent('')
        setFeedback({ type: 'ok', msg: '✓ Message envoyé.' })
        setTimeout(() => { setFeedback(null); onClose() }, 1500)
      }
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="card animate-slide-up space-y-3 p-5"
    >
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-semibold text-brand-ink">
          {isWorkshop ? 'Message à l\'atelier' : 'Message au client'}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-slate-500 hover:text-brand-ink"
        >
          Annuler
        </button>
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        autoFocus
        maxLength={5000}
        placeholder={isWorkshop
          ? "Synthèse pour l'atelier, contexte, points d'attention…"
          : 'Question, mise à jour, demande de précision…'}
        className="field-input resize-none"
        required
      />

      {feedback && (
        <p className={`rounded-xl px-3 py-2 text-sm ${
          feedback.type === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
        }`}>
          {feedback.msg}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending || !content.trim()}
        className="btn-primary w-full"
      >
        {isPending ? 'Envoi…' : `Envoyer ${isWorkshop ? "à l'atelier" : 'au client'}`}
      </button>
    </form>
  )
}
