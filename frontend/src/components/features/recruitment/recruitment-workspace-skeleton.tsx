import { Skeleton } from "@/components/ui/skeleton"

export function RecruitmentWorkspaceSkeleton() {
  return (
    <div
      className="container space-y-6 px-3 py-4 sm:px-6 sm:py-6"
      aria-label="Đang tải dữ liệu tuyển dụng"
      aria-busy="true"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-3">
          <Skeleton className="h-8 w-40 rounded-full" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-72 max-w-[70vw] rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <Skeleton className="h-4 w-80 max-w-[80vw] rounded-full" />
        </div>
        <Skeleton className="h-10 w-36 rounded-full" />
      </div>

      <div className="flex max-w-full gap-2 overflow-hidden rounded-full border border-border/40 bg-secondary p-1">
        {["w-24", "w-32", "w-24", "w-28", "w-24", "w-20"].map((widthClass, index) => (
          <Skeleton
            key={`${widthClass}-${index}`}
            className={`h-8 ${widthClass} shrink-0 rounded-full`}
          />
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-5"
          >
            <Skeleton className="size-11 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-24 rounded-full" />
              <Skeleton className="h-7 w-16 rounded-full" />
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-5 rounded-xl border border-border bg-card p-5">
        <Skeleton className="h-5 w-44 rounded-full" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="space-y-4 rounded-xl border border-border/60 p-4">
              <Skeleton className="h-4 w-28 rounded-full" />
              <Skeleton className="h-8 w-12 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
