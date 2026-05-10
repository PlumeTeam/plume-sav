import { redirect } from 'next/navigation'
import { RoleHeader } from '@/app/_components/RoleHeader'
import {
  getCurrentUser,
  getCurrentUserRoles,
  getCurrentUserSchool,
} from '@/features/auth/queries'
import { SchoolMessagesNavButton } from './_components/SchoolMessagesNavButton'

export default async function SchoolLayout({ children }: { children: React.ReactNode }) {
  const [user, roles, school] = await Promise.all([
    getCurrentUser(),
    getCurrentUserRoles(),
    getCurrentUserSchool(),
  ])

  // Garde-fou rôle : seuls les rôles 'school' et 'plume_admin' (vue support)
  // accèdent à l'espace école.
  if (!roles.includes('school') && !roles.includes('plume_admin')) {
    redirect('/select-dashboard')
  }

  // The space label switches to the actual school name when we know it,
  // so the user always knows which school's tickets they're looking at.
  const spaceLabel = school?.name ? `École ${school.name}` : 'Espace École'

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <RoleHeader
        spaceLabel={spaceLabel}
        spaceColor="green"
        links={[{ href: '/school', label: 'Tickets' }]}
        userEmail={user?.email}
        multiRole={roles.length > 1 || roles.includes('plume_admin')}
        extraActions={<SchoolMessagesNavButton />}
      />
      <div className="mx-auto w-full max-w-4xl flex-1">{children}</div>
    </div>
  )
}
