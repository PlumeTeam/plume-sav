'use client'

import { useRef } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { addMessageAction } from '@/features/tickets/actions'

interface MessageFormProps {
  ticketId: string
}

type MessageState = { error: { _form?: string[]; content?: string[] } | null; success?: boolean }
const initialState: MessageState = { error: null }

export function MessageForm({ ticketId }: MessageFormProps) {
  const formRef = useRef<HTMLFormElement>(null)

  async function action(_prev: MessageState, formData: FormData): Promise<MessageState> {
    const result = await addMessageAction(formData)
    if (result?.error) return { error: result.error as MessageState['error'] }
    formRef.current?.reset()
    return { error: null, success: true }
  }

  const [state, formAction] = useFormState(action, initialState)

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
      aria-label="Envoyer"
    >
      {pending ? '…' : '↑'}
    </button>
  )
}
