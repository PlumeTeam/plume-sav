import { z } from 'zod'
import { WING_BRANDS } from './types'

export const wingInfoSchema = z.object({
  wingBrand: z.string().min(1, 'Marque requise'),
  wingModel: z.string().min(1, 'Modèle requis'),
  wingSize: z.string().min(1, 'Taille requise'),
  wingSerial: z.string().min(1, 'Numéro de série requis'),
  wingColor: z.string().min(1, 'Couleur requise'),
  purchaseDate: z.string().min(1, "Date d'achat requise"),
  flightHours: z.string().regex(/^\d*$/, 'Nombre entier requis'),
})

// 'porosity' is intentionally absent from the wizard — clients can't self-diagnose it.
// 'fabric_issue' is wizard-only (not in the DB enum) and is folded into the rich
// description text by the action — it never reaches the problem_category column.
export const problemSchema = z.object({
  problemCategory: z.enum([
    'tear', 'fabric_issue', 'line_issue', 'riser_issue', 'other',
  ], { errorMap: () => ({ message: 'Catégorie requise' }) }),
  problemDescription: z.string()
    .min(10, 'Description trop courte (10 caractères minimum)')
    .max(2000, 'Description trop longue (2000 caractères max)'),
  urgency: z.enum(['normal', 'urgent']),
})

export const createTicketSchema = z.object({
  // Type de demande SAV — repair / inspection / manufacturing_defect.
  // Détermine le flow du wizard, le destinataire (école vs atelier) et le routing.
  requestType: z.enum(['repair', 'inspection', 'manufacturing_defect']),
  wingBrand: z.string().min(1),
  wingModel: z.string().min(1),
  wingSize: z.string().min(1),
  wingSerial: z.string().min(1),
  wingColor: z.string().min(1),
  purchaseDate: z.string().min(1),
  flightHours: z.coerce.number().int().min(0).optional(),
  // Optional pour repair (déchirure, etc. sans catégorie explicite) et inspection.
  // Validation conditionnelle dans superRefine ci-dessous selon requestType.
  problemCategory: z.enum(['tear', 'fabric_issue', 'line_issue', 'riser_issue', 'other']).optional(),
  // Description optionnelle pour 'inspection' (contrôle de routine) — l'historique
  // de l'aile remplace la description libre. Validation dans superRefine.
  problemDescription: z.string().max(2000).optional().default(''),
  urgency: z.enum(['normal', 'urgent']).optional().default('normal'),
  wingBehaviors: z.array(z.string()).optional(),
  wingHistory: z.object({
    flightHours:        z.string().optional(),
    flightCount:        z.string().optional(),
    alreadyRepaired:    z.enum(['yes', 'no']).nullable().optional(),
    repairDescription:  z.string().max(1000).optional(),
    waterContact:       z.enum(['none', 'fresh', 'salt']).nullable().optional(),
    treeContact:        z.enum(['yes', 'no']).nullable().optional(),
    // Multi-select : un client peut combiner sable + neige + autre.
    // Tableau vide / undefined = aucune condition signalée (équivaut à l'ancien 'none').
    surfaceContact:     z.array(z.enum(['sand', 'snow', 'other'])).optional(),
    surfaceContactNote: z.string().max(200).optional(),
    generalCondition:   z.enum(['excellent', 'good', 'worn', 'bad']).nullable().optional(),
  }).optional(),
  // Destinataire — soit une école (manufacturing_defect sous garantie), soit
  // un atelier (repair, inspection, defect hors garantie). Au moins un requis.
  schoolId: z.string().optional(),
  workshopId: z.string().optional(),
  referentSchoolId: z.string().nullable().optional(),
  schoolChangeReasonCode: z.enum(['school_closed', 'moved_region', 'relationship', 'other']).optional(),
  schoolChangeReasonNote: z.string().max(2000).optional(),
  deliveryMethod: z.enum(['in_person', 'postal'], {
    errorMap: () => ({ message: 'Choisissez la méthode de remise de l\'aile' }),
  }),
  clientMessage: z.string().max(2000).optional(),
  photoPaths: z.array(z.object({
    storagePath: z.string().min(1),
    photoType: z.enum(['overview', 'damage_closeup', 'serial_tag', 'other']),
    caption: z.string().optional(),
  })),
}).superRefine((data, ctx) => {
  // Au moins un destinataire (école ou atelier) doit être renseigné.
  if (!data.schoolId && !data.workshopId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['schoolId'],
      message: 'Choisissez un destinataire pour traiter votre demande',
    })
  }

  // Pour repair et manufacturing_defect, on attend une description libre.
  // Pour inspection, c'est l'historique de l'aile qui sert de description.
  if (data.requestType !== 'inspection') {
    const desc = (data.problemDescription ?? '').trim()
    if (desc.length < 10) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['problemDescription'],
        message: 'Description trop courte (10 caractères minimum)',
      })
    }
  }

  // If the client picked a different school than the referent, we need a reason.
  if (data.schoolId) {
    const changedSchool = data.referentSchoolId && data.referentSchoolId !== data.schoolId
    if (changedSchool && !data.schoolChangeReasonCode) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['schoolChangeReasonCode'],
        message: 'Indiquez pourquoi vous changez d\'école',
      })
    }
    if (data.schoolChangeReasonCode === 'other' && !data.schoolChangeReasonNote?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['schoolChangeReasonNote'],
        message: 'Précisez la raison',
      })
    }
  }
})

