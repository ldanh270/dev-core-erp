import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { POSTING_CHANNELS } from "@/config/entities/recruitment.config"
import {
  useCreateJobPosting,
  useOAuthAccounts,
  useRequisitions,
} from "@/hooks/recruitment/use-recruitment-queries"
import type { JobRequisition, RecruitmentFormField } from "@/types/recruitment.types"

import { useEffect, useMemo, useState } from "react"

import { ExternalLink, FileSpreadsheet, KeyRound, ShieldAlert } from "lucide-react"
import { Link } from "react-router-dom"

const DEFAULT_FIELDS: RecruitmentFormField[] = [
  { key: "full_name", label: "Họ và tên", type: "short_text", required: true },
  { key: "email", label: "Email", type: "short_text", required: true },
  { key: "phone", label: "Số điện thoại", type: "short_text", required: false },
  { key: "cv_url", label: "Đường dẫn CV", type: "short_text", required: false },
]

// eslint-disable-next-line security/detect-unsafe-regex
const FIELD_KEY_PATTERN = /^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  jobRequisitions?: JobRequisition[]
  initialRequisitionId?: string
}

function getFieldError(fields: RecruitmentFormField[]): string | null {
  if (fields.some((field) => !field.label.trim())) return "Mỗi field cần có nhãn hiển thị."
  if (fields.some((field) => !FIELD_KEY_PATTERN.test(field.key) || field.key.length > 50)) {
    return "Mã field phải là lower_snake_case và không quá 50 ký tự."
  }
  if (new Set(fields.map((field) => field.key)).size !== fields.length)
    return "Mã field không được trùng nhau."
  return null
}

