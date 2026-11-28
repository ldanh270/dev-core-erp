import { Skeleton } from "@/components/ui/skeleton"

/**
 * Presenter skeleton displayed while Kanban stages or cards are loading.
 */
export function KanbanBoardSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 overflow-x-auto pb-4 md:grid-cols-3 xl:grid-cols-4">
      {[1, 2, 3].map((number) => (
        <div key={number} className="min-w-[280px] space-y-3 rounded-xl bg-secondary/40 p-4">
          <Skeleton className="h-6 w-1/2 rounded-full" />
          <Skeleton className="h-28 w-full rounded-lg" />
          <Skeleton className="h-28 w-full rounded-lg" />
        </div>
      ))}
    </div>
  )
}
