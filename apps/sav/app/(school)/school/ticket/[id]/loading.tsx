import { Skeleton } from '@/app/_components/Skeleton'

export default function SchoolTicketDetailLoading() {
  return (
    <div className="min-h-screen">
      <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 pt-4 pb-2">
        <Skeleton className="h-10 w-10" rounded="lg" />
        <div className="flex-1">
          <Skeleton className="h-3 w-20" rounded="md" />
          <Skeleton className="mt-1 h-4 w-40" rounded="md" />
        </div>
        <Skeleton className="h-6 w-20" rounded="full" />
      </div>
      <main className="mx-auto max-w-4xl space-y-3 p-4 pb-12">
        <Skeleton className="h-40 w-full" rounded="3xl" />
        <Skeleton className="h-32 w-full" rounded="3xl" />
        <Skeleton className="h-32 w-full" rounded="3xl" />
        <Skeleton className="h-32 w-full" rounded="3xl" />
      </main>
    </div>
  )
}
