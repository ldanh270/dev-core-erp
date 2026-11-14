import { AppDrawer } from "@/components/common"
import { SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { useActivityLog } from "@/hooks/security/queries/use-security-query"
import { cn } from "@/lib/utils"

import { FileText, Loader2 } from "lucide-react"

interface ActivityLogDetailDrawerProps {
  logId: string | null
  onClose: () => void
  scope?: "all" | "me"
}

export function ActivityLogDetailDrawer({
  logId,
  onClose,
  scope = "all",
}: ActivityLogDetailDrawerProps) {
  const { data: log, isLoading } = useActivityLog(logId || "", scope)

  return (
    <AppDrawer isOpen={!!logId} onClose={onClose}>
      <div className="flex flex-col h-full overflow-y-auto px-6 pt-16 pb-8">
        <SheetTitle className="sr-only">Chi tiết nhật ký hoạt động</SheetTitle>
        <SheetDescription className="sr-only">
          Xem thông tin chi tiết của bản ghi nhật ký hoạt động đã chọn.
        </SheetDescription>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
            <p className="text-sm text-muted-foreground">Đang tải chi tiết...</p>
          </div>
        ) : log ? (
          <div className="space-y-6">
            {/* Header Info */}
            <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/30 border border-border/50">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <FileText size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-foreground leading-tight truncate">
                  {log.actionType}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  ID: <span className="font-mono">{log.id}</span>
                </p>
              </div>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 gap-4 px-1">
              <DetailItem label="Danh mục" value={log.category} />
              <DetailItem label="Nhân viên" value={log.employeeName || "Hệ thống"} />
              <DetailItem label="Địa chỉ IP" value={log.ipAddress || "Không rõ"} />
              <DetailItem
                label="Thời gian"
                value={new Date(log.createdAt).toLocaleString("vi-VN", {
                  dateStyle: "full",
                  timeStyle: "medium",
                })}
              />
            </div>

            {/* Structured Details */}
            <div className="space-y-3 pt-4 border-t border-border">
              <h4 className="text-sm font-bold text-foreground px-1">Thông tin chi tiết</h4>
              <div className="rounded-xl bg-slate-950 p-4 font-mono text-xs overflow-x-auto border border-slate-800">
                <pre className="text-emerald-400">
                  {(() => {
                    if (!log.details) return "Không có dữ liệu mở rộng."
                    if (typeof log.details === "string") {
                      try {
                        return JSON.stringify(JSON.parse(log.details), null, 2)
                      } catch {
                        return log.details
                      }
                    }
                    return JSON.stringify(log.details, null, 2)
                  })()}
                </pre>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-20 text-center text-muted-foreground">
            Không tìm thấy thông tin nhật ký.
          </div>
        )}
      </div>
    </AppDrawer>
  )
}

function DetailItem({
  label,
  value,
  className,
}: {
  label: string
  value: string
  className?: string
}) {
  return (
    <div className={cn("flex flex-col space-y-1", className)}>
      <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  )
}
