// Pretty rendering of the wizard-generated description text.
//
// The text format is produced server-side by buildDescription() in actions.ts:
//   [Catégorie] Tissu
//   [Urgence] Normal
//   [Aile] Plume — Affinity — Taille 22 — Summit White
//   [Historique aile]
//     • Heures de vol : 20 h
//     • Nombre de vols : 10
//     • ...
//   ---
//   <free text from the client>
//
// We parse the bracketed tags + history bullets into structured fields and
// render them as labelled rows / pills, then show the client's free text
// underneath as a clean paragraph. If parsing yields nothing useful we fall
// back to the raw text so we never lose information.

interface ParsedDescription {
  category:    string | null
  urgency:     string | null
  history:     Array<{ label: string; value: string }>
  freeText:    string | null
  /** Raw lines we didn't recognise — surfaced after the structured block to
   *  avoid hiding anything during the rollout. */
  extraLines:  string[]
}

const RECOGNISED_TAGS = new Set([
  'Catégorie',
  'Urgence',
  'Aile',         // hidden — duplicate of the Produit card
  'Historique aile',
])

function parseDescription(raw: string | null | undefined): ParsedDescription {
  const empty: ParsedDescription = { category: null, urgency: null, history: [], freeText: null, extraLines: [] }
  if (!raw || typeof raw !== 'string') return empty

  // Split header/freeText on the first `---` separator (the wizard always
  // emits exactly one). If there's no separator, treat the whole thing as
  // header.
  const sepMatch = raw.split(/\n-{3,}\n/)
  const header   = (sepMatch[0] ?? '').trim()
  const freeText = sepMatch.length > 1 ? sepMatch.slice(1).join('\n---\n').trim() : null

  const out: ParsedDescription = { ...empty, freeText: freeText && freeText.length > 0 ? freeText : null }

  const lines = header.split('\n')
  let inHistory = false

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) continue

    // [Tag] value
    const tagMatch = line.match(/^\[([^\]]+)\]\s*(.*)$/)
    if (tagMatch) {
      const [, tag, value] = tagMatch
      const tagName = (tag ?? '').trim()
      const tagValue = (value ?? '').trim()
      inHistory = false

      if (tagName === 'Catégorie') {
        out.category = tagValue || null
      } else if (tagName === 'Urgence') {
        out.urgency = tagValue || null
      } else if (tagName === 'Aile') {
        // duplicate of the Produit card — drop it
      } else if (tagName === 'Historique aile') {
        inHistory = true
      } else if (RECOGNISED_TAGS.has(tagName)) {
        // future-proof
      } else {
        // Unknown tag → surface as a key-value row in extras
        out.history.push({ label: tagName, value: tagValue })
      }
      continue
    }

    // Bullet lines (`• Label : Value`) inside the history section
    if (inHistory) {
      const bulletMatch = line.match(/^[•\-*]\s*(.+?)\s*:\s*(.+)$/)
      if (bulletMatch) {
        out.history.push({ label: (bulletMatch[1] ?? '').trim(), value: (bulletMatch[2] ?? '').trim() })
        continue
      }
    }

    out.extraLines.push(line)
  }

  return out
}

function urgencyTone(urgency: string | null): { label: string; cls: string } {
  if (!urgency) return { label: '—', cls: 'bg-slate-100 text-slate-700' }
  const isUrgent = /urgent/i.test(urgency)
  return isUrgent
    ? { label: '🚨 Urgent', cls: 'bg-red-100 text-red-700' }
    : { label: '⏳ Normal', cls: 'bg-slate-100 text-slate-700' }
}

interface ClientDeclarationViewProps {
  description: string | null | undefined
  /** When > 1, also render the legacy red banner. The parser already extracts
   *  urgency from the text, but the DB column is the authoritative signal. */
  urgencyLevel?: number | null
}

export function ClientDeclarationView({ description, urgencyLevel }: ClientDeclarationViewProps) {
  const parsed = parseDescription(description)
  const urgency = urgencyTone(parsed.urgency)

  const hasStructured =
    parsed.category !== null ||
    parsed.urgency !== null ||
    parsed.history.length > 0

  // Defensive fallback: if we couldn't extract anything, render the raw text.
  if (!hasStructured && !parsed.freeText && parsed.extraLines.length === 0) {
    return description
      ? <p className="whitespace-pre-line text-sm leading-relaxed text-brand-ink">{description}</p>
      : <p className="text-sm italic text-slate-400">Aucune description fournie.</p>
  }

  return (
    <div className="space-y-5">
      {/* Pills row */}
      {(parsed.category || parsed.urgency) && (
        <div className="flex flex-wrap gap-2">
          {parsed.category && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-gold/15 px-3 py-1 text-xs font-semibold text-brand-ink ring-1 ring-brand-gold/30">
              <span aria-hidden>🏷️</span>{parsed.category}
            </span>
          )}
          {parsed.urgency && (
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${urgency.cls}`}>
              {urgency.label}
            </span>
          )}
        </div>
      )}

      {/* Free-text — what the client actually wrote */}
      {parsed.freeText && (
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Ce que vous avez écrit</p>
          <blockquote className="rounded-2xl border-l-4 border-brand-gold bg-brand-cream/50 px-4 py-3 text-sm leading-relaxed text-brand-ink">
            {parsed.freeText}
          </blockquote>
        </div>
      )}

      {/* Wing history grid */}
      {parsed.history.length > 0 && (
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Historique de l&apos;aile</p>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
            {parsed.history.map((row, i) => (
              <div key={i} className="flex items-baseline justify-between gap-3 border-b border-brand-stone/40 pb-1.5">
                <dt className="text-xs text-slate-500">{row.label}</dt>
                <dd className="text-right text-sm font-medium text-brand-ink">{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {/* Anything we didn't recognise — keep it visible to avoid hiding info */}
      {parsed.extraLines.length > 0 && (
        <div className="rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
          {parsed.extraLines.map((l, i) => <p key={i}>{l}</p>)}
        </div>
      )}

      {/* Authoritative urgency banner (DB-driven, mirrors old layout). */}
      {urgencyLevel === 2 && parsed.urgency === null && (
        <p className="rounded-2xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          🚨 Signalé comme urgent
        </p>
      )}
    </div>
  )
}
