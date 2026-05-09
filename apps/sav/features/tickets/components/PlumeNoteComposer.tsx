'use client'

import { useState, useTransition } from 'react'
import { addRoleMessageAction } from '@/features/tickets/actions'

type Audience = 'all' | 'school_plume' | 'workshop_plume' | 'plume_only'

const AUDIENCE_OPTIONS: Array<{ value: Audience; label: string; hint: string }> = [
  {
    value: 'all',
    label: 'Tout le monde',
    hint:  'Visible par le client, l’école, l’atelier et Plume HQ.',
  },
  {
    value: 'school_plume',
    label: 'École & Plume',
    hint:  'Discussion privée avec l’école — atelier et client ne voient pas.',
  },
  {
    value: 'workshop_plume',
    label: 'École, atelier & Plume',
    hint:  "Discussion technique sur le ticket — le client ne voit pas.",
  },
  {
    value: 'plume_only',
    label: 'Plume HQ uniquement',
    hint:  'Note privée HQ — école, atelier et client ne voient pas.',
  },
]

interface PlumeNoteComposerProps {
  ticketId: string
}

/**
 * Composer réservé au rôle plume_admin pour poster un message avec n'importe
 * quel niveau de visibilité. Le composant ne se rend qu'après vérification
 * serveur du rôle (cf. apps/sav/app/(school)/school/ticket/[id]/page.tsx où
 * il est inclus uniquement quand isPlumeAdmin === true).
 *
 * Le sender_role réel est dérivé serveur-side dans addRoleMessageAction —
 * le 'plume_admin' envoyé ici n'est qu'un hint, l'action override de toute
 * façon avec le rôle actif de l'utilisateur authentifié.
 */
export function PlumeNoteComposer({ ticketId }: PlumeNoteComposerProps) {
  const [isPending, startTransition] = useTransition()
  const [audience, setAudience] = useState<Audience>('plume_only')
  const [content, setContent] = useState('')
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'error'; msg: string } | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return
    startTransition(async () => {
      const fd = new FormData()
      fd.set('ticketId',        ticketId)
      fd.set('content',         content.trim())
      fd.set('isInternal',      String(audience !== 'all'))
      fd.set('senderRole',      'plume_admin')
      fd.set('visibilityLevel', audience)

      const r = await addRoleMessageAction(fd)
      if (r?.error) {
        const err = r.error as Record<string, string[] | undefined>
        const msg = err._form?.[0] ?? err.content?.[0] ?? "Erreur lors de l'envoi."
        setFeedback({ type: 'error', msg })
      } else {
        setContent('')
        setFeedback({ type: 'ok', msg: '✓ Message Plume envoyé.' })
        setTimeout(() => setFeedback(null), 2000)
      }
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="card space-y-3 border-2 border-brand-navy/20 bg-brand-navy/5 p-5"
    >
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-semibold text-brand-navy">🦅 Composer Plume HQ</p>
        <span className="rounded-full bg-brand-navy px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
          Admin
        </span>
      </div>

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
                  ? 'border-brand-navy bg-white'
                  : 'border-brand-stone bg-white/60 hover:bg-white'
              }`}
            >
              <input
                type="radio"
                name="plume-audience"
                value={opt.value}
                checked={audience === opt.value}
                onChange={() => setAudience(opt.value)}
                className="mt-0.5 h-4 w-4 border-brand-stone text-brand-navy focus:ring-brand-navy"
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
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        maxLength={5000}
        placeholder={
          audience === 'all'           ? 'Message public au nom de Plume…'
          : audience === 'school_plume' ? "Note privée à l'école…"
          : audience === 'workshop_plume' ? 'Note technique à l\'équipe (école+atelier)…'
          : 'Note privée HQ — uniquement visible par les autres admins Plume…'
        }
        className="field-input resize-none"
        required
      />
      {feedback && (
        <p
          className={`rounded-xl px-3 py-2 text-sm ${
            feedback.type === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
          }`}
        >
          {feedback.msg}
        </p>
      )}
      <button
        type="submit"
        disabled={isPending || !content.trim()}
        className="w-full rounded-full bg-brand-navy px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-navy/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? 'Envoi…' : 'Poster en tant que Plume HQ'}
      </button>
    </form>
  )
}
