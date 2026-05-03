import { CardSkeleton, Skeleton } from '@/app/_components/Skeleton'

export default function Loading() {
  return (
    <main className="space-y-8 px-4 py-6">
      <Skeleton className="h-32 w-full" rounded="3xl" />
      <section>
        <Skeleton className="mb-3 h-3 w-24" rounded="md" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </section>
      <section>
        <Skeleton className="mb-3 h-3 w-24" rounded="md" />
        <div className="space-y-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </section>
    </main>
  )
}
