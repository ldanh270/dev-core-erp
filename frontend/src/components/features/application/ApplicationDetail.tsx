import { BackButton, PageContainer, StatusPill } from "@/components/common"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { APPLICATION_STATUS } from "@/config/entities/attendance.config"
import type { IApplication } from "@/lib/api/application.api"
import { minutesToTime } from "@/lib/utils"

import { Check, ExternalLink, FileCheck2, Paperclip, X } from "lucide-react"

interface ApplicationDetailProps {
  application: IApplication | null
  isLoading: boolean
  mode: "mine" | "manage" | "all"
  onBack: () => void
  onApprove?: (app: IApplication) => void
  onReject?: (app: IApplication) => void
  onSwapConfirm?: (app: IApplication) => void
  onSwapReject?: (app: IApplication) => void
}

/** Formats an optional timestamp as local hours and minutes. */
function formatTimestamp(value?: string | null): string {
  if (!value) return "—"
  const date = new Date(value)
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`
}

/** Displays the complete detail payload and actions for one application. */
export function ApplicationDetail({
  application,
  isLoading,
  mode,
  onBack,
  onApprove,
  onReject,
  onSwapConfirm,
  onSwapReject,
}: ApplicationDetailProps) {
  if (isLoading || !application) {
    return (
      <PageContainer variant="default" className="space-y-4" aria-label="Đang tải chi tiết đơn">
        <Skeleton className="h-10 w-10 rounded-full" />
        <Skeleton className="h-52 w-full rounded-xl" />
        <Skeleton className="h-72 w-full rounded-xl" />
      </PageContainer>
    )
  }

  const isPending = application.status === APPLICATION_STATUS.PENDING
  const isPartnerPending = application.status === APPLICATION_STATUS.PARTNER_PENDING

  // Render detail fields dynamically based on application type
  const renderDetailTable = () => {
    switch (application.type) {
      case "leave":
        return (
          <>
            <th className="px-4 py-3 font-medium text-muted-foreground text-left whitespace-nowrap">
              Từ ngày
            </th>
            <th className="px-4 py-3 font-medium text-muted-foreground text-left whitespace-nowrap">
              Đến ngày
            </th>
            <th className="px-4 py-3 font-medium text-muted-foreground text-left w-full">Lý do</th>
          </>
        )
      case "forgot_card":
        return (
          <>
            <th className="px-4 py-3 font-medium text-muted-foreground text-left whitespace-nowrap">
              Ngày làm việc
            </th>
            <th className="px-4 py-3 font-medium text-muted-foreground text-left whitespace-nowrap">
              Giờ vào
            </th>
            <th className="px-4 py-3 font-medium text-muted-foreground text-left whitespace-nowrap">
              Giờ ra
            </th>
            <th className="px-4 py-3 font-medium text-muted-foreground text-left w-full">Lý do</th>
          </>
        )
      case "regime":
        return (
          <>
            <th className="px-4 py-3 font-medium text-muted-foreground text-left whitespace-nowrap">
              Loại chế độ
            </th>
            <th className="px-4 py-3 font-medium text-muted-foreground text-left whitespace-nowrap">
              Giờ về muộn/sớm
            </th>
            <th className="px-4 py-3 font-medium text-muted-foreground text-left w-full">Lý do</th>
          </>
        )
      case "recruitment":
        return (
          <>
            <th className="px-4 py-3 font-medium text-muted-foreground text-left whitespace-nowrap">
              Vị trí tuyển
            </th>
            <th className="px-4 py-3 font-medium text-muted-foreground text-left whitespace-nowrap">
              Số lượng
            </th>
            <th className="px-4 py-3 font-medium text-muted-foreground text-left w-full">
              Yêu cầu
            </th>
          </>
        )
      case "overtime":
      case "late_early":
      case "shift_swap":
      case "work_from_home":
      default:
        return (
          <>
            <th className="px-4 py-3 font-medium text-muted-foreground text-left whitespace-nowrap">
              Từ ngày
            </th>
            <th className="px-4 py-3 font-medium text-muted-foreground text-left whitespace-nowrap">
              Đến ngày
            </th>
            <th className="px-4 py-3 font-medium text-muted-foreground text-left w-full">
              Chi tiết / Lý do
            </th>
          </>
        )
    }
  }

  const renderDetailRow = () => {
    switch (application.type) {
      case "leave": {
        return (
          <>
            <td className="px-4 py-4 text-foreground">
              {new Date(application.startDate).toLocaleDateString("vi-VN")}
            </td>
            <td className="px-4 py-4 text-foreground">
              {new Date(application.endDate).toLocaleDateString("vi-VN")}
            </td>
            <td className="px-4 py-4 text-foreground">{application.reason || "-"}</td>
          </>
        )
      }
      case "forgot_card": {
        const fc = application.forgotCardDetail
        const fmtTime = (iso?: string | null) => {
          if (!iso) return "—"
          const d = new Date(iso)
          return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
        }
        return (
          <>
            <td className="px-4 py-4 text-foreground">
              {new Date(application.startDate).toLocaleDateString("vi-VN")}
            </td>
            <td className="px-4 py-4 font-mono text-sm text-foreground">
              {fc?.checkInAt ? fmtTime(fc.checkInAt) : "—"}
            </td>
            <td className="px-4 py-4 font-mono text-sm text-foreground">
              {fc?.checkOutAt ? fmtTime(fc.checkOutAt) : "—"}
            </td>
            <td className="px-4 py-4 text-foreground">{application.reason || "-"}</td>
          </>
        )
      }
      case "regime": {
        const regime = application.regimeDetail
        return (
          <>
            <td className="px-4 py-4 text-foreground whitespace-nowrap">
              <span className="rounded-full bg-primary/10 px-3 py-1 font-semibold text-primary">
                {regime?.regimeCategory?.name || "—"}
              </span>
            </td>
            <td className="px-4 py-4 text-foreground whitespace-nowrap">
              Muộn: {regime?.lateMinutes ?? 0}p / Sớm: {regime?.earlyMinutes ?? 0}p
            </td>
            <td className="px-4 py-4 text-foreground">{application.reason || "-"}</td>
          </>
        )
      }
      case "recruitment": {
        const rec = application.recruitmentDetail
        return (
          <>
            <td className="px-4 py-4 text-foreground font-medium">{rec?.positionName || "—"}</td>
            <td className="px-4 py-4 text-foreground">{rec?.quantity || 1}</td>
            <td
              className="px-4 py-4 text-foreground line-clamp-2 max-w-[200px]"
              title={rec?.requirements || ""}
            >
              {rec?.requirements || "-"}
            </td>
          </>
        )
      }
      default:
        return (
          <>
            <td className="px-4 py-4 text-foreground">
              {new Date(application.startDate).toLocaleDateString("vi-VN")}
            </td>
            <td className="px-4 py-4 text-foreground">
              {new Date(application.endDate).toLocaleDateString("vi-VN")}
            </td>
            <td className="px-4 py-4 text-foreground">{application.reason || "-"}</td>
          </>
        )
    }
  }

  return (
    <PageContainer variant="default" className="space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <BackButton onBack={onBack} />
        </div>

        <div className="flex items-center gap-4">
          {/* Actions for Manager */}
          {mode === "manage" && isPending && (
            <div className="flex items-center gap-3 ml-4 border-l border-border pl-4">
              <Button
                variant="outline"
                size="default"
                onClick={() => {
                  onApprove?.(application)
                }}
                className="rounded-full shadow-xs gap-2 font-semibold"
              >
                <Check size={16} className="text-primary" />
                Duyệt đơn
              </Button>
              <Button
                variant="destructive"
                size="default"
                onClick={() => {
                  onReject?.(application)
                }}
                className="rounded-full shadow-xs gap-2 font-semibold"
              >
                <X size={16} />
                Không duyệt
              </Button>
            </div>
          )}
          {/* Actions for Swap Partner */}
          {mode === "manage" && isPartnerPending && (
            <div className="flex items-center gap-3 ml-4 border-l border-border pl-4">
              <Button
                variant="outline"
                size="default"
                onClick={() => {
                  onSwapConfirm?.(application)
                }}
                className="rounded-full shadow-xs gap-2 font-semibold"
              >
                <Check size={16} className="text-primary" />
                Đồng ý đổi ca
              </Button>
              <Button
                variant="destructive"
                size="default"
                onClick={() => {
                  onSwapReject?.(application)
                }}
                className="rounded-full shadow-xs gap-2 font-semibold"
              >
                <X size={16} />
                Không duyệt đổi ca
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Content Body */}
      <div className="flex-1 space-y-6">
        {/* Section 1: Thông tin đơn */}
        <section className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="px-6 py-4 border-b border-border bg-muted/30">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Thông tin đơn
            </h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-muted-foreground font-medium">Mã đơn</span>
              <span className="text-sm font-semibold text-foreground">
                {application.id.toUpperCase()}
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-muted-foreground font-medium">Ngày tạo</span>
              <span className="text-sm font-semibold text-foreground">
                {new Date(application.createdAt).toLocaleDateString("vi-VN")}
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-muted-foreground font-medium">Người nộp đơn</span>
              <span className="text-sm font-semibold text-primary">
                {application.employeeId.substring(0, 10)} -{" "}
                {application.employee?.fullName || "N/A"}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-muted-foreground text-xs font-medium">Người duyệt</span>
              <span className="text-foreground font-semibold mt-1">
                {application.approvedBy?.fullName ||
                  application.assignedTo?.fullName ||
                  "Chưa phân công"}
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-muted-foreground font-medium">Ngày duyệt</span>
              <span className="text-sm font-semibold text-foreground">
                {application.status !== APPLICATION_STATUS.PENDING &&
                application.status !== APPLICATION_STATUS.CANCELLED
                  ? new Date(application.updatedAt).toLocaleDateString("vi-VN")
                  : "-"}
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-muted-foreground font-medium">Vị trí</span>
              <span className="text-sm font-semibold text-foreground">Nhân viên</span>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-muted-foreground font-medium">Trạng thái</span>
              <div>
                <StatusPill
                  label={
                    application.status === APPLICATION_STATUS.PENDING
                      ? "Đang duyệt"
                      : application.status === APPLICATION_STATUS.PARTNER_PENDING
                        ? "Chờ xác nhận đổi ca"
                        : application.status === APPLICATION_STATUS.APPROVED
                          ? "Đã duyệt"
                          : application.status === APPLICATION_STATUS.REJECTED
                            ? "Không duyệt"
                            : application.status
                  }
                  variant={
                    application.status === APPLICATION_STATUS.APPROVED
                      ? "success"
                      : application.status === APPLICATION_STATUS.REJECTED
                        ? "danger"
                        : application.status === APPLICATION_STATUS.PARTNER_PENDING || application.status === APPLICATION_STATUS.PENDING
                          ? "warning"
                          : "neutral"
                  }
                />
              </div>
            </div>
            {application.status === APPLICATION_STATUS.REJECTED && application.rejectReason && (
              <div className="flex flex-col gap-1.5 md:col-span-2">
                <span className="text-xs text-muted-foreground font-medium">Lý do không duyệt</span>
                <span className="text-sm font-semibold text-foreground break-words whitespace-pre-wrap">
                  {application.rejectReason}
                </span>
              </div>
            )}

            {(application.leaveDetail?.documentUrl ||
              application.forgotCardDetail?.documentUrl ||
              application.regimeDetail?.documentUrl) && (
              <div className="flex flex-col gap-1.5 md:col-span-2">
                <span className="text-xs text-muted-foreground font-medium">Tệp đính kèm</span>
                <a
                  href={
                    application.leaveDetail?.documentUrl ||
                    application.forgotCardDetail?.documentUrl ||
                    application.regimeDetail?.documentUrl ||
                    ""
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-primary hover:underline flex items-center gap-1.5 w-fit"
                >
                  <Paperclip size={14} /> Xem tệp đính kèm
                </a>
              </div>
            )}
          </div>
        </section>

        {/* Section 2: Thời gian */}
        <section className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="px-6 py-4 border-b border-border bg-muted/30 flex justify-between items-center">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Thời gian
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/10 border-b border-border text-xs uppercase tracking-wider">
                <tr>{renderDetailTable()}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr className="hover:bg-muted/30 transition-colors">{renderDetailRow()}</tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 3: Forgot Card Detail */}
        {application.type === "forgot_card" && application.forgotCardDetail && (
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 border-b border-border bg-primary/5 px-6 py-4">
              <FileCheck2 size={15} className="text-primary" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-primary">
                Thông tin quên chấm công
              </h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
              {application.forgotCardDetail.employeeShift?.shift && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs text-muted-foreground font-medium">Ca làm việc</span>
                  <span className="text-sm font-semibold text-foreground">
                    {application.forgotCardDetail.employeeShift.shift.name}
                    {" — "}
                    {minutesToTime(application.forgotCardDetail.employeeShift.shift.startTime)}
                    {"–"}
                    {minutesToTime(application.forgotCardDetail.employeeShift.shift.endTime)}
                  </span>
                </div>
              )}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs text-muted-foreground font-medium">Giờ vào</span>
                <span className="text-sm font-semibold font-mono text-foreground">
                  {formatTimestamp(application.forgotCardDetail.checkInAt)}
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-xs text-muted-foreground font-medium">Giờ ra</span>
                <span className="text-sm font-semibold font-mono text-foreground">
                  {formatTimestamp(application.forgotCardDetail.checkOutAt)}
                </span>
              </div>
              {application.forgotCardDetail.documentUrl && (
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <span className="text-xs text-muted-foreground font-medium">
                    Chứng từ đính kèm
                  </span>
                  <a
                    href={application.forgotCardDetail.documentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                  >
                    <ExternalLink size={13} />
                    Xem tài liệu minh chứng
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  )
}
