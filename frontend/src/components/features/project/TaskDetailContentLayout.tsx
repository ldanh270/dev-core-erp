import { TaskDetailMainInfo } from "@/components/features/project/task-detail/TaskDetailMainInfo"
import { TaskDetailSpentTimeCard } from "@/components/features/project/task-detail/TaskDetailSpentTimeCard"
import type { ProjectTaskStatus } from "@/types/project-task-status.types"
import type { SpentTime } from "@/types/spent-time.types"
import type { Task } from "@/types/task.types"

import React from "react"

export interface TaskDetailContentLayoutProps {
  task: Task
  statuses: ProjectTaskStatus[]
  spentTimes?: SpentTime[]
  isLoadingSpent: boolean
  totalSpentHours: number
  currentUserId?: string
  isAdminOrGM: boolean
  canApproveSpentTime: boolean
  onApproveSpentTime: (logId: string) => void
  onRejectSpentTime: (logId: string, reason: string) => void
  onEditSpentTime: (spentTime: SpentTime) => void
  onDeleteSpentTime: (logId: string) => void
}

/**
 * Presenter component that layouts the main task info and spent time side card in a 12-column grid.
 */
export const TaskDetailContentLayout: React.FC<TaskDetailContentLayoutProps> = ({
  task,
  statuses,
  spentTimes,
  isLoadingSpent,
  totalSpentHours,
  currentUserId,
  isAdminOrGM,
  canApproveSpentTime,
  onApproveSpentTime,
  onRejectSpentTime,
  onEditSpentTime,
  onDeleteSpentTime,
}) => {
  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-12 space-y-6 lg:col-span-8">
        <TaskDetailMainInfo task={task} statuses={statuses} />
      </div>

      <div className="col-span-12 space-y-6 lg:col-span-4">
        <TaskDetailSpentTimeCard
          spentTimes={spentTimes}
          isLoadingSpent={isLoadingSpent}
          totalSpentHours={totalSpentHours}
          currentUserId={currentUserId}
          isAdminOrGM={isAdminOrGM}
          canApproveSpentTime={canApproveSpentTime}
          onApprove={onApproveSpentTime}
          onReject={onRejectSpentTime}
          onEdit={onEditSpentTime}
          onDelete={onDeleteSpentTime}
        />
      </div>
    </div>
  )
}
