import { redirect } from 'next/navigation'
import { RoleHeader } from '@/app/_components/RoleHeader'
import {
  getCurrentUser,
  getCurrentUserRoles,
  getCurrentUserWorkshop,
} from '@/features/auth/queries'
import { WorkshopMessagesNavButton } from './_components/WorkshopMessagesNavButton'

export default async function WorkshopLayout({ children }: { children: React.ReactNode }) {
  const [user, roles, workshop] = await Promise.all([
    getCurrentUser(),
    getCurrentUserRoles(),
    getCurrentUserWorkshop(),
  ])

  // Garde-fou rôle : seuls les rôles 'workshop' et 'plume_admin' accèdent
  // à l'espace atelier.
  if (!roles.includes('workshop') && !roles.includes('plume_admin')) {
    redirect('/select-dashboard')
  }

  const spaceLabel = workshop?.label ?? 'Espace Atelier'

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <RoleHeader
        spaceLabel={spaceLabel}
        spaceColor="orange"
        links={[{ href: '/workshop', label: 'Tickets' }]}
        userEmail={user?.email}
        multiRole={roles.length > 1 || roles.includes('plume_admin')}
        extraActions={<WorkshopMessagesNavButton />}
      />
      <div className="mx-auto w-full max-w-6xl flex-1">{children}</div>
    </div>
  )
}
