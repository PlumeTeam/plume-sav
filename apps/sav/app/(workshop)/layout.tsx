import { RoleHeader } from '@/app/_components/RoleHeader'
import {
  getCurrentUser,
  getCurrentUserRoles,
  getCurrentUserWorkshop,
} from '@/features/auth/queries'

export default async function WorkshopLayout({ children }: { children: React.ReactNode }) {
  const [user, roles, workshop] = await Promise.all([
    getCurrentUser(),
    getCurrentUserRoles(),
    getCurrentUserWorkshop(),
  ])
  const spaceLabel = workshop?.label ?? 'Espace Atelier'

  return (
    <div className="flex min-h-screen flex-col bg-brand-cream">
      <RoleHeader
        spaceLabel={spaceLabel}
        spaceColor="orange"
        links={[{ href: '/workshop', label: 'Tickets' }]}
        userEmail={user?.email}
        multiRole={roles.length > 1 || roles.includes('plume_admin')}
      />
      <div className="mx-auto w-full max-w-6xl flex-1">{children}</div>
    </div>
  )
}
