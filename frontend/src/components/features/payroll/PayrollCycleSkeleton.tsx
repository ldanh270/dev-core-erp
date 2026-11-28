import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * Presenter component displaying skeleton loader for the Payroll Cycle settings layout.
 */
export function PayrollCycleSkeleton() {
  return (
    <Card className="w-full rounded-xl border-border overflow-hidden p-0 shadow-xs">
      <div className="flex flex-col lg:flex-row">
        <div className="p-6 md:p-8 lg:w-96 border-b lg:border-b-0 lg:border-r border-border bg-muted/20">
          <Skeleton className="h-6 w-3/4 mb-4 rounded-lg" />
          <Skeleton className="h-4 w-full mb-2 rounded-lg" />
          <Skeleton className="h-4 w-5/6 rounded-lg" />
        </div>
        <div className="p-6 md:p-8 lg:p-10 flex-1">
          <Skeleton className="h-8 w-1/3 mb-8 rounded-lg" />
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        </div>
      </div>
    </Card>
  )
}
