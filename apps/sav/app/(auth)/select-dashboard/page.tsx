import { redirect } from 'next/navigation'
import { getCurrentUserRoles, type UserRole } from '@/features/auth/queries'

const ROLE_PATHS: Record<UserRole, string> = {
  client: '/client',
  school: '/school',
  workshop: '/workshop',
  plume_admin: '/plume',
}

const ROLE_LABELS: Record<UserRole, string> = {
  client: 'Espace client',
  school: 'Espace école',
  workshop: 'Espace atelier',
  plume_admin: 'Plume HQ',
}

export default async function SelectDashboardPage() {
  const roles = await getCurrentUserRoles()

  if (roles.length === 0) {
    return (
      <div className="text-center">
        <h1 className="text-xl font-semibold">Aucun rôle assigné</h1>
        <p className="mt-2 text-sm text-slate-600">
          Contactez Plume pour obtenir l&apos;accès à un espace.
        </p>
      </div>
    )
  }

  if (roles.length === 1) {
    redirect(ROLE_PATHS[roles[0]!])
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Vos espaces</h1>
      <p className="mb-6 text-sm text-slate-600">
        Choisissez l&apos;espace dans lequel vous souhaitez travailler.
      </p>
      <ul className="space-y-2">
        {roles.map(role => (
          <li key={role}>
            <a
              href={ROLE_PATHS[role]}
              className="block rounded-md border px-4 py-3 text-sm hover:bg-slate-50"
            >
              {ROLE_LABELS[role]}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
