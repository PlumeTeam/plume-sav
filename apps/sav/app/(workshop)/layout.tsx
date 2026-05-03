import { RoleHeader } from '@/app/_components/RoleHeader'
import { getCurrentUser, getCurrentUserRoles } from '@/features/auth/queries'

export default async function WorkshopLayout({ children }: { children: React.ReactNode }) {
  const [user, roles] = await Promise.all([getCurrentUser(), getCurrentUserRoles()])
  return (
    <div className="flex min-h-screen flex-col bg-brand-cream">
      <RoleHeader
        spaceLabel="Espace Atelier"
        spaceColor="orange"
        links={[{ href: '/workshop', label: 'Tickets' }]}
        userEmail={user?.email}
        multiRole={roles.length > 1 || roles.includes('plume_admin')}
      />
      <div className="mx-auto w-full max-w-6xl flex-1">{children}</div>
    </div>
  )
}
