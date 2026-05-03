import { Skeleton } from '@/app/_components/Skeleton'

export default function Loading() {
  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <div className="flex items-end justify-between">
        <div>
          <Skeleton className="h-3 w-16" rounded="md" />
          <Skeleton className="mt-2 h-7 w-56" rounded="md" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Skeleton className="h-24 w-full" rounded="3xl" />
        <Skeleton className="h-24 w-full" rounded="3xl" />
        <Skeleton className="h-24 w-full" rounded="3xl" />
        <Skeleton className="h-24 w-full" rounded="3xl" />
      </div>
      <Skeleton className="h-64 w-full" rounded="3xl" />
    </main>
  )
}
