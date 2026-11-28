import { EmptyState, PageContainer } from "@/components/common"
import { Button } from "@/components/ui/button"

import React from "react"

import { AlertCircle } from "lucide-react"
import { useNavigate } from "react-router-dom"

export interface ProjectDetailErrorStateProps {
  title?: string
  description?: string
  backUrl?: string
  backLabel?: string
}

/**
 * Presenter component that displays error and not found state for the Project Detail page.
 */
export const ProjectDetailErrorState: React.FC<ProjectDetailErrorStateProps> = ({
  title = "Không tìm thấy dự án",
  description = "Dự án không tồn tại hoặc bạn không có quyền truy cập.",
  backUrl = "/project/list",
  backLabel = "Quay lại danh sách",
}) => {
  const navigate = useNavigate()
  return (
    <PageContainer variant="default">
      <EmptyState
        icon={AlertCircle}
        title={title}
        description={description}
        action={
          <Button
            onClick={() => {
              navigate(backUrl)
            }}
            className="rounded-full"
          >
            {backLabel}
          </Button>
        }
      />
    </PageContainer>
  )
}
