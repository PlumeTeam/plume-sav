'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { useEffect, useRef, useState } from 'react'
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile'
import { loginAction, type LoginFormState } from '../actions'

const TURNSTILE_SITE_KEY =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '0x4AAAAAAB9Gpk5pYILNvYaj'

const initialState: LoginFormState = { error: null }

export function LoginForm() {
  const [state, formAction] = useFormState(loginAction, initialState)
  const [captchaToken, setCaptchaToken] = useState('')
  const [turnstileError, setTurnstileError] = useState(false)
  const turnstileRef = useRef<TurnstileInstance>(null)

  useEffect(() => {
    if (state.error) {
      turnstileRef.current?.reset()
      setCaptchaToken('')
      setTurnstileError(false)
    }
  }, [state.error])

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="captchaToken" value={captchaToken} readOnly />

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

      <div className="flex justify-center py-1">
        <Turnstile
          ref={turnstileRef}
          siteKey={TURNSTILE_SITE_KEY}
          onSuccess={(token) => { setCaptchaToken(token); setTurnstileError(false) }}
          onError={() => { setCaptchaToken(''); setTurnstileError(true) }}
          onExpire={() => { setCaptchaToken(''); setTurnstileError(false) }}
          options={{ theme: 'light', size: 'normal' }}
        />
      </div>

      {turnstileError && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700" role="alert">
          Le widget de sécurité ne peut pas se charger sur ce domaine. Contactez
          l&apos;administrateur pour ajouter ce domaine à Cloudflare Turnstile.
        </p>
      )}

      {state.error?._form?.[0] && (
        <p className="text-sm text-red-600" role="alert">
          {state.error._form[0]}
        </p>
      )}

      <SubmitButton captchaReady={!!captchaToken} />
    </form>
  )
}

function SubmitButton({ captchaReady }: { captchaReady: boolean }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending || !captchaReady}
      className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-50"
    >
      {pending ? 'Connexion…' : 'Se connecter'}
    </button>
  )
}
