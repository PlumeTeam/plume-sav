'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserRoles } from '@/features/auth/queries'

const updatePreCheckFeeSchema = z.object({
  feeEur: z.preprocess(
    (v) => (v === '' || v == null ? undefined : Number(v)),
    z.number().min(0, 'Le tarif doit être positif').max(10000, 'Tarif trop élevé')
  ),
})

/**
 * Met à jour le tarif fixe du pré-check atelier (singleton plume_settings id=1).
 * Réservé plume_admin — la RLS sur plume_settings est doublée d'une vérif
 * explicite ici.
 */
export async function updatePreCheckFeeAction(formData: FormData) {
  const parsed = updatePreCheckFeeSchema.safeParse({
    feeEur: formData.get('feeEur'),
  })
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: { _form: ['Non authentifié'] } }

  const roles = await getCurrentUserRoles()
  if (!roles.includes('plume_admin')) {
    return { error: { _form: ['Action réservée à Plume HQ'] } }
  }

  const { error } = await supabase
    .from('plume_settings')
    .update({
      pre_check_fee_eur: parsed.data.feeEur,
      updated_at:        new Date().toISOString(),
      updated_by:        user.id,
    })
    .eq('id', 1)

  if (error) return { error: { _form: [`Erreur de sauvegarde (${error.message})`] } }

  revalidatePath('/plume/settings')
  return { success: true as const }
}

// ────────────────────────────────────────────────────────────────────────────
// Politique de garantie — durées, plafonds, quotas, couvertures (toggle)
// ────────────────────────────────────────────────────────────────────────────
const checkboxBool = z.preprocess(
  (v) => v === 'on' || v === 'true' || v === true,
  z.boolean(),
)

const numberFromInput = (max: number, errMax: string) => z.preprocess(
  (v) => (v === '' || v == null ? undefined : Number(v)),
  z.number().min(0, 'Doit être positif').max(max, errMax),
)

const updateWarrantyPolicySchema = z.object({
  warrantyStandardYears:         numberFromInput(50, 'Durée invalide'),
  warrantyExtendedYears:         numberFromInput(50, 'Durée invalide'),
  maxSavClaimsStandard:          numberFromInput(100, 'Quota invalide'),
  maxSavClaimsExtended:          numberFromInput(100, 'Quota invalide'),
  repairThresholdStandardEur:    numberFromInput(100000, 'Plafond invalide'),
  repairThresholdExtendedEur:    numberFromInput(100000, 'Plafond invalide'),
  extendedCoversPreCheck:                checkboxBool,
  extendedCoversSchoolWorkshopShipping:  checkboxBool,
  extendedCoversRepair:                  checkboxBool,
  extendedCoversReplacement:             checkboxBool,
}).superRefine((data, ctx) => {
  // L'étendue ne peut pas être plus courte que la standard — sinon elle
  // n'étend rien et ce serait une mauvaise UX silencieuse.
  if (data.warrantyExtendedYears < data.warrantyStandardYears) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['warrantyExtendedYears'],
      message: 'La garantie étendue doit être ≥ standard',
    })
  }
})

/**
 * Met à jour la politique de garantie sur le singleton plume_settings (id=1).
 * Réservé plume_admin. warranty_duration_months reste synchronisé avec
 * warranty_standard_years pour préserver l'utilitaire legacy computeWarrantyStatus.
 */
export async function updateWarrantyPolicyAction(formData: FormData) {
  const parsed = updateWarrantyPolicySchema.safeParse({
    warrantyStandardYears:        formData.get('warrantyStandardYears'),
    warrantyExtendedYears:        formData.get('warrantyExtendedYears'),
    maxSavClaimsStandard:         formData.get('maxSavClaimsStandard'),
    maxSavClaimsExtended:         formData.get('maxSavClaimsExtended'),
    repairThresholdStandardEur:   formData.get('repairThresholdStandardEur'),
    repairThresholdExtendedEur:   formData.get('repairThresholdExtendedEur'),
    extendedCoversPreCheck:               formData.get('extendedCoversPreCheck') ?? false,
    extendedCoversSchoolWorkshopShipping: formData.get('extendedCoversSchoolWorkshopShipping') ?? false,
    extendedCoversRepair:                 formData.get('extendedCoversRepair') ?? false,
    extendedCoversReplacement:            formData.get('extendedCoversReplacement') ?? false,
  })
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: { _form: ['Non authentifié'] } }

  const roles = await getCurrentUserRoles()
  if (!roles.includes('plume_admin')) {
    return { error: { _form: ['Action réservée à Plume HQ'] } }
  }

  const d = parsed.data
  const { error } = await supabase
    .from('plume_settings')
    .update({
      warranty_standard_years:                 d.warrantyStandardYears,
      warranty_extended_years:                 d.warrantyExtendedYears,
      // Sync legacy warranty_duration_months avec la standard pour ne pas
      // casser computeWarrantyStatus(purchaseDate, warrantyDurationMonths).
      warranty_duration_months:                Math.round(d.warrantyStandardYears * 12),
      max_sav_claims_standard:                 Math.round(d.maxSavClaimsStandard),
      max_sav_claims_extended:                 Math.round(d.maxSavClaimsExtended),
      repair_replacement_threshold_eur:        d.repairThresholdStandardEur,
      repair_threshold_extended_eur:           d.repairThresholdExtendedEur,
      extended_covers_precheck:                d.extendedCoversPreCheck,
      extended_covers_school_workshop_shipping: d.extendedCoversSchoolWorkshopShipping,
      extended_covers_repair:                  d.extendedCoversRepair,
      extended_covers_replacement:             d.extendedCoversReplacement,
      updated_at:                              new Date().toISOString(),
      updated_by:                              user.id,
    })
    .eq('id', 1)

  if (error) return { error: { _form: [`Erreur de sauvegarde (${error.message})`] } }

  revalidatePath('/plume/settings')
  return { success: true as const }
}
