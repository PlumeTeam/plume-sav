interface SkeletonProps {
  className?: string
  rounded?: 'sm' | 'md' | 'lg' | 'full' | '2xl' | '3xl'
}

const ROUNDED: Record<NonNullable<SkeletonProps['rounded']>, string> = {
  sm:   'rounded-md',
  md:   'rounded-lg',
  lg:   'rounded-xl',
  '2xl':'rounded-2xl',
  '3xl':'rounded-3xl',
  full: 'rounded-full',
}

export function Skeleton({ className = '', rounded = 'md' }: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={`animate-pulse bg-brand-stone/70 ${ROUNDED[rounded]} ${className}`}
    />
  )
}

export function CardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`card p-4 ${className}`}>
      <div className="flex items-center gap-3">
        <Skeleton className="h-16 w-16" rounded="2xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" rounded="md" />
          <Skeleton className="h-3 w-1/2" rounded="md" />
          <Skeleton className="h-3 w-1/3" rounded="md" />
        </div>
      </div>
    </div>
  )
}
