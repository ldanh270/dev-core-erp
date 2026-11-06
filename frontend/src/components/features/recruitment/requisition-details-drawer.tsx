import { AppDrawer, StatusPill } from "@/components/common"
import { RejectRequisitionDialog } from "@/components/features/recruitment/reject-requisition-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  REQUISITION_PRIORITY,
  REQUISITION_PRIORITY_LABELS,
  REQUISITION_STATUS_LABELS,
} from "@/config/entities/recruitment.config"
import {
  useApproveRequisition,
  useRequisition,
  useSubmitRequisitionForApproval,
} from "@/hooks/recruitment/use-recruitment-queries"
import { usePersonalEmployeeId } from "@/hooks/attendance/use-personal-employee-id"
import { usePermission } from "@/hooks/use-permission"
import { routerNavigate } from "@/lib/router-navigator"
import type { JobRequisition } from "@/types/recruitment.types"
import {
  Briefcase,
  Building,
  Calendar,
  Check,
  CheckCircle2,
  DollarSign,
  FilePlus2,
  FileText,
  Gift,
  ListChecks,
  Pencil,
  Send,
  UserCheck,
  Users,
  X,
  XCircle,
} from "lucide-react"
import { useState } from "react"

interface RequisitionDetailsDrawerProps {
  /** The unique ID of the requisition to load, or null to close the drawer */
  requisitionId: string | null
  /** Callback triggered to close the details drawer */
  onClose: () => void
  /** Optional callback to open the edit dialog for this requisition */
  onEdit?: (requisition: JobRequisition) => void
}

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

function formatCurrencyRange(salaryMin: number | null, salaryMax: number | null) {
  const format = (value: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value)
  if (salaryMin && salaryMax) return `${format(salaryMin)} – ${format(salaryMax)}`
  return salaryMin ? `Từ ${format(salaryMin)}` : "Chưa xác định"
}

function formatDate(value?: string | null) {
  if (!value) return "Chưa cập nhật"
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value))
}

/**
 * RequisitionDetailsDrawer Component.
 * Slide-out drawer displaying comprehensive details for a specific Job Requisition.
 * Styled matching EmployeeDetailsDrawer in /hrm/employees.
 */