// École : sauvegarde de la checklist de premier diagnostic
// notes contient un JSON sérialisé (SchoolCheckPayload) qui peut inclure
// plusieurs storage paths de photos par question — d'où la marge confortable.
export const schoolChecklistSchema = z.object({
  ticketId:    z.string().uuid(),
  checkedIds:  z.array(z.string()).default([]),
  notes:       z.string().max(16000).optional(),
})

// École : choix d'une issue
//  - resolved_by_school        : niveau 1 — réparation école
//  - normal_behavior_explained : niveau 1 — comportement normal expliqué
//  - escalated_to_workshop     : niveau 2 — atelier (avec ou sans urgence Plume)
//  - escalated_to_plume        : cas exceptionnel HQ
//  - workshop_advice_requested : avis distance, l'aile reste à l'école
//  - reflection                : école n'a pas encore décidé
export const schoolResolutionSchema = z.object({
  ticketId:   z.string().uuid(),
  resolution: z.enum([
    'resolved_by_school',
    'normal_behavior_explained',
    'escalated_to_workshop',
    'escalated_to_plume',
    'workshop_advice_requested',
    'reflection',
  ]),
  note: z.string().max(2000).optional(),
  // Requis pour escalated_to_workshop et workshop_advice_requested
  workshopId:    z.string().optional(),
  workshopLabel: z.string().optional(),
  // Niveau 3 — défaut grave : escalade atelier + alerte Plume HQ
  isPlumeUrgent: z.preprocess((v) => v === 'true' || v === true, z.boolean()).optional(),
}).superRefine((data, ctx) => {
  const needsWorkshop =
    data.resolution === 'escalated_to_workshop' ||
    data.resolution === 'workshop_advice_requested'
  if (needsWorkshop) {
    if (!data.workshopId || !data.workshopLabel) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['workshopId'],
        message: 'Choisissez un atelier du réseau partenaire',
      })
    }
  }
})

// Wizard client : attache des photos à un ticket déjà créé. Utilisé par le
// flow transactionnel — création ticket d'abord, upload photos ensuite avec
// le ticket_id en préfixe de path. Si l'utilisateur ferme entre les deux,
// les fichiers orphelins éventuels portent le ticket_id dans leur chemin et
// sont identifiables pour un cleanup ultérieur.
export const attachTicketPhotosSchema = z.object({
  ticketId: z.string().uuid(),
  photos: z.array(z.object({
    storagePath: z.string().min(1).max(500),
    photoType:   z.enum(['overview', 'damage_closeup', 'serial_tag', 'other']),
    caption:     z.string().max(500).optional(),
  })).min(1).max(20),
})

