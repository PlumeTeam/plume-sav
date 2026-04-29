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
    <form ref={formRef} action={formAction} className="flex items-end gap-2 mt-2">
      <input type="hidden" name="ticketId" value={ticketId} />
      <textarea
        name="content"
        rows={2}
        placeholder="Envoyer un message…"
        className="field-input flex-1 resize-none"
        required
        maxLength={5000}
      />
      <SendButton />
      {state.error?._form?.[0] && (
        <p className="text-xs text-red-600">{state.error._form[0]}</p>
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
      className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white disabled:opacity-50"
      aria-label="Envoyer"
    >
      {pending ? '…' : '↑'}
    </button>
  )
}
