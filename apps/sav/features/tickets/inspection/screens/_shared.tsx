'use client'

import type { ReactNode } from 'react'
import type { YesNo } from '../steps'

// Keys identifying every inspection question that accepts photos. The "Oui"
// branches in phase 1 require evidence; the tri-state ones (lines, risers)
// require it only when the worst value is selected. 'inflation' is purely
// optional (phase 2 — check au sol).
export type PhotoSlot = 'damage' | 'tears' | 'openSeams' | 'maillons' | 'lines' | 'risers' | 'inflation'

export type Tone = 'emerald' | 'amber' | 'red' | 'slate' | 'gold'

// ─────────────────────────────────────────────────────────────────────────────
// Layout primitives
// ─────────────────────────────────────────────────────────────────────────────

export function ScreenLayout({
  phase, title, subtitle, children, footer,
}: {
  phase?:    string
  title:     string
  subtitle?: string
  children:  ReactNode
  footer:    ReactNode
}) {
  return (
    <div className="card animate-slide-up p-5">
      {phase && (
        <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-gold">
          {phase}
        </p>
      )}
      <h2 className="mt-1 font-display text-xl font-bold text-brand-ink">{title}</h2>
      {subtitle && <p className="mt-2 text-sm text-slate-500">{subtitle}</p>}

      <div className="mt-5 space-y-5">
        {children}
      </div>

      <div className="mt-6">{footer}</div>
    </div>
  )
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-brand-ink">{label}</p>
      {children}
    </div>
  )
}

// Surfaced under every problem branch in phase 1 (visible damage, tears, open
// seams, inverted maillons, broken lines, damaged risers) — reminds the school
// that the "Continuer" button stays disabled until they provide a photo or text.
export function PhotoOrTextHint() {
  return (
    <p className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900">
      ⚠️ Ajoutez au moins <strong>une photo</strong> ou <strong>une description</strong> pour continuer.
    </p>
  )
}

// Softer variant for intermediate states (e.g. "Usé") where evidence is helpful
// but not gated — the wizard still lets the school continue without it.
export function OptionalEvidenceHint() {
  return (
    <p className="rounded-2xl border border-brand-stone bg-brand-cream/70 px-3 py-2 text-xs leading-relaxed text-slate-600">
      💡 Optionnel — photo ou description bienvenues pour aider l&apos;atelier.
    </p>
  )
}

export function NavButtons({
  onBack, onNext, nextDisabled, backLabel = '← Précédent', nextLabel = 'Continuer',
  tertiaryLabel, onTertiary,
}: {
  onBack:       () => void
  onNext:       () => void
  nextDisabled?: boolean
  backLabel?:   string
  nextLabel?:   string
  tertiaryLabel?: string
  onTertiary?:    () => void
}) {
  return (
    <div className="space-y-2">
      <div className="flex gap-3">
        <button type="button" onClick={onBack} className="btn-secondary flex-1">
          {backLabel}
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={nextDisabled}
          className="btn-primary flex-[2]"
        >
          {nextLabel}
        </button>
      </div>
      {tertiaryLabel && onTertiary && (
        <button
          type="button"
          onClick={onTertiary}
          className="block w-full text-center text-xs font-medium text-slate-500 underline underline-offset-4 hover:text-brand-gold"
        >
          {tertiaryLabel}
        </button>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Yes / No selector — used for binary visual checks
// ─────────────────────────────────────────────────────────────────────────────

export function YesNoSelector({ value, onChange }: { value: YesNo | undefined; onChange: (v: YesNo) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <button
        type="button"
        onClick={() => onChange('yes')}
        className={`flex flex-col items-center gap-1 rounded-2xl border-2 py-4 text-sm font-semibold transition-all active:scale-[0.97] ${
          value === 'yes'
            ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
            : 'border-brand-stone bg-white text-brand-ink hover:border-brand-gold/40'
        }`}
      >
        <span className="text-2xl" aria-hidden>✓</span>
        Oui
      </button>
      <button
        type="button"
        onClick={() => onChange('no')}
        className={`flex flex-col items-center gap-1 rounded-2xl border-2 py-4 text-sm font-semibold transition-all active:scale-[0.97] ${
          value === 'no'
            ? 'border-red-500 bg-red-50 text-red-900'
            : 'border-brand-stone bg-white text-brand-ink hover:border-brand-gold/40'
        }`}
      >
        <span className="text-2xl" aria-hidden>✕</span>
        Non
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Segmented choice — generic n-way picker with optional tone
// ─────────────────────────────────────────────────────────────────────────────

function toneClasses(tone: Tone | undefined, selected: boolean): string {
  if (!selected) return 'border-brand-stone bg-white text-brand-ink hover:border-brand-gold/40'
  switch (tone) {
    case 'emerald': return 'border-emerald-500 bg-emerald-50 text-emerald-900'
    case 'amber':   return 'border-amber-500 bg-amber-50 text-amber-900'
    case 'red':     return 'border-red-500 bg-red-50 text-red-900'
    case 'slate':   return 'border-slate-500 bg-slate-50 text-slate-900'
    case 'gold':
    default:        return 'border-brand-gold bg-brand-gold/10 text-brand-ink shadow-plume'
  }
}

interface SegmentedChoiceProps<T extends string> {
  options:  Array<{ value: T; label: string; tone?: Tone }>
  value:    T | undefined
  onChange: (v: T) => void
}

export function SegmentedChoice<T extends string>({ options, value, onChange }: SegmentedChoiceProps<T>) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {options.map((opt) => {
        const selected = value === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`rounded-2xl border-2 px-3 py-3 text-left text-sm font-semibold transition-all active:scale-[0.99] ${toneClasses(opt.tone, selected)}`}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
