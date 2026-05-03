import type { Metadata } from 'next'
import { LoginForm } from '@/features/auth/components/LoginForm'

export const metadata: Metadata = { title: 'Connexion' }

export default function LoginPage() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const envOK = !!url && !!key && url.startsWith('http')

  return (
    <>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-brand-ink">Bienvenue</h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Connectez-vous pour suivre vos demandes SAV.
        </p>
      </div>

      {!envOK && (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          <p className="font-semibold">Configuration manquante</p>
          <p className="mt-1">
            Les clés Supabase ne sont pas configurées sur ce déploiement.
            La connexion ne fonctionnera pas tant que <code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code> et{' '}
            <code className="font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> ne seront pas définies.
          </p>
        </div>
      )}

      <LoginForm />
    </>
  )
}
