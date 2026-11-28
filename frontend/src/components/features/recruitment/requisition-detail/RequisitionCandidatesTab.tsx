import { PageCard } from "@/components/common"
import { StatusPill } from "@/components/common/status-pill"
import { Input } from "@/components/ui/input"
import { TABLE_COL_WIDTH } from "@/config/table-columns.config"
import type { JobPosting, KanbanApplication } from "@/types/recruitment.types"

import { Search } from "lucide-react"

interface RequisitionCandidatesTabProps {
  applications: KanbanApplication[]
  postings: JobPosting[]
  search: string
  onSearchChange: (value: string) => void
  onSelectCandidate: (id: string) => void
}

/**
 * Pure UI presentational tab presenting candidates linked to a job requisition
 * with search debouncing, candidate profile badges, and stage indicator pills.
 */
export function RequisitionCandidatesTab({
  applications,
  postings,
  search,
  onSearchChange,
  onSelectCandidate,
}: RequisitionCandidatesTabProps) {
  return (
    <PageCard padding="sm">
      <div className="mb-4 flex items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => {
              onSearchChange(event.target.value)
            }}
            className="h-9 rounded-full pl-9 text-xs"
            placeholder="Tìm ứng viên, email, stage..."
          />
        </div>
        <span className="text-xs text-muted-foreground">{applications.length} ứng viên</span>
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
              <th className="p-3" style={{ width: `${TABLE_COL_WIDTH.TYPE}px` }}>
                Bài đăng
              </th>
              <th className="p-3" style={{ width: `${TABLE_COL_WIDTH.STATUS}px` }}>
                Giai đoạn
              </th>
            </tr>
          </thead>
          <tbody>
            {applications.map((application) => {
              const posting = postings.find((p) => p.id === application.postingId)
              const sourceLabel = posting?.source ?? "Nguồn tuyển dụng"

              return (
                <tr
                  key={application.id}
                  onClick={() => {
                    onSelectCandidate(application.id)
                  }}
                  className="group cursor-pointer border-b border-border transition-colors hover:bg-muted/30 last:border-0"
                >
                  <td className="p-3 font-medium">
                    <span className="font-semibold text-foreground transition-colors group-hover:text-primary group-hover:underline">
                      {application.candidate.fullName}
                    </span>
                    <p className="mt-0.5 font-mono text-[10px] font-normal text-muted-foreground">
                      #{application.id.slice(0, 6)}
                    </p>
                  </td>
                  <td className="p-3 text-muted-foreground">
                    <span>{application.candidate.email}</span>
                    <p className="text-xs">{application.candidate.phone ?? ""}</p>
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">{sourceLabel}</td>
                  <td className="p-3">
                    <StatusPill
                      label={application.pipelineStage?.name ?? "Nộp CV"}
                      variant="info"
                    />
                  </td>
                </tr>
              )
            })}
            {applications.length === 0 && (
              <tr>
                <td colSpan={4} className="p-10 text-center text-muted-foreground">
                  Chưa có ứng viên trong yêu cầu này.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </PageCard>
  )
}
