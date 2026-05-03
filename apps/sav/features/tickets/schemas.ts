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

export const wingBehaviorValueSchema = z.enum([
  'not_straight', 'too_fragile', 'sluggish_inflation',
  'collapses_easily', 'unstable_turbulence', 'brake_issue', 'abnormal_speed',
])

export const problemSchema = z.object({
  problemCategory: z.enum([
    'tear', 'line_issue', 'riser_issue', 'buckle_issue', 'porosity',
    'wing_behavior', 'other',
  ], { errorMap: () => ({ message: 'Catégorie requise' }) }),
  problemDescription: z.string()
    .min(10, 'Description trop courte (10 caractères minimum)')
    .max(2000, 'Description trop longue (2000 caractères max)'),
  urgency: z.enum(['normal', 'urgent']),
  wingBehaviors: z.array(wingBehaviorValueSchema).default([]),
  wingBehaviorOther: z.string().max(500, 'Texte trop long (500 caractères max)').default(''),
}).superRefine((data, ctx) => {
  if (data.problemCategory === 'wing_behavior'
      && data.wingBehaviors.length === 0
      && data.wingBehaviorOther.trim().length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['wingBehaviors'],
      message: 'Sélectionnez au moins un comportement ou décrivez-en un autre',
    })
  }
})

export const createTicketSchema = z.object({
  wingBrand: z.string().min(1),
  wingModel: z.string().min(1),
  wingSize: z.string().min(1),
  wingSerial: z.string().min(1),
  wingColor: z.string().min(1),
  purchaseDate: z.string().min(1),
  flightHours: z.coerce.number().int().min(0).optional(),
  problemCategory: z.enum([
    'tear', 'line_issue', 'riser_issue', 'buckle_issue', 'porosity',
    'wing_behavior', 'other',
  ]),
  problemDescription: z.string().min(10).max(2000),
  urgency: z.enum(['normal', 'urgent']),
  wingBehaviors: z.array(wingBehaviorValueSchema).optional().default([]),
  wingBehaviorOther: z.string().max(500).optional().default(''),
  photoPaths: z.array(z.object({
    storagePath: z.string(),
    photoType: z.enum(['overview', 'damage_closeup', 'serial_tag', 'other']),
    caption: z.string().optional(),
  })).min(1, 'Au moins une photo est requise'),
})

export const addMessageSchema = z.object({
  ticketId: z.string().uuid(),
  content: z.string().min(1).max(5000),
})

export const updateStatusSchema = z.object({
  ticketId: z.string().uuid(),
  newStatus: z.enum([
    'submitted', 'in_review', 'diagnosed',
    'repair_in_progress', 'repaired', 'shipped', 'closed', 'rejected',
  ]),
  note: z.string().max(500).optional(),
})

export const roleMessageSchema = z.object({
  ticketId: z.string().uuid(),
  content: z.string().min(1).max(5000),
  isInternal: z.preprocess((v) => v === 'true', z.boolean()),
  senderRole: z.enum(['client', 'school', 'workshop', 'plume_admin']),
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

// Re-export for convenience
export { WING_BRANDS }
