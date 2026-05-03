import { redirect } from 'next/navigation'
import { getCurrentUserRoles, getCurrentUser, type UserRole } from '@/features/auth/queries'
import { logoutAction } from '@/features/auth/actions'
import { PlumeLogo } from '@/app/_components/PlumeLogo'

const ROLE_PATHS: Record<UserRole, string> = {
  client:      '/client',
  school:      '/school',
  workshop:    '/workshop',
  plume_admin: '/plume',
}

const ALL_DASHBOARDS: Array<{
  role: UserRole
  href: string
  emoji: string
  label: string
  description: string
}> = [
  { role: 'client',      href: '/client',   emoji: '🪂', label: 'Vue Pilote',  description: 'Suivre mes ailes et mes demandes SAV.' },
  { role: 'school',      href: '/school',   emoji: '🏫', label: 'Vue École',   description: 'Valider et superviser les tickets élèves.' },
  { role: 'workshop',    href: '/workshop', emoji: '🔧', label: 'Vue Atelier', description: 'Diagnostiquer et réparer les ailes.' },
  { role: 'plume_admin', href: '/plume',    emoji: '⚙️', label: 'Plume HQ',    description: 'Vue d’ensemble et administration.' },
]

export default async function SelectDashboardPage() {
  const [user, roles] = await Promise.all([getCurrentUser(), getCurrentUserRoles()])

  const isAdmin = roles.includes('plume_admin')

  // Non-admin with exactly one role → go straight to their dashboard
  if (!isAdmin && roles.length === 1) {
    redirect(ROLE_PATHS[roles[0]!])
  }

  if (roles.length === 0) {
    return (
      <div className="flex min-h-screen flex-col bg-brand-cream">
        <header className="flex justify-center pt-10">
          <PlumeLogo size="lg" withWordmark />
        </header>
        <main className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center px-4 py-12 text-center">
          <p className="text-4xl" aria-hidden>🔒</p>
          <h1 className="mt-4 text-xl font-bold text-brand-ink">Aucun rôle assigné</h1>
          <p className="mt-2 text-sm text-slate-500">
            Votre compte n&apos;a accès à aucun espace SAV pour le moment.
            Contactez Plume ou votre école partenaire.
          </p>
          <a
            href="mailto:sav@plumeparagliders.com"
            className="btn-primary mt-6 w-full sm:w-auto"
          >
            Contacter Plume
          </a>
          <form action={logoutAction} className="mt-4">
            <button type="submit" className="text-xs text-slate-400 underline underline-offset-2">
              Se déconnecter
            </button>
          </form>
        </main>
      </div>
    )
  }

  const cards = isAdmin
    ? ALL_DASHBOARDS
    : ALL_DASHBOARDS.filter(d => roles.includes(d.role))

  return (
    <div className="flex min-h-screen flex-col bg-brand-cream">
      <header className="border-b border-brand-stone/60 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <PlumeLogo size="sm" withWordmark />
          <div className="ml-auto flex items-center gap-2">
            {user?.email && (
              <span className="hidden sm:inline truncate max-w-[180px] text-xs text-slate-400">
                {user.email}
              </span>
            )}
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-brand-cream hover:text-brand-ink"
              >
                Déconnexion
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-brand-ink">Choisir un espace</h1>
          <p className="mt-1 text-sm text-slate-500">
            {isAdmin ? 'Mode administrateur — accès à tous les espaces.'
                     : `Vous avez accès à ${roles.length} espace${roles.length > 1 ? 's' : ''}.`}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {cards.map(({ href, emoji, label, description }) => (
            <a
              key={href}
              href={href}
              className="group card flex items-start gap-4 p-5 transition-all hover:-translate-y-0.5 hover:shadow-plume"
            >
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-cream text-2xl ring-1 ring-brand-stone group-hover:bg-brand-coral/10 group-hover:ring-brand-coral/30 transition-colors"
                aria-hidden
              >
                {emoji}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-brand-ink">{label}</p>
                <p className="mt-0.5 text-xs text-slate-500">{description}</p>
              </div>
              <span className="self-center text-slate-300 group-hover:text-brand-coral transition-colors" aria-hidden>›</span>
            </a>
          ))}
        </div>
      </main>
    </div>
  )
}
