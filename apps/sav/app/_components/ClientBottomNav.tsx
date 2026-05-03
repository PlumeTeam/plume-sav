'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function ClientBottomNav() {
  const pathname = usePathname()
  const isList   = pathname === '/client' || pathname.startsWith('/client/ticket')
  const isNew    = pathname.startsWith('/client/new-ticket')

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-20 border-t border-brand-stone/60 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 pb-safe-bottom"
      aria-label="Navigation principale"
    >
      <div className="mx-auto grid max-w-2xl grid-cols-2">
        <Link
          href="/client"
          aria-current={isList ? 'page' : undefined}
          className={`flex flex-col items-center justify-center gap-1 py-3 text-xs font-medium transition-colors ${
            isList ? 'text-brand-ink' : 'text-slate-500 hover:text-brand-ink'
          }`}
        >
          <span className="text-xl leading-none" aria-hidden>🎫</span>
          Mes tickets
          {isList && <span aria-hidden className="-mb-2 mt-0.5 h-0.5 w-8 rounded-full bg-brand-coral" />}
        </Link>
        <Link
          href="/client/new-ticket"
          aria-current={isNew ? 'page' : undefined}
          className={`flex flex-col items-center justify-center gap-1 py-3 text-xs font-medium transition-colors ${
            isNew
              ? 'bg-brand-coral/90 text-white'
              : 'bg-brand-coral text-white hover:bg-brand-coral/90'
          }`}
        >
          <span className="text-xl leading-none" aria-hidden>＋</span>
          Nouveau ticket
        </Link>
      </div>
    </nav>
  )
}
