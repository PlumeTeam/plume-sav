import { RoleHeader } from '@/app/_components/RoleHeader'
import { getCurrentUser, getCurrentUserRoles } from '@/features/auth/queries'

export default async function PlumeLayout({ children }: { children: React.ReactNode }) {
  const [user, roles] = await Promise.all([getCurrentUser(), getCurrentUserRoles()])
  return (
    <div className="flex min-h-screen flex-col bg-brand-cream">
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
      />
      <div className="mx-auto w-full max-w-6xl flex-1">{children}</div>
    </div>
  )
}