// Atelier : sauvegarde de la checklist diagnostic technique
export const workshopChecklistSchema = z.object({
  ticketId:    z.string().uuid(),
  checkedIds:  z.array(z.string()).default([]),
  notes:       z.string().max(5000).optional(),
})

// Atelier : démarrage du pré-check (T5 bis, branche "problème pas clair").
// Pas de payload supplémentaire — c'est juste une transition d'état.
export const startWorkshopPreCheckSchema = z.object({
  ticketId: z.string().uuid(),
})

// Atelier : clôture du pré-check — observations obligatoires (au moins 10
// caractères pour éviter les bouts de phrase vides). Tarif figé côté serveur
// depuis plume_settings, pas envoyé par le client.
export const finishWorkshopPreCheckSchema = z.object({
  ticketId:     z.string().uuid(),
  observations: z.string()
    .trim()
    .min(10, 'Décrivez vos observations (10 caractères min)')
    .max(5000, 'Observations trop longues (5000 caractères max)'),
})

// Atelier : upload d'un rapport de révision (ticket request_type='inspection').
// Le fichier est déjà uploadé dans le bucket 'tickets' côté client — on persiste
// uniquement le storage_path et le nom de fichier original.
export const revisionReportSchema = z.object({
  ticketId:    z.string().uuid(),
  storagePath: z.string().min(1).max(1000),
  filename:    z.string().trim().min(1).max(255),
})

// École : assigne un atelier au ticket pour la communication, sans changer
// le statut/résolution (pas d'escalade — juste "voilà à qui je parle").
export const assignWorkshopSchema = z.object({
  ticketId:      z.string().uuid(),
  workshopId:    z.string().min(1),
  workshopLabel: z.string().min(1),
})

export const addMessageSchema = z.object({
  ticketId: z.string().uuid(),
  content: z.string().min(1).max(5000),
})

export const updateStatusSchema = z.object({
  ticketId: z.string().uuid(),
  newStatus: z.enum([
    'pending', 'processing', 'approved', 'rejected', 'completed', 'cancelled',
  ]),
  note: z.string().max(500).optional(),
})

export const roleMessageSchema = z.object({
  ticketId: z.string().uuid(),
  content: z.string().min(1).max(5000),
  isInternal: z.preprocess((v) => v === 'true', z.boolean()),
  senderRole: z.enum(['client', 'school', 'workshop', 'plume_admin']),
  // Optional explicit visibility — overrides the legacy is_internal mapping.
  // Used by the new school action cards to differentiate "À l'atelier" vs "Au client".
  visibilityLevel: z.enum(['all', 'school_plume', 'workshop_plume', 'plume_only']).optional(),
  // 5-channel system (cf. apps/sav/features/tickets/channels.ts). Quand
  // fourni, l'action valide que le rôle effectif peut poster dans ce canal
  // et écrit ticket_messages.channel pour le filtrage server-side.
  channel: z.enum([
    'school_client', 'client_workshop', 'workshop_school', 'group', 'workshop_plume',
  ]).optional(),
})

// Message posté sur un canal explicite (T3 atelier). Photos optionnelles —
// les paths viennent du bucket `tickets` après upload côté client.
export const channelMessageSchema = z.object({
  ticketId: z.string().uuid(),
  channel: z.enum([
    'school_client',
    'client_workshop',
    'workshop_school',
    'group',
    'workshop_plume',
  ]),
  // Contenu OU au moins une photo — l'un des deux suffit.
  content: z.string().trim().max(5000).optional().default(''),
  attachmentPaths: z.array(z.string().min(1)).max(8).default([]),
}).superRefine((data, ctx) => {
  if (!data.content && data.attachmentPaths.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['content'],
      message: 'Ajoutez un message ou une photo',
    })
  }
})

// ============================================================
// Bons de transport GLS (migration 20260510000000)
// ============================================================

// Adresse client postale — utilisée pour le leg client → école quand
// l'adresse n'a pas encore été capturée sur le ticket.
export const clientShippingAddressSchema = z.object({
  street:     z.string().trim().min(3,  'Adresse trop courte').max(200, 'Adresse trop longue'),
  postalCode: z.string().trim().min(2,  'Code postal requis').max(15,   'Code postal trop long'),
  city:       z.string().trim().min(1,  'Ville requise').max(100, 'Ville trop longue'),
  country:    z.string().trim().length(2, 'Code pays ISO-2 requis (ex: FR, BE)').toUpperCase().default('FR'),
})

