// Constants used across the SAV diagnostic workflow.
// Hardcoded for now; partner_schools comes from the live DB,
// partner_workshops can move to a table later when the network grows.

export type ChecklistItem = {
  id:    string
  label: string
  hint?: string
}

// ── École : checklist pour problèmes visuels (déchirure, suspente, etc.) ────
export const SCHOOL_VISUAL_CHECKLIST: ChecklistItem[] = [
  { id: 'damage_located',     label: 'Localisation du dommage identifiée' },
  { id: 'damage_photographed',label: 'Photo du dommage prise sur place' },
  { id: 'small_tear',         label: 'Déchirure < 15 cm et > 3 cm d\'une couture',
    hint: 'Si oui : réparable par l\'école avec ripstop' },
  { id: 'open_seam',          label: 'Couture ouverte identifiée' },
  { id: 'lines_check',        label: 'Maillon inversé ou suspente mal placée vérifiés' },
  { id: 'severity_assessed',  label: 'Évaluation de la gravité réalisée' },
]

// ── École : checklist pour problèmes de comportement ──────────────────────
export const SCHOOL_BEHAVIOR_CHECKLIST: ChecklistItem[] = [
  { id: 'behavior_verified',     label: 'Comportement vérifié en vol ou au sol' },
  { id: 'symmetry_check',        label: 'Symétrie visuelle de l\'aile vérifiée' },
  { id: 'inflation_test',        label: 'Test de gonflage effectué',
    hint: 'Lourd ? Asymétrique ? Hésitant ?' },
  { id: 'pilot_level_check',     label: 'Comportement cohérent avec le niveau du pilote ?',
    hint: 'Aile pas adaptée au niveau, ou comportement réellement anormal ?' },
  { id: 'client_advised',        label: 'Information / conseil donné au client' },
]

// ── Atelier : checklist diagnostic technique ──────────────────────────────
export const WORKSHOP_TECHNICAL_CHECKLIST: ChecklistItem[] = [
  { id: 'porosity_test',     label: 'Contrôle porosité (porosimètre)' },
  { id: 'trim_check',        label: 'Vérification du calage réel',
    hint: 'A-t-il bougé par rapport aux specs constructeur ?' },
  { id: 'symmetry_measured', label: 'Symétrie mesurée précisément (pas seulement visuelle)' },
  { id: 'malfacons_check',   label: 'Détection malfaçons : diagonales, astrap, incohérences' },
  { id: 'seam_quality',      label: 'Qualité des coutures et écarts de couture vérifiés' },
  { id: 'materials_check',   label: 'Bon tissu au bon endroit (renforts, panneaux)' },
  { id: 'repair_done',       label: 'Réparation effectuée (si applicable)' },
]

// ── Issues école (3 outcomes + escalation Plume) ──────────────────────────
export const SCHOOL_RESOLUTIONS = [
  {
    value: 'resolved_by_school',
    label: 'Résolu par l\'école',
    description: 'Petit SAV fait sur place (ripstop, conseil, réglage). Le ticket est clôturé.',
    emoji: '✅',
    targetStatus: 'completed' as const,
  },
  {
    value: 'normal_behavior_explained',
    label: 'Comportement normal, client informé',
    description: 'Le comportement signalé est normal. Vous avez expliqué au client. Ticket clôturé.',
    emoji: '💬',
    targetStatus: 'completed' as const,
  },
  {
    value: 'escalated_to_workshop',
    label: 'Escalader vers un atelier',
    description: 'Vous ne pouvez pas résoudre, ou le diagnostic dépasse vos compétences. Choisissez un atelier du réseau.',
    emoji: '🔧',
    targetStatus: 'approved' as const,
  },
  {
    value: 'escalated_to_plume',
    label: 'Cas exceptionnel — remonter à Plume',
    description: 'Le problème ne rentre dans aucune catégorie. L\'équipe Plume HQ prendra le relais.',
    emoji: '🦅',
    targetStatus: 'processing' as const, // stays "processing" but visible to plume_admin
  },
] as const

// ── Réseau d'ateliers partenaires ─────────────────────────────────────────
// TODO: migrer vers une table partner_workshops quand le réseau grandit.
export const PARTNER_WORKSHOPS: Array<{ id: string; label: string; region: string }> = [
  { id: 'plume-annecy',     label: 'Atelier Plume Annecy',         region: 'Haute-Savoie' },
  { id: 'plume-grenoble',   label: 'Atelier Plume Grenoble',       region: 'Isère' },
  { id: 'plume-saint-hil',  label: 'Atelier Saint-Hilaire',        region: 'Isère' },
  { id: 'plume-chamonix',   label: 'Atelier Plume Chamonix',       region: 'Haute-Savoie' },
  { id: 'plume-pyrenees',   label: 'Atelier Plume Pyrénées',       region: 'Pyrénées' },
  { id: 'plume-hq',         label: 'Atelier Plume HQ (Annecy)',    region: 'Haute-Savoie' },
]
