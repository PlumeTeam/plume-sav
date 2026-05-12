'use client'

import { useState, useTransition } from 'react'
import dynamic from 'next/dynamic'
import {
  addRoleMessageAction,
  assignWorkshopForCommunicationAction,
} from '@/features/tickets/actions'
import { PARTNER_WORKSHOPS } from '@/features/tickets/constants'
import { CommentThread } from '@/features/tickets/components/CommentThread'
import type { TicketMessage } from '@/features/tickets/types'

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

const AFFILIATED_WORKSHOPS = PARTNER_WORKSHOPS.filter((w) => w.affiliated)

interface SchoolWorkshopChannelProps {
  ticketId:              string
  /** Messages déjà filtrés sur visibility_level='workshop_plume'. */
  messages:              TicketMessage[]
  assignedWorkshopId:    string | null
  assignedWorkshopLabel: string | null
}

/**
 * Sous-onglet "Avec l'atelier" du panneau Messages école.
 *
 * Tant qu'aucun atelier n'est sélectionné on affiche un picker (carte + liste)
 * dans le flux du chat. Une fois choisi, on déroule le thread et le composer.
 * L'école peut changer d'atelier à tout moment via le bouton "Changer d'atelier" :
 * cela re-déclenche assignWorkshopForCommunicationAction et bascule l'atelier
 * destinataire pour les prochains messages.
 *
 * Limitation actuelle : tous les messages `workshop_plume` du ticket sont
 * partagés (la colonne target_workshop_id n'existe pas encore). En clair,
 * l'historique avec l'atelier précédent reste visible pour le nouvel atelier
 * une fois assigné. Une migration ajoutera ce filtrage par atelier.
 */
export function SchoolWorkshopChannel({
  ticketId,
  messages,
  assignedWorkshopId,
  assignedWorkshopLabel,
}: SchoolWorkshopChannelProps) {
  const [showPicker, setShowPicker] = useState<boolean>(!assignedWorkshopId)

  if (showPicker || !assignedWorkshopId) {
    return (
      <PickerView
        ticketId={ticketId}
        initialId={assignedWorkshopId}
        onCancel={assignedWorkshopId ? () => setShowPicker(false) : null}
        onAssigned={() => setShowPicker(false)}
      />
    )
  }

  return (
    <ConversationView
      ticketId={ticketId}
      messages={messages}
      workshopLabel={assignedWorkshopLabel ?? assignedWorkshopId}
      onChangeWorkshop={() => setShowPicker(true)}
    />
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Picker — affiché tant qu'aucun atelier n'est assigné OU quand l'école
// demande à changer d'atelier.
// ─────────────────────────────────────────────────────────────────────────────

interface PickerViewProps {
  ticketId:    string
  initialId:   string | null
  onCancel:    (() => void) | null
  onAssigned:  () => void
}

function PickerView({ ticketId, initialId, onCancel, onAssigned }: PickerViewProps) {
  const [pickedId, setPickedId] = useState<string>(initialId ?? '')
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'error'; msg: string } | null>(null)

  function handleSubmit(e: React.FormEvent) {
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
        setFeedback(null)
        onAssigned()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="card animate-slide-up space-y-3 p-5">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="section-title">
          {initialId ? "Changer d'atelier" : "Choisir un atelier du réseau"}
        </h2>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-xs text-slate-500 hover:text-brand-ink"
          >
            Annuler
          </button>
        )}
      </div>
      <p className="text-xs text-slate-500">
        Cet atelier sera votre interlocuteur sur ce ticket. Vous pourrez en changer à tout moment.
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
        {isPending
          ? 'Assignation…'
          : initialId
            ? "Changer pour cet atelier"
            : 'Continuer vers la conversation'}
      </button>
    </form>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Conversation — thread + composer + bouton "Changer d'atelier" en tête.
// ─────────────────────────────────────────────────────────────────────────────

interface ConversationViewProps {
  ticketId:         string
  messages:         TicketMessage[]
  workshopLabel:    string
  onChangeWorkshop: () => void
}

function ConversationView({
  ticketId,
  messages,
  workshopLabel,
  onChangeWorkshop,
}: ConversationViewProps) {
  return (
    <div className="space-y-3">
      <section className="card p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="section-title flex items-center gap-2">
              <span aria-hidden>🛠️</span>
              <span>Avec l&apos;atelier</span>
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Interlocuteur : <strong className="text-brand-ink">{workshopLabel}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onChangeWorkshop}
            className="rounded-xl border border-brand-stone bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-brand-gold/40 hover:text-brand-ink"
          >
            Changer d&apos;atelier
          </button>
        </div>
        <CommentThread
          messages={messages}
          ownRoles={['school']}
          showInternalBadge
          emptyText="Aucun échange avec cet atelier pour le moment."
        />
      </section>

      <WorkshopComposer ticketId={ticketId} workshopLabel={workshopLabel} />
    </div>
  )
}

function WorkshopComposer({ ticketId, workshopLabel }: { ticketId: string; workshopLabel: string }) {
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
      fd.set('isInternal',      'true')
      fd.set('senderRole',      'school')
      fd.set('visibilityLevel', 'workshop_plume')
      fd.set('channel',         'workshop_school')

      const r = await addRoleMessageAction(fd)
      if (r?.error) {
        const err = r.error as Record<string, string[] | undefined>
        const msg = err._form?.[0] ?? err.content?.[0] ?? "Erreur lors de l'envoi."
        setFeedback({ type: 'error', msg })
      } else {
        setContent('')
        setFeedback({ type: 'ok', msg: '✓ Message envoyé.' })
        setTimeout(() => setFeedback(null), 2000)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-3 p-5">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-sm font-semibold text-brand-ink">Envoyer à {workshopLabel}</p>
        <p className="text-[11px] text-slate-500">
          Visible par l&apos;atelier &amp; Plume HQ — le client ne voit pas.
        </p>
      </div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        maxLength={5000}
        placeholder="Question technique, demande d'avis, coordination…"
        className="field-input resize-none"
        required
      />
      {feedback && (
        <p className={`rounded-xl px-3 py-2 text-sm ${
          feedback.type === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
        }`}>{feedback.msg}</p>
      )}
      <button
        type="submit"
        disabled={isPending || !content.trim()}
        className="btn-primary w-full sm:w-auto"
      >
        {isPending ? 'Envoi…' : `Envoyer à ${workshopLabel}`}
      </button>
    </form>
  )
}
