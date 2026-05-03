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

const SPACE_COLORS: Record<RoleHeaderProps['spaceColor'], string> = {
  navy:   'bg-brand-navy text-white',
  coral:  'bg-brand-coral text-white',
  green:  'bg-emerald-600 text-white',
  orange: 'bg-orange-500 text-white',
  purple: 'bg-violet-600 text-white',
}

export function RoleHeader({ spaceLabel, spaceColor, links = [], userEmail, multiRole }: RoleHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-brand-stone/60 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <Link href="/select-dashboard" aria-label="Plume SAV" className="shrink-0">
          <PlumeLogo size="sm" />
        </Link>
        <span className={`hidden sm:inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${SPACE_COLORS[spaceColor]}`}>
          {spaceLabel}
        </span>
        <span className="sm:hidden text-sm font-semibold text-brand-ink">{spaceLabel}</span>

        <nav className="ml-auto flex items-center gap-1">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="hidden md:inline-flex rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:bg-brand-cream hover:text-brand-ink"
            >
              {label}
            </Link>
          ))}
          {multiRole && (
            <Link
              href="/select-dashboard"
              className="hidden md:inline-flex rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:bg-brand-cream hover:text-brand-ink"
              title="Changer de tableau de bord"
            >
              Changer d&apos;espace
            </Link>
          )}
          {userEmail && (
            <span className="hidden lg:inline truncate max-w-[180px] rounded-lg px-2 py-1 text-xs text-slate-400">
              {userEmail}
            </span>
          )}
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-lg px-3 py-1.5 text-sm text-slate-500 hover:bg-brand-cream hover:text-brand-ink"
            >
              Déconnexion
            </button>
          </form>
        </nav>
      </div>
    </header>
  )
}
