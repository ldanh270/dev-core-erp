import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { taskEstimateAiApi } from "@/lib/api/task-estimate-ai.api"
import type { TaskEstimateAiSuggestion } from "@/lib/api/task-estimate-ai.api"

import { useEffect, useState } from "react"

import {
  AlertTriangle,
  Brain,
  Briefcase,
  Calendar,
  CheckCircle2,
  Loader2,
  Sparkles,
  TrendingUp,
  UserCheck,
  UserPlus,
  XCircle,
} from "lucide-react"
import { toast } from "sonner"

interface TaskAssigneeAiModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  taskId: string
  onAssign: (employeeId: string) => void
}

export function TaskAssigneeAiModal({
  isOpen,
  onOpenChange,
  taskId,
  onAssign,
}: TaskAssigneeAiModalProps) {
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<TaskEstimateAiSuggestion[]>([])

  useEffect(() => {
    if (isOpen && taskId) {
      // eslint-disable-next-line react-hooks/immutability
      void fetchSuggestions()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, taskId])

  const fetchSuggestions = async () => {
    setLoading(true)
    try {
      const data = await taskEstimateAiApi.getSuggestions(taskId)
      setSuggestions(data)
    } catch (err) {
      const error = err as Error
      console.error("Failed to fetch AI suggestions:", error)
      toast.error("Không thể tải gợi ý từ AI. Vui lòng thử lại sau.")
    } finally {
      setLoading(false)
    }
  }

  // Get score color
  const getScoreColor = (score: number) => {
    if (score >= 80)
      return "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900"
    if (score >= 50)
      return "text-amber-500 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900"
    return "text-rose-500 bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900"
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-3xl border-border bg-popover p-6 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10 text-primary animate-pulse">
              <Brain className="h-5 w-5" />
            </div>
            <DialogTitle className="text-xl font-bold flex items-center gap-1.5">
              Gợi ý Phân công Công việc bằng AI
              <Sparkles className="h-4 w-4 text-amber-500 fill-amber-500 animate-bounce" />
            </DialogTitle>
          </div>
          <DialogDescription>
            AI tự động đánh giá chéo kỹ năng lịch sử, khối lượng công việc hiện tại và lịch trình
            nghỉ phép của thành viên trong dự án để đưa ra gợi ý tối ưu nhất.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-1 space-y-4 my-2">
          {loading ? (
            <div className="space-y-4 py-4">
              <div className="flex flex-col items-center justify-center py-6 space-y-3">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <span className="text-sm font-medium text-muted-foreground animate-pulse">
                  AI đang quét dữ liệu dự án và chấm điểm...
                </span>
              </div>
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 border border-border/50 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                    <Skeleton className="h-8 w-12 rounded-lg" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ))}
            </div>
          ) : suggestions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertTriangle className="h-10 w-10 text-amber-500 mb-2" />
              <p className="font-semibold text-foreground">Không tìm thấy thành viên phù hợp</p>
              <p className="text-sm text-muted-foreground max-w-sm mt-1">
                Dự án này hiện chưa có thành viên nào hoạt động hoặc cấu hình phân quyền bị thiếu.
              </p>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              {suggestions.map((suggestion, index) => (
                <div
                  key={suggestion.employeeId}
                  className={`relative p-5 border rounded-2xl transition-all duration-300 hover:shadow-md bg-card/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    index === 0
                      ? "border-primary bg-primary/5 dark:bg-primary/5"
                      : "border-border/60"
                  }`}
                >
                  {index === 0 && (
                    <div className="absolute -top-3 left-4 px-2 py-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center gap-1">
                      <UserCheck className="h-3 w-3" />
                      AI KHUYÊN DÙNG
                    </div>
                  )}

                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-secondary/80 flex items-center justify-center font-bold text-foreground text-sm uppercase">
                        {suggestion.fullName.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground flex items-center gap-1.5">
                          {suggestion.fullName}
                          {suggestion.position && (
                            <Badge
                              variant="outline"
                              className="text-[10px] py-0 px-2 font-normal flex items-center gap-1 border-border rounded-full"
                            >
                              <Briefcase className="h-2.5 w-2.5" />
                              {suggestion.position}
                            </Badge>
                          )}
                        </h4>

                        {/* Sub stats row */}
                        <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1 font-medium">
                            <TrendingUp className="h-3.5 w-3.5" />
                            Khối lượng:{" "}
                            <span
                              className={
                                suggestion.workloadScore >= 80
                                  ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                                  : suggestion.workloadScore >= 50
                                    ? "text-amber-600 dark:text-amber-400 font-semibold"
                                    : "text-rose-600 dark:text-rose-400 font-semibold"
                              }
                            >
                              {suggestion.workloadScore}%
                            </span>
                          </span>
                          <span className="flex items-center gap-1 font-medium">
                            <Calendar className="h-3.5 w-3.5" />
                            Lịch trình:{" "}
                            {suggestion.availabilityScore === 100 ? (
                              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
                                <CheckCircle2 className="h-3 w-3" /> Sẵn sàng
                              </span>
                            ) : (
                              <span className="text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-0.5">
                                <XCircle className="h-3 w-3" /> Bận nghỉ phép
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* AI reasoning list */}
                    <div className="space-y-1 bg-background/50 dark:bg-background/20 p-3 rounded-xl border border-border/40">
                      <div className="text-[11px] font-semibold uppercase text-primary tracking-wider mb-1 flex items-center gap-1">
                        <Brain className="h-3 w-3" /> Nhận định của AI:
                      </div>
                      {suggestion.reasons.map((reason, idx) => (
                        <p
                          key={idx}
                          className="text-xs text-muted-foreground pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-primary"
                        >
                          {reason}
                        </p>
                      ))}
                    </div>
                  </div>

                  {/* Score badge & Assign button */}
                  <div className="flex flex-row sm:flex-col items-center justify-between sm:justify-center gap-3 sm:border-l border-border/40 sm:pl-6 min-w-[120px]">
                    <div className="flex flex-col items-center">
                      <div
                        className={`px-3 py-1 rounded-full border text-xs font-bold ${getScoreColor(suggestion.finalScore)}`}
                      >
                        {suggestion.finalScore}% Khớp
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        onAssign(suggestion.employeeId)
                        onOpenChange(false)
                      }}
                      className="rounded-full gap-1 w-full sm:w-auto"
                      disabled={suggestion.availabilityScore === 0}
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      Chọn
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
