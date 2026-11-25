import { PageCard } from "@/components/common"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  APPLICATION_STATUS_LABELS,
  RECRUITMENT_APPLICATION_STATUSES,
} from "@/config/entities/recruitment.config"
import type { Employee } from "@/types/employee.types"
import type { RecruitmentApplication } from "@/types/recruitment.types"

import { Mail, Phone } from "lucide-react"

interface ApplicationSidebarPanelProps {
  application: RecruitmentApplication
  employees: Employee[]
  onStatusChange: (status: string) => void
  isStatusUpdating: boolean
  onAssignRecruiter: (employeeId: string) => void
  isAssignUpdating: boolean
}

/**
 * Pure UI presentational sidebar panel displaying candidate avatar, quick contacts,
 * direct recruiter assignment dropdown, and status workflow controls.
 */
export function ApplicationSidebarPanel({
  application,
  employees,
  onStatusChange,
  isStatusUpdating,
  onAssignRecruiter,
  isAssignUpdating,
}: ApplicationSidebarPanelProps) {
  const statusLabelsMap = new Map(Object.entries(APPLICATION_STATUS_LABELS))

  return (
    <div className="space-y-6">
      {/* Candidate Profile Summary */}
      <PageCard className="flex flex-col items-center border border-border/60 p-6 text-center transition-all duration-200 hover:border-primary/30 hover:shadow-md">
        <div className="mb-3 flex size-20 items-center justify-center overflow-hidden rounded-2xl border-4 border-background bg-primary/10 text-2xl font-bold text-primary shadow-sm transition-transform duration-300 hover:scale-105 hover:rotate-1">
          {application.candidate.avatarUrl ? (
            <img
              src={application.candidate.avatarUrl}
              alt={application.candidate.fullName}
              className="size-full object-cover"
            />
          ) : (
            application.candidate.fullName.charAt(0).toUpperCase()
          )}
        </div>
        <h2 className="text-lg font-bold text-foreground">{application.candidate.fullName}</h2>
        <p className="text-xs text-muted-foreground">{application.requisition?.title ?? "—"}</p>

        <div className="mt-6 w-full space-y-3 border-t border-border/40 pt-4 text-left text-xs">
          <div className="flex items-center gap-2 truncate rounded-lg px-2 py-1 text-foreground transition-colors hover:bg-muted/30">
            <Mail className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate">{application.candidate.email}</span>
          </div>
          {application.candidate.phone && (
            <div className="flex items-center gap-2 rounded-lg px-2 py-1 text-foreground transition-colors hover:bg-muted/30">
              <Phone className="size-3.5 shrink-0 text-muted-foreground" />
              <span>{application.candidate.phone}</span>
            </div>
          )}
        </div>
      </PageCard>

      {/* Application Controls (Status & Assigned HR) */}
      <PageCard className="space-y-4 border border-border/60 p-6 transition-all duration-200 hover:border-primary/30 hover:shadow-md">
        <h3 className="border-b border-border pb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Quản lý trạng thái
        </h3>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-foreground">Trạng thái hồ sơ</Label>
          <Select
            value={application.status}
            onValueChange={onStatusChange}
            disabled={isStatusUpdating}
          >
            <SelectTrigger className="h-9 rounded-full text-xs transition-all hover:border-primary/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RECRUITMENT_APPLICATION_STATUSES.map((statusVal) => (
                <SelectItem key={statusVal} value={statusVal} className="text-xs font-medium">
                  {statusLabelsMap.get(statusVal) || statusVal}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-foreground">
            Người phụ trách (Recruiter)
          </Label>
          <Select
            value={application.assignedToId ?? ""}
            onValueChange={onAssignRecruiter}
            disabled={isAssignUpdating}
          >
            <SelectTrigger className="h-9 rounded-full text-xs transition-all hover:border-primary/50">
              <SelectValue placeholder="Chọn nhân sự phụ trách" />
            </SelectTrigger>
            <SelectContent>
              {employees.map((emp) => (
                <SelectItem key={emp.id} value={emp.id} className="text-xs font-medium">
                  {emp.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </PageCard>
    </div>
  )
}
