import {
  DataTablePage,
  StatusPill,
  type DataTableColumn,
} from "@/components/common"
import { CreateRequisitionDialog } from "@/components/features/recruitment/create-requisition-dialog"
import { RejectRequisitionDialog } from "@/components/features/recruitment/reject-requisition-dialog"
import { RequisitionDetailsDrawer } from "@/components/features/recruitment/requisition-details-drawer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  REQUISITION_PRIORITY,
  REQUISITION_PRIORITY_LABELS,
  REQUISITION_STATUS,
  REQUISITION_STATUS_LABELS,
} from "@/config/entities/recruitment.config"
import { getTableColWidthPx } from "@/config/table-columns.config"
import { TYPOGRAPHY } from "@/config/typography.config"
import {
  useApproveRequisition,
  useRequisitions,
  useSubmitRequisitionForApproval,
} from "@/hooks/recruitment/use-recruitment-queries"
import { usePersonalEmployeeId } from "@/hooks/attendance/use-personal-employee-id"
import { usePermission } from "@/hooks/use-permission"
import { routerNavigate } from "@/lib/router-navigator"
import { cn } from "@/lib/utils"
import type { JobRequisition } from "@/types/recruitment.types"

import { useMemo, useState } from "react"

import { Check, Eye, FilePlus2, FileSearch, Filter, Pencil, Plus, RotateCcw, Send, X } from "lucide-react"

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

const TAB_DEFINITIONS = [
  { id: "all", label: "Tất cả" },
  { id: REQUISITION_STATUS.DRAFT, label: REQUISITION_STATUS_LABELS[REQUISITION_STATUS.DRAFT] },
  {
    id: REQUISITION_STATUS.PENDING_APPROVAL,
    label: REQUISITION_STATUS_LABELS[REQUISITION_STATUS.PENDING_APPROVAL],
  },
  { id: REQUISITION_STATUS.APPROVED, label: REQUISITION_STATUS_LABELS[REQUISITION_STATUS.APPROVED] },
  { id: REQUISITION_STATUS.REJECTED, label: REQUISITION_STATUS_LABELS[REQUISITION_STATUS.REJECTED] },
  { id: REQUISITION_STATUS.CLOSED, label: REQUISITION_STATUS_LABELS[REQUISITION_STATUS.CLOSED] },
  { id: REQUISITION_STATUS.FILLED, label: REQUISITION_STATUS_LABELS[REQUISITION_STATUS.FILLED] },
]

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

function RequisitionRowActions({
  requisition,
  canCreateJd,
  canSubmit,
  canApprove,
  canEdit,
  onViewDetails,
  onEdit,
}: {
  requisition: JobRequisition
  canCreateJd: boolean
  canSubmit: boolean
  canApprove: boolean
  canEdit: boolean
  onViewDetails: (id: string) => void
  onEdit: (req: JobRequisition) => void
}) {
  const submit = useSubmitRequisitionForApproval()
  const approve = useApproveRequisition()
  const [isRejectOpen, setIsRejectOpen] = useState(false)

  return (
    <>
      <div
        className="flex items-center justify-end gap-1"
        onClick={(e) => { e.stopPropagation(); }}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full hover:bg-muted hover:text-foreground h-8 w-8"
              aria-label={`Xem chi tiết ${requisition.code}`}
              onClick={() => {
                onViewDetails(requisition.id)
              }}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Xem chi tiết</TooltipContent>
        </Tooltip>

        {canEdit && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full hover:text-primary hover:bg-primary/10 h-8 w-8"
                aria-label={`Sửa ${requisition.code}`}
                onClick={() => {
                  onEdit(requisition)
                }}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Chỉnh sửa yêu cầu</TooltipContent>
          </Tooltip>
        )}

        {canSubmit && requisition.status === "draft" && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full hover:text-primary hover:bg-primary/10 h-8 w-8"
                aria-label={`Gửi duyệt ${requisition.code}`}
                onClick={() => {
                  submit.mutate(requisition.id)
                }}
                disabled={submit.isPending}
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Gửi phê duyệt</TooltipContent>
          </Tooltip>
        )}

        {canApprove && requisition.status === "pending_approval" && (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full text-success hover:text-success hover:bg-success/10 h-8 w-8"
                  aria-label={`Duyệt ${requisition.code}`}
                  onClick={() => {
                    approve.mutate({ id: requisition.id, data: { approved: true } })
                  }}
                  disabled={approve.isPending}
                >
                  <Check className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Phê duyệt yêu cầu</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                  aria-label={`Từ chối ${requisition.code}`}
                  onClick={() => {
                    setIsRejectOpen(true)
                  }}
                  disabled={approve.isPending}
                >
                  <X className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Từ chối yêu cầu</TooltipContent>
            </Tooltip>
          </>
        )}

        {canCreateJd && requisition.status === "approved" && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full hover:text-primary hover:bg-primary/10 h-8 w-8"
                aria-label={`Tạo JD cho ${requisition.code}`}
                onClick={() => { routerNavigate(
                    `/recruitment/job-descriptions/create?requisitionId=${requisition.id}`,
                  ); }
                }
              >
                <FilePlus2 className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Tạo mô tả công việc (JD)</TooltipContent>
          </Tooltip>
        )}
      </div>

      <RejectRequisitionDialog
        requisitionCode={requisition.code}
        open={isRejectOpen}
        pending={approve.isPending}
        onOpenChange={setIsRejectOpen}
        onConfirm={(comment) => { approve.mutate(
            { id: requisition.id, data: { approved: false, comment } },
            { onSuccess: () => { setIsRejectOpen(false); } },
          ); }
        }
      />
    </>
  )
}

