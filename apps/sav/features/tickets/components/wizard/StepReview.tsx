'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWizardStore } from '../../store'
import { createTicketAction } from '../../actions'
import { PROBLEM_CATEGORIES, type WizardWingHistory } from '../../types'
import { createClient } from '@/lib/supabase/client'
import type { PartnerSchool } from '../../queries'
import { StepLayout } from './StepLayout'

interface StepReviewProps {
  schools: PartnerSchool[]
  onBack:  () => void
}

export function StepReview({ schools, onBack }: StepReviewProps) {
  const router = useRouter()
  const { wingInfo, wingHistory, problem, photos, _photoFiles, reset } = useWizardStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError]   = useState<string | null>(null)
  const [progress, setProgress]         = useState<{ done: number; total: number } | null>(null)
  // Synchronous re-entry guard. setIsSubmitting(true) ne devient visible qu'au
  // prochain render, donc deux clics rapides peuvent passer le `disabled` du
  // bouton avant que React ne réagisse. Ce ref bloque le 2ème appel tout de suite.
  const submitLockRef = useRef(false)

  const problemLabel  = PROBLEM_CATEGORIES.find((c) => c.value === problem.problemCategory)
  const isBehavior    = (problem.wingBehaviors?.length ?? 0) > 0
  const selectedSchool = schools.find((s) => s.id === problem.partnerSchoolId)

  async function handleSubmit() {
    if (submitLockRef.current) return
    if (!problem.partnerSchoolId) {
      setSubmitError('École manquante. Revenez à l’étape précédente.')
      return
    }
    submitLockRef.current = true
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setSubmitError('Session expirée. Reconnectez-vous.')
        setIsSubmitting(false)
        submitLockRef.current = false
        return
      }

      const uploadedPhotos: Array<{
        storagePath: string
        photoType: 'overview' | 'damage_closeup' | 'serial_tag' | 'other'
        caption?: string
      }> = []

      // Last error captured so we can surface it to the user verbatim if
      // every upload fails. Otherwise it's just logged for diagnosis.
      let lastUploadError: string | null = null

      setProgress({ done: 0, total: photos.length })
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i]
        const file  = _photoFiles[i]
        if (!photo || !file) continue

        // Only [a-z0-9] in the extension — keeps the path safe even if
        // the input file had something unusual.
        const rawExt = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
        const ext = /^[a-z0-9]+$/.test(rawExt) ? rawExt : 'jpg'
        const storagePath = `${user.id}/${Date.now()}-${i}.${ext}`

        if (process.env.NODE_ENV !== 'production') {
          console.log('[upload] →', {
            bucket: 'tickets',
            path: storagePath,
            size: file.size,
            type: file.type,
          })
        }

        const { error: uploadError } = await supabase.storage
          .from('tickets')
          .upload(storagePath, file, {
            upsert: false,
            contentType: file.type || `image/${ext}`,
            cacheControl: '3600',
          })

        if (uploadError) {
          // Supabase Storage errors carry .message and sometimes .statusCode
          // / .error — log everything we have to ease diagnosis.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const e = uploadError as any
          console.error('[upload] error:', {
            message:    uploadError.message,
            statusCode: e.statusCode ?? e.status ?? '?',
            name:       e.name ?? '?',
            error:      e.error ?? '?',
          })
          lastUploadError = uploadError.message
          continue
        }

        uploadedPhotos.push({
          storagePath,
          photoType: photo.photoType,
          caption:   photo.caption || undefined,
        })
        setProgress({ done: i + 1, total: photos.length })
      }

      // Photos are optional — but if the user added some and they all failed
      // to upload, surface the actual Supabase error rather than a generic message.
      if (photos.length > 0 && uploadedPhotos.length === 0) {
        const detail = lastUploadError ? ` (${lastUploadError})` : ''
        setSubmitError(`Échec de l'upload des photos${detail}.`)
        setIsSubmitting(false)
        submitLockRef.current = false
        setProgress(null)
        return
      }

      const result = await createTicketAction({
        wingBrand:              wingInfo.wingBrand,
        wingModel:              wingInfo.wingModel,
        wingSize:               wingInfo.wingSize,
        wingSerial:             wingInfo.wingSerial,
        wingColor:              wingInfo.wingColor,
        purchaseDate:           wingInfo.purchaseDate,
        flightHours:            wingInfo.flightHours ? parseInt(wingInfo.flightHours, 10) : undefined,
        problemCategory:        problem.problemCategory,
        problemDescription:     problem.problemDescription,
        urgency:                problem.urgency,
        wingBehaviors:          problem.wingBehaviors,
        wingHistory,
        clientMessage:          problem.clientMessage,
        schoolId:               problem.partnerSchoolId,
        referentSchoolId:       problem.referentSchoolId,
        schoolChangeReasonCode: problem.schoolChangeReasonCode,
        schoolChangeReasonNote: problem.schoolChangeReasonNote,
        deliveryMethod:         problem.deliveryMethod,
        photoPaths:             uploadedPhotos,
      })

      if (result?.error) {
        const errorMsg = Object.values(result.error).flat().join(' — ')
        setSubmitError(errorMsg || 'Erreur lors de la soumission.')
        setIsSubmitting(false)
        submitLockRef.current = false
        setProgress(null)
        return
      }

      // Reset wizard state BEFORE navigating so that going Back doesn't
      // resurrect the just-submitted draft. Then route to the confirmation page.
      const ticketId = (result as { ticketId?: string } | null)?.ticketId
      reset()
      if (ticketId) {
        router.push(`/client/ticket-created/${ticketId}`)
      } else {
        router.push('/client')
      }
    } catch (err) {
      console.error('Submit error:', err)
      setSubmitError('Une erreur inattendue est survenue. Réessayez.')
      setIsSubmitting(false)
      submitLockRef.current = false
      setProgress(null)
    }
  }

  return (
    <StepLayout
      title="Tout est prêt ?"
      subtitle="Un dernier coup d'œil avant l'envoi à votre école."
      footer={
        <>
          <button type="button" onClick={onBack} disabled={isSubmitting} className="btn-secondary flex-1">
            ← Retour
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !problem.partnerSchoolId}
            className="btn-primary flex-[2]"
          >
            {isSubmitting ? (
              <span className="inline-flex items-center justify-center gap-2">
                <svg
                  aria-hidden
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                  <path
                    d="M22 12a10 10 0 0 1-10 10"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
                <span>Envoi…</span>
              </span>
            ) : selectedSchool
              ? `Envoyer à ${selectedSchool.name}`
              : 'Envoyer la demande'}
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <Section title="Votre aile">
          <Row label="Marque / Modèle" value={`${wingInfo.wingBrand} ${wingInfo.wingModel} ${wingInfo.wingSize}`.trim()} />
          <Row label="Couleur" value={wingInfo.wingColor} />
          <Row label="Numéro de série" value={wingInfo.wingSerial} mono />
          <Row label="Date d'achat" value={wingInfo.purchaseDate} />
          {wingInfo.flightHours && <Row label="Heures de vol" value={`${wingInfo.flightHours} h`} />}
        </Section>

        <Section title="Historique de l'aile">
          <WingHistoryRecap history={wingHistory} />
        </Section>

        <Section title="Problème">
          <Row label="Catégorie" value={problemLabel ? `${problemLabel.emoji} ${problemLabel.label}` : (isBehavior ? '🪂 Comportement' : '—')} />
          <div>
            <p className="mb-1 text-xs text-slate-500">Description</p>
            <p className="whitespace-pre-line text-sm text-brand-ink">{problem.problemDescription}</p>
          </div>
          <Row label="Urgence" value={problem.urgency === 'urgent' ? '🚨 Urgent' : '⏳ Normal'} />
        </Section>

        <Section title={`Photos (${photos.length})`}>
          {photos.length === 0 ? (
            <p className="text-sm text-slate-500">Aucune photo ajoutée — pas obligatoire.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {photos.map((p, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={p.dataUrl} alt={`Photo ${i + 1}`} className="aspect-square w-full rounded-2xl object-cover ring-1 ring-brand-stone" />
              ))}
            </div>
          )}
        </Section>

        <Section title="Destinataire">
          {selectedSchool ? (
            <div className="flex items-start gap-3">
              <span aria-hidden className="text-2xl">🏫</span>
              <div>
                <p className="text-sm font-semibold text-brand-ink">{selectedSchool.name}</p>
                {(selectedSchool.city || selectedSchool.region) && (
                  <p className="mt-0.5 text-xs text-slate-500">
                    {[selectedSchool.city, selectedSchool.region].filter(Boolean).join(' · ')}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-amber-700">Aucune école sélectionnée — revenez en arrière.</p>
          )}
        </Section>

        <Section title="Remise de l&apos;aile">
          {problem.deliveryMethod === 'in_person' && (
            <div className="flex items-start gap-3">
              <span aria-hidden className="text-2xl">🤝</span>
              <div>
                <p className="text-sm font-semibold text-brand-ink">Remise en main propre</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Vous prendrez rendez-vous avec l&apos;école pour déposer votre aile.
                </p>
              </div>
            </div>
          )}
          {problem.deliveryMethod === 'postal' && (
            <div className="flex items-start gap-3">
              <span aria-hidden className="text-2xl">📦</span>
              <div>
                <p className="text-sm font-semibold text-brand-ink">Envoi postal</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Emballez soigneusement votre aile et conservez le numéro de suivi.
                </p>
              </div>
            </div>
          )}
          {!problem.deliveryMethod && (
            <p className="text-sm text-amber-700">Méthode de remise non choisie — revenez en arrière.</p>
          )}
        </Section>

        <Section title="Message à l'école">
          {problem.clientMessage?.trim() ? (
            <div className="rounded-xl border-l-4 border-brand-gold bg-brand-cream/60 p-3">
              <p className="whitespace-pre-line text-sm italic leading-relaxed text-brand-ink">
                {problem.clientMessage.trim()}
              </p>
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              Aucun message — vous pouvez en revenir à l&apos;étape précédente pour en ajouter un.
            </p>
          )}
        </Section>

        {submitError && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{submitError}</p>
        )}

        {progress && progress.total > 0 && (
          <div className="rounded-xl bg-brand-cream p-3">
            <p className="text-xs text-slate-500">Upload des photos…</p>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white">
              <div
                className="h-full rounded-full bg-brand-gold transition-all duration-300"
                style={{ width: `${(progress.done / progress.total) * 100}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-slate-400">{progress.done}/{progress.total}</p>
          </div>
        )}
      </div>
    </StepLayout>
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

// Display labels for the wing-history enums. Kept in sync with the
// French strings used in StepWingHistory's option lists and with the
// server-side serialisation in actions.ts (formatWingHistory).
const WATER_LABELS:   Record<string, string> = { none: 'Non', fresh: 'Eau douce', salt: 'Eau salée' }
const SURFACE_LABELS: Record<string, string> = { none: 'Non', sand: 'Sable / dunes', snow: 'Neige', other: 'Autre' }
const CONDITION_LABELS: Record<string, string> = {
  excellent: 'Excellent', good: 'Bon', worn: 'Usé', bad: 'Mauvais',
}

function WingHistoryRecap({
  history,
}: {
  history: WizardWingHistory
}) {
  const rows: Array<{ label: string; value: string }> = []

  if (history.flightHours)
    rows.push({ label: 'Heures de vol',  value: `${history.flightHours} h` })
  if (history.flightCount)
    rows.push({ label: 'Nombre de vols', value: history.flightCount })

  if (history.alreadyRepaired === 'yes') {
    const detail = history.repairDescription?.trim()
    rows.push({ label: 'Déjà réparée', value: detail ? `Oui — ${detail}` : 'Oui' })
  } else if (history.alreadyRepaired === 'no') {
    rows.push({ label: 'Déjà réparée', value: 'Non' })
  }

  if (history.waterContact)
    rows.push({ label: 'Contact eau', value: WATER_LABELS[history.waterContact] ?? history.waterContact })

  if (history.treeContact === 'yes')      rows.push({ label: 'Arbrissage',  value: 'Oui' })
  else if (history.treeContact === 'no')  rows.push({ label: 'Arbrissage',  value: 'Non' })

  if (history.surfaceContact) {
    const base = SURFACE_LABELS[history.surfaceContact] ?? history.surfaceContact
    const note = history.surfaceContact === 'other' && history.surfaceContactNote?.trim()
      ? ` (${history.surfaceContactNote.trim()})`
      : ''
    rows.push({ label: 'Sable / neige', value: `${base}${note}` })
  }

  if (history.generalCondition)
    rows.push({ label: 'État général', value: CONDITION_LABELS[history.generalCondition] ?? history.generalCondition })

  if (rows.length === 0) {
    return <p className="text-sm text-slate-500">Aucune information renseignée.</p>
  }

  return (
    <>
      {rows.map((r) => (
        <Row key={r.label} label={r.label} value={r.value} />
      ))}
    </>
  )
}
