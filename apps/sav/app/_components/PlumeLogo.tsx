interface PlumeLogoProps {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'dark' | 'light'
  withWordmark?: boolean
}

const SIZE_PX: Record<NonNullable<PlumeLogoProps['size']>, number> = {
  sm: 28,
  md: 36,
  lg: 56,
}

export function PlumeLogo({ size = 'md', variant = 'dark', withWordmark = false }: PlumeLogoProps) {
  const px = SIZE_PX[size]
  const tone = variant === 'dark' ? '#1a1a2e' : '#FAF6F0'
  const wordmarkColor = variant === 'dark' ? 'text-brand-ink' : 'text-brand-cream'

  return (
    <span className="inline-flex items-center gap-2.5" aria-label="Plume">
      <svg
        width={px}
        height={px}
        viewBox="0 0 64 64"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect width="64" height="64" rx={px > 40 ? 16 : 12} fill={tone} />
        <path
          d="M16 46c0-15 9-26 22-30 4 9 1 19-7 24-4 2-9 4-15 6Z"
          fill="#FF7A59"
        />
        <path
          d="M16 46c5-2 10-4 14-7 5 3 9 5 14 5-3 5-8 8-14 8-7 0-12-2-14-6Z"
          fill="#FAF6F0"
        />
      </svg>
      {withWordmark && (
        <span className={`font-display text-base font-bold tracking-tight ${wordmarkColor}`}>
          Plume <span className="font-normal opacity-60">SAV</span>
        </span>
      )}
    </span>
  )
}
