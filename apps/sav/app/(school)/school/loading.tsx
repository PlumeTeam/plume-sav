import { CardSkeleton, Skeleton } from '@/app/_components/Skeleton'

export default function Loading() {
  return (
    <main>
      <div className="border-b border-brand-stone/60 bg-white px-4 py-5">
        <Skeleton className="h-5 w-40" rounded="md" />
        <Skeleton className="mt-2 h-3 w-64" rounded="md" />
      </div>
      <div className="mx-auto max-w-4xl space-y-3 px-4 py-5">
        <Skeleton className="h-12 w-full" rounded="2xl" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-20" rounded="full" />
          <Skeleton className="h-9 w-24" rounded="full" />
          <Skeleton className="h-9 w-24" rounded="full" />
          <Skeleton className="h-9 w-24" rounded="full" />
        </div>
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </main>
  )
}
