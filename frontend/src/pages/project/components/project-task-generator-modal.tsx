import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { taskEstimateAiApi } from "@/lib/api/task-estimate-ai.api"
import type { GeneratedTaskSuggestion } from "@/lib/api/task-estimate-ai.api"
import { taskApi } from "@/lib/api/task.api"
import type { TaskPriority, TaskTracker } from "@/types/task.types"

import { useEffect, useState } from "react"

import { useQueryClient } from "@tanstack/react-query"
import { AlertTriangle, Brain, Loader2, Plus, Sparkles } from "lucide-react"
import { toast } from "sonner"

interface ProjectTaskGeneratorModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
}

interface EditableSuggestion extends GeneratedTaskSuggestion {
  checked: boolean
  index: number
}

export function ProjectTaskGeneratorModal({
  isOpen,
  onOpenChange,
  projectId,
}: ProjectTaskGeneratorModalProps) {
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [suggestions, setSuggestions] = useState<EditableSuggestion[]>([])
  const queryClient = useQueryClient()

  useEffect(() => {
    if (isOpen && projectId) {
      // eslint-disable-next-line react-hooks/immutability
      void fetchSuggestions()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, projectId])

  const fetchSuggestions = async () => {
    setLoading(true)
    try {
      const data = await taskEstimateAiApi.generateTasks(projectId)
      const mapped = data.map((t, idx) => ({
        ...t,
        checked: true,
        index: idx,
      }))
      setSuggestions(mapped)
    } catch (err) {
      const error = err as Error
      console.error("Failed to generate project tasks:", error)
      toast.error("Không thể sinh công việc tự động. Vui lòng kiểm tra API Key hoặc thử lại sau.")
      onOpenChange(false)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleCheck = (index: number) => {
    setSuggestions((prev) =>
      prev.map((t) => (t.index === index ? { ...t, checked: !t.checked } : t)),
    )
  }

  const handleFieldChange = (
    index: number,
    field: keyof GeneratedTaskSuggestion,
    value: string | number,
  ) => {
    setSuggestions((prev) => prev.map((t) => (t.index === index ? { ...t, [field]: value } : t)))
  }

  const handleCreateTasks = async () => {
    const selected = suggestions.filter((t) => t.checked)
    if (selected.length === 0) {
      toast.error("Vui lòng chọn ít nhất 1 công việc để tạo.")
      return
    }

    setCreating(true)
    try {
      // Create selected tasks sequentially to avoid database race conditions
      for (const t of selected) {
        await taskApi.create({
          projectId,
          title: t.title,
          description: t.description,
          tracker: t.tracker as TaskTracker,
          priority: t.priority as TaskPriority,
          estimatedTime: t.estimatedTime,
        })
      }

      toast.success(`Đã tạo thành công ${selected.length} công việc mới bằng AI!`)
      void queryClient.invalidateQueries({ queryKey: ["tasks"] })
      onOpenChange(false)
    } catch (err) {
      const error = err as Error
      console.error("Failed to create generated tasks:", error)
      toast.error("Lỗi khi tạo công việc. Một số công việc có thể chưa được lưu.")
    } finally {
      setCreating(false)
    }
  }

  // Helper colors for badges
  const getTrackerVariant = (tracker: string) => {
    if (tracker === "feature")
      return "bg-purple-50 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400 border-purple-200 dark:border-purple-900"
    if (tracker === "test")
      return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900"
    if (tracker === "bug")
      return "bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 border-rose-200 dark:border-rose-900"
    return "bg-slate-50 text-slate-700 dark:bg-slate-950/20 dark:text-slate-400 border-slate-200 dark:border-slate-900"
  }

  const getPriorityVariant = (priority: string) => {
    if (priority === "urgent")
      return "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 border-red-200 dark:border-red-900"
    if (priority === "high")
      return "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border-amber-200 dark:border-amber-900"
    return "bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 border-blue-200 dark:border-blue-900"
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl rounded-3xl border-border bg-popover p-6 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500 animate-pulse">
              <Sparkles className="h-5 w-5" />
            </div>
            <DialogTitle className="text-xl font-bold flex items-center gap-1.5">
              Phân rã Công việc Dự án bằng AI
              <Brain className="h-4 w-4 text-primary animate-bounce" />
            </DialogTitle>
          </div>
          <DialogDescription>
            AI tự động phân tích Tên, Mô tả dự án và Công nghệ sử dụng để phân rã thành danh sách
            task con kèm mô tả kỹ thuật chi tiết.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-1 space-y-4 my-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <Loader2 className="h-10 w-10 text-purple-500 animate-spin" />
              <span className="text-sm font-semibold text-muted-foreground animate-pulse">
                AI đang nghiên cứu cấu trúc dự án và thiết kế các task con...
              </span>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertTriangle className="h-10 w-10 text-amber-500 mb-2" />
              <p className="font-semibold text-foreground">Không thể sinh gợi ý</p>
              <p className="text-sm text-muted-foreground max-w-sm mt-1">
                Vui lòng đảm bảo dự án của bạn đã được điền thông tin mô tả chi tiết và danh sách
                công nghệ.
              </p>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              {suggestions.map((suggestion) => (
                <div
                  key={suggestion.index}
                  className={`p-4 border rounded-2xl transition-all duration-200 bg-card/40 flex items-start gap-4 ${
                    suggestion.checked
                      ? "border-purple-500 bg-purple-500/5"
                      : "border-border/60 opacity-60"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={suggestion.checked}
                    onChange={() => {
                      handleToggleCheck(suggestion.index)
                    }}
                    className="mt-1 h-4 w-4 text-purple-600 border-border rounded focus:ring-purple-500"
                  />

                  <div className="flex-1 space-y-3">
                    {/* Header Info */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Input
                        value={suggestion.title}
                        onChange={(e) => {
                          handleFieldChange(suggestion.index, "title", e.target.value)
                        }}
                        className="font-bold text-foreground bg-transparent border-none focus-visible:ring-1 focus-visible:ring-purple-500 h-8 px-1 text-sm flex-1 mr-4 rounded-lg"
                        disabled={!suggestion.checked}
                      />
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Badge
                          variant="outline"
                          className={`text-[10px] uppercase py-0 px-2 font-semibold border ${getTrackerVariant(suggestion.tracker)}`}
                        >
                          {suggestion.tracker}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={`text-[10px] uppercase py-0 px-2 font-semibold border ${getPriorityVariant(suggestion.priority)}`}
                        >
                          {suggestion.priority}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className="text-[10px] py-0 px-2 font-bold rounded-full"
                        >
                          {suggestion.estimatedTime}h Baseline
                        </Badge>
                      </div>
                    </div>

                    {/* Description Area */}
                    <Textarea
                      value={suggestion.description || ""}
                      onChange={(e) => {
                        handleFieldChange(suggestion.index, "description", e.target.value)
                      }}
                      className="text-xs text-muted-foreground bg-transparent border-none focus-visible:ring-1 focus-visible:ring-purple-500 p-1 resize-none h-16 rounded-lg leading-relaxed"
                      disabled={!suggestion.checked}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer actions */}
        {!loading && suggestions.length > 0 && (
          <div className="border-t border-border/40 pt-4 flex items-center justify-between gap-4 mt-2">
            <span className="text-xs text-muted-foreground font-medium">
              Đã chọn{" "}
              <strong className="text-purple-600 dark:text-purple-400">
                {suggestions.filter((t) => t.checked).length}
              </strong>{" "}
              trên {suggestions.length} công việc được đề xuất.
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={() => {
                  onOpenChange(false)
                }}
                className="rounded-full"
                disabled={creating}
              >
                Hủy
              </Button>
              <Button
                onClick={handleCreateTasks}
                disabled={creating}
                className="bg-purple-600 text-white hover:bg-purple-700 rounded-full px-5 flex items-center gap-1.5"
              >
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang khởi tạo...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Tạo công việc
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
