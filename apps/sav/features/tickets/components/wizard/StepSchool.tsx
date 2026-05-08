'use client'

import { useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { useWizardStore } from '../../store'
import type { PartnerSchool } from '../../queries'
import type { SchoolChangeReasonCode } from '../../types'
import { StepLayout, StepNav } from './StepLayout'

// Leaflet must not run on the server (uses window/document)
const SchoolMapPicker = dynamic(
  () => import('../SchoolMapPicker'),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[320px] items-center justify-center rounded-2xl bg-brand-cream text-sm text-slate-400">
        Chargement de la carte…
      </div>
    ),
  }
)

interface StepSchoolProps {
  schools:  PartnerSchool[]
  onNext:   () => void
  onBack:   () => void
}

type SubState = 'default' | 'reason' | 'map'

const REASONS: Array<{ code: SchoolChangeReasonCode; label: string; description: string; emoji: string }> = [
  { code: 'school_closed', label: "L'école a fermé",         description: "L'école qui m'a vendu l'aile n'existe plus.", emoji: '🚫' },
  { code: 'moved_region',  label: 'Je ne suis plus dans la région',
    description: "J'ai déménagé loin de mon école d'origine.", emoji: '🚚' },
  { code: 'relationship',  label: 'Problème relationnel',
    description: 'Je préfère travailler avec une autre école.', emoji: '🙅' },
  { code: 'other',         label: 'Autre raison',
    description: 'Je précise dans le champ texte.', emoji: '📝' },
]

