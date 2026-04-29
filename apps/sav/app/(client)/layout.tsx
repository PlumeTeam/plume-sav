import Link from 'next/link'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <div className="flex-1 pb-20">{children}</div>

      {/* Bottom navigation — mobile-first */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-slate-100 bg-white">
        <div className="grid grid-cols-2">
          <NavLink href="/client" label="Mes tickets" emoji="🎫" />
          <NavLink href="/client/new-ticket" label="Nouveau" emoji="+" primary />
        </div>
      </nav>
    </div>
  )
}

function NavLink({
  href,
  label,
  emoji,
  primary,
}: {
  href: string
  label: string
  emoji: string
  primary?: boolean
}) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center justify-center gap-1 py-3 text-xs font-medium ${
        primary
          ? 'bg-slate-900 text-white'
          : 'text-slate-500'
      }`}
    >
      <span className="text-xl" aria-hidden>{emoji}</span>
      {label}
    </Link>
  )
}
