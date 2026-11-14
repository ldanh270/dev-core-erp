import { StatusPill } from "@/components/common/status-pill"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { POSTING_CHANNELS } from "@/config/entities/recruitment.config"
import type { JobPosting, RecruitmentFormField } from "@/types/recruitment.types"

import { useState } from "react"

import {
  Briefcase,
  Building2,
  Calendar,
  Check,
  Clock,
  Copy,
  ExternalLink,
  FileText,
  Globe,
  Hash,
  Layers,
  Link2,
  UserCheck,
  Users,
  Wallet,
} from "lucide-react"
import { toast } from "sonner"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  posting: JobPosting | null
}

const channelLabel = (value: string) =>
  POSTING_CHANNELS.find((item) => item.value === value)?.label ?? value

const formatCurrency = (amount: number | null | undefined) => {
  if (amount == null) return null
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount)
}

const formatEmploymentType = (type?: string) => {
  switch (type) {
    case "full_time":
      return "Toàn thời gian"
    case "part_time":
      return "Bán thời gian"
    case "contractor":
      return "Hợp đồng"
    case "intern":
      return "Thực tập"
    default:
      return type ?? "—"
  }
}

export function ViewJobPostingDialog({ open, onOpenChange, posting }: Props) {
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)

  if (!posting) return null

  const isGoogleForm = posting.channel === "google_form"
  const requisition = posting.requisition

  const salaryDisplay =
    requisition?.salaryMin || requisition?.salaryMax
      ? `${formatCurrency(requisition.salaryMin) ?? "0 ₫"} - ${formatCurrency(requisition.salaryMax) ?? "Thỏa thuận"}`
      : "Thỏa thuận"

  const handleCopy = (text: string, type: "link" | "code") => {
    void navigator.clipboard.writeText(text)
    if (type === "link") {
      setCopiedLink(true)
      toast.success("Đã sao chép đường dẫn ứng tuyển!")
      setTimeout(() => {
        setCopiedLink(false)
      }, 2000)
    } else {
      setCopiedCode(true)
      toast.success("Đã sao chép mã nguồn!")
      setTimeout(() => {
        setCopiedCode(false)
      }, 2000)
    }
  }

  const fields: RecruitmentFormField[] = posting.fields ?? [
    { key: "full_name", label: "Họ và tên", type: "short_text", required: true },
    { key: "email", label: "Email", type: "short_text", required: true },
    { key: "phone", label: "Số điện thoại", type: "short_text", required: false },
    { key: "cv_url", label: "Đường dẫn CV", type: "short_text", required: false },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl rounded-2xl border-border bg-background p-6">
        <DialogHeader className="space-y-3 pb-2 border-b border-border">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className="rounded-full px-3 py-1 bg-primary/10 text-primary border-primary/20 text-xs font-semibold"
              >
                <Globe className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                {channelLabel(posting.channel)}
              </Badge>
              <StatusPill
                label={
                  posting.status === "open"
                    ? "Đang mở"
                    : posting.status === "closed"
                      ? "Đã đóng"
                      : "Nháp"
                }
                variant={
                  posting.status === "open"
                    ? "success"
                    : posting.status === "closed"
                      ? "danger"
                      : "neutral"
                }
              />
            </div>
            {isGoogleForm && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span>Kết nối:</span>
                {posting.connectorStatus === "ready" ? (
                  <StatusPill label="Sẵn sàng" variant="success" />
                ) : posting.connectorStatus === "error" ? (
                  <StatusPill label="Lỗi kết nối" variant="danger" />
                ) : (
                  <StatusPill label="Chưa cấu hình" variant="warning" />
                )}
              </div>
            )}
          </div>

          <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary shrink-0" />
            Chi tiết Bài đăng tuyển dụng
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-5 py-2">
          {/* Section 1: Requisition Overview */}
          <div className="rounded-xl bg-card p-4 border border-border space-y-3 shadow-xs">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Vị trí tuyển dụng
                </span>
                <h3 className="text-lg font-bold text-foreground mt-0.5">
                  {requisition?.title ?? "Chưa rõ vị trí"}
                </h3>
              </div>
              {requisition?.code && (
                <Badge
                  variant="outline"
                  className="rounded-full font-mono text-xs border-primary/30 text-primary bg-primary/5 font-semibold"
                >
                  {requisition.code}
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-border/60 text-xs">
              <div className="space-y-1">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground" /> Phòng ban
                </span>
                <p className="font-semibold text-foreground">{requisition?.department || "—"}</p>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Layers className="h-3.5 w-3.5 text-muted-foreground" /> Cấp bậc
                </span>
                <p className="font-semibold text-foreground">{requisition?.positionLevel || "—"}</p>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" /> Hình thức
                </span>
                <p className="font-semibold text-foreground">
                  {formatEmploymentType(requisition?.employmentType)}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Wallet className="h-3.5 w-3.5 text-muted-foreground" /> Mức lương
                </span>
                <p className="font-semibold text-primary">{salaryDisplay}</p>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" /> Số lượng tuyển
                </span>
                <p className="font-semibold text-foreground">
                  {requisition?.headcount ?? 1} ứng viên
                </p>
              </div>
              {requisition?.requestedBy?.fullName && (
                <div className="space-y-1">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <UserCheck className="h-3.5 w-3.5 text-muted-foreground" /> Người tạo
                  </span>
                  <p className="font-semibold text-foreground">
                    {requisition.requestedBy.fullName}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Public Link Action Banner */}
          {posting.postingUrl ? (
            <div className="rounded-xl border border-primary/25 bg-primary/5 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4 text-primary shrink-0" />
                <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Đường dẫn ứng tuyển công khai (Google Form)
                </span>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-background rounded-lg p-3 border border-border">
                <span className="text-xs font-mono text-primary break-all line-clamp-2">
                  {posting.postingUrl}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      handleCopy(posting.postingUrl ?? "", "link")
                    }}
                    className="rounded-full text-xs gap-1.5 h-8 border-border"
                  >
                    {copiedLink ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    {copiedLink ? "Đã chép" : "Sao chép"}
                  </Button>
                  <a href={posting.postingUrl} target="_blank" rel="noreferrer">
                    <Button size="sm" className="rounded-full text-xs gap-1.5 h-8">
                      <ExternalLink className="h-3.5 w-3.5" />
                      Mở form
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-800 dark:text-amber-300">
              <p className="font-semibold">Chưa phát hành đường dẫn công khai</p>
              <p className="mt-0.5 text-amber-700/80 dark:text-amber-400/80">
                Nhấn nút <strong>Public</strong> ở trang danh sách bài đăng để tự động tạo Google
                Form và phát hành link cho ứng viên.
              </p>
            </div>
          )}

          {/* Section 3: Connector Details & Source Code */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl bg-card p-3.5 border border-border space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground block">
                Mã nguồn (Source Code)
              </span>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs font-mono font-medium text-foreground truncate">
                  <Hash className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="truncate">{posting.sourceCode}</span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    handleCopy(posting.sourceCode, "code")
                  }}
                  className="h-7 w-7 p-0 rounded-full shrink-0"
                  title="Sao chép Mã nguồn"
                >
                  {copiedCode ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            <div className="rounded-xl bg-card p-3.5 border border-border space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground block">
                Mã biểu mẫu Google (External Form ID)
              </span>
              <p className="text-xs font-mono font-semibold text-foreground truncate">
                {posting.sourceCode.replace(/^GFORM_/, "") || "—"}
              </p>
            </div>
          </div>

          {/* Section 4: Configured Form Fields */}
          <div className="rounded-xl bg-card p-4 border border-border space-y-2.5">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary shrink-0" />
              <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                Các trường thu thập thông tin ({fields.length})
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {fields.map((field) => (
                <div
                  key={field.key}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-muted/30 text-xs font-medium text-foreground"
                >
                  <span>{field.label}</span>
                  {field.required && <span className="text-destructive font-bold">*</span>}
                  <span className="text-[10px] text-muted-foreground bg-background px-1.5 py-0.5 rounded-full border border-border">
                    {field.type === "paragraph" ? "Đoạn văn" : "Văn bản ngắn"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 5: Timestamps */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground pt-3 border-t border-border">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              <span>
                Ngày tạo:{" "}
                <strong>
                  {posting.createdAt
                    ? new Date(posting.createdAt).toLocaleDateString("vi-VN")
                    : "—"}
                </strong>
              </span>
            </div>
            {posting.publishedAt && (
              <div className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-500" />
                <span>
                  Phát hành:{" "}
                  <strong>{new Date(posting.publishedAt).toLocaleDateString("vi-VN")}</strong>
                </span>
              </div>
            )}
            {posting.lastSyncedAt && (
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-primary" />
                <span>
                  Đồng bộ gần nhất:{" "}
                  <strong>{new Date(posting.lastSyncedAt).toLocaleString("vi-VN")}</strong>
                </span>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button
            variant="outline"
            className="rounded-full border-border text-foreground hover:bg-muted"
            onClick={() => {
              onOpenChange(false)
            }}
          >
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
