import { useMemo, useState } from "react"
import { Check, Eye, FilePlus2, FileSearch, Filter, Pencil, Plus, RotateCcw, Send, X } from "lucide-react"
import { AppPagination, DataTableToolbar, EmptyState, PageCard, PageHeader } from "@/components/common"
import { StatusPill } from "@/components/common/status-pill"
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
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  REQUISITION_PRIORITY,
  REQUISITION_PRIORITY_LABELS,
  REQUISITION_STATUS,
  REQUISITION_STATUS_LABELS,
} from "@/config/entities/recruitment.config"
import { useApproveRequisition, useRequisitions, useSubmitRequisitionForApproval } from "@/hooks/recruitment/use-recruitment-queries"
import { usePermission } from "@/hooks/use-permission"
import { usePersonalEmployeeId } from "@/hooks/attendance/use-personal-employee-id"
import { routerNavigate } from "@/lib/router-navigator"
import type { JobRequisition } from "@/types/recruitment.types"

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

interface TabDefinition {
  id: string
  label: string
}

const TAB_DEFINITIONS: TabDefinition[] = [
  { id: "all", label: "Tất cả" },
  { id: REQUISITION_STATUS.DRAFT, label: REQUISITION_STATUS_LABELS[REQUISITION_STATUS.DRAFT] },
  { id: REQUISITION_STATUS.PENDING_APPROVAL, label: REQUISITION_STATUS_LABELS[REQUISITION_STATUS.PENDING_APPROVAL] },
  { id: REQUISITION_STATUS.APPROVED, label: REQUISITION_STATUS_LABELS[REQUISITION_STATUS.APPROVED] },
  { id: REQUISITION_STATUS.REJECTED, label: REQUISITION_STATUS_LABELS[REQUISITION_STATUS.REJECTED] },
  { id: REQUISITION_STATUS.CLOSED, label: REQUISITION_STATUS_LABELS[REQUISITION_STATUS.CLOSED] },
  { id: REQUISITION_STATUS.FILLED, label: REQUISITION_STATUS_LABELS[REQUISITION_STATUS.FILLED] },
]

function formatCurrencyRange(requisition: JobRequisition) {
  const format = (value: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value)
  if (requisition.salaryMin && requisition.salaryMax) return `${format(requisition.salaryMin)} – ${format(requisition.salaryMax)}`
  return requisition.salaryMin ? `Từ ${format(requisition.salaryMin)}` : "Chưa xác định"
}

