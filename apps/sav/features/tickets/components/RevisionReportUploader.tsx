'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { saveRevisionReportAction } from '@/features/tickets/actions'
import { getSupabasePublicUrl, formatDate } from '@/features/tickets/utils'

interface RevisionReportUploaderProps {
  ticketId:           string
  initialPath:        string | null
  initialFilename:    string | null
  initialUploadedAt:  string | null
}

// Limite raisonnable côté UI — Supabase Storage accepte jusqu'à 50 MB par défaut
// sur le plan free / Pro, mais un rapport de révision PDF excède rarement 10 MB.
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024
const ACCEPT_ATTRIBUTE = 'application/pdf,image/*,.doc,.docx,.odt'

export function RevisionReportUploader({
  ticketId,
  initialPath,
  initialFilename,
  initialUploadedAt,
}: RevisionReportUploaderProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const hasFile = !!initialPath
  const publicUrl = initialPath ? getSupabasePublicUrl(initialPath) : null

  function handlePick() {
    fileInputRef.current?.click()
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadError(null)

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setUploadError(`Fichier trop volumineux (max ${Math.round(MAX_FILE_SIZE_BYTES / 1024 / 1024)} MB)`)
      e.target.value = ''
      return
    }

    setIsUploading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setUploadError('Session expirée — reconnectez-vous')
        return
      }

      const rawExt  = file.name.split('.').pop()?.toLowerCase() ?? 'bin'
      const ext     = /^[a-z0-9]+$/.test(rawExt) ? rawExt : 'bin'
      // Préfixe imposé par la spec : revision-reports/{ticket_id}/...
      // Suffixe temporel pour éviter les collisions lors d'un remplacement.
      const storagePath = `revision-reports/${ticketId}/${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('tickets')
        .upload(storagePath, file, {
          upsert:       false,
          contentType:  file.type || 'application/octet-stream',
          cacheControl: '3600',
        })

      if (uploadError) {
        setUploadError(`Échec upload (${uploadError.message})`)
        return
      }

      // Persistance via Server Action — la RLS sera revalidée côté serveur
      // (rôle workshop ou plume_admin requis).
      const fd = new FormData()
      fd.set('ticketId',    ticketId)
      fd.set('storagePath', storagePath)
      fd.set('filename',    file.name)

      startTransition(async () => {
        const res = await saveRevisionReportAction(fd)
        if (res && 'error' in res) {
          const formErrors = (res.error as { _form?: string[] })?._form
          setUploadError(formErrors?.[0] ?? 'Erreur lors de l\'enregistrement')
          return
        }
        router.refresh()
      })
    } finally {
      setIsUploading(false)
      // Reset l'input pour pouvoir ré-uploader le même fichier après remplacement
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const busy = isUploading || isPending

  return (
    <div className="space-y-3">
      {hasFile && publicUrl ? (
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-brand-cream px-4 py-3 ring-1 ring-brand-stone">
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 text-sm font-medium text-brand-ink">
              <span aria-hidden>📄</span>
              <span className="truncate" title={initialFilename ?? ''}>
                {initialFilename ?? 'Rapport de révision'}
              </span>
            </p>
            {initialUploadedAt && (
              <p className="mt-0.5 text-xs text-slate-500">
                Uploadé le {formatDate(initialUploadedAt)}
              </p>
            )}
          </div>
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            download={initialFilename ?? undefined}
            className="shrink-0 rounded-xl bg-white px-3 py-1.5 text-xs font-semibold text-brand-navy ring-1 ring-brand-stone hover:bg-brand-gold/10 hover:ring-brand-gold/40"
          >
            Télécharger →
          </a>
        </div>
      ) : (
        <p className="text-sm text-slate-600">
          Aucun rapport pour le moment. Uploadez le document de révision (PDF, image ou doc) — il sera attaché au carnet d&apos;entretien de l&apos;aile.
        </p>
      )}

      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT_ATTRIBUTE}
          onChange={handleFileChange}
          className="hidden"
          disabled={busy}
        />
        <button
          type="button"
          onClick={handlePick}
          disabled={busy}
          className="rounded-2xl bg-brand-navy px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-brand-ink disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy
            ? 'Envoi en cours…'
            : hasFile
              ? 'Remplacer le rapport'
              : 'Uploader le rapport de révision'}
        </button>
      </div>

      {uploadError && (
        <p className="rounded-2xl bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
          {uploadError}
        </p>
      )}
    </div>
  )
}
