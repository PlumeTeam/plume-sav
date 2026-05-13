import type { Database, TicketStatus, RequestStatus, ServiceType, ProblemCategory, UrgencyLevel, PhotoType, MessageSenderRole, MessageChannel, SchoolResolution, ClosureOutcome, WarrantyTier } from '@plume/db'

export type Ticket = Database['public']['Tables']['service_requests']['Row']
export type TicketInsert = Database['public']['Tables']['service_requests']['Insert']
export type TicketUpdate = Database['public']['Tables']['service_requests']['Update']
export type TicketPhoto = Database['public']['Tables']['ticket_photos']['Row']
export type TicketMessage = Database['public']['Tables']['ticket_messages']['Row']
export type TicketStatusHistory = Database['public']['Tables']['ticket_status_history']['Row']

export type { TicketStatus, RequestStatus, ServiceType, ProblemCategory, UrgencyLevel, PhotoType, MessageSenderRole, MessageChannel, SchoolResolution, ClosureOutcome, WarrantyTier }

// Rôle SAV autorisé à clôturer un ticket (T7). Le client est exclu — c'est
// volontaire : seul un acteur du réseau (école / atelier / Plume HQ) peut
// déclarer le SAV terminé.
export type CloserRole = Exclude<MessageSenderRole, 'client'>

// Libellés UI pour les statuts finaux. Ordre = ordre d'affichage dans le
// dropdown de clôture (du plus fréquent au plus rare).
export const CLOSURE_OUTCOME_OPTIONS: Array<{
  value:       ClosureOutcome
  label:       string
  description: string
  /** Rôle(s) où ce statut est typiquement pertinent — affichage uniquement
   *  (pas une contrainte serveur). Tout rôle autorisé peut choisir n'importe
   *  quel statut, mais on grise les options non pertinentes. */
  primaryRoles: CloserRole[]
}> = [
  {
    value:        'repaired',
    label:        'Réparé',
    description:  "L'aile a été réparée et restituée.",
    primaryRoles: ['workshop', 'school'],
  },
  {
    value:        'resolved_in_consultation',
    label:        'Résolu en consultation',
    description:  "Diagnostic école / atelier sans réparation matérielle.",
    primaryRoles: ['school', 'workshop'],
  },
  {
    value:        'no_repair_needed',
    label:        'Pas de réparation nécessaire',
    description:  "Comportement normal ou problème sans intervention.",
    primaryRoles: ['school', 'workshop'],
  },
  {
    value:        'replaced',
    label:        'Remplacé',
    description:  "Aile remplacée (échange neuf, sous garantie ou commercial).",
    primaryRoles: ['plume_admin', 'workshop'],
  },
  {
    value:        'client_cancelled',
    label:        'Annulé par le client',
    description:  "Le client a retiré sa demande.",
    primaryRoles: ['school', 'workshop', 'plume_admin'],
  },
  {
    value:        'invalid',
    label:        'Non valide',
    description:  "Hors SAV, doublon, ou demande infondée.",
    primaryRoles: ['plume_admin', 'school'],
  },
  {
    value:        'other',
    label:        'Autre',
    description:  "Note de clôture obligatoire pour préciser.",
    primaryRoles: ['school', 'workshop', 'plume_admin'],
  },
]

export const CLOSURE_OUTCOME_LABELS: Record<ClosureOutcome, string> = {
  resolved_in_consultation: 'Résolu en consultation',
  repaired:                 'Réparé',
  replaced:                 'Remplacé',
  no_repair_needed:         'Pas de réparation nécessaire',
  invalid:                  'Non valide',
  client_cancelled:         'Annulé par le client',
  other:                    'Autre',
}

export const CLOSER_ROLE_LABELS: Record<CloserRole, string> = {
  school:      "l'école",
  workshop:    "l'atelier",
  plume_admin: 'Plume HQ',
}

export type TicketWithPhotos = Ticket & {
  ticket_photos: TicketPhoto[]
}

export type TicketWithHistory = Ticket & {
  ticket_status_history: TicketStatusHistory[]
}

export type TicketDetail = Ticket & {
  ticket_photos: TicketPhoto[]
  ticket_status_history: TicketStatusHistory[]
  ticket_messages: TicketMessage[]
}

// Wizard step data types (client-side only)
export interface WizardWingInfo {
  wingBrand: string
  wingModel: string
  wingSize: string
  wingSerial: string
  wingColor: string
  purchaseDate: string
  flightHours: string
}

