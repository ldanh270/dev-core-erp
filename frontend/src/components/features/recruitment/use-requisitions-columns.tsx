import type { DataTableColumn } from "@/components/common"
import { StatusPill } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import {
  REQUISITION_PRIORITY,
  REQUISITION_PRIORITY_LABELS,
  REQUISITION_STATUS_LABELS,
} from "@/config/entities/recruitment.config"
import { getTableColWidthPx } from "@/config/table-columns.config"
import { TYPOGRAPHY } from "@/config/typography.config"
import { routerNavigate } from "@/lib/router-navigator"
import { cn } from "@/lib/utils"
import type { JobRequisition } from "@/types/recruitment.types"

import { RequisitionRowActions } from "./RequisitionRowActions"

const priorityVariantMap: Record<string, "destructive" | "secondary" | "outline"> = {
  [REQUISITION_PRIORITY.URGENT]: "destructive",
  [REQUISITION_PRIORITY.HIGH]: "secondary",
  [REQUISITION_PRIORITY.MEDIUM]: "outline",
  [REQUISITION_PRIORITY.LOW]: "outline",
}

const statusVariantMap: Record<string, "success" | "warning" | "danger" | "info" | "neutral"> = {
  draft: "neutral",
  pending_approval: "warning",
  approved: "success",
  rejected: "danger",
  closed: "neutral",
  filled: "info",
}

function formatCurrencyRange(requisition: JobRequisition) {
  const format = (value: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(value)
  if (requisition.salaryMin && requisition.salaryMax)
    return `${format(requisition.salaryMin)} – ${format(requisition.salaryMax)}`
  return requisition.salaryMin ? `Từ ${format(requisition.salaryMin)}` : "Chưa xác định"
}

function formatDate(value?: string | null) {
  return value
    ? new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(new Date(value))
    : "—"
}

export interface RequisitionsColumnsOptions {
  hasPermission: (permission: string) => boolean
  employeeId?: string | null
  onViewDetails: (id: string) => void
  onEdit: (requisition: JobRequisition) => void
}

/**
 * Factory function defining data table column schema for job requisitions.
 */
export function getRequisitionsColumns({
  hasPermission,
  employeeId,
  onViewDetails,
  onEdit,
}: RequisitionsColumnsOptions): DataTableColumn<JobRequisition>[] {
  return [
      {
        id: "code",
        header: "Mã YC",
        width: getTableColWidthPx("CODE"),
        minWidth: getTableColWidthPx("CODE"),
        sticky: true,
        cell: (requisition) => (
          <button
            onClick={() => {
              routerNavigate(`/recruitment/requisitions/${requisition.id}/overview`)
            }}
            className={cn(
              TYPOGRAPHY.CELL_CODE,
              "text-primary hover:underline focus-visible:outline-none text-left",
            )}
          >
            {requisition.code}
          </button>
        ),
      },
      {
        id: "title",
        header: "Vị trí tuyển",
        width: getTableColWidthPx("TITLE"),
        minWidth: getTableColWidthPx("TITLE"),
        sticky: true,
        cell: (requisition) => (
          <div className="min-w-0 max-w-[240px]">
            <button
              onClick={() => {
                routerNavigate(`/recruitment/requisitions/${requisition.id}/overview`)
              }}
              className={cn(
                TYPOGRAPHY.CELL_PRIMARY,
                "text-left hover:text-primary hover:underline transition-colors focus-visible:outline-none block truncate w-full",
              )}
              title={requisition.title}
            >
              {requisition.title}
            </button>
            <div className={cn(TYPOGRAPHY.CELL_SECONDARY, "mt-1 flex items-center gap-1.5")}>
              <span className="truncate">{requisition.department || "Chưa có phòng ban"}</span>
              {requisition.positionLevel && (
                <>
                  <span aria-hidden className="shrink-0">
                    •
                  </span>
                  <span className="shrink-0">{requisition.positionLevel}</span>
                </>
              )}
              <Badge
                variant={priorityVariantMap[requisition.priority]}
                className="rounded-full px-2 py-0 text-[10px] shrink-0"
              >
                {REQUISITION_PRIORITY_LABELS[requisition.priority]}
              </Badge>
            </div>
          </div>
        ),
      },
      {
        id: "salary",
        header: "Ngân sách",
        width: getTableColWidthPx("SCHEDULE"),
        minWidth: getTableColWidthPx("SCHEDULE"),
        hideBelow: "lg",
        cell: (requisition) => (
          <span className={TYPOGRAPHY.CELL_CURRENCY}>{formatCurrencyRange(requisition)}</span>
        ),
      },
      {
        id: "targetHireDate",
        header: "Hạn tuyển",
        width: getTableColWidthPx("DATE"),
        minWidth: getTableColWidthPx("DATE"),
        hideBelow: "xl",
        cell: (requisition) => (
          <span className={TYPOGRAPHY.CELL_DATE}>{formatDate(requisition.targetHireDate)}</span>
        ),
      },
      {
        id: "approver",
        header: "Người duyệt",
        width: getTableColWidthPx("EMPLOYEE"),
        minWidth: getTableColWidthPx("EMPLOYEE"),
        hideBelow: "md",
        cell: (requisition) => (
          <div className="min-w-0 truncate">
            <p className={TYPOGRAPHY.CELL_PRIMARY}>
              {requisition.approver?.fullName ?? "Chưa chỉ định"}
            </p>
            <p className={TYPOGRAPHY.CELL_SECONDARY}>{requisition.approver?.position ?? ""}</p>
          </div>
        ),
      },
      {
        id: "status",
        header: "Trạng thái",
        width: getTableColWidthPx("STATUS"),
        minWidth: getTableColWidthPx("STATUS"),
        cell: (requisition) => (
          <StatusPill
            label={REQUISITION_STATUS_LABELS[requisition.status]}
            variant={statusVariantMap[requisition.status]}
          />
        ),
      },
      {
        id: "actions",
        header: "",
        width: getTableColWidthPx("ACTIONS"),
        minWidth: getTableColWidthPx("ACTIONS"),
        align: "right",
        cell: (requisition) => (
          <RequisitionRowActions
            requisition={requisition}
            canCreateJd={hasPermission("recruitment.jd.create")}
            canSubmit={hasPermission("recruitment.update") && Boolean(requisition.approverId)}
            canApprove={
              hasPermission("recruitment.requisition.approve") &&
              Boolean(requisition.approverId) &&
              requisition.approverId === employeeId
            }
            canEdit={
              hasPermission("recruitment.update") &&
              (requisition.status === "draft" || requisition.status === "pending_approval")
            }
            onViewDetails={onViewDetails}
            onEdit={onEdit}
          />
        ),
      },
    ]
}
