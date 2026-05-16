import type { TicketChannel } from './components/TicketChannelSwitch'
import type { TicketWithPhotos } from './types'
import { resolveWarrantyTierForDisplay } from './utils'

/**
 * Construit les 3 canaux de messagerie côté client — École / Atelier / Groupe.
 *
 * Logique partagée entre la page détail du ticket (onglet « Messages » via
 * ClientTicketTabs) et la page conversation /client/messages/[id], afin que
 * les deux exposent rigoureusement les mêmes canaux, composers et garde-fous.
 *
 * @param schoolName    nom de l'école référente (partner_schools) — null si non résolu.
 * @param workshopName  nom de l'atelier assigné (partner_workshops) — null si non résolu ;
 *                      on retombe alors sur `ticket.assigned_workshop_label`.
 */
export function buildClientChannels(
  ticket: TicketWithPhotos,
  schoolName: string | null,
  workshopName: string | null,
): TicketChannel[] {
  const resolvedSchool   = schoolName ?? 'votre école'
  const hasWorkshop      = !!ticket.assigned_workshop_id
  const resolvedWorkshop = workshopName ?? ticket.assigned_workshop_label ?? null
  const workshopLabel    = resolvedWorkshop ?? "l'atelier"
  const warrantyTier     = resolveWarrantyTierForDisplay(ticket.warranty_tier, ticket.purchase_date)

  return [
    {
      id:               'school',
      label:            'École',
      emoji:            '🏫',
      channel:          'school_client',
      // Messages pré-migration 5-canaux (channel NULL, visibility_level='all').
      legacyVisibility: 'all',
      composer: {
        senderRole:      'client',
        visibilityLevel: 'all',
        channel:         'school_client',
        placeholder:     `Écrire à ${resolvedSchool}…`,
        submitLabel:     "Envoyer à l'école",
        helperText:      `Privé — vous ↔ ${resolvedSchool}`,
      },
      emptyText: `Aucun message pour l'instant. Écrivez ci-dessous pour démarrer la conversation — ${resolvedSchool} vous répondra ici.`,
    },
    {
      id:      'workshop',
      label:   'Atelier',
      emoji:   '🛠️',
      channel: 'client_workshop',
      banner: warrantyTier === 'out_of_warranty' ? (
        <div className="rounded-2xl border border-brand-stone bg-brand-cream px-4 py-3">
          <p className="text-sm font-semibold text-brand-ink">Hors garantie — devis &amp; facture</p>
          <p className="mt-1 text-xs leading-relaxed text-brand-ink/80">
            L&apos;atelier peut vous transmettre un devis et une facture en pièce
            jointe (photo du document) directement dans cette messagerie. Le
            paiement se fait directement entre vous et l&apos;atelier.
          </p>
        </div>
      ) : null,
      composer: hasWorkshop
        ? {
            senderRole:      'client',
            visibilityLevel: 'all',
            channel:         'client_workshop',
            placeholder:     `Écrire à ${workshopLabel}…`,
            submitLabel:     "Envoyer à l'atelier",
            helperText:      `Privé — vous ↔ ${workshopLabel}`,
          }
        : {
            senderRole:      'client',
            visibilityLevel: 'all',
            channel:         'client_workshop',
            placeholder:     '',
            submitLabel:     '',
            helperText:      '',
            disabledReason:  `Ce canal sera actif dès que ${resolvedSchool} aura assigné un atelier à votre demande.`,
          },
      emptyText: hasWorkshop
        ? `Démarrez la conversation avec ${workshopLabel} ci-dessous.`
        : "Pas encore d'atelier assigné — ce canal sera disponible bientôt.",
    },
    {
      id:      'group',
      label:   'Groupe',
      emoji:   '👥',
      channel: 'group',
      composer: {
        senderRole:      'client',
        visibilityLevel: 'all',
        channel:         'group',
        placeholder:     'Message pour le groupe (école + atelier)…',
        submitLabel:     'Envoyer au groupe',
        helperText:      "Visible par l'école, l'atelier et Plume",
      },
      emptyText: 'Aucun message dans la discussion de groupe pour le moment.',
    },
  ]
}
