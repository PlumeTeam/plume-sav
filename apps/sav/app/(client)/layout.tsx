import Link from 'next/link'
import { redirect } from 'next/navigation'
import { logoutAction } from '@/features/auth/actions'
import { PlumeLogo } from '@/app/_components/PlumeLogo'
import { getCurrentUser, getCurrentUserRoles } from '@/features/auth/queries'

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const [user, roles] = await Promise.all([getCurrentUser(), getCurrentUserRoles()])

  // Garde-fou rôle : un utilisateur école ou atelier ne doit pas pouvoir
  // accéder à l'espace client en tapant l'URL. plume_admin garde l'accès
  // (vue cross-rôle pour le support).
  if (!roles.includes('client') && !roles.includes('plume_admin')) {
    redirect('/select-dashboard')
  }

  const multiRole = roles.length > 1 || roles.includes('plume_admin')

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="sticky top-0 z-20 bg-brand-navy/95 backdrop-blur supports-[backdrop-filter]:bg-brand-navy/85">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <Link href="/client" aria-label="Plume SAV — accueil">
            <PlumeLogo size="sm" variant="light" withWordmark />
          </Link>
          <nav className="ml-auto flex items-center gap-1">
            {multiRole && (
              <Link
                href="/select-dashboard"
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors"
              >
                Changer d&apos;espace
              </Link>
            )}
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                aria-label="Se déconnecter"
              >
                Déconnexion
              </button>
            </form>
          </nav>
        </div>
      </header>

      <div className="mx-auto w-full max-w-2xl flex-1 pb-12">{children}</div>

      {user?.email && <span className="sr-only">{user.email}</span>}
    </div>
  )
}
