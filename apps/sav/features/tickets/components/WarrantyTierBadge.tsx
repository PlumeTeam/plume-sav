import type { WarrantyTier } from '../types'

// Badge "tier de garantie" partagé entre les dashboards (client/école/atelier/HQ).
// 4 niveaux avec codage couleur cohérent :
//   - standard       : vert  (full coverage)
//   - extended       : amber (couverture partielle, cf. toggles HQ)
//   - out_of_warranty: rouge (rien n'est pris en charge)
//   - plume_override : violet (override exceptionnel HQ, traité comme standard)

const TIER_META: Record<WarrantyTier, {
  label:     string
  short:     string
  emoji:     string
  classes:   string
  dotClass:  string
}> = {
  standard: {
    label:    'Garantie standard',
    short:    'Garantie',
    emoji:    '✅',
    classes:  'bg-emerald-50 text-emerald-800 ring-emerald-200',
    dotClass: 'bg-emerald-500',
  },
  extended: {
    label:    'Garantie étendue',
    short:    'Étendue',
    emoji:    '🟡',
    classes:  'bg-amber-50 text-amber-800 ring-amber-200',
    dotClass: 'bg-amber-500',
  },
  out_of_warranty: {
    label:    'Hors garantie',
    short:    'Hors garantie',
    emoji:    '⚠️',
    classes:  'bg-red-50 text-red-800 ring-red-200',
    dotClass: 'bg-red-500',
  },
  plume_override: {
    label:    'Prise en charge Plume',
    short:    'Plume',
    emoji:    '🦅',
    classes:  'bg-violet-50 text-violet-800 ring-violet-200',
    dotClass: 'bg-violet-500',
  },
}

interface WarrantyTierBadgeProps {
  tier:    WarrantyTier
  /** sm = compact (file de tickets), md = standard (cartes), lg = bandeau */
  size?:   'sm' | 'md' | 'lg'
  /** Quand true, affiche le label court (utile dans la file de tickets). */
  compact?: boolean
}

export function WarrantyTierBadge({ tier, size = 'md', compact = false }: WarrantyTierBadgeProps) {
  const meta = TIER_META[tier]

  const padding =
    size === 'sm' ? 'px-2 py-0.5 text-[10px]' :
    size === 'lg' ? 'px-3 py-1.5 text-sm' :
    'px-2.5 py-1 text-xs'

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ring-1 ${meta.classes} ${padding}`}
      title={meta.label}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dotClass}`} aria-hidden />
      <span aria-hidden>{meta.emoji}</span>
      <span>{compact ? meta.short : meta.label}</span>
    </span>
  )
}

export const WARRANTY_TIER_LABELS: Record<WarrantyTier, string> =
  Object.fromEntries(
    (Object.keys(TIER_META) as WarrantyTier[]).map((k) => [k, TIER_META[k].label]),
  ) as Record<WarrantyTier, string>
