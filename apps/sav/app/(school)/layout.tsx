import { RoleHeader } from '@/app/_components/RoleHeader'
import { getCurrentUser, getCurrentUserRoles } from '@/features/auth/queries'

export default async function SchoolLayout({ children }: { children: React.ReactNode }) {
  const [user, roles] = await Promise.all([getCurrentUser(), getCurrentUserRoles()])
  return (
    <div className="flex min-h-screen flex-col bg-brand-cream">
      <RoleHeader
        spaceLabel="Espace École"
        spaceColor="green"
        links={[{ href: '/school', label: 'Tickets' }]}
        userEmail={user?.email}
        multiRole={roles.length > 1 || roles.includes('plume_admin')}
      />
      <div className="mx-auto w-full max-w-4xl flex-1">{children}</div>
    </div>
  )
}
