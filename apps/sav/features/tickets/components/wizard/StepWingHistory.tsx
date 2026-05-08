'use client'

import { useState } from 'react'
import { useWizardStore } from '../../store'
import type {
  WaterContactKind,
  SurfaceContactKind,
  WingCondition,
} from '../../types'
import { StepLayout, StepNav } from './StepLayout'

interface StepWingHistoryProps {
  onNext: () => void
  onBack: () => void
}

const WATER_OPTIONS: Array<{ value: WaterContactKind; emoji: string; label: string }> = [
  { value: 'none',  emoji: '⛔', label: 'Non' },
  { value: 'fresh', emoji: '💧', label: 'Eau douce' },
  { value: 'salt',  emoji: '🌊', label: 'Eau salée' },
]

const SURFACE_OPTIONS: Array<{ value: SurfaceContactKind; emoji: string; label: string }> = [
  { value: 'none',  emoji: '⛔', label: 'Non' },
  { value: 'sand',  emoji: '🏜️', label: 'Sable / dunes' },
  { value: 'snow',  emoji: '❄️', label: 'Neige' },
  { value: 'other', emoji: '❓', label: 'Autre' },
]

const CONDITION_OPTIONS: Array<{ value: WingCondition; emoji: string; label: string; description: string }> = [
  { value: 'excellent', emoji: '🟢', label: 'Excellent', description: "Comme neuve, peu d'heures et bien entretenue" },
  { value: 'good',      emoji: '🟡', label: 'Bon',       description: 'Quelques marques mais pas de problème connu' },
  { value: 'worn',      emoji: '🟠', label: 'Usé',       description: 'Marques visibles, vieillissement normal' },
  { value: 'bad',       emoji: '🔴', label: 'Mauvais',   description: 'Pour le SAV, justement…' },
]

