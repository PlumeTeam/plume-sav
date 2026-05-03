import type { Metadata } from 'next'
import { LoginForm } from '@/features/auth/components/LoginForm'

export const metadata: Metadata = { title: 'Connexion' }

export default function LoginPage() {
  return (
    <>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-brand-ink">Bienvenue</h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Connectez-vous pour suivre vos demandes SAV.
        </p>
      </div>
      <LoginForm />
    </>
  )
}
