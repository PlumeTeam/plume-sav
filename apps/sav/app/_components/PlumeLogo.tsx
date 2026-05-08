import Image from 'next/image'

interface PlumeLogoProps {
  size?: 'sm' | 'md' | 'lg'
  /** dark = logo noir (fonds clairs) · light = logo blanc (fonds sombres) */
  variant?: 'dark' | 'light'
  /** Conservé pour compatibilité — le PNG inclut déjà le wordmark, no-op. */
  withWordmark?: boolean
}

// Spec : 36–40 px en header. Largeur dérivée du ratio natif du PNG (2668×2138).
const HEIGHT_PX: Record<NonNullable<PlumeLogoProps['size']>, number> = {
  sm: 36,
  md: 48,
  lg: 72,
}

const ASPECT = 2668 / 2138

export function PlumeLogo({ size = 'md', variant = 'dark' }: PlumeLogoProps) {
  const height = HEIGHT_PX[size]
  const width  = Math.round(height * ASPECT)

  const src = variant === 'light'
    ? '/images/plume-logo-white.png'
    : '/images/plume-logo-black.png'

  return (
    <Image
      src={src}
      alt="Plume Paragliders"
      width={width}
      height={height}
      priority
      className="h-auto w-auto select-none"
      style={{ height, width }}
    />
  )
}
