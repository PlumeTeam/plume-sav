'use client'

import { useTransition, useState } from 'react'
import {
  addRoleMessageAction,
  saveDiagnosisAction,
} from '@/features/tickets/actions'

interface WorkshopActionBarProps {
  ticketId: string
  diagnosisNotes: string | null
  estimatedCost:  number | null
  estimatedHours: number | null
  partsNeeded:    string | null
}

// Niveau de visibilité d'un message atelier — détermine qui voit quoi.
type MessageAudience = 'all' | 'workshop_plume' | 'plume_only'

const AUDIENCE_OPTIONS: Array<{
  value: MessageAudience
  label: string
  hint:  string
}> = [
  {
    value: 'all',
    label: 'Tout le monde',
    hint:  "Visible par le client, l'école et Plume HQ.",
  },
  {
    value: 'workshop_plume',
    label: 'École & Plume HQ',
    hint:  "Discussion technique interne — le client ne voit pas.",
  },
  {
    value: 'plume_only',
    label: 'Plume HQ uniquement',
    hint:  "Note privée pour Plume — école et client ne voient pas.",
  },
]

export function WorkshopActionBar({
  ticketId,
  diagnosisNotes,
  estimatedCost,
  estimatedHours,
  partsNeeded,
}: WorkshopActionBarProps) {
  const [isPending, startTransition] = useTransition()
  const [showMessage,   setShowMessage]   = useState(false)
  const [showDiagnosis, setShowDiagnosis] = useState(false)
  const [messageContent, setMessageContent] = useState('')
  // Par défaut, la majorité des messages atelier vont au client/école
  // (mises à jour de progression). Les autres niveaux nécessitent un opt-in.
  const [audience, setAudience] = useState<MessageAudience>('all')
  const [notes, setNotes] = useState(diagnosisNotes ?? '')
  const [cost,  setCost]  = useState(estimatedCost?.toString() ?? '')
  const [hours, setHours] = useState(estimatedHours?.toString() ?? '')
  const [parts, setParts] = useState(partsNeeded ?? '')
  const [feedback, setFeedback] = useState<{ type: 'error' | 'ok'; msg: string } | null>(null)

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const fd = new FormData()
      fd.set('ticketId',        ticketId)
      fd.set('content',         messageContent)
      fd.set('isInternal',      String(audience !== 'all'))
      fd.set('senderRole',      'workshop')
      fd.set('visibilityLevel', audience)
      const result = await addRoleMessageAction(fd)
      if (result?.error) {
        const err = result.error as Record<string, string[] | undefined>
        const msg = err._form?.[0] ?? err.content?.[0] ?? "Erreur envoi."
        setFeedback({ type: 'error', msg })
      } else {
        setMessageContent('')
        setShowMessage(false)
        setFeedback({ type: 'ok', msg: 'Message envoyé.' })
      }
    })
  }

  async function handleSaveDiagnosis(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const fd = new FormData()
      fd.set('ticketId', ticketId)
      fd.set('diagnosisNotes', notes)
      fd.set('estimatedCost',  cost)
      fd.set('estimatedHours', hours)
      fd.set('partsNeeded',    parts)
      const result = await saveDiagnosisAction(fd)
      if (result?.error) setFeedback({ type: 'error', msg: 'Erreur sauvegarde.' })
      else {
        setShowDiagnosis(false)
        setFeedback({ type: 'ok', msg: 'Diagnostic sauvegardé.' })
      }
    })
  }

  return (
    <div className="space-y-3">
      {feedback && (
        <p className={`rounded-xl px-3 py-2 text-sm ${
          feedback.type === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
        }`}>
          {feedback.msg}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => { setShowDiagnosis(!showDiagnosis); setShowMessage(false) }}
          className="btn-secondary"
        >
          {showDiagnosis ? 'Fermer diagnostic' : '🔧 Saisir diagnostic'}
        </button>
        <button
          onClick={() => { setShowMessage(!showMessage); setShowDiagnosis(false) }}
          className="btn-secondary"
        >
          {showMessage ? 'Annuler message' : '✉️ Envoyer message'}
        </button>
      </div>

      {showDiagnosis && (
        <form onSubmit={handleSaveDiagnosis} className="space-y-3 rounded-2xl bg-brand-cream p-4">
          <h3 className="text-sm font-semibold text-brand-ink">Diagnostic technicien</h3>
          <div>
            <label className="mb-1 block text-xs text-slate-500">Notes de diagnostic</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="field-input resize-none"
              placeholder="Observations, causes, interventions prévues…"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-slate-500">Heures estimées</label>
              <input
                type="number" min="0" step="0.5"
                value={hours} onChange={(e) => setHours(e.target.value)}
                className="field-input" placeholder="0"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">Coût estimé (€)</label>
              <input
                type="number" min="0" step="0.01"
                value={cost} onChange={(e) => setCost(e.target.value)}
                className="field-input" placeholder="0.00"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">Pièces nécessaires</label>
            <textarea
              value={parts}
              onChange={(e) => setParts(e.target.value)}
              rows={2}
              className="field-input resize-none"
              placeholder="Liste des pièces…"
            />
          </div>
          <button type="submit" disabled={isPending} className="btn-primary w-full">
            {isPending ? 'Sauvegarde…' : 'Sauvegarder le diagnostic'}
          </button>
        </form>
      )}

      {showMessage && (
        <form onSubmit={handleSendMessage} className="space-y-3 rounded-2xl bg-brand-cream p-4">
          <fieldset className="space-y-2">
            <legend className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              Destinataires
            </legend>
            <div className="space-y-1.5">
              {AUDIENCE_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex cursor-pointer items-start gap-2 rounded-xl border p-2.5 transition-colors ${
                    audience === opt.value
                      ? 'border-brand-gold bg-brand-gold/10'
                      : 'border-brand-stone bg-white hover:bg-brand-cream/40'
                  }`}
                >
                  <input
                    type="radio"
                    name="ws-audience"
                    value={opt.value}
                    checked={audience === opt.value}
                    onChange={() => setAudience(opt.value)}
                    className="mt-0.5 h-4 w-4 border-brand-stone text-brand-gold focus:ring-brand-gold"
                  />
                  <span className="flex-1">
                    <span className="block text-sm font-medium text-brand-ink">{opt.label}</span>
                    <span className="block text-xs text-slate-500">{opt.hint}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <textarea
            value={messageContent}
            onChange={(e) => setMessageContent(e.target.value)}
            placeholder={
              audience === 'all'
                ? 'Message visible par le client…'
                : audience === 'workshop_plume'
                ? "Discussion technique avec l'école et Plume…"
                : 'Note interne pour Plume HQ…'
            }
            rows={3}
            maxLength={5000}
            className="field-input resize-none"
            required
          />
          <button type="submit" disabled={isPending || !messageContent.trim()} className="btn-primary w-full">
            {isPending ? 'Envoi…' : 'Envoyer'}
          </button>
        </form>
      )}
    </div>
  )
}
