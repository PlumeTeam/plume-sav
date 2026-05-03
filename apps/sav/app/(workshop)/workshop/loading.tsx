import { CardSkeleton, Skeleton } from '@/app/_components/Skeleton'

export default function Loading() {
  return (
    <main>
      <div className="border-b border-brand-stone/60 bg-white px-4 py-5">
        <Skeleton className="h-5 w-48" rounded="md" />
        <Skeleton className="mt-2 h-3 w-72" rounded="md" />
      </div>
      <div className="hidden md:grid md:grid-cols-3 md:gap-4 md:p-6">
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-3 rounded-3xl border border-brand-stone/60 bg-white p-4">
            <Skeleton className="h-4 w-24" rounded="md" />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ))}
      </div>
      <div className="space-y-3 px-4 py-4 md:hidden">
        <div className="flex gap-2">
          <Skeleton className="h-9 w-32" rounded="full" />
          <Skeleton className="h-9 w-32" rounded="full" />
          <Skeleton className="h-9 w-28" rounded="full" />
        </div>
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </main>
  )
}
