// Constants used across the SAV diagnostic workflow.
// partner_schools et partner_workshops viennent maintenant de la DB
// (cf. getPartnerSchools / getPartnerWorkshops). On garde ici uniquement
// les checklists métier et un fallback minimal d'atelier pour ne pas
// stranger le wizard si la DB est temporairement indisponible.

// Default text shown in the wizard's "Message à l'école" textarea.
// The client can keep it as-is, edit it, or wipe it entirely.
export const DEFAULT_CLIENT_MESSAGE = `Bonjour,

Voici les informations concernant un problème sur mon aile.

Cordialement`

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
// Les ateliers vivent maintenant dans la table partner_workshops (cf. queries.ts).
// Ce type est partagé entre la DB et les composants UI ; les champs lat/lng
// peuvent être null pour un atelier sans coords (l'UI filtre alors la carte).
export type PartnerWorkshop = {
  id:         string
  label:      string
  city:       string | null
  region:     string | null
  address:    string | null
  /** Latitude WGS84 — used by WorkshopMapPicker to drop a marker. */
  lat:        number | null
  /** Longitude WGS84. */
  lng:        number | null
  /** True for ateliers in the Plume network. Renders coral on the map; non-
   *  affiliated workshops render gray and carry no Plume guarantee. */
  affiliated: boolean
  /** Contact public — affiché sur les cartes ticket école/admin. */
  email?:     string | null
  /** Contact public — affiché sur les cartes ticket école/admin. */
  phone?:     string | null
}

/**
 * UUID Supabase de l'atelier test "Plume Embrun". Stocké en clair pour servir
 * de fallback hors-DB et pour les tests RLS. Source de vérité = table
 * partner_workshops (row id = ce même UUID).
 */
export const PLUME_EMBRUN_WORKSHOP_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'

/**
 * Fallback minimal utilisé quand getPartnerWorkshops() échoue (DB down,
 * RLS qui filtre tout, table absente sur un env de dev). Contient juste
 * l'atelier Plume Embrun avec son vrai UUID — garantit que le wizard
 * propose toujours au moins un destinataire.
 */
export const FALLBACK_PARTNER_WORKSHOPS: PartnerWorkshop[] = [
  {
    id:         PLUME_EMBRUN_WORKSHOP_ID,
    label:      'Atelier Plume Embrun',
    city:       'Embrun',
    region:     'Hautes-Alpes',
    address:    "Résidence le Val d'Embrun, 05200 Embrun",
    lat:        44.5633,
    lng:        6.4957,
    affiliated: true,
    // Mode démo (mai 2026) — compte de test atelier. Repasser à
    // sav@plumeparagliders.com avant la mise en prod publique.
    email:      'jbchandelier+atelier@gmail.com',
    phone:      '+33 4 92 00 00 00',
  },
]
