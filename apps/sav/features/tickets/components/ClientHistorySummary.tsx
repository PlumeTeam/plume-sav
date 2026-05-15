import {
  SummarySection,
  SummaryRow,
  type Severity,
} from '@/features/tickets/inspection/SeverityBlocks'

// Section "Historique de l'aile" — rows label/badge, homogène avec
// SchoolCheckSummary. Le bandeau verdict global vit désormais dans
// ClientDeclarationPanel (il agrège historique + comportements + urgence),
// ce composant ne porte donc plus que les lignes structurées.

interface HistoryItem {
  label: string
  value: string
}

// Seuils heures de vol / nombre de vols — définis avec le produit.
// Les bornes hautes sont exclusives (100 = "100h ou moins" reste vert).
const HOURS_AMBER_FROM = 100
const HOURS_RED_FROM   = 300
const COUNT_AMBER_FROM = 200
const COUNT_RED_FROM   = 500

function parseFirstInt(value: string): number | null {
  const m = /(-?\d+(?:[.,]\d+)?)/.exec(value)
  if (!m || !m[1]) return null
  const n = Number(m[1].replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

function severityForHours(value: string): Severity {
  const n = parseFirstInt(value)
  if (n == null) return 'neutral'
  if (n >= HOURS_RED_FROM)   return 'red'
  if (n >= HOURS_AMBER_FROM) return 'amber'
  return 'green'
}

function severityForCount(value: string): Severity {
  const n = parseFirstInt(value)
  if (n == null) return 'neutral'
  if (n >= COUNT_RED_FROM)   return 'red'
  if (n >= COUNT_AMBER_FROM) return 'amber'
  return 'green'
}

// Routeur label → severity. Matche les libellés produits par formatWingHistory
// (cf. actions/_helpers.ts). Si un label ne matche pas, on tombe en 'neutral'
// — l'item s'affiche grisé plutôt que faussement OK.
export function severityForHistoryRow(label: string, value: string): Severity {
  const lower = value.toLowerCase().trim()

  switch (label.trim()) {
    case 'Heures de vol':
      return severityForHours(value)
    case 'Nombre de vols':
      return severityForCount(value)
    case 'Déjà réparée':
      return lower.startsWith('non') ? 'green' : 'red'
    case "Contact avec l'eau":
      return lower === 'non' ? 'green' : 'red'
    case 'Arbrissage':
      return lower === 'non' ? 'green' : 'amber'
    case 'Sable/neige/dunes':
      return 'amber'
    case 'État général':
      if (lower === 'excellent' || lower === 'bon') return 'green'
      if (lower === 'usé' || lower === 'use' || lower === 'mauvais') return 'red'
      return 'amber'
    default:
      return 'neutral'
  }
}

export interface HistoryAnalysis {
  rows:    Array<{ label: string; value: string; severity: Severity }>
  verdict: Severity
  counts:  { red: number; amber: number; green: number }
}

export function analyseClientHistory(history: HistoryItem[]): HistoryAnalysis {
  const rows = history.map(({ label, value }) => ({
    label,
    value,
    severity: severityForHistoryRow(label, value),
  }))
  const counts = {
    red:   rows.filter((r) => r.severity === 'red').length,
    amber: rows.filter((r) => r.severity === 'amber').length,
    green: rows.filter((r) => r.severity === 'green').length,
  }
  const verdict: Severity =
    counts.red > 0   ? 'red'   :
    counts.amber > 0 ? 'amber' :
    counts.green > 0 ? 'green' : 'neutral'
  return { rows, verdict, counts }
}

interface ClientHistorySummaryProps {
  history: HistoryItem[]
}

/**
 * Section "Historique de l'aile" en lignes label/badge. Renvoie null quand
 * le pilote n'a rien renseigné dans l'historique (le caller affichera son
 * propre fallback).
 */
export function ClientHistorySummary({ history }: ClientHistorySummaryProps) {
  if (history.length === 0) return null
  const { rows } = analyseClientHistory(history)
  return (
    <SummarySection title="Historique de l'aile">
      {rows.map((row, i) => (
        <SummaryRow key={`${row.label}-${i}`} {...row} />
      ))}
    </SummarySection>
  )
}