// Génération d'une étiquette GLS pour un leg donné. L'`address` n'est requise
// que pour `client_to_school` à la 1ère génération — sinon la Server Action
// la lit depuis la colonne client_shipping_address du ticket.
export const generateShippingLabelSchema = z.object({
  ticketId: z.string().uuid(),
  leg:      z.enum(['client_to_school', 'school_to_workshop', 'workshop_to_return']),
  address:  clientShippingAddressSchema.optional(),
  // Requis pour le leg workshop_to_return — destination du renvoi.
  returnDestination: z.enum(['school', 'client']).optional(),
}).superRefine((data, ctx) => {
  if (data.leg === 'workshop_to_return' && !data.returnDestination) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['returnDestination'],
      message: 'Précisez la destination du renvoi (école ou client)',
    })
  }
})

// ============================================================
// Actions admin Plume HQ (T2)
// ============================================================

// Réassignation d'un ticket à une autre école — ne change PAS le statut,
// juste l'aiguillage. Plume conserve `referent_school_id` à jour pour la
// traçabilité et `school_id` devient l'école qui traite désormais.
export const adminReassignSchoolSchema = z.object({
  ticketId: z.string().uuid(),
  schoolId: z.string().min(1, 'École requise'),
  // Note libre obligatoire : pourquoi cette réassignation ?
  reason:   z.string().trim().min(3, 'Motif requis (3 caractères min)').max(2000),
})

// Fermeture manuelle d'un ticket par l'admin — note obligatoire pour la
// traçabilité. Statut → completed.
export const adminCloseTicketSchema = z.object({
  ticketId: z.string().uuid(),
  note:     z.string().trim().min(3, 'Note obligatoire (3 caractères min)').max(2000),
})

// ============================================================
// Clôture explicite d'un ticket (T7) — école / atelier / Plume HQ
// ============================================================
//
// Le client est exclu côté Server Action (validation du rôle). Le statut
// final (outcome) est obligatoire ; la note est optionnelle sauf pour
// `other` (vérifié par superRefine).
export const closeTicketSchema = z.object({
  ticketId: z.string().uuid(),
  outcome:  z.enum([
    'resolved_in_consultation',
    'repaired',
    'replaced',
    'no_repair_needed',
    'invalid',
    'client_cancelled',
    'other',
  ], { errorMap: () => ({ message: 'Choisissez un statut final' }) }),
  note: z.string().trim().max(2000, 'Note trop longue (2000 caractères max)').optional(),
}).superRefine((data, ctx) => {
  if (data.outcome === 'other' && (!data.note || data.note.length < 3)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['note'],
      message: 'Précisez la raison (3 caractères min) — obligatoire pour « Autre »',
    })
  }
})

export type CloseTicketInput = z.infer<typeof closeTicketSchema>

// Relance email d'une école qui n'a pas pris en charge son ticket.
export const adminRemindSchoolSchema = z.object({
  ticketId: z.string().uuid(),
})

// T6 — Décision atelier : coût estimé + (optionnel) prise en charge exceptionnelle
// hors garantie. Le décompte repair/replacement est calculé côté serveur en
// relisant plume_settings (jamais reçu du client — sinon contournable).
export const repairDecisionSchema = z.object({
  ticketId: z.string().uuid(),
  estimatedCost: z.preprocess(
    (v) => (v !== '' && v != null ? Number(v) : undefined),
    z.number({ invalid_type_error: 'Coût invalide' })
      .min(0, 'Le coût doit être positif')
      .max(100000, 'Coût trop élevé'),
  ),
  // True = Plume prend en charge alors qu'on est hors garantie (exception).
  // Ignoré côté serveur si la garantie est encore active (couverture automatique).
  warrantyOverride: z.preprocess(
    (v) => v === 'true' || v === true,
    z.boolean(),
  ).optional(),
  // Justification — requise UNIQUEMENT pour l'override hors garantie.
  note: z.string().trim().max(2000).optional(),
})

