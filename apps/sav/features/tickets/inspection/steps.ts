// School inspection wizard — payload schema V2.
// Persisted as JSON inside service_requests.school_checklist.notes with the
// __wizard__ marker. The page-side guard (`isCheckValidated`) only checks
// notes.length > 0, so a saved payload counts as validated regardless of
// schema details — keeping the contract back-compat.

export type FabricCondition  = 'good' | 'worn' | 'damaged'
export type LinesCondition   = 'good' | 'worn' | 'broken'
export type RisersCondition  = 'good' | 'worn' | 'damaged'
export type YesNo            = 'yes' | 'no'
export type YesNoIdk         = 'yes' | 'no' | 'idk'
/** Legacy V2 — remplacé en pratique par InflationSurfaceConsistency à partir de mai 2026. */
export type InflationSymmetry = 'yes' | 'no' | 'unsure'
export type InflationSurfaceConsistency = 'yes' | 'no' | 'unsure'
/** Tendance observée au gonflage — remplace le simple oui/non binaire
 *  d'inflationNormalBehavior (qui restait flou sur la nature du défaut). */
export type InflationTendency = 'closes_easily' | 'lazy' | 'none' | 'unsure'
export type TearSize         = 'lt5' | '5to10' | '10to15' | 'gt15'
export type SeamDistance     = 'close' | 'far'

export type Phase1 = {
  // Écran 1 — Inspection visuelle générale
  visibleDamage?:      YesNo
  damageDescription?:  string
  damagePhotoPaths?:   string[]

  // Écran 2 — Tissu
  fabricCondition?:    FabricCondition
  visibleTears?:       YesNo
  tearSize?:           TearSize
  seamDistance?:       SeamDistance
  tearsNote?:          string
  tearsPhotoPaths?:    string[]

  // Écran 3 — Coutures et structure
  openSeams?:          YesNo
  openSeamsNote?:      string
  openSeamsPhotoPaths?:string[]
  linesCondition?:     LinesCondition
  linesNote?:          string
  linesPhotoPaths?:    string[]
  maillonsInverted?:   YesNoIdk
  maillonsNote?:       string
  maillonsPhotoPaths?: string[]
  risersCondition?:    RisersCondition
  risersNote?:         string
  risersPhotoPaths?:   string[]
}

/** Raison pour laquelle le check de gonflage a été sauté.
 *  `not_possible` = conditions/matériel indisponibles ; `not_necessary` =
 *  l'inspecteur juge le test au sol superflu. Les deux masquent les
 *  sous-questions de gonflage de la même façon. */
export type Phase2SkipReason = 'not_possible' | 'not_necessary'

export type Phase2 =
  | { skipped: true; skipReason?: Phase2SkipReason }
  | {
      skipped:                      false
      /** Remplace inflationSymmetry — la symétrie au gonflage est quasi impossible
       *  à constater à l'œil nu, on bascule sur un critère plus parlant pour les
       *  écoles : l'état de surface (propreté, cohérence) observable au sol. */
      inflationSurfaceConsistency?: InflationSurfaceConsistency
      /** @deprecated Présent dans les payloads V2 historiques uniquement — plus
       *  collecté depuis mai 2026. Lu par le review screen pour ne pas casser
       *  l'affichage des anciens checks. */
      inflationSymmetry?:           InflationSymmetry
      /** Tendance observée — remplace inflationNormalBehavior (yes/no binaire). */
      inflationTendency?:           InflationTendency
      /** @deprecated Remplacé par inflationTendency en mai 2026. Conservé pour
       *  rendre les anciens payloads V2 dans le review screen. */
      inflationNormalBehavior?:     YesNo
      inflationNotes?:              string
      /** Photos optionnelles jointes au check de gonflage (chemins dans le
       *  bucket `tickets`). Même shape que damagePhotoPaths & cie en Phase 1. */
      inflationPhotoPaths?:         string[]
    }

