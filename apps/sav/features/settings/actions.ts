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
