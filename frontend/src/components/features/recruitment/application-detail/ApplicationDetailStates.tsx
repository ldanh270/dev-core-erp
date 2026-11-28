import { Skeleton } from "@/components/ui/skeleton"

/**
 * Presentational skeleton placeholder while application data is being fetched.
 */
export function ApplicationDetailSkeleton() {
  return (
    <div className="container space-y-6 p-8">
      <Skeleton className="h-10 w-1/3 rounded-full" />
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-8 space-y-6">
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
        <div className="col-span-4 space-y-6">
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  )
}
