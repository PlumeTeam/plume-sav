import { redirect } from 'next/navigation'
import { RoleHeader } from '@/app/_components/RoleHeader'
import { getCurrentUser, getCurrentUserRoles } from '@/features/auth/queries'
import { PlumeMessagesNavButton } from './_components/PlumeMessagesNavButton'

export default async function PlumeLayout({ children }: { children: React.ReactNode }) {
  const [user, roles] = await Promise.all([getCurrentUser(), getCurrentUserRoles()])

  // Garde-fou rôle : Plume HQ est strictement réservé aux plume_admin.
  if (!roles.includes('plume_admin')) {
    redirect('/select-dashboard')
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <RoleHeader
        spaceLabel="Plume HQ"
        spaceColor="navy"
        links={[
          { href: '/plume',    label: 'Dashboard' },
          { href: '/school',   label: 'Vue École' },
          { href: '/workshop', label: 'Vue Atelier' },
          { href: '/client',   label: 'Vue Client' },
        ]}
        userEmail={user?.email}
        multiRole
        extraActions={<PlumeMessagesNavButton />}
      />
      <div className="mx-auto w-full max-w-6xl flex-1">{children}</div>
    </div>
  )
}
