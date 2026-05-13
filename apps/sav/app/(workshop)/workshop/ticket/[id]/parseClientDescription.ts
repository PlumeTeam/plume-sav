// Parser de la `description` riche construite par createTicketAction.
// Le wizard client fold les métadonnées (catégorie, urgence, comportements,
// historique aile) en bloc préfixe `[Section] valeur`, séparé du texte libre
// par `\n\n---\n\n`. On reconstruit ici un objet structuré pour rendre la vue
// "Client" du DiagnosticViewSwitcher en cartes propres (équivalent UX du
// SchoolCheckSummary côté école), au lieu de balancer le texte brut.

export interface ParsedClientDescription {
  /** Comportements de l'aile signalés au wizard (libellés en clair, joints). */
  behaviors:      string | null
  /** Lignes "label : valeur" de la section [Historique aile]. Conservées
   *  dans leur ordre de saisie pour cohérence avec le wizard. */
  history:        Array<{ label: string; value: string }>
  /** Texte libre laissé par le pilote (après le séparateur `---`). */
  freeText:       string
}

const SEPARATOR = '\n\n---\n\n'

// Lignes historique du wizard, format `  • Label : valeur`.
// Tolère un espace en plus, un bullet alternatif, et la valeur sans `:` (skip).
const HISTORY_LINE_RE = /^\s*•\s*([^:]+?)\s*:\s*(.+?)\s*$/

export function parseClientDescription(description: string | null): ParsedClientDescription {
  if (!description) {
    return { behaviors: null, history: [], freeText: '' }
  }

  // Coupe le bloc structuré du texte libre. Si aucun séparateur n'est trouvé,
  // on considère toute la description comme texte libre (rétrocompat tickets
  // anciens créés sans buildRichDescription).
  const sepIdx = description.indexOf(SEPARATOR)
  const metadataBlock = sepIdx >= 0 ? description.slice(0, sepIdx) : ''
  const freeText      = sepIdx >= 0 ? description.slice(sepIdx + SEPARATOR.length).trim() : description.trim()

  let behaviors: string | null = null
  const history: Array<{ label: string; value: string }> = []

  if (metadataBlock) {
    const lines = metadataBlock.split('\n')
    let inHistory = false
    for (const raw of lines) {
      const line = raw.trimEnd()

      if (line.startsWith('[Comportements]')) {
        behaviors = line.replace('[Comportements]', '').trim() || null
        inHistory = false
        continue
      }

      if (line.startsWith('[Historique aile]')) {
        inHistory = true
        continue
      }

      // Tout autre `[Section]` (Catégorie, Urgence, Aile, Heures de vol) est
      // lu depuis les colonnes du ticket — on les ignore ici pour ne pas
      // dupliquer la donnée. Si on en croise un, on sort de la zone historique.
      if (line.startsWith('[')) {
        inHistory = false
        continue
      }

      if (inHistory) {
        const m = HISTORY_LINE_RE.exec(line)
        if (m && m[1] && m[2]) {
          history.push({ label: m[1], value: m[2] })
        }
      }
    }
  }

  return { behaviors, history, freeText }
}
