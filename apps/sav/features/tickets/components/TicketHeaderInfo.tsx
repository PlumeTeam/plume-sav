// Bandeau d'info compact (Aile · Client · École · Atelier) affiché en tête
// de chaque page détail ticket. Donne aux 4 rôles (client, école, atelier,
// plume) le même contexte d'arrivée — pas besoin d'aller fouiller dans les
// onglets pour récupérer un email ou un numéro de téléphone.
//
// Composant pur : chaque page fournit ses données (school résolue, workshop
// résolu). Aucune requête DB ici.

interface WingInfo {
  brand:  string | null
  model:  string | null
  size:   string | null
  color:  string | null
  serial: string | null
}

interface ClientInfo {
  firstName: string | null
  lastName:  string | null
  email:     string | null
  phone:     string | null
}

interface PartyInfo {
  name:  string | null
  email: string | null
  phone: string | null
}

interface Props {
  wing:     WingInfo
  client:   ClientInfo
  /** École qui suit le ticket (ou qui a vendu l'aile selon le contexte). */
  school:   PartyInfo | null
  /** Atelier assigné au ticket — null tant qu'aucun atelier n'a été choisi. */
  workshop: PartyInfo | null
}

export function TicketHeaderInfo({ wing, client, school, workshop }: Props) {
  const clientName =
    [client.firstName, client.lastName].filter(Boolean).join(' ').trim() || null

  return (
    <section
      className="card grid grid-cols-1 gap-x-5 gap-y-4 p-4 sm:grid-cols-2 lg:grid-cols-4"
      aria-label="Contexte du ticket"
    >
      <Block title="Aile">
        <p className="truncate font-semibold text-brand-ink">
          {[wing.brand, wing.model].filter(Boolean).join(' ') || '—'}
        </p>
        <p className="truncate text-xs text-slate-500">
          {[wing.size && `Taille ${wing.size}`, wing.color]
            .filter(Boolean)
            .join(' · ') || '—'}
        </p>
        {wing.serial ? (
          <p className="break-all font-mono text-xs text-slate-500">S/N {wing.serial}</p>
        ) : (
          <p className="text-xs text-slate-400">S/N —</p>
        )}
      </Block>

      <Block title="Client">
        <p className="truncate font-semibold text-brand-ink">{clientName ?? '—'}</p>
        <Email value={client.email} />
        <Phone value={client.phone} />
      </Block>

      <Block title="École">
        {school ? (
          <>
            <p className="truncate font-semibold text-brand-ink">
              {school.name?.trim() || '—'}
            </p>
            <Email value={school.email} />
            <Phone value={school.phone} />
          </>
        ) : (
          <p className="text-sm italic text-slate-500">—</p>
        )}
      </Block>

      <Block title="Atelier">
        {workshop ? (
          <>
            <p className="truncate font-semibold text-brand-ink">
              {workshop.name?.trim() || '—'}
            </p>
            <Email value={workshop.email} />
            <Phone value={workshop.phone} />
          </>
        ) : (
          <p className="text-sm italic text-slate-500">Pas encore assigné</p>
        )}
      </Block>
    </section>
  )
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        {title}
      </p>
      <div className="space-y-1 text-sm text-brand-ink">{children}</div>
    </div>
  )
}

function Email({ value }: { value: string | null }) {
  if (!value) return <p className="truncate text-xs text-slate-400">✉ —</p>
  return (
    <a
      href={`mailto:${value}`}
      className="block truncate text-xs text-brand-gold hover:underline"
      title={value}
    >
      ✉ {value}
    </a>
  )
}

function Phone({ value }: { value: string | null }) {
  if (!value) return <p className="truncate text-xs text-slate-400">📞 —</p>
  return (
    <a
      href={`tel:${value.replace(/\s+/g, '')}`}
      className="block truncate text-xs text-brand-gold hover:underline"
    >
      📞 {value}
    </a>
  )
}

// ─── Helpers ────────────────────────────────────────────────────────────────
// Évite que chaque page (school/client/workshop) duplique 30 lignes de JSX
// pour mapper les colonnes du ticket et les rows partner_* vers les props.

interface TicketHeaderSource {
  product_brand:  string | null
  product_model:  string | null
  wing_size:      string | null
  wing_color:     string | null
  serial_number:  string | null
  first_name:     string | null
  last_name:      string | null
  email:          string | null
  phone:          string | null
}

interface PartySource {
  name?:  string | null
  label?: string | null
  email?: string | null
  phone?: string | null
}

export function ticketHeaderProps(
  ticket: TicketHeaderSource,
  school: PartySource | null,
  workshop: PartySource | null,
): Props {
  return {
    wing: {
      brand:  ticket.product_brand,
      model:  ticket.product_model,
      size:   ticket.wing_size,
      color:  ticket.wing_color,
      serial: ticket.serial_number,
    },
    client: {
      firstName: ticket.first_name,
      lastName:  ticket.last_name,
      email:     ticket.email,
      phone:     ticket.phone,
    },
    school: school
      ? { name:  school.name ?? school.label ?? null, email: school.email ?? null, phone: school.phone ?? null }
      : null,
    workshop: workshop
      ? { name:  workshop.label ?? workshop.name ?? null, email: workshop.email ?? null, phone: workshop.phone ?? null }
      : null,
  }
}
