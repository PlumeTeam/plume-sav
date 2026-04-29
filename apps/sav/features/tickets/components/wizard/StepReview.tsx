'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWizardStore } from '../../store'
import { createTicketAction } from '../../actions'
import { PROBLEM_CATEGORIES } from '../../types'
import { createClient } from '@/lib/supabase/client'

interface StepReviewProps {
  onBack: () => void
}

export function StepReview({ onBack }: StepReviewProps) {
  const router = useRouter()
  const { wingInfo, problem, photos, _photoFiles, reset } = useWizardStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const problemLabel = PROBLEM_CATEGORIES.find((c) => c.value === problem.problemCategory)

  async function handleSubmit() {
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      // 1. Upload photos to Supabase Storage (client-side)
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

      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i]
        const file = _photoFiles[i]

        if (!photo || !file) continue

        const ext = file.name.split('.').pop() ?? 'jpg'
        const storagePath = `${user.id}/${Date.now()}-${i}.${ext}`

        const { error: uploadError } = await supabase.storage
          .from('ticket-photos')
          .upload(storagePath, file, { upsert: false })

        if (uploadError) {
          console.error('Upload error:', uploadError.message)
          // Continue with other photos, non-blocking
          continue
        }

        uploadedPhotos.push({
          storagePath,
          photoType: photo.photoType,
          caption: photo.caption || undefined,
        })
      }

      // 2. Create ticket via Server Action
      const result = await createTicketAction({
        wingBrand: wingInfo.wingBrand,
        wingModel: wingInfo.wingModel,
        wingSize: wingInfo.wingSize,
        wingSerial: wingInfo.wingSerial,
        wingColor: wingInfo.wingColor,
        purchaseDate: wingInfo.purchaseDate,
        flightHours: wingInfo.flightHours ? parseInt(wingInfo.flightHours, 10) : undefined,
        problemCategory: problem.problemCategory,
        problemDescription: problem.problemDescription,
        urgency: problem.urgency,
        photoPaths: uploadedPhotos.length > 0 ? uploadedPhotos : [{
          storagePath: 'placeholder',
          photoType: 'other' as const,
        }],
      })

      if (result?.error) {
        const errorMsg = Object.values(result.error).flat().join(' — ')
        setSubmitError(errorMsg || 'Erreur lors de la soumission.')
        setIsSubmitting(false)
        return
      }

      // 3. Reset wizard draft on success
      reset()
      // redirect() is called inside createTicketAction on success
    } catch (err) {
      setSubmitError('Une erreur inattendue est survenue. Réessayez.')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 px-4 pb-32">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Récapitulatif</h2>
        <p className="mt-1 text-sm text-slate-500">
          Vérifiez les informations avant d'envoyer votre demande.
        </p>
      </div>

      {/* Wing info */}
      <Section title="Votre aile">
        <Row label="Marque / Modèle" value={`${wingInfo.wingBrand} ${wingInfo.wingModel} ${wingInfo.wingSize}`} />
        <Row label="Couleur" value={wingInfo.wingColor} />
        <Row label="Numéro de série" value={wingInfo.wingSerial} />
        <Row label="Date d'achat" value={wingInfo.purchaseDate} />
        {wingInfo.flightHours && (
          <Row label="Heures de vol" value={`${wingInfo.flightHours} h`} />
        )}
      </Section>

      {/* Problem */}
      <Section title="Problème">
        <Row label="Catégorie" value={problemLabel ? `${problemLabel.emoji} ${problemLabel.label}` : '—'} />
        <div>
          <p className="text-xs text-slate-500 mb-1">Description</p>
          <p className="text-sm text-slate-800">{problem.problemDescription}</p>
        </div>
        <Row label="Urgence" value={problem.urgency === 'urgent' ? '🚨 Urgent' : '⏳ Normal'} />
      </Section>

      {/* Photos */}
      <Section title={`Photos (${photos.length})`}>
        {photos.length === 0 ? (
          <p className="text-sm text-slate-500">Aucune photo ajoutée.</p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {photos.map((p, i) => (
              <img
                key={i}
                src={p.dataUrl}
                alt={`Photo ${i + 1}`}
                className="aspect-square w-full rounded-xl object-cover"
              />
            ))}
          </div>
        )}
      </Section>

      {/* Info box */}
      <div className="rounded-xl bg-blue-50 px-4 py-3">
        <p className="text-sm text-blue-800 font-medium">Ce qui se passe après l'envoi</p>
        <p className="mt-1 text-xs text-blue-700">
          Votre école partenaire sera notifiée et vous contactera sous 4h pour organiser l'inspection.
        </p>
      </div>

      {submitError && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{submitError}</p>
      )}

      {/* Navigation */}
      <div className="fixed bottom-0 left-0 right-0 flex gap-3 border-t border-slate-100 bg-white px-4 pb-safe-bottom pt-3">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="btn-secondary flex-1"
        >
          ← Retour
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="btn-primary flex-[2] disabled:opacity-60"
        >
          {isSubmitting ? 'Envoi en cours…' : '✓ Envoyer ma demande'}
        </button>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-slate-400 uppercase tracking-wide">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <p className="text-xs text-slate-500 flex-shrink-0">{label}</p>
      <p className="text-sm text-slate-800 text-right">{value}</p>
    </div>
  )
}
