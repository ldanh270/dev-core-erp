import React from "react"
import { AlertCircle } from "lucide-react"
import { EmptyState, PageContainer } from "@/components/common"
import { Button } from "@/components/ui/button"

export interface TaskDetailErrorStateProps {
  title?: string
  description?: string
  onBack: () => void
  backLabel?: string
}

/**
 * Presenter component that displays error and not found state for the Task Detail page.
 */
export const TaskDetailErrorState: React.FC<TaskDetailErrorStateProps> = ({
  title = "Không tìm thấy công việc",
  description = "Công việc không tồn tại hoặc đã bị xóa.",
  onBack,
  backLabel = "Quay lại",
}) => {
  return (
    <PageContainer variant="default">
      <EmptyState
        icon={AlertCircle}
        title={title}
        description={description}
        action={
          <Button onClick={onBack} className="rounded-full">
            {backLabel}
          </Button>
        }
      />
    </PageContainer>
  )
}
