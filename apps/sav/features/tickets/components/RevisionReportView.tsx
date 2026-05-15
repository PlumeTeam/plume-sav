import { getSupabasePublicUrl, formatDate } from '@/features/tickets/utils'

interface RevisionReportViewProps {
  storagePath: string
  filename:    string | null
  uploadedAt:  string | null
}

// Vue read-only du rapport de révision — utilisée côté client (carnet
// d'entretien) et côté Plume HQ quand on ne veut pas exposer le bouton
// remplacement. L'atelier utilise RevisionReportUploader à la place.
export function RevisionReportView({ storagePath, filename, uploadedAt }: RevisionReportViewProps) {
  const publicUrl = getSupabasePublicUrl(storagePath)
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-brand-cream px-4 py-3 ring-1 ring-brand-stone">
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 text-sm font-medium text-brand-ink">
          <span aria-hidden>📄</span>
          <span className="truncate" title={filename ?? ''}>
            {filename ?? 'Rapport de révision'}
          </span>
        </p>
        {uploadedAt && (
          <p className="mt-0.5 text-xs text-slate-500">
            Émis le {formatDate(uploadedAt)}
          </p>
        )}
      </div>
      <a
        href={publicUrl}
        target="_blank"
        rel="noopener noreferrer"
        download={filename ?? undefined}
        className="shrink-0 rounded-xl bg-white px-3 py-1.5 text-xs font-semibold text-brand-navy ring-1 ring-brand-stone hover:bg-brand-gold/10 hover:ring-brand-gold/40"
      >
        Télécharger →
      </a>
    </div>
  )
}
