'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import {
  addRoleMessageAction,
  assignWorkshopForCommunicationAction,
} from '@/features/tickets/actions'
import { PARTNER_WORKSHOPS } from '@/features/tickets/constants'

// Leaflet must not run on the server (window/document access).
const WorkshopMapPicker = dynamic(
  () => import('@/features/tickets/components/WorkshopMapPicker'),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[320px] items-center justify-center rounded-2xl bg-brand-cream text-sm text-slate-400">
        Chargement de la carte…
      </div>
    ),
  }
)

type Channel = 'client' | 'workshop'
type CardKey = 'client' | 'workshop' | 'check'

interface SchoolActionsProps {
  ticketId:              string
  isCheckValidated:      boolean
  assignedWorkshopId:    string | null
  assignedWorkshopLabel: string | null
  /**
   * Which cards to render. Defaults to all three. Used by the tabbed page to
   * show only the workshop+check pair in the "Check aile" tab — client comm
   * lives in its own dedicated tab.
   */
  cards?:                CardKey[]
}

export function SchoolActions({
  ticketId,
  isCheckValidated,
  assignedWorkshopId,
  assignedWorkshopLabel,
  cards = ['client', 'workshop', 'check'],
}: SchoolActionsProps) {
  const [open, setOpen] = useState<Channel | null>(null)

  // Local optimistic copy of the workshop assignment so the picker can
  // hand off to the composer without a full page reload.
  const [workshop, setWorkshop] = useState<{ id: string; label: string } | null>(
    assignedWorkshopId && assignedWorkshopLabel
      ? { id: assignedWorkshopId, label: assignedWorkshopLabel }
      : null
  )

  const showClient   = cards.includes('client')
  const showWorkshop = cards.includes('workshop')
  const showCheck    = cards.includes('check')

  // Auto-fit the grid to the number of visible cards so a 1- or 2-card
  // layout doesn't leave empty columns.
  const visibleCount = (showClient ? 1 : 0) + (showWorkshop ? 1 : 0) + (showCheck ? 1 : 0)
  const gridCols =
    visibleCount === 1 ? 'sm:grid-cols-1'
    : visibleCount === 2 ? 'sm:grid-cols-2'
    : 'sm:grid-cols-3'

  return (
    <div className="space-y-3">
      <div className={`grid grid-cols-1 gap-3 ${gridCols}`}>
        {/* Communiquer avec le client */}
        {showClient && (
          <button
            type="button"
            onClick={() => setOpen(open === 'client' ? null : 'client')}
            className={`card flex flex-col items-start gap-2 p-5 text-left transition-all hover:-translate-y-0.5 ${
              open === 'client' ? 'border-2 border-brand-gold bg-brand-gold/5 shadow-plume' : ''
            }`}
          >
            <span aria-hidden className="text-3xl">💬</span>
            <p className="text-sm font-semibold text-brand-ink">Communiquer avec le client</p>
            <p className="text-xs text-slate-500">
              Message visible par le client (et par toute l&apos;équipe Plume).
            </p>
          </button>
        )}

        {/* Communiquer avec l'atelier */}
        {showWorkshop && (
          <button
            type="button"
            onClick={() => setOpen(open === 'workshop' ? null : 'workshop')}
            className={`card flex flex-col items-start gap-2 p-5 text-left transition-all hover:-translate-y-0.5 ${
              open === 'workshop' ? 'border-2 border-brand-gold bg-brand-gold/5 shadow-plume' : ''
            }`}
          >
            <span aria-hidden className="text-3xl">🛠️</span>
            <p className="text-sm font-semibold text-brand-ink">Communiquer avec l&apos;atelier</p>
            <p className="text-xs text-slate-500">
              {workshop
                ? <>Atelier&nbsp;: <strong>{workshop.label}</strong></>
                : 'Choisissez un atelier puis échangez. Le client ne voit pas.'}
            </p>
          </button>
        )}

        {/* Checker l'aile */}
        {showCheck && (
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
        )}
      </div>

      {showClient && open === 'client' && (
        <ClientComposer ticketId={ticketId} onClose={() => setOpen(null)} />
      )}

      {showWorkshop && open === 'workshop' && (
        <WorkshopComposer
          ticketId={ticketId}
          workshop={workshop}
          onPicked={(w) => setWorkshop(w)}
          onClose={() => setOpen(null)}
        />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CLIENT — public message
// ─────────────────────────────────────────────────────────────────────────────

function ClientComposer({ ticketId, onClose }: { ticketId: string; onClose: () => void }) {
  const [isPending, startTransition] = useTransition()
  const [content, setContent] = useState('')
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'error'; msg: string } | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return
    startTransition(async () => {
      const fd = new FormData()
      fd.set('ticketId',        ticketId)
      fd.set('content',         content.trim())
      fd.set('isInternal',      'false')
      fd.set('senderRole',      'school')
      fd.set('visibilityLevel', 'all')

      const r = await addRoleMessageAction(fd)
      if (r?.error) {
        const err = r.error as Record<string, string[] | undefined>
        const msg = err._form?.[0] ?? err.content?.[0] ?? "Erreur lors de l'envoi."
        setFeedback({ type: 'error', msg })
      } else {
        setContent('')
        setFeedback({ type: 'ok', msg: '✓ Message envoyé.' })
        setTimeout(() => { setFeedback(null); onClose() }, 1500)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="card animate-slide-up space-y-3 p-5">
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-semibold text-brand-ink">Message au client</p>
        <button type="button" onClick={onClose} className="text-xs text-slate-500 hover:text-brand-ink">
          Annuler
        </button>
      </div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        autoFocus
        maxLength={5000}
        placeholder="Question, mise à jour, demande de précision…"
        className="field-input resize-none"
        required
      />
      {feedback && (
        <p className={`rounded-xl px-3 py-2 text-sm ${
          feedback.type === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
        }`}>{feedback.msg}</p>
      )}
      <button type="submit" disabled={isPending || !content.trim()} className="btn-primary w-full">
        {isPending ? 'Envoi…' : 'Envoyer au client'}
      </button>
    </form>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// WORKSHOP — picker first (if needed), then internal-channel message
// ─────────────────────────────────────────────────────────────────────────────

interface WorkshopComposerProps {
  ticketId: string
  workshop: { id: string; label: string } | null
  onPicked: (w: { id: string; label: string }) => void
  onClose:  () => void
}

// Only affiliated workshops are exposed to the school — non-affiliated entries
// in PARTNER_WORKSHOPS exist for context/future use but aren't pickable here.
const AFFILIATED_WORKSHOPS = PARTNER_WORKSHOPS.filter((w) => w.affiliated)

function WorkshopComposer({ ticketId, workshop, onPicked, onClose }: WorkshopComposerProps) {
  const [step, setStep] = useState<'pick' | 'compose'>(workshop ? 'compose' : 'pick')
  const [pickedId, setPickedId] = useState<string>(workshop?.id ?? '')
  const [isPending, startTransition] = useTransition()
  const [content, setContent] = useState('')
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'error'; msg: string } | null>(null)

  function handlePick(e: React.FormEvent) {
    e.preventDefault()
    if (!pickedId) return
    const ws = AFFILIATED_WORKSHOPS.find((w) => w.id === pickedId)
    if (!ws) return

    startTransition(async () => {
      const fd = new FormData()
      fd.set('ticketId',      ticketId)
      fd.set('workshopId',    ws.id)
      fd.set('workshopLabel', ws.label)
      const r = await assignWorkshopForCommunicationAction(fd)
      if (r?.error) {
        const err = r.error as Record<string, string[] | undefined>
        const msg = err._form?.[0] ?? "Erreur lors de l'assignation."
        setFeedback({ type: 'error', msg })
      } else {
        onPicked({ id: ws.id, label: ws.label })
        setStep('compose')
        setFeedback(null)
      }
    })
  }

  function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim() || !workshop) return
    startTransition(async () => {
      const fd = new FormData()
      fd.set('ticketId',        ticketId)
      fd.set('content',         content.trim())
      fd.set('isInternal',      'true')
      fd.set('senderRole',      'school')
      fd.set('visibilityLevel', 'workshop_plume')

      const r = await addRoleMessageAction(fd)
      if (r?.error) {
        const err = r.error as Record<string, string[] | undefined>
        const msg = err._form?.[0] ?? err.content?.[0] ?? "Erreur lors de l'envoi."
        setFeedback({ type: 'error', msg })
      } else {
        setContent('')
        setFeedback({ type: 'ok', msg: '✓ Message envoyé.' })
        setTimeout(() => { setFeedback(null); onClose() }, 1500)
      }
    })
  }

  // ── Step 1: Pick a workshop ─────────────────────────────────────────────
  if (step === 'pick') {
    return (
      <form onSubmit={handlePick} className="card animate-slide-up space-y-3 p-5">
        <div className="flex items-baseline justify-between">
          <p className="text-sm font-semibold text-brand-ink">Choisir un atelier du réseau</p>
          <button type="button" onClick={onClose} className="text-xs text-slate-500 hover:text-brand-ink">
            Annuler
          </button>
        </div>
        <p className="text-xs text-slate-500">
          Cet atelier sera votre interlocuteur sur ce ticket. Vous pourrez en changer
          en escaladant via le panneau Décision si besoin.
        </p>

        <WorkshopMapPicker
          workshops={AFFILIATED_WORKSHOPS}
          selectedId={pickedId || null}
          onSelect={setPickedId}
        />

        {/* Liste textuelle — fallback / clavier / lisibilité */}
        <div className="space-y-2">
          {AFFILIATED_WORKSHOPS.map((w) => {
            const isSelected = pickedId === w.id
            return (
              <button
                key={w.id}
                type="button"
                onClick={() => setPickedId(w.id)}
                className={`flex w-full items-start gap-3 rounded-xl border-2 p-3 text-left transition-all active:scale-[0.99] ${
                  isSelected
                    ? 'border-brand-gold bg-brand-gold/10 shadow-plume'
                    : 'border-brand-stone bg-white hover:border-brand-gold/40'
                }`}
              >
                <span aria-hidden className="text-2xl">🛠️</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-brand-ink">{w.label}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{w.city} · {w.region}</p>
                </div>
                {isSelected && <span className="text-brand-gold text-lg" aria-hidden>✓</span>}
              </button>
            )
          })}
        </div>

        {feedback && feedback.type === 'error' && (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{feedback.msg}</p>
        )}

        <button type="submit" disabled={isPending || !pickedId} className="btn-primary w-full">
          {isPending ? 'Assignation…' : 'Continuer vers le message'}
        </button>
      </form>
    )
  }

  // ── Step 2: Compose ─────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSend} className="card animate-slide-up space-y-3 p-5">
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-semibold text-brand-ink">
          Message à <span className="text-brand-gold">{workshop?.label}</span>
        </p>
        <button type="button" onClick={onClose} className="text-xs text-slate-500 hover:text-brand-ink">
          Annuler
        </button>
      </div>

      <button
        type="button"
        onClick={() => setStep('pick')}
        className="text-left text-xs text-slate-500 underline underline-offset-2 hover:text-brand-ink"
      >
        Changer d&apos;atelier
      </button>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        autoFocus
        maxLength={5000}
        placeholder="Synthèse pour l'atelier, contexte, points d'attention…"
        className="field-input resize-none"
        required
      />

      {feedback && (
        <p className={`rounded-xl px-3 py-2 text-sm ${
          feedback.type === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
        }`}>{feedback.msg}</p>
      )}

      <button type="submit" disabled={isPending || !content.trim()} className="btn-primary w-full">
        {isPending ? 'Envoi…' : `Envoyer à ${workshop?.label ?? "l'atelier"}`}
      </button>
    </form>
  )
}
