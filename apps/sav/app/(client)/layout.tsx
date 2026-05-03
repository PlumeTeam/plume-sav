import Link from 'next/link'
import { logoutAction } from '@/features/auth/actions'
import { PlumeLogo } from '@/app/_components/PlumeLogo'
import { getCurrentUser, getCurrentUserRoles } from '@/features/auth/queries'

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const [user, roles] = await Promise.all([getCurrentUser(), getCurrentUserRoles()])
  const multiRole = roles.length > 1 || roles.includes('plume_admin')

  return (
    <div className="flex min-h-screen flex-col bg-brand-cream">
      {/* Top compact header — visible on every client page */}
      <header className="sticky top-0 z-20 border-b border-brand-stone/60 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <Link href="/client" aria-label="Plume SAV — accueil">
            <PlumeLogo size="sm" withWordmark />
          </Link>
          <nav className="ml-auto flex items-center gap-1">
            {multiRole && (
              <Link
                href="/select-dashboard"
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-brand-cream hover:text-brand-ink"
              >
                Changer d&apos;espace
              </Link>
            )}
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-brand-cream hover:text-brand-ink"
                aria-label="Se déconnecter"
              >
                Déconnexion
              </button>
            </form>
          </nav>
        </div>
      </header>

      <div className="mx-auto w-full max-w-2xl flex-1 pb-24">{children}</div>

      {/* Bottom navigation — mobile-first */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-20 border-t border-brand-stone/60 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 pb-safe-bottom"
        aria-label="Navigation principale"
      >
        <div className="mx-auto grid max-w-2xl grid-cols-2">
          <NavLink href="/client" label="Mes tickets" icon="🎫" />
          <NavLink href="/client/new-ticket" label="Nouveau ticket" icon="＋" primary />
        </div>
      </nav>
      {/* Hide email from layout context for now — used by analytics later */}
      {user?.email && <span className="sr-only">{user.email}</span>}
    </div>
  )
}

function NavLink({
  href,
  label,
  icon,
  primary,
}: {
  href: string
  label: string
  icon: string
  primary?: boolean
}) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center justify-center gap-1 py-3 text-xs font-medium transition-colors ${
        primary
          ? 'bg-brand-coral text-white'
          : 'text-slate-500 hover:text-brand-ink'
      }`}
    >
      <span className={`text-xl leading-none ${primary ? '' : ''}`} aria-hidden>
        {icon}
      </span>
      {label}
    </Link>
  )
}
