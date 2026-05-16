interface SchoolWorkshopValidationCardProps {
  /** TRUE = atelier a accepté, FALSE = refusé, NULL = en attente. */
  workshopAccepted:      boolean | null
  /** Raison saisie par l'atelier en cas de refus. */
  workshopRefusalReason: string | null
  /** Libellé de l'atelier assigné (pour personnaliser le message). */
  workshopLabel:         string | null
}

/**
 * Carte d'état "Validation atelier" (étape 6, vue école — lecture seule).
 *
 * L'école ne décide rien ici : c'est l'atelier qui accepte ou refuse depuis
 * son espace. La carte reflète l'un des trois états et, en cas de refus,
 * invite l'école à choisir un autre atelier (étape 5 redevient active).
 */
export function SchoolWorkshopValidationCard({
  workshopAccepted,
  workshopRefusalReason,
  workshopLabel,
}: SchoolWorkshopValidationCardProps) {
  const who = workshopLabel ?? "L'atelier"

  if (workshopAccepted === true) {
    return (
      <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
        <p className="text-sm font-semibold text-emerald-800">
          ✓ Demande acceptée par l&apos;atelier
        </p>
        <p className="mt-0.5 text-xs text-emerald-800/80">
          {who} est disponible — vous pouvez imprimer le ticket d&apos;envoi.
        </p>
      </div>
    )
  }

  if (workshopAccepted === false) {
    return (
      <div className="mt-3 rounded-2xl border-2 border-red-300 bg-red-50 p-3">
        <p className="text-sm font-semibold text-red-800">
          ✕ Demande refusée par l&apos;atelier
        </p>
        {workshopRefusalReason && (
          <p className="mt-1 whitespace-pre-line text-xs text-red-800/90">
            {workshopRefusalReason}
          </p>
        )}
        <p className="mt-1.5 text-xs font-medium text-red-800">
          Choisissez un autre atelier à l&apos;étape précédente.
        </p>
      </div>
    )
  }

  return (
    <div className="mt-3 rounded-2xl border-2 border-amber-300 bg-amber-50 p-3">
      <p className="text-sm font-semibold text-amber-900">
        ⏳ En attente de la réponse de l&apos;atelier
      </p>
      <p className="mt-0.5 text-xs text-amber-900/80">
        {who} doit confirmer qu&apos;il accepte la demande et qu&apos;il est
        disponible. Vous pourrez imprimer le ticket d&apos;envoi dès l&apos;accord.
      </p>
    </div>
  )
}
