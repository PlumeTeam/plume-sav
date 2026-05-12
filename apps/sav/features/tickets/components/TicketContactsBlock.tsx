import type { TicketContacts } from '../contacts'

/**
 * Affiche les coordonnées des trois parties prenantes (client, école, atelier)
 * sous une carte de ticket. Compact : icônes 📞 ✉️ + texte petit.
 * Rendu mobile-first ; grille 2/3 colonnes sur écrans ≥sm.
 */
export function TicketContactsBlock({ contacts }: { contacts: TicketContacts }) {
  const { client, school, workshop } = contacts
  const hasClient   = client.name || client.email || client.phone
  const hasSchool   = !!school
  const hasWorkshop = !!workshop
  if (!hasClient && !hasSchool && !hasWorkshop) return null

  return (
    <div className="grid grid-cols-1 gap-2 border-t border-brand-stone/60 pt-3 sm:grid-cols-2 lg:grid-cols-3">
      {hasClient && (
        <ContactRow
          icon="👤"
          label="Client"
          name={client.name ?? '—'}
          email={client.email}
          phone={client.phone}
        />
      )}
      {school && (
        <ContactRow
          icon="🏫"
          label="École"
          name={school.name}
          email={school.email}
          phone={school.phone}
        />
      )}
      {workshop && (
        <ContactRow
          icon="🔧"
          label="Atelier"
          name={workshop.label}
          email={workshop.email}
          phone={workshop.phone}
        />
      )}
    </div>
  )
}

function ContactRow({
  icon, label, name, email, phone,
}: {
  icon: string
  label: string
  name: string
  email: string | null
  phone: string | null
}) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        <span aria-hidden className="mr-1">{icon}</span>
        {label}
      </p>
      <p className="mt-0.5 truncate text-xs font-medium text-brand-ink">{name}</p>
      {(phone || email) && (
        <div className="mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5">
          {phone && (
            <span className="inline-flex min-w-0 items-center gap-1 text-[11px] text-slate-500">
              <span aria-hidden>📞</span>
              <span className="truncate">{phone}</span>
            </span>
          )}
          {email && (
            <span className="inline-flex min-w-0 items-center gap-1 text-[11px] text-slate-500">
              <span aria-hidden>✉️</span>
              <span className="truncate">{email}</span>
            </span>
          )}
        </div>
      )}
    </div>
  )
}
