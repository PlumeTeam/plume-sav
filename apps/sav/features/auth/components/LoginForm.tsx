'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { loginAction, type LoginFormState } from '../actions'

const initialState: LoginFormState = { error: null }

export function LoginForm() {
  const [state, formAction] = useFormState(loginAction, initialState)

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="mt-1 block w-full rounded-md border px-3 py-2 text-sm"
        />
        {state.error?.email?.[0] && (
          <p className="mt-1 text-sm text-red-600">{state.error.email[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium">
          Mot de passe
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="mt-1 block w-full rounded-md border px-3 py-2 text-sm"
        />
        {state.error?.password?.[0] && (
          <p className="mt-1 text-sm text-red-600">{state.error.password[0]}</p>
        )}
      </div>

      {state.error?._form?.[0] && (
        <p className="text-sm text-red-600" role="alert">
          {state.error._form[0]}
        </p>
      )}

      <SubmitButton />
    </form>
  )
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-50"
    >
      {pending ? 'Connexion…' : 'Se connecter'}
    </button>
  )
}
