'use client'

import { useEffect, useRef, useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { addMessageAction } from '@/features/tickets/actions'

interface MessageFormProps {
  ticketId: string
}

type MessageState = { error: { _form?: string[]; content?: string[] } | null; success?: boolean; ts?: number }
const initialState: MessageState = { error: null }

export function MessageForm({ ticketId }: MessageFormProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const [showSentToast, setShowSentToast] = useState(false)

  async function action(_prev: MessageState, formData: FormData): Promise<MessageState> {
    const result = await addMessageAction(formData)
    if (result?.error) return { error: result.error as MessageState['error'] }
    formRef.current?.reset()
    return { error: null, success: true, ts: Date.now() }
  }

  const [state, formAction] = useFormState(action, initialState)

  useEffect(() => {
    if (state.success) {
      setShowSentToast(true)
      const t = setTimeout(() => setShowSentToast(false), 2400)
      return () => clearTimeout(t)
    }
  }, [state.success, state.ts])

  return (
    <form ref={formRef} action={formAction} className="space-y-2">
      <input type="hidden" name="ticketId" value={ticketId} />
      <div className="flex items-end gap-2">
        <textarea
          name="content"
          rows={2}
          placeholder="Écrire un message à l’équipe…"
          className="field-input flex-1 resize-none"
          required
          maxLength={5000}
        />
        <SendButton />
      </div>
      {showSentToast && (
        <p
          className="rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-700 animate-fade-in"
          role="status"
        >
          ✓ Message envoyé
        </p>
      )}
      {state.error?._form?.[0] && (
        <p className="text-xs text-red-600">{state.error._form[0]}</p>
      )}
      {state.error?.content?.[0] && (
        <p className="text-xs text-red-600">{state.error.content[0]}</p>
      )}
    </form>
  )
}

function SendButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-brand-coral text-white shadow-plume disabled:opacity-50 hover:bg-brand-coral/90 transition-colors"
      aria-label="Envoyer le message"
    >
      {pending ? '…' : '↑'}
    </button>
  )
}