export function RequisitionDetailsDrawer({ requisitionId, onClose, onEdit }: RequisitionDetailsDrawerProps) {
  const { data: requisition, isLoading, error } = useRequisition(requisitionId || "")
  const { hasPermission } = usePermission()
  const employeeId = usePersonalEmployeeId()

  const submitMutation = useSubmitRequisitionForApproval()
  const approveMutation = useApproveRequisition()
  const [isRejectOpen, setIsRejectOpen] = useState(false)

  const canCreateJd = hasPermission("recruitment.jd.create")
  const canSubmit =
    requisition && hasPermission("recruitment.update") && Boolean(requisition.approverId) && requisition.status === "draft"
  const canApprove =
    requisition &&
    hasPermission("recruitment.requisition.approve") &&
    Boolean(requisition.approverId) &&
    requisition.approverId === employeeId &&
    requisition.status === "pending_approval"
  const canEdit =
    requisition &&
    hasPermission("recruitment.update") &&
    (requisition.status === "draft" || requisition.status === "pending_approval")

  return (
    <AppDrawer isOpen={!!requisitionId} onClose={onClose} widthClassName="w-full sm:max-w-[50vw]">
      <TooltipProvider>
        {/* Loading Skeleton */}
        {isLoading && (
          <div className="p-8 space-y-8 animate-in fade-in duration-300 mt-6">
            <div className="space-y-3">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-5 w-40" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-24 w-full col-span-2 rounded-xl" />
            </div>
          </div>
        )}

        {/* Error / Not Found */}
        {!isLoading && (error || (!requisition && requisitionId)) && (
          <div className="p-8 flex flex-col items-center justify-center text-center h-full min-h-[400px]">
            <h2 className="text-lg font-medium text-destructive mb-1">Không tìm thấy thông tin</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Yêu cầu tuyển dụng không tồn tại hoặc đã bị xóa.
            </p>
            <Button onClick={onClose} variant="outline" size="sm" className="rounded-full">
              Đóng
            </Button>
          </div>
        )}

        {/* Main Details View */}
        {!isLoading && requisition && (
          <div className="animate-in fade-in duration-300">
            {/* Header Section */}
            <div className="px-8 pt-14 pb-6 bg-muted/20 border-b border-border">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono bg-background border border-border px-2 py-0.5 rounded text-xs font-semibold text-primary">
                      {requisition.code}
                    </span>
                    <Badge variant={priorityVariantMap[requisition.priority]} className="rounded-full px-2.5 py-0.5 text-xs">
                      {REQUISITION_PRIORITY_LABELS[requisition.priority]}
                    </Badge>
                  </div>
                  <StatusPill
                    label={REQUISITION_STATUS_LABELS[requisition.status]}
                    variant={statusVariantMap[requisition.status]}
                  />
                </div>

                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-foreground">{requisition.title}</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {requisition.department || "Chưa chọn phòng ban"}{" "}
                    {requisition.positionLevel ? `• Cấp bậc: ${requisition.positionLevel}` : ""}
                  </p>
                </div>

                {/* Header Action Buttons */}
                <div className="flex items-center gap-2 pt-2 border-t border-border/50 flex-wrap">
                  {canEdit && onEdit && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full gap-1.5"
                          onClick={() => {
                            onClose()
                            onEdit(requisition)
                          }}
                        >
                          <Pencil size={14} className="text-primary" /> Chỉnh sửa
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Chỉnh sửa thông tin yêu cầu tuyển dụng</TooltipContent>
                    </Tooltip>
                  )}

                  {canSubmit && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="default"
                          size="sm"
                          className="rounded-full gap-1.5"
                          disabled={submitMutation.isPending}
                          onClick={() => { submitMutation.mutate(requisition.id); }}
                        >
                          <Send size={14} /> Gửi phê duyệt
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Gửi yêu cầu này cho người quản lý phê duyệt</TooltipContent>
                    </Tooltip>
                  )}

                  {canApprove && (
                    <>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="default"
                            size="sm"
                            className="rounded-full gap-1.5 bg-success text-success-foreground hover:bg-success/90"
                            disabled={approveMutation.isPending}
                            onClick={() => { approveMutation.mutate({ id: requisition.id, data: { approved: true } }); }}
                          >
                            <Check size={14} /> Chấp nhận
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Phê duyệt yêu cầu tuyển dụng này</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="rounded-full gap-1.5"
                            disabled={approveMutation.isPending}
                            onClick={() => { setIsRejectOpen(true) }}
                          >
                            <X size={14} /> Từ chối
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Từ chối yêu cầu tuyển dụng này</TooltipContent>
                      </Tooltip>
                    </>
                  )}

                  {canCreateJd && requisition.status === "approved" && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full gap-1.5 text-primary border-primary/30 hover:bg-primary/10"
                          onClick={() => {
                            onClose()
                            routerNavigate(`/recruitment/requisitions/${requisition.id}/postings?createPosting=1`)
                          }}
                        >
                          <FilePlus2 size={14} /> Tạo bài đăng tuyển dụng
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Tạo bài đăng tuyển dụng trực tiếp cho yêu cầu này</TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-8 space-y-8">
              {/* Bento Grid Metrics */}
              <section>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Thông tin vị trí & Ngân sách
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="border border-border rounded-xl p-4 bg-card">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Briefcase size={14} />
                      <span className="text-xs font-medium">Vị trí tuyển dụng</span>
                    </div>
                    <div className="text-sm font-semibold text-foreground pl-6">{requisition.title}</div>
                  </div>

                  <div className="border border-border rounded-xl p-4 bg-card">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Building size={14} />
                      <span className="text-xs font-medium">Phòng ban</span>
                    </div>
                    <div className="text-sm font-semibold text-foreground pl-6">{requisition.department || "—"}</div>
                  </div>

                  <div className="border border-border rounded-xl p-4 bg-card">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Users size={14} />
                      <span className="text-xs font-medium">Số lượng cần tuyển</span>
                    </div>
                    <div className="text-sm font-semibold text-foreground pl-6">{requisition.headcount} người</div>
                  </div>

                  <div className="border border-border rounded-xl p-4 bg-card">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <DollarSign size={14} />
                      <span className="text-xs font-medium">Ngân sách dự kiến</span>
                    </div>
                    <div className="text-sm font-semibold text-foreground pl-6">
                      {formatCurrencyRange(requisition.salaryMin, requisition.salaryMax)}
                    </div>
                  </div>
                </div>
              </section>

              {/* Progress & Approver Info */}
              <section>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Tiến độ & Phê duyệt
                </h3>
                <div className="border border-border rounded-xl bg-card overflow-hidden divide-y divide-border">
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 text-muted-foreground">
                      <UserCheck size={16} />
                      <span className="text-xs">Người yêu cầu</span>
                    </div>
                    <span className="text-sm font-medium">{requisition.requestedBy?.fullName ?? "—"}</span>
                  </div>

                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 text-muted-foreground">
                      <UserCheck size={16} />
                      <span className="text-xs">Người phê duyệt</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium block">
                        {requisition.approver?.fullName ?? "Chưa chỉ định"}
                      </span>
                      {requisition.approver?.position && (
                        <span className="text-xs text-muted-foreground">{requisition.approver.position}</span>
                      )}
                    </div>
                  </div>

                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 text-muted-foreground">
                      <Calendar size={16} />
                      <span className="text-xs">Hạn tuyển dụng mong muốn</span>
                    </div>
                    <span className="text-sm font-medium">{formatDate(requisition.targetHireDate)}</span>
                  </div>

                  {requisition.targetCloseDate && (
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-2.5 text-muted-foreground">
                        <Calendar size={16} />
                        <span className="text-xs">Hạn đóng yêu cầu</span>
                      </div>
                      <span className="text-sm font-medium">{formatDate(requisition.targetCloseDate)}</span>
                    </div>
                  )}
                </div>
              </section>

              {/* Approval status notes (if rejected / approved) */}
              {requisition.rejectionReason && (
                <section className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 text-destructive">
                  <div className="flex items-center gap-2 font-semibold text-sm mb-1">
                    <XCircle size={16} /> Lý do từ chối
                  </div>
                  <p className="text-xs leading-relaxed pl-6">{requisition.rejectionReason}</p>
                </section>
              )}

              {requisition.approvedAt && (
                <section className="bg-success/10 border border-success/20 rounded-xl p-4 text-success">
                  <div className="flex items-center gap-2 font-semibold text-sm">
                    <CheckCircle2 size={16} /> Phê duyệt lúc: {formatDate(requisition.approvedAt)}
                    {requisition.approvedBy?.fullName && ` bởi ${requisition.approvedBy.fullName}`}
                  </div>
                </section>
              )}

              {/* Hiring Reason / Description / Requirements / Benefits */}
              {requisition.reason && (
                <section>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                    <FileText size={15} /> Lý do tuyển dụng
                  </h3>
                  <div className="border border-border rounded-xl p-4 bg-card text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                    {requisition.reason}
                  </div>
                </section>
              )}

              {requisition.description && (
                <section>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                    <FileText size={15} /> Mô tả công việc
                  </h3>
                  <div className="border border-border rounded-xl p-4 bg-card text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                    {requisition.description}
                  </div>
                </section>
              )}

              {requisition.requirements && (
                <section>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                    <ListChecks size={15} /> Yêu cầu ứng viên
                  </h3>
                  <div className="border border-border rounded-xl p-4 bg-card text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                    {requisition.requirements}
                  </div>
                </section>
              )}

              {requisition.benefits && (
                <section>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Gift size={15} /> Quyền lợi & Đãi ngộ
                  </h3>
                  <div className="border border-border rounded-xl p-4 bg-card text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                    {requisition.benefits}
                  </div>
                </section>
              )}
            </div>
          </div>
        )}
      </TooltipProvider>
      <RejectRequisitionDialog requisitionCode={requisition?.code ?? ""} open={isRejectOpen} pending={approveMutation.isPending} onOpenChange={setIsRejectOpen} onConfirm={(comment) => { if (requisition) approveMutation.mutate({ id: requisition.id, data: { approved: false, comment } }, { onSuccess: () => { setIsRejectOpen(false); } }); }} />
    </AppDrawer>
  )
}