export type SchoolCheckPayload = {
  __wizard__:        true
  version:           2
  inspectorName:     string
  completedAt:       string
  /** Best-effort copy of the [Catégorie] tag the client wrote at submission. */
  reportedCategory?: string
  phase1:            Phase1
  phase2:            Phase2
  /** Free-form synthesis the school types on the review screen. */
  globalNote?:       string
  /** Legacy bridge — derived ids of "positive findings" so the school detail
   *  page's `isCheckValidated = checkedIds.length > 0 || notes.length > 0`
   *  stays truthy with the new schema. */
  checkedIds:        string[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants — wording centralized so the review screen can reuse it
// ─────────────────────────────────────────────────────────────────────────────

export const FABRIC_CONDITION_LABELS: Record<FabricCondition, string> = {
  good:    'Bon',
  worn:    'Usé',
  damaged: 'Abîmé',
}

export const LINES_CONDITION_LABELS: Record<LinesCondition, string> = {
  good:   'Bon',
  worn:   'Usé',
  broken: 'Suspente cassée ou abîmée',
}

export const RISERS_CONDITION_LABELS: Record<RisersCondition, string> = {
  good:    'Bon',
  worn:    'Usé',
  damaged: 'Abîmé',
}

export const TEAR_SIZE_LABELS: Record<TearSize, string> = {
  lt5:     '< 5 cm',
  '5to10': '5 – 10 cm',
  '10to15':'10 – 15 cm',
  gt15:    '> 15 cm',
}

export const SEAM_DISTANCE_LABELS: Record<SeamDistance, string> = {
  close: '< 3 cm d’une couture',
  far:   '> 3 cm d’une couture',
}

export const YESNO_LABELS: Record<YesNo, string> = { yes: 'Oui', no: 'Non' }
export const YESNOIDK_LABELS: Record<YesNoIdk, string> = {
  yes: 'Oui', no: 'Non', idk: 'Je ne sais pas',
}
export const INFLATION_SYMMETRY_LABELS: Record<InflationSymmetry, string> = {
  yes: 'Oui', no: 'Non', unsure: 'Difficile à dire',
}
export const INFLATION_SURFACE_LABELS: Record<InflationSurfaceConsistency, string> = {
  yes: 'Oui', no: 'Non', unsure: 'Difficile à dire',
}
export const INFLATION_TENDENCY_LABELS: Record<InflationTendency, string> = {
  closes_easily: 'Tendance à fermer facilement',
  lazy:          'Tendance à être paresseuse',
  none:          'Aucune tendance particulière',
  unsure:        'Difficile à dire',
}

/**
 * Extracts the `[Catégorie] X` tag from the rich description the client
 * wizard writes via buildRichDescription(). Returns null if absent so the
 * UI can fall back to a generic banner.
 */
export function extractReportedCategory(description: string | null | undefined): string | null {
  if (!description) return null
  const m = description.match(/^\s*\[Catégorie\]\s*(.+)$/m)
  return m && m[1] ? m[1].trim() : null
}

/**
 * Decode the wizard payload from `service_requests.school_checklist`. The
 * page-side guard stores the V2 payload JSON-encoded inside `notes` with a
 * `__wizard__` marker so we can recover it across reloads. Returns null for
 * the legacy `{ checkedIds, notes }` shape or anything we can't parse.
 */
export function readSchoolCheckPayload(raw: unknown): SchoolCheckPayload | null {
  if (!raw || typeof raw !== 'object') return null
  const obj = raw as Record<string, unknown>
  const notes = obj.notes
  if (typeof notes !== 'string') return null
  try {
    const parsed = JSON.parse(notes)
    if (parsed && typeof parsed === 'object' && parsed.__wizard__ === true) {
      return parsed as SchoolCheckPayload
    }
  } catch { /* not JSON — was a plain text note in the legacy shape */ }
  return null
}

/**
 * Convenience accessor — pulls just the inspector name (trimmed, non-empty)
 * from a stored school_checklist. Used by the school & workshop ticket views
 * to display "Check effectué par <nom>" for traceability across roles.
 */
export function readSchoolCheckInspector(raw: unknown): string | null {
  const payload = readSchoolCheckPayload(raw)
  const name = payload?.inspectorName?.trim()
  return name && name.length > 0 ? name : null
}

/**
 * The ripstop hint surfaces when the tear is small enough to repair on-site
 * AND far enough from a seam. Anything closer to a seam, or larger than
 * 15 cm, escalates to the workshop.
 */
export function showRipstopHint(p: Phase1): boolean {
  if (p.visibleTears !== 'yes') return false
  if (!p.tearSize || !p.seamDistance) return false
  return p.tearSize !== 'gt15' && p.seamDistance === 'far'
}