// Wing history step — every field is optional ("le client peut ne pas savoir").
// Numeric inputs are stored as strings to keep the user's literal input until
// we serialise into the ticket description.
export type WaterContactKind   = 'none' | 'fresh' | 'salt'
// Multi-select : un client peut combiner plusieurs conditions (sable + neige).
// Vide / undefined = aucune condition rapportée.
export type SurfaceContactKind = 'sand' | 'snow' | 'other'
export type WingCondition      = 'excellent' | 'good' | 'worn' | 'bad'

export interface WizardWingHistory {
  flightHours?:        string  // numeric input, kept as string while editing
  flightCount?:        string
  alreadyRepaired?:    'yes' | 'no' | null
  repairDescription?:  string
  waterContact?:       WaterContactKind | null
  treeContact?:        'yes' | 'no' | null  // arbrissage
  surfaceContact?:     SurfaceContactKind[]  // [] / undefined = aucune
  surfaceContactNote?: string  // free text when surfaceContact includes 'other'
  generalCondition?:   WingCondition | null
}

export type SchoolChangeReasonCode =
  | 'school_closed'
  | 'moved_region'
  | 'relationship'
  | 'other'

export type DeliveryMethod = 'in_person' | 'postal'

// Bons de transport SAV — trois trajets possibles dans le parcours.
// Chacun mappe sur sa propre paire de colonnes {leg}_tracking / {leg}_label_url.
export type ShipmentLeg =
  | 'client_to_school'    // Client → École  (envoi postal initial)
  | 'school_to_workshop'  // École → Atelier (escalade)
  | 'workshop_to_return'  // Atelier → École ou Client (renvoi)

export type WorkshopReturnDestination = 'school' | 'client'

// T6 — Décision atelier après pré-check
//  - repair       : coût estimé ≤ seuil plume_settings → réparation
//  - replacement  : coût estimé > seuil → aile neuve
// T6+ — Décision atelier après pré-check / diagnostic :
//  - 'no_issue'    : aucun défaut, l'aile repart telle quelle (skip réparation)
//  - 'repair'      : coût ≤ seuil → réparation
//  - 'replacement' : coût > seuil OU non réparable → remplacement aile neuve
export type WorkshopDecision = 'no_issue' | 'repair' | 'replacement'

// Statut de garantie au moment de la décision atelier — figé à la prise
// de décision pour traçabilité (purchase_date pouvant être corrigé plus tard).
export type WarrantyStatus = 'under_warranty' | 'out_of_warranty'

// Adresse postale du client — capturée à la volée la 1ère fois qu'il
// génère un bon de transport. Stockée en JSONB sur le ticket.
export interface ClientShippingAddress {
  street:      string
  postalCode:  string
  city:        string
  country:     string  // ISO-2 par défaut "FR"
}

export interface WizardProblem {
  problemCategory: WizardProblemCategory | ''
  problemDescription: string
  urgency: UrgencyLevel
  wingBehaviors?: string[]                       // IDs from WING_BEHAVIOR_TYPES, used when problemCategory is 'other'
  partnerSchoolId?: string                       // School the wizard sends the ticket to
  referentSchoolId?: string | null               // School linked to the wing's purchase (default destination)
  schoolChangeReasonCode?: SchoolChangeReasonCode // Set only when partnerSchoolId !== referentSchoolId
  schoolChangeReasonNote?: string                // Free text, required when reason code is 'other'
  deliveryMethod?: DeliveryMethod                // How the client gets the wing to the school
  clientMessage?: string                          // Personal message to the school, posted as the first chat reply
}

export interface WizardPhoto {
  dataUrl: string
  photoType: PhotoType
  caption: string
  fileName: string
}

export const WING_BRANDS = [
  'Plume', 'Ozone', 'Advance', 'Niviuk', 'Nova', 'Gin', 'BGD',
  'Skywalk', 'U-Turn', 'Gradient', 'Triple Seven', 'Sup Air', 'Autre',
] as const

// Wizard-only category type. Extends the DB enum with 'fabric_issue', which
// is shown to the client as "Tissu" but never written to the problem_category
// column (the insert payload doesn't carry it — it's folded into the rich
// description text + mapped to a service_type by deriveServiceType).
export type WizardProblemCategory = ProblemCategory | 'fabric_issue'

