import { getPlumeSettings } from '@/features/tickets/queries'

/**
 * Convenience wrapper — lit le tarif (€) du pré-check atelier depuis le
 * singleton plume_settings (id=1). Délègue à getPlumeSettings, qui gère le
 * fallback si la table / ligne n'est pas encore en place.
 */
export async function getPreCheckFeeEur(): Promise<number> {
  const settings = await getPlumeSettings()
  return settings.preCheckFeeEur
}
