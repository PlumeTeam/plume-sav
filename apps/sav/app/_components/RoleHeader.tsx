import Link from 'next/link'
import { logoutAction } from '@/features/auth/actions'
import { PlumeLogo } from './PlumeLogo'

interface RoleHeaderProps {
  spaceLabel: string
  spaceColor: 'navy' | 'coral' | 'green' | 'orange' | 'purple'
  links?: Array<{ href: string; label: string }>
  userEmail?: string | null
  multiRole?: boolean
}

// Pastilles d'espace — couleurs douces lisibles sur le fond Plume Black du header.
const SPACE_BADGE: Record<RoleHeaderProps['spaceColor'], string> = {
  navy:   'bg-white/10 text-white ring-1 ring-white/15',
  coral:  'bg-brand-gold text-white',
  green:  'bg-emerald-500/90 text-white',
  orange: 'bg-orange-500/90 text-white',
  purple: 'bg-violet-500/90 text-white',
}

export function RoleHeader({ spaceLabel, spaceColor, links = [], userEmail, multiRole }: RoleHeaderProps) {
  return (
    <header className="sticky top-0 z-20 bg-brand-navy/95 backdrop-blur supports-[backdrop-filter]:bg-brand-navy/85">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <Link href="/select-dashboard" aria-label="Plume SAV" className="shrink-0">
          <PlumeLogo size="sm" variant="light" />
        </Link>
        <span className={`hidden sm:inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-[0.08em] ${SPACE_BADGE[spaceColor]}`}>
          {spaceLabel}
        </span>
        <span className="sm:hidden text-sm font-semibold text-white">{spaceLabel}</span>

        <nav className="ml-auto flex items-center gap-1">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="hidden md:inline-flex rounded-lg px-3 py-1.5 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors"
            >
              {label}
            </Link>
          ))}
          {multiRole && (
            <Link
              href="/select-dashboard"
              className="hidden md:inline-flex rounded-lg px-3 py-1.5 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors"
              title="Changer de tableau de bord"
            >
              Changer d&apos;espace
            </Link>
          )}
          {userEmail && (
            <span className="hidden lg:inline truncate max-w-[180px] rounded-lg px-2 py-1 text-xs text-white/40">
              {userEmail}
            </span>
          )}
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors"
            >
              Déconnexion
            </button>
          </form>
        </nav>
      </div>
    </header>
  )
}