export default function RequisitionsPage() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [keyword, setKeyword] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedRequisition, setSelectedRequisition] = useState<JobRequisition | null>(null)
  const [viewingRequisitionId, setViewingRequisitionId] = useState<string | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)

  const { hasPermission } = usePermission()
  const employeeId = usePersonalEmployeeId()

  const { data, isLoading } = useRequisitions({ page: 1, pageSize: 100 })
  const allRequisitions = useMemo(() => data?.data ?? [], [data?.data])

  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allRequisitions.length }
    for (const req of allRequisitions) {
      counts[req.status] = (counts[req.status] || 0) + 1
    }
    return counts
  }, [allRequisitions])

  const filteredRequisitions = useMemo(() => {
    return allRequisitions.filter((req) => {
      if (activeTab !== "all" && req.status !== activeTab) return false
      if (priorityFilter !== "all" && req.priority !== priorityFilter) return false

      const normalizedKeyword = keyword.trim().toLowerCase()
      if (normalizedKeyword) {
        const matches = [req.code, req.title, req.department, req.approver?.fullName]
          .filter(Boolean)
          .some((val) => val?.toLowerCase().includes(normalizedKeyword))
        if (!matches) return false
      }
      return true
    })
  }, [allRequisitions, activeTab, priorityFilter, keyword])

  const totalItems = filteredRequisitions.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const paginatedRequisitions = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredRequisitions.slice(start, start + pageSize)
  }, [filteredRequisitions, page, pageSize])

  const hasActiveFilters = activeTab !== "all" || priorityFilter !== "all" || keyword.trim() !== ""

  const handleResetFilters = () => {
    setActiveTab("all")
    setPriorityFilter("all")
    setKeyword("")
    setPage(1)
  }

  const columns: DataTableColumn<JobRequisition>[] = useMemo(
    () => [
      {
        id: "code",
        header: "Mã YC",
        width: getTableColWidthPx("CODE"),
        minWidth: getTableColWidthPx("CODE"),
        sticky: true,
        cell: (requisition) => (
          <button
            onClick={() => { routerNavigate(`/recruitment/requisitions/${requisition.id}/overview`); }}
            className={cn(TYPOGRAPHY.CELL_CODE, "text-primary hover:underline focus-visible:outline-none text-left")}
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
              onClick={() => { routerNavigate(`/recruitment/requisitions/${requisition.id}/overview`); }}
              className={cn(TYPOGRAPHY.CELL_PRIMARY, "text-left hover:text-primary hover:underline transition-colors focus-visible:outline-none block truncate w-full")}
              title={requisition.title}
            >
              {requisition.title}
            </button>
            <div className={cn(TYPOGRAPHY.CELL_SECONDARY, "mt-1 flex items-center gap-1.5")}>
              <span className="truncate">{requisition.department || "Chưa có phòng ban"}</span>
              {requisition.positionLevel && (
                <>
                  <span aria-hidden className="shrink-0">•</span>
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
        width: "180px",
        minWidth: "180px",
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
          <span className={TYPOGRAPHY.CELL_DATE}>
            {formatDate(requisition.targetHireDate)}
          </span>
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
            onViewDetails={(id) => { routerNavigate(`/recruitment/requisitions/${id}/overview`); }}
            onEdit={(req) => {
              setSelectedRequisition(req)
              setIsEditOpen(true)
            }}
          />
        ),
      },
    ],
    [hasPermission, employeeId],
  )

  const tabsConfig = useMemo(
    () => ({
      items: TAB_DEFINITIONS.map((tab) => ({
        id: tab.id,
        label: tab.label,
        count: tabCounts[tab.id] || 0,
      })),
      activeTab,
      onTabChange: (id: string) => {
        setActiveTab(id)
        setPage(1)
      },
    }),
    [activeTab, tabCounts],
  )

  return (
    <>
      <DataTablePage<JobRequisition>
        title="Yêu cầu tuyển dụng"
        description="Theo dõi nhu cầu tuyển dụng, người duyệt và tiến độ mở vị trí."
        variant="viewport"
        data={paginatedRequisitions}
        columns={columns}
        isLoading={isLoading}
        tabs={tabsConfig}
        keyExtractor={(req) => req.id}
        search={{
          value: keyword,
          onSearch: (val: string) => {
            setKeyword(val)
            setPage(1)
          },
          placeholder: "Tìm theo mã, vị trí, phòng ban, người duyệt...",
        }}
        filters={
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-muted-foreground hidden sm:block" />
            <Select
              value={priorityFilter}
              onValueChange={(val) => {
                setPriorityFilter(val)
                setPage(1)
              }}
            >
              <SelectTrigger className="w-[150px] text-sm font-semibold bg-background rounded-full">
                <SelectValue placeholder="Độ ưu tiên" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả ưu tiên</SelectItem>
                <SelectItem value={REQUISITION_PRIORITY.URGENT}>Khẩn cấp</SelectItem>
                <SelectItem value={REQUISITION_PRIORITY.HIGH}>Cao</SelectItem>
                <SelectItem value={REQUISITION_PRIORITY.MEDIUM}>Trung bình</SelectItem>
                <SelectItem value={REQUISITION_PRIORITY.LOW}>Thấp</SelectItem>
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                onClick={handleResetFilters}
                className="h-10 px-4 text-sm font-semibold gap-1.5 rounded-full text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="h-4 w-4" />
                Xóa lọc
              </Button>
            )}
          </div>
        }
        primaryAction={
          hasPermission("recruitment.create") ? (
            <Button onClick={() => { setIsCreateOpen(true); }} className="rounded-full font-semibold">
              <Plus className="mr-2 h-4 w-4" />
              Tạo yêu cầu mới
            </Button>
          ) : undefined
        }
        emptyState={{
          icon: FileSearch,
          title: hasActiveFilters
            ? "Không tìm thấy yêu cầu phù hợp"
            : "Chưa có yêu cầu tuyển dụng nào",
          description: hasActiveFilters
            ? "Không có yêu cầu tuyển dụng nào khớp với bộ lọc hoặc từ khóa tìm kiếm."
            : "Hiện tại chưa có yêu cầu tuyển dụng nào được tạo. Hãy bấm 'Tạo yêu cầu mới' để bắt đầu.",
        }}
        pagination={{
          currentPage: page,
          totalPages,
          totalItems,
          itemsPerPage: pageSize,
          onPageChange: setPage,
          onItemsPerPageChange: (value) => {
            setPageSize(value)
            setPage(1)
          },
        }}
      />

      <CreateRequisitionDialog
        open={isCreateOpen || isEditOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateOpen(false)
            setIsEditOpen(false)
            setSelectedRequisition(null)
          }
        }}
        requisition={selectedRequisition}
      />

      <RequisitionDetailsDrawer
        requisitionId={viewingRequisitionId}
        onClose={() => { setViewingRequisitionId(null); }}
        onEdit={(req) => {
          setSelectedRequisition(req)
          setIsEditOpen(true)
        }}
      />
    </>
  )
}
