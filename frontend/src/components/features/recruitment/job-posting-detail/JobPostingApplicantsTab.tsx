import { PageCard } from "@/components/common"
import { StatusPill } from "@/components/common/status-pill"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TABLE_COL_WIDTH } from "@/config/table-columns.config"
import type { RecruitmentApplication } from "@/types/recruitment.types"

import { Plus, Search } from "lucide-react"

interface JobPostingApplicantsTabProps {
  candidates: RecruitmentApplication[]
  searchQuery: string
  onSearchChange: (value: string) => void
  onAddCandidate: () => void
}

/**
 * Pure UI presentational tab listing applicants assigned to a specific job posting,
 * with search filtering, stage pills, and manual candidate addition trigger.
 */
export function JobPostingApplicantsTab({
  candidates,
  searchQuery,
  onSearchChange,
  onAddCandidate,
}: JobPostingApplicantsTabProps) {
  return (
    <PageCard padding="sm">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(event) => {
              onSearchChange(event.target.value)
            }}
            className="h-9 rounded-full pl-9 text-xs"
            placeholder="Tìm theo ứng viên, email, giai đoạn..."
          />
        </div>
        <Button className="rounded-full text-xs font-bold" onClick={onAddCandidate}>
          <Plus className="mr-1.5 size-3.5" />
          Thêm ứng viên
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-left text-muted-foreground">
            <tr>
              <th className="p-3" style={{ width: `${TABLE_COL_WIDTH.TITLE}px` }}>
                Ứng viên
              </th>
              <th className="p-3" style={{ width: `${TABLE_COL_WIDTH.CONTACT}px` }}>
                Liên hệ
              </th>
              <th className="p-3" style={{ width: `${TABLE_COL_WIDTH.STATUS}px` }}>
                Giai đoạn
              </th>
              <th className="p-3" style={{ width: `${TABLE_COL_WIDTH.EMPLOYEE}px` }}>
                Người phụ trách
              </th>
            </tr>
          </thead>
          <tbody>
            {candidates.map((application) => (
              <tr key={application.id} className="border-b border-border last:border-0">
                <td className="p-3 font-medium">
                  <span className="text-foreground">{application.candidate.fullName}</span>
                  <p className="mt-0.5 font-mono text-[10px] font-normal text-muted-foreground">
                    #{application.id.substring(0, 6)}
                  </p>
                </td>
                <td className="p-3 text-muted-foreground">
                  <span>{application.candidate.email}</span>
                  <p className="mt-0.5 text-xs">{application.candidate.phone ?? ""}</p>
                </td>
                <td className="p-3">
                  <StatusPill label={application.pipelineStage?.name ?? "Nộp đơn"} variant="info" />
                </td>
                <td className="p-3 text-muted-foreground">
                  {application.assignedTo?.fullName ?? "Chưa phân công"}
                </td>
              </tr>
            ))}
            {candidates.length === 0 && (
              <tr>
                <td colSpan={4} className="p-10 text-center text-muted-foreground">
                  Chưa có ứng viên. Thêm thủ công hoặc đồng bộ từ Google Form.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </PageCard>
  )
}