// Categories shown in the client wizard. 'porosity' and 'buckle_issue' sont
// volontairement exclus :
//  - porosity : un client ne peut pas l'auto-diagnostiquer — c'est l'atelier
//    qui le constate après inspection.
//  - buckle_issue : trop spécifique pour le funnel client ; les boucles
//    relèvent d'un cas atelier traité hors wizard.
// Le DB enum garde les deux pour les usages staff / historique.
export const PROBLEM_CATEGORIES: Array<{
  value: Exclude<WizardProblemCategory, 'porosity' | 'buckle_issue'>
  label: string
  description: string
  emoji: string
}> = [
  { value: 'tear',         label: 'Déchirure',  description: 'Accroc, coupure ou déchirure du tissu', emoji: '🪡' },
  { value: 'fabric_issue', label: 'Tissu',      description: 'Usure, décoloration ou problème de tissu', emoji: '🧶' },
  { value: 'line_issue',   label: 'Suspente',   description: 'Suspente cassée, emmêlée ou usée',      emoji: '🧵' },
  { value: 'riser_issue',  label: 'Élévateur',  description: "Problème d'élévateur ou poulie",        emoji: '🔗' },
  { value: 'other',        label: 'Autre',      description: 'Autre problème non listé',              emoji: '❓' },
]

export const WING_BEHAVIOR_TYPES = [
  { id: 'not_straight',     label: 'Aile qui ne vole pas droit' },
  { id: 'too_fragile',      label: 'Aile trop fragile' },
  { id: 'lazy_inflation',   label: 'Aile trop paresseuse au gonflage' },
  { id: 'closes_easily',    label: 'Aile qui ferme facilement (fermetures asymétriques, frontales)' },
  { id: 'unstable',         label: 'Aile instable en turbulence' },
  { id: 'brake_issue',      label: 'Problème de freins (trop durs, trop mous, course trop longue/courte)' },
  { id: 'speed_issue',      label: 'Vitesse anormale (trop lente ou trop rapide)' },
  { id: 'other_behavior',   label: 'Autre comportement inhabituel' },
] as const

export const STATUS_CONFIG: Partial<Record<RequestStatus, { label: string; color: string; bg: string }>> = {
  pending:                 { label: 'À traiter',         color: 'text-amber-800',   bg: 'bg-amber-100' },
  PENDING:                 { label: 'À traiter',         color: 'text-amber-800',   bg: 'bg-amber-100' },
  school_acknowledged:     { label: 'Vue par l\'école',  color: 'text-amber-800',   bg: 'bg-amber-100' },
  wing_received_school:    { label: 'Aile reçue',        color: 'text-sky-800',     bg: 'bg-sky-100' },
  school_checking:         { label: 'Diagnostic école',  color: 'text-sky-800',     bg: 'bg-sky-100' },
  processing:              { label: 'En cours',          color: 'text-sky-800',     bg: 'bg-sky-100' },
  approved:                { label: 'Approuvé',          color: 'text-violet-800',  bg: 'bg-violet-100' },
  school_resolved:         { label: 'Résolu école',      color: 'text-emerald-800', bg: 'bg-emerald-100' },
  escalated_to_workshop:   { label: 'Vers atelier',      color: 'text-violet-800',  bg: 'bg-violet-100' },
  wing_received_workshop:  { label: 'Atelier reçu',      color: 'text-violet-800',  bg: 'bg-violet-100' },
  workshop_pre_checking:   { label: 'Pré-check atelier', color: 'text-violet-800',  bg: 'bg-violet-100' },
  workshop_diagnosing:     { label: 'Diagnostic atelier',color: 'text-violet-800',  bg: 'bg-violet-100' },
  workshop_repairing:      { label: 'En réparation',     color: 'text-violet-800',  bg: 'bg-violet-100' },
  workshop_done:           { label: 'Réparé',            color: 'text-emerald-800', bg: 'bg-emerald-100' },
  wing_returned:           { label: 'Aile renvoyée',     color: 'text-emerald-800', bg: 'bg-emerald-100' },
  completed:               { label: 'Terminé',           color: 'text-emerald-800', bg: 'bg-emerald-100' },
  rejected:                { label: 'Rejeté',            color: 'text-red-800',     bg: 'bg-red-100' },
  cancelled:               { label: 'Annulé',            color: 'text-slate-600',   bg: 'bg-slate-100' },
  SUCCESS:                 { label: 'Réussi',            color: 'text-emerald-800', bg: 'bg-emerald-100' },
  ERROR:                   { label: 'Erreur',            color: 'text-red-800',     bg: 'bg-red-100' },
}
