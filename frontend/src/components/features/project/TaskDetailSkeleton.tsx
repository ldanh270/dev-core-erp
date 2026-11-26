import React from "react"
import { PageContainer } from "@/components/common"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * Presenter component that displays loading skeletons for the Task Detail page.
 */
export const TaskDetailSkeleton: React.FC = () => {
  return (
    <PageContainer variant="default" className="space-y-6">
      <Skeleton className="h-10 w-1/3 rounded-full" />
      <Skeleton className="h-40 w-full rounded-xl" />
      <Skeleton className="h-24 w-full rounded-xl" />
    </PageContainer>
  )
}
