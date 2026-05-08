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
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-brand-ink">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          placeholder="vous@domaine.com"
          className="field-input"
        />
        {state.error?.email?.[0] && (
          <p className="mt-1 text-xs text-red-600">{state.error.email[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-brand-ink">
          Mot de passe
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
          className="field-input"
        />
        {state.error?.password?.[0] && (
          <p className="mt-1 text-xs text-red-600">{state.error.password[0]}</p>
        )}
      </div>

      <div className="flex justify-center pt-1">
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
        <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700" role="alert">
          Le widget de sécurité ne peut pas se charger sur ce domaine. Contactez
          l&apos;administrateur pour ajouter ce domaine à Cloudflare Turnstile.
        </p>
      )}

      {state.error?._form?.[0] && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {state.error._form[0]}
        </p>
      )}

      <SubmitButton captchaReady={!!captchaToken} />

      <p className="text-center text-xs text-slate-500">
        Pas encore de compte ? Contactez votre école partenaire ou{' '}
        <a href="mailto:sav@plumeparagliders.com" className="font-medium text-brand-gold hover:underline">
          sav@plumeparagliders.com
        </a>
      </p>
    </form>
  )
}

function SubmitButton({ captchaReady }: { captchaReady: boolean }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending || !captchaReady} className="btn-primary w-full">
      {pending ? 'Connexion…' : 'Se connecter'}
    </button>
  )
}