// Décision atelier 3-options (étape "Prise de décision" du WorkshopStepPanel).
// Cost requis uniquement pour 'repair' ; 'no_issue' et 'replacement' acceptent
// une note libre optionnelle. Le check coût ≤ seuil reste côté serveur.
export const workshopDecisionSchema = z.object({
  ticketId: z.string().uuid(),
  decision: z.enum(['no_issue', 'repair', 'replacement']),
  estimatedCost: z.preprocess(
    (v) => (v === '' || v == null ? undefined : Number(v)),
    z.number({ invalid_type_error: 'Coût invalide' })
      .min(0, 'Le coût doit être positif')
      .max(100000, 'Coût trop élevé')
      .optional(),
  ),
  note: z.string().trim().max(2000).optional(),
}).superRefine((data, ctx) => {
  if (data.decision === 'repair' && data.estimatedCost == null) {
    ctx.addIssue({
      code:    z.ZodIssueCode.custom,
      path:    ['estimatedCost'],
      message: 'Coût estimé requis pour une réparation',
    })
  }
})

export const diagnosisSchema = z.object({
  ticketId: z.string().uuid(),
  diagnosisNotes: z.string().max(5000).optional(),
  estimatedCost: z.preprocess(
    (v) => (v !== '' && v != null ? Number(v) : undefined),
    z.number().min(0).optional()
  ),
  estimatedHours: z.preprocess(
    (v) => (v !== '' && v != null ? Number(v) : undefined),
    z.number().min(0).optional()
  ),
  partsNeeded: z.string().max(2000).optional(),
})

// École : validation de l'envoi postal de l'aile par le client.
// `approve` ne porte rien d'autre que le ticketId. `refuse` exige une raison
// non vide qui sera affichée au client dans son dashboard.
export const approveShippingSchema = z.object({
  ticketId: z.string().uuid(),
})

export const refuseShippingSchema = z.object({
  ticketId: z.string().uuid(),
  reason:   z.string().trim().min(10, 'Expliquez la raison du refus (10 caractères min.)').max(2000),
})

// Plume HQ : validation de l'envoi postal pour les clients ayant dépassé le
// seuil annuel (auto_approved_shipping = FALSE). Mêmes contraintes que la
// version école — raison obligatoire pour un refus.
export const adminApproveClientShippingSchema = z.object({
  ticketId: z.string().uuid(),
})

export const adminRefuseClientShippingSchema = z.object({
  ticketId: z.string().uuid(),
  reason:   z.string().trim().min(10, 'Expliquez la raison du refus (10 caractères min.)').max(2000),
})

export type WingInfoInput = z.infer<typeof wingInfoSchema>
export type ProblemInput = z.infer<typeof problemSchema>
export type CreateTicketInput = z.infer<typeof createTicketSchema>
export type AddMessageInput = z.infer<typeof addMessageSchema>
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>
export type RoleMessageInput = z.infer<typeof roleMessageSchema>
export type DiagnosisInput = z.infer<typeof diagnosisSchema>
export type ChannelMessageInput = z.infer<typeof channelMessageSchema>
export type RepairDecisionInput     = z.infer<typeof repairDecisionSchema>
export type WorkshopDecisionInput   = z.infer<typeof workshopDecisionSchema>
export type SchoolChecklistInput   = z.infer<typeof schoolChecklistSchema>
export type SchoolResolutionInput  = z.infer<typeof schoolResolutionSchema>
export type WorkshopChecklistInput = z.infer<typeof workshopChecklistSchema>
export type AttachTicketPhotosInput = z.infer<typeof attachTicketPhotosSchema>
export type AssignWorkshopInput    = z.infer<typeof assignWorkshopSchema>
export type ClientShippingAddressInput   = z.infer<typeof clientShippingAddressSchema>
export type GenerateShippingLabelInput   = z.infer<typeof generateShippingLabelSchema>

// Re-export for convenience
export { WING_BRANDS }