export function StepSchool({ schools, onNext, onBack }: StepSchoolProps) {
  const { problem, setProblem, wingInfo } = useWizardStore()

  // The referent school comes from the wing the user picked in step 1.
  // If the wing has no partner_school_id (legacy data / column missing),
  // we have nothing to default to — go straight to the map.
  const referentSchoolId = problem.referentSchoolId ?? null
  const referentSchool   = useMemo(
    () => schools.find((s) => s.id === referentSchoolId) ?? null,
    [schools, referentSchoolId]
  )

  // Determine the initial sub-state based on what we know.
  const [sub, setSub] = useState<SubState>(() => {
    if (problem.schoolChangeReasonCode) return 'map'
    if (referentSchool) return 'default'
    return 'map'
  })

  const [reasonCode, setReasonCode] = useState<SchoolChangeReasonCode | null>(
    problem.schoolChangeReasonCode ?? null
  )
  const [reasonNote, setReasonNote] = useState<string>(problem.schoolChangeReasonNote ?? '')

  const [pickedId, setPickedId] = useState<string | null>(
    problem.partnerSchoolId ?? referentSchoolId ?? null
  )

  // Keep the picked id consistent when the user lands on default-referent
  useEffect(() => {
    if (sub === 'default' && referentSchool) setPickedId(referentSchool.id)
  }, [sub, referentSchool])

  const pickedSchool = useMemo(
    () => schools.find((s) => s.id === pickedId) ?? null,
    [schools, pickedId]
  )

  // ── Confirm: persist + go next ──────────────────────────────────────────
  function confirm() {
    if (!pickedSchool) return
    const isDifferent = referentSchoolId != null && pickedSchool.id !== referentSchoolId

    setProblem({
      partnerSchoolId:        pickedSchool.id,
      schoolChangeReasonCode: isDifferent ? (reasonCode ?? undefined) : undefined,
      schoolChangeReasonNote: isDifferent && reasonCode === 'other' ? reasonNote.trim() : undefined,
    })
    onNext()
  }

  // ── Sub-state rendering ─────────────────────────────────────────────────

  // No referent school known + no schools: dead end (rare)
  if (!referentSchool && schools.length === 0) {
    return (
      <StepLayout
        title="Aucune école disponible"
        subtitle="Aucune école partenaire n'est référencée pour le moment. Réessayez plus tard."
      >
        <></>
      </StepLayout>
    )
  }

  // ── Default state: show the wing's referent school ──────────────────────
  if (sub === 'default' && referentSchool) {
    return (
      <StepLayout
        title="Envoi à votre école"
        subtitle="Votre demande sera envoyée à l'école qui vous a vendu cette aile."
        footer={
          <StepNav
            onBack={onBack}
            onNext={confirm}
            nextLabel={`Envoyer à ${referentSchool.name}`}
          />
        }
      >
        <div className="space-y-4">
          <div className="card flex items-start gap-3 border-2 border-brand-coral bg-brand-coral/10 p-5 shadow-plume">
            <span aria-hidden className="text-3xl">🏫</span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-coral">Votre école référente</p>
              <p className="mt-1 truncate text-base font-bold text-brand-ink">{referentSchool.name}</p>
              {(referentSchool.city || referentSchool.region) && (
                <p className="mt-0.5 text-xs text-slate-600">
                  {[referentSchool.city, referentSchool.region].filter(Boolean).join(' · ')}
                </p>
              )}
              <p className="mt-3 text-xs text-slate-600">
                Aile : <strong className="text-brand-ink">{wingInfo.wingBrand} {wingInfo.wingModel} {wingInfo.wingSize}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSub('reason')}
            className="block w-full text-center text-xs text-slate-500 underline underline-offset-4 hover:text-brand-coral"
          >
            Je ne souhaite pas interagir avec mon école référente
          </button>
        </div>
      </StepLayout>
    )
  }

  // ── Reason capture ──────────────────────────────────────────────────────
  if (sub === 'reason') {
    const valid =
      !!reasonCode && (reasonCode !== 'other' || reasonNote.trim().length >= 3)

    return (
      <StepLayout
        title="Pourquoi changer d'école ?"
        subtitle="Cette information aide Plume à comprendre les attentes de ses clients. Elle reste confidentielle entre vous et Plume HQ."
        footer={
          <StepNav
            onBack={() => referentSchool ? setSub('default') : onBack()}
            onNext={() => setSub('map')}
            nextDisabled={!valid}
            nextLabel="Voir les autres écoles"
          />
        }
      >
        <div className="space-y-2">
          {REASONS.map((r) => {
            const isSelected = reasonCode === r.code
            return (
              <button
                key={r.code}
                type="button"
                onClick={() => setReasonCode(r.code)}
                className={`flex w-full items-start gap-3 rounded-2xl border-2 p-4 text-left transition-all active:scale-[0.99] ${
                  isSelected
                    ? 'border-brand-coral bg-brand-coral/10 shadow-plume'
                    : 'border-brand-stone bg-white hover:border-brand-coral/40'
                }`}
              >
                <span aria-hidden className="text-2xl">{r.emoji}</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-brand-ink">{r.label}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{r.description}</p>
                </div>
                <span className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${
                  isSelected
                    ? 'border-brand-coral bg-brand-coral text-white'
                    : 'border-brand-stone bg-white text-transparent'
                }`} aria-hidden>✓</span>
              </button>
            )
          })}
        </div>

        {reasonCode === 'other' && (
          <div className="mt-4 animate-slide-up">
            <label className="mb-1.5 block text-sm font-medium text-brand-ink">
              Précisez la raison
            </label>
            <textarea
              value={reasonNote}
              onChange={(e) => setReasonNote(e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder="Ex : je vole maintenant à l'étranger, l'école d'origine ne propose pas le service…"
              className="field-input resize-none"
            />
          </div>
        )}
      </StepLayout>
    )
  }

  // ── Map picker ──────────────────────────────────────────────────────────
  return (
    <StepLayout
      title="Choisissez une école"
      subtitle="Cliquez sur un repère sur la carte ou sélectionnez une école dans la liste."
      footer={
        <StepNav
          onBack={() => referentSchool ? setSub('reason') : onBack()}
          onNext={confirm}
          nextDisabled={!pickedSchool}
          nextLabel={pickedSchool ? `Envoyer à ${pickedSchool.name}` : 'Sélectionnez une école'}
        />
      }
    >
      <div className="space-y-4">
        <SchoolMapPicker
          schools={schools}
          selectedId={pickedId}
          onSelect={setPickedId}
        />

        {/* Liste textuelle — fallback si carte indisponible / écoles sans coords */}
        <div>
          <p className="mb-2 text-sm font-medium text-brand-ink">
            Toutes les écoles partenaires ({schools.length})
          </p>
          <div className="space-y-2">
            {schools.map((s) => {
              const isSelected = pickedId === s.id
              const isReferent = referentSchoolId === s.id
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setPickedId(s.id)}
                  className={`flex w-full items-start gap-3 rounded-2xl border-2 p-3 text-left transition-all active:scale-[0.99] ${
                    isSelected
                      ? 'border-brand-coral bg-brand-coral/10 shadow-plume'
                      : 'border-brand-stone bg-white hover:border-brand-coral/40'
                  }`}
                >
                  <span aria-hidden className="text-xl">🏫</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-brand-ink">
                      {s.name}
                      {isReferent && (
                        <span className="ml-2 rounded-full bg-brand-cream px-2 py-0.5 text-[10px] font-medium text-slate-600">
                          référente
                        </span>
                      )}
                    </p>
                    {(s.city || s.region) && (
                      <p className="mt-0.5 text-xs text-slate-500">
                        {[s.city, s.region].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </div>
                  {isSelected && <span className="text-brand-coral text-lg" aria-hidden>✓</span>}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </StepLayout>
  )
}
