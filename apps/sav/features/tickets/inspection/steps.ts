// School inspection wizard — step definitions.
// Each step asks a single yes/no/na question (or a 3-choice severity, or a free-text)
// and is rendered on its own screen. Mirrors the client wizard's "one question per page" UX.

export type InspectionStepKind = 'yesno' | 'severity' | 'freetext'

export type InspectionStep = {
  id:    string
  kind:  InspectionStepKind
  title: string
  hint?: string
  /** For yesno: hint shown below if the answer is "yes" */
  yesHint?: string
  /** For freetext: placeholder of the textarea */
  placeholder?: string
}

export const VISUAL_INSPECTION_STEPS: InspectionStep[] = [
  { id: 'damage_located',  kind: 'yesno',
    title: "Avez-vous identifié la localisation du dommage ?",
    hint:  "Repérez précisément l'endroit affecté." },
  { id: 'small_tear',      kind: 'yesno',
    title: "La déchirure mesure-t-elle entre 3 et 15 cm, à plus de 3 cm d'une couture ?",
    yesHint: "Réparable par l'école avec du ripstop." },
  { id: 'open_seam',       kind: 'yesno',
    title: "Y a-t-il une couture ouverte ?" },
  { id: 'lines_check',     kind: 'yesno',
    title: "Maillon inversé ou suspente mal placée constatés ?" },
  { id: 'severity',        kind: 'severity',
    title: "Comment évaluez-vous la gravité du dommage ?" },
]

export const BEHAVIOR_INSPECTION_STEPS: InspectionStep[] = [
  { id: 'behavior_verified', kind: 'yesno',
    title: "Comportement vérifié en vol ou au sol ?" },
  { id: 'symmetry_check',    kind: 'yesno',
    title: "La symétrie visuelle de l'aile est-elle correcte ?" },
  { id: 'inflation_test',    kind: 'yesno',
    title: "Avez-vous testé le gonflage ?",
    hint:  "Lourd ? Asymétrique ? Hésitant ?" },
  { id: 'pilot_level_check', kind: 'yesno',
    title: "Comportement cohérent avec le niveau du pilote ?",
    hint:  "Aile pas adaptée, ou réellement anormale ?" },
  { id: 'client_advised',    kind: 'freetext',
    title: "Quel conseil / information avez-vous donné au client ?",
    placeholder: "Synthèse de l'échange (ce qui a été expliqué, accord trouvé…)" },
]

export const SEVERITY_OPTIONS = [
  { value: 'minor',    emoji: '🟢', label: 'Mineur',  description: "Réparation rapide, peu d'impact sur la sécurité." },
  { value: 'moderate', emoji: '🟡', label: 'Modéré',  description: "Réparation possible mais l'aile doit être inspectée." },
  { value: 'severe',   emoji: '🔴', label: 'Grave',   description: "Sécurité compromise — escalade atelier nécessaire." },
] as const

// Schema persisted in service_requests.school_checklist (JSONB).
// We extend the legacy { checkedIds, notes } shape so the existing flat-checklist
// page keeps reading old data, while the wizard writes the richer { answers } map.
export type InspectionAnswer = {
  value: string  // 'yes' | 'no' | 'na' | 'minor' | 'moderate' | 'severe' | free text
  note?: string
}

export type InspectionPayload = {
  /** Map keyed by step id. */
  answers:    Record<string, InspectionAnswer>
  /** Name of the school staff who performed the check (asked at step 0). */
  inspectorName?: string
  /** ISO timestamp of the last save. */
  completedAt?: string
  /** Free-form global note. */
  notes?:     string
  /** Legacy compatibility for the flat checklist UI. */
  checkedIds?: string[]
}
