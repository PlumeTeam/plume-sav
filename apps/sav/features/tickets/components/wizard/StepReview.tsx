'use client'

import { useState } from 'react'
import { useWizardStore } from '../../store'
import { createTicketAction } from '../../actions'
import { PROBLEM_CATEGORIES } from '../../types'
import { createClient } from '@/lib/supabase/client'

interface StepReviewProps {
  onBack: () => void
}

export function StepReview({ onBack }: StepReviewProps) {
  const { wingInfo, problem, photos, _photoFiles, reset } = useWizardStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError]   = useState<string | null>(null)
  const [progress, setProgress]         = useState<{ done: number; total: number } | null>(null)

  const problemLabel = PROBLEM_CATEGORIES.find((c) => c.value === problem.problemCategory)

  async function handleSubmit() {
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setSubmitError('Session expirée. Reconnectez-vous.')
        setIsSubmitting(false)
        return
      }

      const uploadedPhotos: Array<{
        storagePath: string
        photoType: 'overview' | 'damage_closeup' | 'serial_tag' | 'other'
        caption?: string
      }> = []

      setProgress({ done: 0, total: photos.length })
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i]
        const file  = _photoFiles[i]
        if (!photo || !file) continue

        const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
        const storagePath = `${user.id}/${Date.now()}-${i}.${ext}`

        const { error: uploadError } = await supabase.storage
          .from('ticket-photos')
          .upload(storagePath, file, { upsert: false, contentType: file.type || `image/${ext}` })

        if (uploadError) {
          console.error('Upload error:', uploadError.message)
          continue
        }

        uploadedPhotos.push({
          storagePath,
          photoType: photo.photoType,
          caption:   photo.caption || undefined,
        })
        setProgress({ done: i + 1, total: photos.length })
      }

      if (uploadedPhotos.length === 0) {
        setSubmitError("Échec de l'upload des photos. Vérifiez votre connexion et réessayez.")
        setIsSubmitting(false)
        setProgress(null)
        return
      }

      const result = await createTicketAction({
        wingBrand:          wingInfo.wingBrand,
        wingModel:          wingInfo.wingModel,
        wingSize:           wingInfo.wingSize,
        wingSerial:         wingInfo.wingSerial,
        wingColor:          wingInfo.wingColor,
        purchaseDate:       wingInfo.purchaseDate,
        flightHours:        wingInfo.flightHours ? parseInt(wingInfo.flightHours, 10) : undefined,
        problemCategory:    problem.problemCategory,
        problemDescription: problem.problemDescription,
        urgency:            problem.urgency,
        photoPaths:         uploadedPhotos,
      })

      if (result?.error) {
        const errorMsg = Object.values(result.error).flat().join(' — ')
        setSubmitError(errorMsg || 'Erreur lors de la soumission.')
        setIsSubmitting(false)
        setProgress(null)
        return
      }

      reset()
      // redirect() is called inside createTicketAction on success
    } catch (err) {
      console.error('Submit error:', err)
      setSubmitError('Une erreur inattendue est survenue. Réessayez.')
      setIsSubmitting(false)
      setProgress(null)
    }
  }

  return (
    <div className="flex flex-col gap-6 px-4 pb-36">
      <div>
        <h2 className="font-display text-xl font-bold text-brand-ink">Récapitulatif</h2>
        <p className="mt-1 text-sm text-slate-500">
          Vérifiez les informations avant d&apos;envoyer votre demande.
        </p>
      </div>

      <Section title="Votre aile">
        <Row label="Marque / Modèle" value={`${wingInfo.wingBrand} ${wingInfo.wingModel} ${wingInfo.wingSize}`.trim()} />
        <Row label="Couleur" value={wingInfo.wingColor} />
        <Row label="Numéro de série" value={wingInfo.wingSerial} mono />
        <Row label="Date d'achat" value={wingInfo.purchaseDate} />
        {wingInfo.flightHours && <Row label="Heures de vol" value={`${wingInfo.flightHours} h`} />}
      </Section>

      <Section title="Problème">
        <Row label="Catégorie" value={problemLabel ? `${problemLabel.emoji} ${problemLabel.label}` : '—'} />
        <div>
          <p className="mb-1 text-xs text-slate-500">Description</p>
          <p className="whitespace-pre-line text-sm text-brand-ink">{problem.problemDescription}</p>
        </div>
        <Row label="Urgence" value={problem.urgency === 'urgent' ? '🚨 Urgent' : '⏳ Normal'} />
      </Section>

      <Section title={`Photos (${photos.length})`}>
        {photos.length === 0 ? (
          <p className="text-sm text-slate-500">Aucune photo ajoutée.</p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {photos.map((p, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={p.dataUrl} alt={`Photo ${i + 1}`} className="aspect-square w-full rounded-2xl object-cover ring-1 ring-brand-stone" />
            ))}
          </div>
        )}
      </Section>

      <div className="rounded-2xl bg-brand-coral/10 px-4 py-3">
        <p className="text-sm font-semibold text-brand-ink">Et après ?</p>
        <p className="mt-1 text-xs text-brand-ink/80">
          Votre école partenaire reçoit la demande, organise l&apos;inspection sous 4 h, et vous tient informé via la messagerie du ticket.
        </p>
      </div>

      {submitError && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{submitError}</p>
      )}

      {progress && progress.total > 0 && (
        <div className="rounded-xl bg-brand-cream p-3">
          <p className="text-xs text-slate-500">Upload des photos…</p>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white">
            <div
              className="h-full rounded-full bg-brand-coral transition-all duration-300"
              style={{ width: `${(progress.done / progress.total) * 100}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-slate-400">{progress.done}/{progress.total}</p>
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-brand-stone/60 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 px-4 pt-3 pb-safe-bottom">
        <div className="mx-auto flex max-w-2xl gap-3">
          <button type="button" onClick={onBack} disabled={isSubmitting} className="btn-secondary flex-1">
            ← Retour
          </button>
          <button type="button" onClick={handleSubmit} disabled={isSubmitting} className="btn-primary flex-[2]">
            {isSubmitting ? 'Envoi…' : 'Envoyer la demande'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-4">
      <h3 className="section-title mb-3">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <p className="flex-shrink-0 text-xs text-slate-500">{label}</p>
      <p className={`text-right text-sm text-brand-ink ${mono ? 'font-mono' : ''}`}>{value || '—'}</p>
    </div>
  )
}