export function StepWingHistory({ onNext, onBack }: StepWingHistoryProps) {
  const { wingHistory, setWingHistory } = useWizardStore()

  // Local state mirrors the store; we commit on Next so the user can scroll
  // through the page without each keystroke triggering a Zustand write loop.
  const [flightHours,         setFlightHours]         = useState(wingHistory.flightHours ?? '')
  const [flightCount,         setFlightCount]         = useState(wingHistory.flightCount ?? '')
  const [alreadyRepaired,     setAlreadyRepaired]     = useState<'yes' | 'no' | null>(wingHistory.alreadyRepaired ?? null)
  const [repairDescription,   setRepairDescription]   = useState(wingHistory.repairDescription ?? '')
  const [waterContact,        setWaterContact]        = useState<WaterContactKind | null>(wingHistory.waterContact ?? null)
  const [surfaceContact,      setSurfaceContact]      = useState<SurfaceContactKind | null>(wingHistory.surfaceContact ?? null)
  const [surfaceContactNote,  setSurfaceContactNote]  = useState(wingHistory.surfaceContactNote ?? '')
  const [generalCondition,    setGeneralCondition]    = useState<WingCondition | null>(wingHistory.generalCondition ?? null)

  function handleNext() {
    setWingHistory({
      flightHours:        flightHours.trim() || undefined,
      flightCount:        flightCount.trim() || undefined,
      alreadyRepaired,
      repairDescription:  alreadyRepaired === 'yes' ? repairDescription.trim() || undefined : undefined,
      waterContact,
      surfaceContact,
      surfaceContactNote: surfaceContact === 'other' ? surfaceContactNote.trim() || undefined : undefined,
      generalCondition,
    })
    onNext()
  }

  return (
    <StepLayout
      title="Historique de l'aile"
      subtitle="Aidez l'école à mieux comprendre l'usage de votre aile. Toutes les questions sont optionnelles — laissez vide ce que vous ne savez pas."
      footer={<StepNav onBack={onBack} onNext={handleNext} nextLabel="Continuer" />}
    >
      <div className="space-y-7">
        {/* 1. Heures de vol */}
        <Section
          label="Heures de vol approximatives"
          hint="Estimation du total cumulé"
        >
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              inputMode="numeric"
              placeholder="ex : 150"
              value={flightHours}
              onChange={(e) => setFlightHours(e.target.value)}
              className="field-input flex-1"
            />
            <span className="text-sm text-slate-500">heures</span>
          </div>
        </Section>

        {/* 2. Nombre de vols */}
        <Section
          label="Nombre de vols approximatif"
          hint="Estimation, pas besoin d'être précis"
        >
          <input
            type="number"
            min="0"
            inputMode="numeric"
            placeholder="ex : 200"
            value={flightCount}
            onChange={(e) => setFlightCount(e.target.value)}
            className="field-input"
          />
        </Section>

        {/* 3. Déjà réparée ? */}
        <Section label="L'aile a-t-elle déjà été réparée ?">
          <div className="grid grid-cols-2 gap-2">
            <ChoiceButton
              selected={alreadyRepaired === 'yes'}
              onClick={() => setAlreadyRepaired('yes')}
              emoji="✓"
              label="Oui"
            />
            <ChoiceButton
              selected={alreadyRepaired === 'no'}
              onClick={() => setAlreadyRepaired('no')}
              emoji="✕"
              label="Non"
            />
          </div>

          {alreadyRepaired === 'yes' && (
            <div className="mt-3 animate-slide-up">
              <label className="mb-1.5 block text-xs font-medium text-slate-600">
                Décrivez brièvement
              </label>
              <textarea
                value={repairDescription}
                onChange={(e) => setRepairDescription(e.target.value)}
                rows={3}
                maxLength={1000}
                placeholder="Ex : ripstop posé sur déchirure de 6 cm bord d'attaque par mon école en 2024."
                className="field-input resize-none"
              />
            </div>
          )}
        </Section>

        {/* 4. Eau ? */}
        <Section label="L'aile est-elle tombée dans l'eau ?">
          <div className="grid grid-cols-3 gap-2">
            {WATER_OPTIONS.map((opt) => (
              <ChoiceButton
                key={opt.value}
                selected={waterContact === opt.value}
                onClick={() => setWaterContact(opt.value)}
                emoji={opt.emoji}
                label={opt.label}
              />
            ))}
          </div>
        </Section>

        {/* 5. Sable / neige / dunes ? */}
        <Section label="Contact avec sable, neige ou dunes ?">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {SURFACE_OPTIONS.map((opt) => (
              <ChoiceButton
                key={opt.value}
                selected={surfaceContact === opt.value}
                onClick={() => setSurfaceContact(opt.value)}
                emoji={opt.emoji}
                label={opt.label}
              />
            ))}
          </div>
          {surfaceContact === 'other' && (
            <div className="mt-3 animate-slide-up">
              <input
                type="text"
                value={surfaceContactNote}
                onChange={(e) => setSurfaceContactNote(e.target.value)}
                maxLength={200}
                placeholder="Précisez (boue, herbe haute, ronces…)"
                className="field-input"
              />
            </div>
          )}
        </Section>

        {/* 6. État général */}
        <Section
          label="État général de votre aile"
          hint="Votre ressenti, sans contrainte"
        >
          <div className="space-y-2">
            {CONDITION_OPTIONS.map((opt) => {
              const isSelected = generalCondition === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setGeneralCondition(opt.value)}
                  className={`flex w-full items-start gap-3 rounded-2xl border-2 p-3 text-left transition-all active:scale-[0.99] ${
                    isSelected
                      ? 'border-brand-coral bg-brand-coral/10 shadow-plume'
                      : 'border-brand-stone bg-white hover:border-brand-coral/40'
                  }`}
                >
                  <span aria-hidden className="text-2xl">{opt.emoji}</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-brand-ink">{opt.label}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{opt.description}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </Section>
      </div>
    </StepLayout>
  )
}

// ── Building blocks ──────────────────────────────────────────────────────

function Section({
  label, hint, children,
}: {
  label:    string
  hint?:    string
  children: React.ReactNode
}) {
  return (
    <div>
      <p className="text-sm font-semibold text-brand-ink">{label}</p>
      {hint && <p className="mb-2 mt-0.5 text-xs text-slate-500">{hint}</p>}
      {!hint && <div className="mb-2" />}
      {children}
    </div>
  )
}

function ChoiceButton({
  selected, onClick, emoji, label,
}: {
  selected: boolean
  onClick:  () => void
  emoji:    string
  label:    string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1 rounded-2xl border-2 px-2 py-3 text-sm font-semibold transition-all active:scale-[0.97] ${
        selected
          ? 'border-brand-coral bg-brand-coral/10 text-brand-ink shadow-plume'
          : 'border-brand-stone bg-white text-brand-ink hover:border-brand-coral/40'
      }`}
    >
      <span aria-hidden className="text-xl">{emoji}</span>
      <span className="text-xs leading-tight">{label}</span>
    </button>
  )
}
