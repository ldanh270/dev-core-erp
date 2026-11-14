import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { EXPORT_STATUS } from "@/config/entities/security.config"
import { useActivityExport } from "@/hooks/security/use-activity-export"
import type { ActivityLogQuery } from "@/types/security.types"

import { Download, FileWarning, Loader2 } from "lucide-react"

interface ExportLogsModalProps {
  isOpen: boolean
  onClose: () => void
  query: ActivityLogQuery
}

export function ExportLogsModal({ isOpen, onClose, query }: ExportLogsModalProps) {
  const { progress, startExport, cancelExport } = useActivityExport(query)

  const handleClose = () => {
    if (
      progress.status === EXPORT_STATUS.FETCHING ||
      progress.status === EXPORT_STATUS.COUNTING ||
      progress.status === EXPORT_STATUS.BUILDING
    ) {
      cancelExport()
    }
    onClose()
  }

  const isExporting =
    progress.status === EXPORT_STATUS.COUNTING ||
    progress.status === EXPORT_STATUS.FETCHING ||
    progress.status === EXPORT_STATUS.BUILDING

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose()
      }}
    >
      <DialogContent className="sm:max-w-[425px]" showCloseButton={!isExporting}>
        <DialogHeader>
          <DialogTitle>Xuất báo cáo nhật ký</DialogTitle>
          <DialogDescription>
            Tải xuống nhật ký hoạt động dưới dạng file CSV theo bộ lọc hiện tại của bạn. Lưu ý: Cần
            chọn từ ngày/đến ngày để xuất dữ liệu.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Default / Idle state */}
          {progress.status === EXPORT_STATUS.IDLE && (
            <div className="flex flex-col gap-4 text-sm text-muted-foreground bg-muted/30 p-4 rounded-xl border border-border">
              <div className="flex justify-between border-b border-border/50 pb-2">
                <span>Từ ngày:</span>
                <span className="font-medium text-foreground">
                  {query.fromDate
                    ? new Date(query.fromDate).toLocaleDateString("vi-VN")
                    : "Chưa chọn"}
                </span>
              </div>
              <div className="flex justify-between border-b border-border/50 pb-2">
                <span>Đến ngày:</span>
                <span className="font-medium text-foreground">
                  {query.toDate ? new Date(query.toDate).toLocaleDateString("vi-VN") : "Chưa chọn"}
                </span>
              </div>
              <div className="flex justify-between border-b border-border/50 pb-2">
                <span>Danh mục:</span>
                <span className="font-medium text-foreground uppercase text-[11px]">
                  {query.category || "Tất cả"}
                </span>
              </div>
            </div>
          )}

          {/* Counting state */}
          {progress.status === EXPORT_STATUS.COUNTING && (
            <div className="flex flex-col items-center justify-center py-6 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium">Đang tính toán số lượng bản ghi...</p>
            </div>
          )}

          {/* Fetching / Progress state */}
          {progress.status === EXPORT_STATUS.FETCHING && (
            <div className="flex flex-col items-center justify-center py-4 gap-4">
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="bg-primary h-full transition-all duration-300"
                  style={{
                    width: `${Math.max(5, (progress.fetchedRows / progress.totalRows) * 100)}%`,
                  }}
                />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-foreground">Đang tải dữ liệu...</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {progress.fetchedRows.toLocaleString()} / {progress.totalRows.toLocaleString()}{" "}
                  dòng
                </p>
              </div>
            </div>
          )}

          {/* Building state */}
          {progress.status === EXPORT_STATUS.BUILDING && (
            <div className="flex flex-col items-center justify-center py-6 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
              <p className="text-sm font-medium text-emerald-600">Đang tạo file CSV...</p>
              <p className="text-xs text-muted-foreground">Quá trình này có thể mất vài giây.</p>
            </div>
          )}

          {/* Error state */}
          {progress.status === EXPORT_STATUS.ERROR && (
            <div className="flex flex-col items-center justify-center py-4 gap-3 text-center">
              <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <FileWarning className="h-6 w-6 text-destructive" />
              </div>
              <p className="text-sm font-medium text-destructive">{progress.errorMsg}</p>
            </div>
          )}

          {/* Success state */}
          {progress.status === EXPORT_STATUS.SUCCESS && (
            <div className="flex flex-col items-center justify-center py-6 gap-3 text-center">
              <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <Download className="h-6 w-6 text-emerald-500" />
              </div>
              <p className="text-sm font-bold text-emerald-600">Đã tải xuống thành công!</p>
            </div>
          )}
        </div>

        <DialogFooter className="sm:justify-end">
          {isExporting ? (
            <Button variant="destructive" onClick={cancelExport}>
              Hủy tải xuống
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose}>
                Đóng
              </Button>
              {progress.status !== EXPORT_STATUS.SUCCESS && (
                <Button
                  onClick={startExport}
                  disabled={!query.fromDate || !query.toDate}
                  className="gap-2"
                >
                  <Download size={14} />
                  {progress.status === EXPORT_STATUS.ERROR ? "Thử lại" : "Xác nhận tải xuống"}
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
