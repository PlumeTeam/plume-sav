'use client'

import Link from 'next/link'

interface TicketSectionNavProps {
  ticketId: string
}

const ITEMS: Array<{ key: string; label: string; emoji: string; anchor?: string; href?: string }> = [
  { key: 'etat',        label: 'État',         emoji: '📍', anchor: 'etat' },
  { key: 'messagerie',  label: 'Messagerie',   emoji: '💬' },
  { key: 'contact',     label: 'École',        emoji: '🏫', anchor: 'contact' },
  { key: 'infos',       label: 'Mes infos',    emoji: '📋', anchor: 'infos' },
]

/**
 * Sticky shortcut bar shown right under the ticket header. Three of the four
 * entries scroll to in-page anchors (smooth, with scroll-mt offset on the
 * target sections so the title isn't hidden behind the sticky bar). The
 * "Messagerie" entry navigates to the dedicated /client/messages/[id] page.
 */
export function TicketSectionNav({ ticketId }: TicketSectionNavProps) {
  function handleScroll(e: React.MouseEvent<HTMLAnchorElement>, anchor: string) {
    e.preventDefault()
    const el = document.getElementById(anchor)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    // Update the URL hash without jumping (scrollIntoView already moved us).
    history.replaceState(null, '', `#${anchor}`)
  }

  return (
    <nav
      aria-label="Sections de la demande SAV"
      className="mx-auto max-w-2xl px-4 pb-3"
    >
      <ul className="flex items-center gap-2 overflow-x-auto">
        {ITEMS.map((item) => {
          const className =
            'inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-brand-stone bg-white px-3 py-2 text-xs font-medium text-brand-ink hover:border-brand-gold/40 hover:text-brand-ink active:scale-[0.98] transition-all'
          const content = (
            <>
              <span aria-hidden>{item.emoji}</span>
              <span>{item.label}</span>
            </>
          )

          if (item.key === 'messagerie') {
            return (
              <li key={item.key}>
                <Link href={`/client/messages/${ticketId}`} className={className}>
                  {content}
                </Link>
              </li>
            )
          }

          return (
            <li key={item.key}>
              <a
                href={`#${item.anchor}`}
                onClick={(e) => item.anchor && handleScroll(e, item.anchor)}
                className={className}
              >
                {content}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
