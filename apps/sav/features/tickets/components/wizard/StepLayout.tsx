'use client'

interface StepLayoutProps {
  title:    string
  subtitle?: string
  children: React.ReactNode
  /** Sticky bottom navigation, typically Back + Next buttons */
  footer?:  React.ReactNode
}

/**
 * Common shell for every wizard step in the conversational flow.
 * Centers the question, leaves room for the sticky footer, runs the
 * slide-up entrance animation on mount.
 */
export function StepLayout({ title, subtitle, children, footer }: StepLayoutProps) {
  return (
    <div className="flex min-h-[calc(100vh-160px)] flex-col px-4 pb-36 animate-slide-up">
      <header className="mb-6 mt-2">
        <h2 className="font-display text-2xl font-bold text-brand-ink">{title}</h2>
        {subtitle && <p className="mt-2 text-sm text-slate-500">{subtitle}</p>}
      </header>

      <div className="flex-1">{children}</div>

      {footer && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-brand-stone/60 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 px-4 pt-3 pb-safe-bottom">
          <div className="mx-auto flex max-w-2xl gap-3">{footer}</div>
        </div>
      )}
    </div>
  )
}

interface StepNavProps {
  onBack?:    () => void
  onNext?:    () => void
  nextLabel?: string
  nextDisabled?: boolean
  hideBack?:  boolean
}

/** Standard Back / Next pair for the sticky footer. */
export function StepNav({ onBack, onNext, nextLabel = 'Continuer', nextDisabled, hideBack }: StepNavProps) {
  return (
    <>
      {!hideBack && (
        <button type="button" onClick={onBack} className="btn-secondary flex-1">
          ← Retour
        </button>
      )}
      <button
        type="button"
        onClick={onNext}
        disabled={nextDisabled}
        className={`btn-primary ${hideBack ? 'flex-1' : 'flex-[2]'}`}
      >
        {nextLabel}
      </button>
    </>
  )
}
