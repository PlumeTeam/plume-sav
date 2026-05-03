'use client'

import { useTransition, useState } from 'react'
import {
  updateTicketStatusAction,
  addRoleMessageAction,
  saveDiagnosisAction,
} from '@/features/tickets/actions'
import type { RequestStatus } from '@/features/tickets/types'

interface WorkshopActionBarProps {
  ticketId: string
  currentStatus: RequestStatus
  diagnosisNotes: string | null
  estimatedCost: number | null
  estimatedHours: number | null
  partsNeeded: string | null
}

const STATUS_TRANSITIONS: Partial<Record<RequestStatus, Array<{ label: string; newStatus: RequestStatus }>>> = {
  approved:   [{ label: 'Marquer comme réparé', newStatus: 'completed' }],
}

export function WorkshopActionBar({
  ticketId,
  currentStatus,
  diagnosisNotes,
  estimatedCost,
  estimatedHours,
  partsNeeded,
}: WorkshopActionBarProps) {
  const [isPending, startTransition] = useTransition()
  const [showMessage, setShowMessage] = useState(false)
  const [showDiagnosis, setShowDiagnosis] = useState(false)
  const [messageContent, setMessageContent] = useState('')
  const [isInternal, setIsInternal] = useState(true)
  const [notes, setNotes] = useState(diagnosisNotes ?? '')
  const [cost, setCost] = useState(estimatedCost?.toString() ?? '')
  const [hours, setHours] = useState(estimatedHours?.toString() ?? '')
  const [parts, setParts] = useState(partsNeeded ?? '')
  const [feedback, setFeedback] = useState<{ type: 'error' | 'ok'; msg: string } | null>(null)

  const transitions = STATUS_TRANSITIONS[currentStatus] ?? []

  function handleStatusChange(newStatus: RequestStatus) {
    startTransition(async () => {
      const fd = new FormData()
      fd.set('ticketId', ticketId)
      fd.set('newStatus', newStatus)
      const result = await updateTicketStatusAction(fd)
      if (result?.error) setFeedback({ type: 'error', msg: 'Erreur statut.' })
    })
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const fd = new FormData()
      fd.set('ticketId', ticketId)
      fd.set('content', messageContent)
      fd.set('isInternal', String(isInternal))
      fd.set('senderRole', 'workshop')
      const result = await addRoleMessageAction(fd)
      if (result?.error) {
        setFeedback({ type: 'error', msg: "Erreur envoi." })
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
      fd.set('estimatedCost', cost)
      fd.set('estimatedHours', hours)
      fd.set('partsNeeded', parts)
      const result = await saveDiagnosisAction(fd)
      if (result?.error) {
        setFeedback({ type: 'error', msg: 'Erreur sauvegarde.' })
      } else {
        setShowDiagnosis(false)
        setFeedback({ type: 'ok', msg: 'Diagnostic sauvegardé.' })
      }
    })
  }

  return (
    <div className="space-y-3">
      {feedback && (
        <p className={`rounded-xl px-3 py-2 text-sm ${
          feedback.type === 'ok'
            ? 'bg-green-50 text-green-700'
            : 'bg-red-50 text-red-700'
        }`}>
          {feedback.msg}
        </p>
      )}

      {/* Status transitions */}
      {transitions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {transitions.map(({ label, newStatus }) => (
            <button
              key={newStatus}
              onClick={() => handleStatusChange(newStatus)}
              disabled={isPending}
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Quick action buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => { setShowDiagnosis(!showDiagnosis); setShowMessage(false) }}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700"
        >
          {showDiagnosis ? 'Fermer diagnostic' : 'Saisir diagnostic'}
        </button>
        <button
          onClick={() => { setShowMessage(!showMessage); setShowDiagnosis(false) }}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700"
        >
          {showMessage ? 'Annuler message' : 'Envoyer message'}
        </button>
      </div>

      {/* Diagnosis form */}
      {showDiagnosis && (
        <form onSubmit={handleSaveDiagnosis} className="space-y-3 rounded-2xl bg-slate-50 p-4">
          <h3 className="text-sm font-semibold text-slate-900">Diagnostic technicien</h3>
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
                type="number"
                min="0"
                step="0.5"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className="field-input"
                placeholder="0"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">Coût estimé (€)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className="field-input"
                placeholder="0.00"
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
          <button
            type="submit"
            disabled={isPending}
            className="btn-primary w-full disabled:opacity-50"
          >
            {isPending ? 'Sauvegarde…' : 'Sauvegarder le diagnostic'}
          </button>
        </form>
      )}

      {/* Message form */}
      {showMessage && (
        <form onSubmit={handleSendMessage} className="space-y-3 rounded-2xl bg-slate-50 p-4">
          <div className="flex items-center gap-2">
            <input
              id="ws-internal"
              type="checkbox"
              checked={isInternal}
              onChange={(e) => setIsInternal(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            <label htmlFor="ws-internal" className="text-sm text-slate-600">
              Commentaire interne
            </label>
          </div>
          <textarea
            value={messageContent}
            onChange={(e) => setMessageContent(e.target.value)}
            placeholder={isInternal ? 'Note interne atelier…' : 'Message au client ou à l\'école…'}
            rows={3}
            className="field-input resize-none"
            required
          />
          <button type="submit" disabled={isPending || !messageContent.trim()} className="btn-primary w-full disabled:opacity-50">
            {isPending ? 'Envoi…' : 'Envoyer'}
          </button>
        </form>
      )}
    </div>
  )
}
