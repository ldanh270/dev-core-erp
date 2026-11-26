import { PageContainer, PageHeader } from "@/components/common"
import { ProjectCapacityBoard } from '@/components/features/project/ProjectCapacityBoard'

/**
 * Project-level Capacity Copilot board page orchestrator.
 * Displays weekly capacity forecasting to assist staffing coordination.
 */
export default function ProjectCapacityBoardPage() {
  return (
    <PageContainer variant="table">
      <PageHeader
        title="Dự báo capacity"
        description="Theo dõi project thiếu/dư capacity theo tuần để hỗ trợ điều phối nhân sự."
      />

      <ProjectCapacityBoard />
    </PageContainer>
  )
}


