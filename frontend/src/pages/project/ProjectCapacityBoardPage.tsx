/**
 * Project-level Capacity Copilot board page.
 * Kept outside Project Task pages so staffing forecast does not modify task assignment AI.
 */
import { PageContainer, PageHeader } from "@/components/common"
import { ProjectCapacityBoard } from "@/pages/project/components/project-capacity-board"

export default function ProjectCapacityBoardPage() {
  return (
    <PageContainer variant="fluid" className="space-y-6">
      <PageHeader
        title="Dự báo capacity"
        description="Theo dõi project thiếu/dư capacity theo tuần để hỗ trợ điều phối nhân sự."
      />

      <ProjectCapacityBoard />
    </PageContainer>
  )
}