export function CreateJobPostingDialog({
  open,
  onOpenChange,
  jobRequisitions,
  initialRequisitionId,
}: Props) {
  const create = useCreateJobPosting()
  const { data: reqData, isLoading: isLoadingRequisitions } = useRequisitions({
    status: "approved",
  })
  const { data: oauthAccounts = [], isLoading: isLoadingOAuthAccounts } = useOAuthAccounts()

  const requisitions = useMemo(() => {
    const list = jobRequisitions ?? reqData?.data ?? []
    return list.filter((r) => r.status === "approved" || r.id === initialRequisitionId)
  }, [jobRequisitions, reqData, initialRequisitionId])

  const [requisitionId, setRequisitionId] = useState(initialRequisitionId ?? "")
  const [channel, setChannel] = useState("google_form")
  const [oauthAccountId, setOauthAccountId] = useState<string>("")
  const selectedRequisition = requisitions.find((item) => item.id === requisitionId)
  const fields = selectedRequisition?.candidateFields?.length
    ? selectedRequisition.candidateFields
    : DEFAULT_FIELDS

  const fieldError = useMemo(() => getFieldError(fields), [fields])

  // Filter OAuth accounts for the selected channel
  const filteredOAuthAccounts = useMemo(() => {
    return oauthAccounts.filter((acc) => acc.channel === channel)
  }, [oauthAccounts, channel])

  // Auto-select first OAuth account if available
  useEffect(() => {
    if (filteredOAuthAccounts.length > 0 && !oauthAccountId) {
      setOauthAccountId(filteredOAuthAccounts[0].id)
    }
  }, [filteredOAuthAccounts, oauthAccountId])

  const submit = () => {
    if (!requisitionId || fieldError) return
    create.mutate(
      {
        requisitionId,
        channel,
        oauthAccountId: oauthAccountId || undefined,
      },
      {
        onSuccess: () => {
          onOpenChange(false)
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl rounded-xl border-border bg-background">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary shrink-0" />
            Tạo bài đăng tuyển dụng
          </DialogTitle>
          <DialogDescription>
            Chọn Yêu cầu tuyển dụng, Kênh đăng tuyển và Tài khoản OAuth kết nối để tạo bài đăng tự
            động.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 py-2">
          {/* Requisition Select */}
          <div className="grid gap-2">
            <Label className="text-sm font-medium text-foreground">
              Yêu cầu tuyển dụng (Requisition APPROVED){" "}
              <span className="text-destructive" aria-hidden="true">
                *
              </span>
            </Label>
            {!jobRequisitions && isLoadingRequisitions ? (
              <Skeleton className="h-10 w-full rounded-full" />
            ) : (
              <Select value={requisitionId} onValueChange={setRequisitionId}>
                <SelectTrigger className="h-10 w-full rounded-full border-border bg-background px-4 text-sm">
                  <SelectValue placeholder="Chọn Yêu cầu tuyển dụng..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border">
                  {requisitions.map((req) => (
                    <SelectItem key={req.id} value={req.id}>
                      <span className="font-semibold text-primary">{req.code}</span>
                      <span className="mx-1.5 text-muted-foreground">·</span>
                      <span>{req.title}</span>
                      <span className="mx-1.5 text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground">{req.department}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Channel & OAuth Account Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Channel Select */}
            <div className="grid gap-2">
              <Label className="text-sm font-medium text-foreground">
                Kênh đăng tuyển{" "}
                <span className="text-destructive" aria-hidden="true">
                  *
                </span>
              </Label>
              <Select value={channel} onValueChange={setChannel}>
                <SelectTrigger className="h-10 w-full rounded-full border-border bg-background px-4 text-sm">
                  <SelectValue placeholder="Chọn Kênh đăng tuyển" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border">
                  {POSTING_CHANNELS.map((ch) => (
                    <SelectItem
                      key={ch.value}
                      value={ch.value}
                      disabled={ch.value !== "google_form"}
                    >
                      <div className="flex items-center justify-between w-full gap-2">
                        <span>{ch.label}</span>
                        {ch.value !== "google_form" && (
                          <span className="text-[10px] text-muted-foreground">(Sắp hỗ trợ)</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* OAuth Account Select */}
            <div className="grid gap-2">
              <Label className="text-sm font-medium text-foreground">
                Tài khoản kết nối (OAuth)
              </Label>
              {isLoadingOAuthAccounts ? (
                <Skeleton className="h-10 w-full rounded-full" />
              ) : (
                <Select value={oauthAccountId} onValueChange={setOauthAccountId}>
                  <SelectTrigger className="h-10 w-full rounded-full border-border bg-background px-4 text-sm">
                    <SelectValue
                      placeholder={
                        filteredOAuthAccounts.length > 0
                          ? "Chọn tài khoản kết nối..."
                          : "Chưa kết nối tài khoản"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border">
                    {filteredOAuthAccounts.map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>
                        <div className="flex items-center gap-2">
                          <KeyRound className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span className="font-medium">{acc.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* OAuth Missing Warning Card */}
          {!isLoadingOAuthAccounts &&
            channel === "google_form" &&
            filteredOAuthAccounts.length === 0 && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
                <div className="flex items-start gap-3">
                  <ShieldAlert className="mt-0.5 h-5 w-5 text-amber-600 dark:text-amber-500 shrink-0" />
                  <div>
                    <p className="font-semibold text-amber-800 dark:text-amber-300">
                      Chưa kết nối tài khoản Google Form
                    </p>
                    <p className="text-xs text-amber-700/80 dark:text-amber-400/80 mt-0.5">
                      Bạn cần liên kết ít nhất 1 tài khoản Google OAuth để xuất bản bài đăng trực
                      tiếp.
                    </p>
                  </div>
                </div>
                <Link
                  to="/recruitment/oauth-accounts"
                  onClick={() => {
                    onOpenChange(false)
                  }}
                >
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full border-amber-500/40 text-amber-800 dark:text-amber-200 hover:bg-amber-500/20 text-xs shrink-0 gap-1.5"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Kết nối ngay
                  </Button>
                </Link>
              </div>
            )}

          {/* Info Card */}
          <div className="flex gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">
            <FileSpreadsheet className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div>
              <p className="font-medium text-foreground">Google Forms Integration</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Họ tên và email luôn là trường bắt buộc để khởi tạo hồ sơ ứng viên. Sau khi tạo bài
                đăng, bấm nút <strong>Public</strong> để phát hành Google Form tự động.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-border p-4">
            <p className="text-sm font-semibold">Schema ứng viên từ Yêu cầu tuyển dụng</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Bài đăng sẽ giữ một snapshot riêng khi được tạo.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {fields.map((field) => (
                <span
                  key={field.key}
                  className="rounded-full border border-border px-3 py-1 text-xs"
                >
                  {field.label}
                  {field.required ? " *" : ""}
                </span>
              ))}
            </div>
          </div>
          {fieldError && (
            <p role="alert" className="text-sm text-destructive font-medium">
              {fieldError}
            </p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            className="rounded-full border-border text-foreground hover:bg-muted"
            onClick={() => {
              onOpenChange(false)
            }}
          >
            Hủy
          </Button>
          <Button
            className="rounded-full"
            onClick={submit}
            disabled={!requisitionId || Boolean(fieldError) || create.isPending}
          >
            {create.isPending ? "Đang lưu..." : "Lưu cấu hình"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
