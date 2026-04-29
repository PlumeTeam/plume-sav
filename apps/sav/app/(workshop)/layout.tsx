import Link from 'next/link'
import { logoutAction } from '@/features/auth/actions'

export default function WorkshopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-100 bg-white">
        <div className="flex items-center gap-3 px-4 py-3">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500 text-sm font-bold text-white"
            aria-hidden
          >
            A
          </div>
          <span className="flex-1 text-sm font-semibold text-slate-900">Espace Atelier</span>
          <nav className="flex items-center gap-1">
            <Link
              href="/workshop"
              className="rounded-lg px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            >
              Tickets
            </Link>
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-lg px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              >
                Déconnexion
              </button>
            </form>
          </nav>
        </div>
      </header>
      <div className="flex-1">{children}</div>
    </div>
  )
}