function formatDate(value?: string | null) {
  return value ? new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value)) : "—"
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

  // Fetch requisition list
  const { data, isLoading } = useRequisitions({ page: 1, pageSize: 100 })
  const allRequisitions = useMemo(() => data?.data ?? [], [data?.data])

  // Count items per tab status
  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allRequisitions.length }
    for (const req of allRequisitions) {
      counts[req.status] = (counts[req.status] || 0) + 1
    }
    return counts
  }, [allRequisitions])

  // Filter list by tab status, priority dropdown & search keyword
  const filteredRequisitions = useMemo(() => {
    return allRequisitions.filter((req) => {
      // Filter by active status tab
      if (activeTab !== "all" && req.status !== activeTab) {
        return false
      }
      // Filter by priority
      if (priorityFilter !== "all" && req.priority !== priorityFilter) {
        return false
      }
      // Filter by keyword
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

  // Pagination on client-side filtered data
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

  return (
    <TooltipProvider delayDuration={150}>
      <div className="container flex flex-col gap-6 px-3 py-4 sm:px-6 sm:py-6">
        <PageHeader
          title="Yêu cầu tuyển dụng"
          description="Theo dõi nhu cầu tuyển dụng, người duyệt và tiến độ mở vị trí."
          actions={
            hasPermission("recruitment.create") ? (
              <Button onClick={() => { setIsCreateOpen(true); }} className="rounded-full">
                <Plus className="mr-2 h-4 w-4" />
                Tạo yêu cầu mới
              </Button>
            ) : undefined
          }
        />

        <PageCard padding="sm" className="p-0 overflow-hidden" noBorder={false}>
          {/* ── Status Tab Navigation (Style matching /hrm/employees) ── */}
          <nav
            aria-label="Lọc yêu cầu tuyển dụng theo trạng thái"
            className="flex items-center gap-6 overflow-x-auto border-b border-border px-6 hide-scrollbar bg-background"
          >
            {TAB_DEFINITIONS.map((tab) => {
              const isActive = activeTab === tab.id
              const count = tabCounts[tab.id] || 0
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id)
                    setPage(1)
                  }}
                  className={`relative flex items-center gap-2 py-4 font-medium text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${
                    isActive ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                  <span
                    className={`inline-flex items-center justify-center min-w-[20px] h-[20px] rounded-full text-[11px] font-bold px-1.5 border ${
                      isActive
                        ? "bg-primary border-primary text-primary-foreground"
                        : "bg-background border-border text-muted-foreground"
                    }`}
                  >
                    {count}
                  </span>
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-t-full" />
                  )}
                </button>
              )
            })}
          </nav>

          {/* ── Filter Toolbar ── */}
          <DataTableToolbar
            searchQuery={keyword}
            onSearchChange={(value) => {
              setKeyword(value)
              setPage(1)
            }}
            searchPlaceholder="Tìm theo mã, vị trí, phòng ban, người duyệt..."
            actions={
              <div className="flex items-center gap-2">
                {/* Priority Select */}
                <div className="flex items-center gap-2">
                  <Filter className="h-3.5 w-3.5 text-muted-foreground hidden sm:block" />
                  <Select
                    value={priorityFilter}
                    onValueChange={(val) => {
                      setPriorityFilter(val)
                      setPage(1)
                    }}
                  >
                    <SelectTrigger size="sm" className="w-[170px] bg-background">
                      <SelectValue placeholder="Độ ưu tiên" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả độ ưu tiên</SelectItem>
                      <SelectItem value={REQUISITION_PRIORITY.URGENT}>Khẩn cấp</SelectItem>
                      <SelectItem value={REQUISITION_PRIORITY.HIGH}>Cao</SelectItem>
                      <SelectItem value={REQUISITION_PRIORITY.MEDIUM}>Trung bình</SelectItem>
                      <SelectItem value={REQUISITION_PRIORITY.LOW}>Thấp</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Reset Filter Button */}
                {hasActiveFilters && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleResetFilters}
                        className="h-9 px-3 text-xs gap-1.5 rounded-full text-muted-foreground hover:text-foreground"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Xóa lọc
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Đặt lại tất cả bộ lọc</TooltipContent>
                  </Tooltip>
                )}
              </div>
            }
          />

          {/* ── Table View ── */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="w-28 px-4 py-3 text-xs font-medium uppercase text-muted-foreground">Mã</TableHead>
                  <TableHead className="min-w-56 px-4 py-3 text-xs font-medium uppercase text-muted-foreground">Vị trí tuyển</TableHead>
                  <TableHead className="hidden lg:table-cell w-44 px-4 py-3 text-xs font-medium uppercase text-muted-foreground">Ngân sách</TableHead>
                  <TableHead className="hidden xl:table-cell w-36 px-4 py-3 text-xs font-medium uppercase text-muted-foreground">Hạn tuyển</TableHead>
                  <TableHead className="hidden md:table-cell w-44 px-4 py-3 text-xs font-medium uppercase text-muted-foreground">Người duyệt</TableHead>
                  <TableHead className="w-36 px-4 py-3 text-xs font-medium uppercase text-muted-foreground">Trạng thái</TableHead>
                  <TableHead className="w-36 px-4 py-3 text-right text-xs font-medium uppercase text-muted-foreground">
                    Thao tác
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell colSpan={7} className="p-3">
                        <Skeleton className="h-12 w-full rounded-lg" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : paginatedRequisitions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="p-8">
                      <EmptyState
                        icon={FileSearch}
                        title={hasActiveFilters ? "Không tìm thấy yêu cầu phù hợp" : "Chưa có yêu cầu tuyển dụng nào"}
                        description={
                          hasActiveFilters
                            ? "Không có yêu cầu tuyển dụng nào khớp với bộ lọc hoặc từ khóa tìm kiếm."
                            : "Hiện tại chưa có yêu cầu tuyển dụng nào được tạo. Hãy bấm 'Tạo yêu cầu mới' để bắt đầu."
                        }
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedRequisitions.map((requisition) => (
                    <RequisitionRow
                      key={requisition.id}
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
                      onViewDetails={(id) => routerNavigate(`/recruitment/requisitions/${id}/overview`)}
                      onEdit={(req) => {
                        setSelectedRequisition(req)
                        setIsEditOpen(true)
                      }}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <AppPagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={totalItems}
            itemsPerPage={pageSize}
            onItemsPerPageChange={(value) => {
              setPageSize(value)
              setPage(1)
            }}
          />
        </PageCard>

        {/* Dialog create / edit */}
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

        {/* Slide-out Drawer view details */}
        <RequisitionDetailsDrawer
          requisitionId={viewingRequisitionId}
          onClose={() => { setViewingRequisitionId(null); }}
          onEdit={(req) => {
            setSelectedRequisition(req)
            setIsEditOpen(true)
          }}
        />
      </div>
    </TooltipProvider>
  )
}

function RequisitionRow({
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
    <TableRow
      onClick={() => { onViewDetails(requisition.id); }}
      className="cursor-pointer transition-colors duration-100 hover:bg-muted/25"
    >
      {/* Code */}
      <TableCell className="px-4 py-3 font-mono text-xs font-medium text-primary">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onViewDetails(requisition.id)
          }}
          className="hover:underline focus-visible:outline-none focus-visible:underline text-left"
        >
          {requisition.code}
        </button>
      </TableCell>

      {/* Position Title & Department */}
      <TableCell className="px-4 py-3">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onViewDetails(requisition.id)
          }}
          className="font-medium text-foreground text-left hover:text-primary hover:underline transition-colors focus-visible:outline-none"
        >
          {requisition.title}
        </button>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>{requisition.department || "Chưa có phòng ban"}</span>
          {requisition.positionLevel && (
            <>
              <span aria-hidden>•</span>
              <span>{requisition.positionLevel}</span>
            </>
          )}
          <Badge variant={priorityVariantMap[requisition.priority]} className="rounded-full px-2 py-0 text-[11px]">
            {REQUISITION_PRIORITY_LABELS[requisition.priority]}
          </Badge>
        </div>
      </TableCell>

      {/* Salary Budget */}
      <TableCell className="hidden lg:table-cell px-4 py-3 text-sm">
        {formatCurrencyRange(requisition)}
      </TableCell>

      {/* Target Hire Date */}
      <TableCell className="hidden xl:table-cell px-4 py-3 text-sm text-muted-foreground">
        {formatDate(requisition.targetHireDate)}
      </TableCell>

      {/* Approver */}
      <TableCell className="hidden md:table-cell px-4 py-3">
        <p className="text-sm font-medium">{requisition.approver?.fullName ?? "Chưa chỉ định"}</p>
        <p className="text-xs text-muted-foreground">{requisition.approver?.position ?? ""}</p>
      </TableCell>

      {/* Status */}
      <TableCell className="px-4 py-3">
        <StatusPill
          label={REQUISITION_STATUS_LABELS[requisition.status]}
          variant={statusVariantMap[requisition.status]}
        />
      </TableCell>

      {/* Actions */}
      <TableCell className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-end gap-1">
          {/* View Details */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full hover:bg-muted hover:text-foreground"
                aria-label={`Xem chi tiết ${requisition.code}`}
                onClick={() => { onViewDetails(requisition.id); }}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Xem chi tiết</TooltipContent>
          </Tooltip>

          {/* Edit */}
          {canEdit && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full hover:text-primary hover:bg-primary/10"
                  aria-label={`Sửa ${requisition.code}`}
                  onClick={() => { onEdit(requisition); }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Chỉnh sửa yêu cầu</TooltipContent>
            </Tooltip>
          )}

          {/* Submit */}
          {canSubmit && requisition.status === "draft" && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full hover:text-primary hover:bg-primary/10"
                  aria-label={`Gửi duyệt ${requisition.code}`}
                  onClick={() => { submit.mutate(requisition.id); }}
                  disabled={submit.isPending}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Gửi phê duyệt</TooltipContent>
            </Tooltip>
          )}

          {/* Approve */}
          {canApprove && requisition.status === "pending_approval" && (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full text-success hover:text-success hover:bg-success/10"
                    aria-label={`Duyệt ${requisition.code}`}
                    onClick={() => { approve.mutate({ id: requisition.id, data: { approved: true } }); }}
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
                    className="rounded-full text-destructive hover:text-destructive hover:bg-destructive/10"
                    aria-label={`Từ chối ${requisition.code}`}
                    onClick={() => { setIsRejectOpen(true); }}
                    disabled={approve.isPending}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Từ chối yêu cầu</TooltipContent>
              </Tooltip>
            </>
          )}

          {/* Create JD */}
          {canCreateJd && requisition.status === "approved" && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full hover:text-primary hover:bg-primary/10"
                  aria-label={`Tạo bài đăng từ ${requisition.code}`}
                  onClick={() => routerNavigate(`/recruitment/requisitions/${requisition.id}/postings?createPosting=1`)}
                >
                  <FilePlus2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Tạo bài đăng tuyển dụng</TooltipContent>
            </Tooltip>
          )}
        </div>
      </TableCell>
    </TableRow>
    <RejectRequisitionDialog requisitionCode={requisition.code} open={isRejectOpen} pending={approve.isPending} onOpenChange={setIsRejectOpen} onConfirm={(comment) => { approve.mutate({ id: requisition.id, data: { approved: false, comment } }, { onSuccess: () => { setIsRejectOpen(false); } }); }} />
    </>
  )
}
