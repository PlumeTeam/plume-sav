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
export const problemSchema = z.object({
  problemCategory: z.enum([
    'tear', 'line_issue', 'riser_issue', 'buckle_issue', 'other',
  ], { errorMap: () => ({ message: 'Catégorie requise' }) }),
  problemDescription: z.string()
    .min(10, 'Description trop courte (10 caractères minimum)')
    .max(2000, 'Description trop longue (2000 caractères max)'),
  urgency: z.enum(['normal', 'urgent']),
})

export const createTicketSchema = z.object({
  wingBrand: z.string().min(1),
  wingModel: z.string().min(1),
  wingSize: z.string().min(1),
  wingSerial: z.string().min(1),
  wingColor: z.string().min(1),
  purchaseDate: z.string().min(1),
  flightHours: z.coerce.number().int().min(0).optional(),
  problemCategory: z.enum(['tear', 'line_issue', 'riser_issue', 'buckle_issue', 'other']),
  problemDescription: z.string().min(10).max(2000),
  urgency: z.enum(['normal', 'urgent']),
  wingBehaviors: z.array(z.string()).optional(),
  // Partner school the wizard sends the ticket to. Required for the new flow.
  schoolId: z.string().min(1, 'Choisissez une école pour traiter votre demande'),
  // Original referent school (linked to the wing's purchase). Captured so Plume HQ
  // can correlate "school avoidance" patterns later.
  referentSchoolId: z.string().nullable().optional(),
  // Filled only when the client picks a school different from the referent one.
  schoolChangeReasonCode: z.enum(['school_closed', 'moved_region', 'relationship', 'other']).optional(),
  schoolChangeReasonNote: z.string().max(2000).optional(),
  // How the client gets the wing to the school (in person vs. postal shipment)
  deliveryMethod: z.enum(['in_person', 'postal'], {
    errorMap: () => ({ message: 'Choisissez la méthode de remise de l\'aile' }),
  }),
  photoPaths: z.array(z.object({
    storagePath: z.string().min(1),
    photoType: z.enum(['overview', 'damage_closeup', 'serial_tag', 'other']),
    caption: z.string().optional(),
  })),
}).superRefine((data, ctx) => {
  // Photos are always optional — the client can submit without any photo
  // even for visual problems (sometimes there's nothing to show).

  // If the client picked a different school than the referent, we need a reason.
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
})

// École : sauvegarde de la checklist de premier diagnostic
export const schoolChecklistSchema = z.object({
  ticketId:    z.string().uuid(),
  checkedIds:  z.array(z.string()).default([]),
  notes:       z.string().max(2000).optional(),
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

// Atelier : sauvegarde de la checklist diagnostic technique
export const workshopChecklistSchema = z.object({
  ticketId:    z.string().uuid(),
  checkedIds:  z.array(z.string()).default([]),
  notes:       z.string().max(5000).optional(),
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

export type WingInfoInput = z.infer<typeof wingInfoSchema>
export type ProblemInput = z.infer<typeof problemSchema>
export type CreateTicketInput = z.infer<typeof createTicketSchema>
export type AddMessageInput = z.infer<typeof addMessageSchema>
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>
export type RoleMessageInput = z.infer<typeof roleMessageSchema>
export type DiagnosisInput = z.infer<typeof diagnosisSchema>
export type SchoolChecklistInput   = z.infer<typeof schoolChecklistSchema>
export type SchoolResolutionInput  = z.infer<typeof schoolResolutionSchema>
export type WorkshopChecklistInput = z.infer<typeof workshopChecklistSchema>

// Re-export for convenience
export { WING_BRANDS }
