import { PageCard } from "@/components/common"
import { StatusPill } from "@/components/common/status-pill"
import type { KanbanApplication } from "@/types/recruitment.types"

import { EmptyRow, WorkspaceHeader } from "./WorkspaceShared"

interface RequisitionBackgroundChecksTabProps {
  applications: KanbanApplication[]
}

/**
 * Pure presentational tab listing background check verifications
 * across candidate offers within a requisition.
 */
export function RequisitionBackgroundChecksTab({
  applications,
}: RequisitionBackgroundChecksTabProps) {
  const checks = applications.flatMap((application) =>
    (application.offers ?? [])
      .filter((offer) => offer.backgroundCheck)
      .map((offer) => ({
        application,
        check: offer.backgroundCheck as Exclude<typeof offer.backgroundCheck, null | undefined>,
      })),
  )

  return (
    <PageCard padding="sm">
      <WorkspaceHeader
        title="Background Check"
        description="Kiểm tra thông tin của ứng viên trong yêu cầu tuyển dụng này."
        count={checks.length}
      />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b text-left text-muted-foreground">
            <tr>
              <th className="p-3">Ứng viên</th>
              <th className="p-3">Email</th>
              <th className="p-3">Nhóm kiểm tra</th>
              <th className="p-3">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {checks.map(({ application, check }) => (
              <tr key={check.id} className="border-b last:border-0">
                <td className="p-3 font-medium">{application.candidate.fullName}</td>
                <td className="p-3 text-muted-foreground">{application.candidate.email}</td>
                <td className="p-3">{check.group}</td>
                <td className="p-3">
                  <StatusPill label={check.status} variant="info" />
                </td>
              </tr>
            ))}
            <EmptyRow
              visible={checks.length === 0}
              message="Chưa có background check trong yêu cầu này."
            />
          </tbody>
        </table>
      </div>
    </PageCard>
  )
}
