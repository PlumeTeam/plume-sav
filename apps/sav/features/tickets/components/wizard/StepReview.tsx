'use client'

import { useState } from 'react'
import { useWizardStore } from '../../store'
import { createTicketAction } from '../../actions'
import { PROBLEM_CATEGORIES } from '../../types'
import { createClient } from '@/lib/supabase/client'
import type { PartnerSchool } from '../../queries'

interface StepReviewProps {
  onBack: () => void
  schools: PartnerSchool[]
}

export function StepReview({ onBack, schools }: StepReviewProps) {
  const { wingInfo, problem, photos, _photoFiles, reset } = useWizardStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError]   = useState<string | null>(null)
  const [progress, setProgress]         = useState<{ done: number; total: number } | null>(null)
  const [schoolId, setSchoolId] = useState<string>(schools[0]?.id ?? '')

  const problemLabel = PROBLEM_CATEGORIES.find((c) => c.value === problem.problemCategory)
  const selectedSchool = schools.find((s) => s.id === schoolId)

  async function handleSubmit() {
    if (!schoolId) {
      setSubmitError('Choisissez une école pour traiter votre demande.')
      return
    }
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

      const isBehaviorOnly = (problem.wingBehaviors?.length ?? 0) > 0

      // Photos are optional for behavior-only tickets; otherwise we need at least one
      // successfully uploaded so the school/atelier can diagnose visually.
      if (!isBehaviorOnly && uploadedPhotos.length === 0) {
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
        wingBehaviors:      problem.wingBehaviors,
        schoolId,
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
          Vérifiez les informations puis envoyez votre demande à votre école partenaire.
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
          <p className="text-sm text-slate-500">
            {(problem.wingBehaviors?.length ?? 0) > 0
              ? 'Aucune photo — non requis pour un problème de comportement.'
              : 'Aucune photo ajoutée.'}
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {photos.map((p, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={p.dataUrl} alt={`Photo ${i + 1}`} className="aspect-square w-full rounded-2xl object-cover ring-1 ring-brand-stone" />
            ))}
          </div>
        )}
      </Section>

      {/* ── Envoi à l'école ─────────────────────────────────────── */}
      <Section title="Envoi à votre école">
        <div>
          <label htmlFor="school-picker" className="mb-1.5 block text-sm font-medium text-brand-ink">
            École partenaire
          </label>
          <select
            id="school-picker"
            value={schoolId}
            onChange={(e) => setSchoolId(e.target.value)}
            className="field-input"
            required
          >
            {schools.length === 0 && <option value="">Aucune école disponible</option>}
            {schools.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}{s.region ? ` — ${s.region}` : ''}{s.city ? ` (${s.city})` : ''}
              </option>
            ))}
          </select>
          {selectedSchool && (
            <p className="mt-2 text-xs text-slate-500">
              Votre demande sera envoyée à <strong className="text-brand-ink">{selectedSchool.name}</strong> pour un premier diagnostic.
              L&apos;école pourra la résoudre directement, vous expliquer si tout est normal, ou la transmettre à un atelier du réseau Plume.
            </p>
          )}
        </div>
      </Section>

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
          <button type="button" onClick={handleSubmit} disabled={isSubmitting || !schoolId} className="btn-primary flex-[2]">
            {isSubmitting
              ? 'Envoi…'
              : selectedSchool
                ? `Envoyer à ${selectedSchool.name}`
                : 'Envoyer la demande'}
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
