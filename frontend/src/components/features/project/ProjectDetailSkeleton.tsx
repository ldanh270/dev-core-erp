import { PageContainer } from "@/components/common"
import { Skeleton } from "@/components/ui/skeleton"

import React from "react"

/**
 * Presenter component that displays loading skeletons for the Project Detail page.
 */
export const ProjectDetailSkeleton: React.FC = () => {
  return (
    <PageContainer variant="default" className="space-y-6">
      <Skeleton className="h-14 w-1/3 rounded-full" />
      <Skeleton className="h-10 w-full rounded-full" />
      <div className="grid grid-cols-3 gap-6">
        <Skeleton className="col-span-2 h-64 rounded-xl" />
        <Skeleton className="col-span-1 h-64 rounded-xl" />
      </div>
    </PageContainer>
  )
}
