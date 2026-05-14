'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWizardStore } from '../../store'
import { attachTicketPhotosAction, createTicketAction } from '../../actions'
import { PROBLEM_CATEGORIES, REQUEST_TYPE_CONFIG, type WizardWingHistory } from '../../types'
import { PARTNER_WORKSHOPS } from '../../constants'
import { createClient } from '@/lib/supabase/client'
import type { PartnerSchool } from '../../queries'
import { resolveWarrantyTierForDisplay } from '../../utils'
import { StepLayout } from './StepLayout'

interface StepReviewProps {
  schools: PartnerSchool[]
  onBack:  () => void
}

export function StepReview({ schools, onBack }: StepReviewProps) {
  const router = useRouter()
  const { requestType, wingInfo, wingHistory, problem, photos, _photoFiles, reset } = useWizardStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError]   = useState<string | null>(null)
  const [progress, setProgress]         = useState<{ done: number; total: number } | null>(null)
  const submitLockRef = useRef(false)

  const typeCfg       = REQUEST_TYPE_CONFIG[requestType]
  const problemLabel  = PROBLEM_CATEGORIES.find((c) => c.value === problem.problemCategory)
  const isBehavior    = (problem.wingBehaviors?.length ?? 0) > 0
  const selectedSchool   = schools.find((s) => s.id === problem.partnerSchoolId)
  const selectedWorkshop = PARTNER_WORKSHOPS.find((w) => w.id === problem.partnerWorkshopId)

  // Le destinataire dépend du type : repair/inspection → atelier ; defect → école ou atelier selon garantie
  const targetLabel  = selectedSchool?.name ?? selectedWorkshop?.label ?? null
  const hasRecipient = !!selectedSchool || !!selectedWorkshop

  // Encart hors-garantie : aile > 3 ans (cf. plume_settings)
  const warrantyTier = resolveWarrantyTierForDisplay(null, wingInfo.purchaseDate || null)

  async function handleSubmit() {
    if (submitLockRef.current) return
    if (!hasRecipient) {
      setSubmitError('Destinataire manquant. Revenez à l’étape précédente.')
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

      // Flow transactionnel (anti-orphelins) :
      //  1. Création du ticket SANS photos → on récupère ticketId
      //  2. Upload photos vers Storage avec ticket_id en préfixe de path
      //  3. Insert ticket_photos en DB via attachTicketPhotosAction
      const createRes = await createTicketAction({
        requestType,
        wingBrand:              wingInfo.wingBrand,
        wingModel:              wingInfo.wingModel,
        wingSize:               wingInfo.wingSize,
        wingSerial:             wingInfo.wingSerial,
        wingColor:              wingInfo.wingColor,
        purchaseDate:           wingInfo.purchaseDate,
        flightHours:            wingInfo.flightHours ? parseInt(wingInfo.flightHours, 10) : undefined,
        problemCategory:        problem.problemCategory || undefined,
        problemDescription:     problem.problemDescription,
        urgency:                problem.urgency,
        wingBehaviors:          problem.wingBehaviors,
        wingHistory,
        clientMessage:          problem.clientMessage,
        schoolId:               problem.partnerSchoolId,
        workshopId:             problem.partnerWorkshopId,
        referentSchoolId:       problem.referentSchoolId,
        schoolChangeReasonCode: problem.schoolChangeReasonCode,
        schoolChangeReasonNote: problem.schoolChangeReasonNote,
        deliveryMethod:         problem.deliveryMethod,
        photoPaths:             [],
      })

      if (createRes?.error) {
        const errorMsg = Object.values(createRes.error).flat().join(' — ')
        setSubmitError(errorMsg || 'Erreur lors de la soumission.')
        setIsSubmitting(false)
        submitLockRef.current = false
        setProgress(null)
        return
      }

      const ticketId = (createRes as { ticketId?: string } | null)?.ticketId
      if (!ticketId) {
        setSubmitError('Ticket créé mais identifiant manquant. Contactez le support.')
        setIsSubmitting(false)
        submitLockRef.current = false
        setProgress(null)
        return
      }

      // Étape 2 — upload photos avec ticket_id en préfixe de path.
      const uploadedPhotos: Array<{
        storagePath: string
        photoType: 'overview' | 'damage_closeup' | 'serial_tag' | 'other'
        caption?: string
      }> = []
      let lastUploadError: string | null = null

      if (photos.length > 0) {
        setProgress({ done: 0, total: photos.length })
        for (let i = 0; i < photos.length; i++) {
          const photo = photos[i]
          const file  = _photoFiles[i]
          if (!photo || !file) continue

          const rawExt = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
          const ext = /^[a-z0-9]+$/.test(rawExt) ? rawExt : 'jpg'
          const storagePath = `${user.id}/${ticketId}/${i}-${Date.now()}.${ext}`

          const { error: uploadError } = await supabase.storage
            .from('tickets')
            .upload(storagePath, file, {
              upsert: false,
              contentType: file.type || `image/${ext}`,
              cacheControl: '3600',
            })

          if (uploadError) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const e = uploadError as any
            console.error('[upload] error:', {
              message:    uploadError.message,
              statusCode: e.statusCode ?? e.status ?? '?',
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

        if (uploadedPhotos.length > 0) {
          const attachRes = await attachTicketPhotosAction({
            ticketId,
            photos: uploadedPhotos,
          })
          if (attachRes?.error) {
            const flat = attachRes.error as Record<string, string[] | undefined>
            console.warn('[attachTicketPhotos] failed:', flat._form?.[0] ?? 'unknown')
          }
        }

        if (photos.length > 0 && uploadedPhotos.length === 0 && lastUploadError) {
          console.warn(`[wizard] tous les uploads photos ont échoué : ${lastUploadError}`)
        }
      }

      reset()
      router.push(`/client/ticket-created/${ticketId}`)
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
      subtitle={`Récapitulatif de votre demande de ${typeCfg.label.toLowerCase()}.`}
      footer={
        <>
          <button type="button" onClick={onBack} disabled={isSubmitting} className="btn-secondary flex-1">
            ← Retour
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !hasRecipient}
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
            ) : targetLabel
              ? `Envoyer à ${targetLabel}`
              : 'Envoyer la demande'}
          </button>
        </>
      }
    >
      <div className="space-y-3">
        {warrantyTier === 'out_of_warranty' && wingInfo.purchaseDate && (
          <div className="rounded-card border border-brand-stone bg-brand-cream p-4">
            <p className="text-sm font-semibold text-brand-ink">
              Votre aile n&apos;est plus sous garantie
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-brand-ink/80">
              Vous pouvez utiliser notre plateforme SAV gratuitement. Chaque
              intervention est enregistrée dans le carnet d&apos;entretien
              numérique de votre aile — un historique précieux pour vous et
              pour la revente.
            </p>
          </div>
        )}

        <Section title="Type de demande">
          <div className="flex items-center gap-3">
            <span aria-hidden className="text-2xl">{typeCfg.emoji}</span>
            <div>
              <p className="text-sm font-semibold text-brand-ink">{typeCfg.label}</p>
              <p className="text-xs text-slate-500">{typeCfg.description}</p>
            </div>
          </div>
        </Section>

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

        {requestType !== 'inspection' && (
          <Section title={requestType === 'repair' ? 'Dommage' : 'Défaut suspecté'}>
            {problemLabel && (
              <Row label="Catégorie" value={`${problemLabel.emoji} ${problemLabel.label}`} />
            )}
            {!problemLabel && isBehavior && (
              <Row label="Catégorie" value="🪂 Comportement" />
            )}
            <div>
              <p className="mb-1 text-xs text-slate-500">Description</p>
              <p className="whitespace-pre-line text-sm text-brand-ink">{problem.problemDescription}</p>
            </div>
          </Section>
        )}

        {requestType !== 'inspection' && (
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
        )}

        <Section title="Destinataire">
          {selectedSchool && (
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
          )}
          {selectedWorkshop && (
            <div className="flex items-start gap-3">
              <span aria-hidden className="text-2xl">🔧</span>
              <div>
                <p className="text-sm font-semibold text-brand-ink">{selectedWorkshop.label}</p>
                {(selectedWorkshop.city || selectedWorkshop.region) && (
                  <p className="mt-0.5 text-xs text-slate-500">
                    {[selectedWorkshop.city, selectedWorkshop.region].filter(Boolean).join(' · ')}
                  </p>
                )}
              </div>
            </div>
          )}
          {!hasRecipient && (
            <p className="text-sm text-amber-700">Aucun destinataire sélectionné — revenez en arrière.</p>
          )}
        </Section>

        <Section title="Remise de l&apos;aile">
          {problem.deliveryMethod === 'in_person' && (
            <div className="flex items-start gap-3">
              <span aria-hidden className="text-2xl">🤝</span>
              <div>
                <p className="text-sm font-semibold text-brand-ink">Remise en main propre</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Vous prendrez rendez-vous avec le destinataire pour déposer votre aile.
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

        <Section title="Message">
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

const WATER_LABELS:   Record<string, string> = { none: 'Non', fresh: 'Eau douce', salt: 'Eau salée' }
const SURFACE_LABELS: Record<string, string> = { sand: 'Sable / dunes', snow: 'Neige', other: 'Autre' }
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

  if (history.surfaceContact && history.surfaceContact.length > 0) {
    const labels = history.surfaceContact
      .map((v) => SURFACE_LABELS[v] ?? v)
      .join(', ')
    const note = history.surfaceContact.includes('other') && history.surfaceContactNote?.trim()
      ? ` (${history.surfaceContactNote.trim()})`
      : ''
    rows.push({ label: 'Sable / neige', value: `${labels}${note}` })
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
