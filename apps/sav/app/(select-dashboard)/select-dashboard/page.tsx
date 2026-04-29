import { redirect } from 'next/navigation'
import { getCurrentUserRoles, getCurrentUser, type UserRole } from '@/features/auth/queries'
import { logoutAction } from '@/features/auth/actions'

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
  cardClass: string
  badgeClass: string
}> = [
  {
    role:        'client',
    href:        '/client',
    emoji:       '👤',
    label:       'Vue Client',
    description: 'Voir le dashboard comme un client',
    cardClass:   'border-blue-200 bg-blue-50 hover:bg-blue-100 active:bg-blue-200',
    badgeClass:  'bg-blue-100 text-blue-700',
  },
  {
    role:        'school',
    href:        '/school',
    emoji:       '🏫',
    label:       'Vue École',
    description: 'Voir le dashboard comme une école',
    cardClass:   'border-green-200 bg-green-50 hover:bg-green-100 active:bg-green-200',
    badgeClass:  'bg-green-100 text-green-700',
  },
  {
    role:        'workshop',
    href:        '/workshop',
    emoji:       '🔧',
    label:       'Vue Atelier',
    description: "Voir le dashboard comme l'atelier",
    cardClass:   'border-orange-200 bg-orange-50 hover:bg-orange-100 active:bg-orange-200',
    badgeClass:  'bg-orange-100 text-orange-700',
  },
  {
    role:        'plume_admin',
    href:        '/plume',
    emoji:       '🦅',
    label:       'Vue Admin Plume',
    description: 'Dashboard administrateur complet',
    cardClass:   'border-purple-200 bg-purple-50 hover:bg-purple-100 active:bg-purple-200',
    badgeClass:  'bg-purple-100 text-purple-700',
  },
]

export default async function SelectDashboardPage() {
  const [user, roles] = await Promise.all([getCurrentUser(), getCurrentUserRoles()])

  const isAdmin = roles.includes('plume_admin')

  // Non-admin with exactly one role → go straight to their dashboard
  if (!isAdmin && roles.length === 1) {
    redirect(ROLE_PATHS[roles[0]!])
  }

  // Not authenticated or no roles assigned
  if (roles.length === 0) {
    return (
      <div className="text-center">
        <p className="mb-1 text-3xl" aria-hidden>🔒</p>
        <h1 className="text-xl font-semibold text-slate-900">Aucun rôle assigné</h1>
        <p className="mt-2 text-sm text-slate-500">
          Contactez Plume pour obtenir l&apos;accès à un espace.
        </p>
        <form action={logoutAction} className="mt-6">
          <button type="submit" className="text-sm text-slate-400 underline underline-offset-2">
            Se déconnecter
          </button>
        </form>
      </div>
    )
  }

  // Admin sees all 4 dashboards; other multi-role users see only their assigned ones
  const cards = isAdmin
    ? ALL_DASHBOARDS
    : ALL_DASHBOARDS.filter(d => roles.includes(d.role))

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-100 bg-white px-4 py-4">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Choisir un tableau de bord</h1>
            {user?.email && (
              <p className="mt-0.5 text-xs text-slate-400">{user.email}</p>
            )}
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            >
              Déconnexion
            </button>
          </form>
        </div>
      </header>

      {/* Cards */}
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-6">
        {isAdmin && (
          <p className="mb-4 text-xs text-slate-400">
            Mode administrateur — accès à toutes les vues
          </p>
        )}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {cards.map(({ href, emoji, label, description, cardClass, badgeClass }) => (
            <a
              key={href}
              href={href}
              className={`flex items-start gap-4 rounded-2xl border p-4 transition-colors ${cardClass}`}
            >
              <span
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl ${badgeClass}`}
                aria-hidden
              >
                {emoji}
              </span>
              <div className="min-w-0">
                <p className="font-semibold text-slate-900">{label}</p>
                <p className="mt-0.5 text-xs text-slate-500">{description}</p>
              </div>
              <span className="ml-auto self-center text-slate-300" aria-hidden>›</span>
            </a>
          ))}
        </div>

        {!isAdmin && roles.length > 1 && (
          <p className="mt-4 text-center text-xs text-slate-400">
            Vous avez accès à {roles.length} espaces
          </p>
        )}
      </main>
    </div>
  )
}
