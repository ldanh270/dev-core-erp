import { useConfirm } from "@/components/common"
import { useState } from "react"
import { usePositions, useCreatePosition, useUpdatePosition, useDeletePosition } from "@/hooks/use-position-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { PageCard } from "@/components/common"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Briefcase, Plus, Edit2, Trash2, CheckSquare } from "lucide-react"
import { toast } from "sonner"

// English to Vietnamese labels for trackers
const TRACKER_LABELS: Record<string, string> = {
  feature: "Feature (Tính năng)",
  bug: "Bug (Lỗi)",
  support: "Support (Hỗ trợ)",
  task: "Task (Công việc)",
  meeting: "Meeting (Họp)",
  test: "Test (Kiểm thử)",
  subtask: "Subtask (Việc con)",
  management: "Management (Quản lý)",
}

/**
 * Component for administering organizational Positions.
 * Provides a management panel for administrators to list, create, update,
 * and delete positions, including configuring the globally allowed task trackers per position.
 */
export default function PositionsManagement() {
  const confirm = useConfirm()
  const { data: positions = [], isLoading, refetch } = usePositions()
  const createMutation = useCreatePosition()
  const updateMutation = useUpdatePosition()
  const deleteMutation = useDeletePosition()

  // Form state
  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [code, setCode] = useState("")
  const [description, setDescription] = useState("")
  const [allowedTrackers, setAllowedTrackers] = useState<string[]>([])

  const handleOpenCreate = () => {
    setEditingId(null)
    setName("")
    setCode("")
    setDescription("")
    setAllowedTrackers([])
    setIsOpen(true)
  }

  const handleOpenEdit = (pos: { id: string; name: string; code: string; description?: string | null; allowedTaskTrackers?: string[] }) => {
    setEditingId(pos.id)
    setName(pos.name)
    setCode(pos.code)
    setDescription(pos.description || "")
    setAllowedTrackers(pos.allowedTaskTrackers || [])
    setIsOpen(true)
  }

  const handleToggleTracker = (tracker: string) => {
    setAllowedTrackers((prev) =>
      prev.includes(tracker) ? prev.filter((t) => t !== tracker) : [...prev, tracker]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !code.trim()) {
      toast.error("Vui lòng điền đầy đủ tên và mã chức vụ")
      return
    }

    const payload = {
      name: name.trim(),
      code: code.trim().toLowerCase().replace(/\s+/g, "_"),
      description: description.trim() || undefined,
      allowedTaskTrackers: allowedTrackers,
      allowedApplicationTypes: [],
    }

    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, data: payload })
        toast.success("Cập nhật chức vụ thành công")
      } else {
        await createMutation.mutateAsync(payload)
        toast.success("Tạo chức vụ mới thành công")
      }
      setIsOpen(false)
      refetch()
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: { message?: string } } } }
      const msg = err.response?.data?.error?.message || "Đã xảy ra lỗi"
      toast.error(msg)
    }
  }

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({
      title: "Xác nhận xóa chức vụ",
      description: "Bạn có chắc chắn muốn xóa chức vụ này không? Hành động này không thể hoàn tác.",
      confirmText: "Xóa chức vụ",
      variant: "destructive",
    })
    if (isConfirmed) {
      try {
        await deleteMutation.mutateAsync(id)
        toast.success("Xóa chức vụ thành công")
        refetch()
      } catch {
        toast.error("Xóa chức vụ thất bại")
      }
    }
  }

  return (
    <div className="container p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-6">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Bảo mật & Cài đặt
          </span>
          <h1 className="text-2xl font-bold text-foreground mt-0.5">Quản lý Chức vụ</h1>
          <p className="text-xs text-muted-foreground mt-1 max-w-[600px]">
            Định nghĩa các chức vụ và cấu hình các quy tắc giới hạn tạo Công việc (Task) cũng như gửi Yêu cầu (Application) toàn hệ thống.
          </p>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="rounded-full bg-primary text-primary-foreground hover:bg-primary/95 flex items-center gap-1.5 h-10 text-xs px-4"
        >
          <Plus className="size-4" />
          Thêm chức vụ mới
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-48 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      ) : positions.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-xl">
          <Briefcase className="size-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm font-semibold text-foreground">Chưa có chức vụ nào</p>
          <p className="text-xs text-muted-foreground mt-1">Bấm nút "Thêm chức vụ mới" để tạo.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {positions.map((pos) => (
            <PageCard
              key={pos.id}
              className="hover:shadow-md transition-all duration-300 border border-border/80 flex flex-col justify-between p-6 rounded-xl space-y-4 hover:border-primary/45"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-base text-foreground leading-tight">{pos.name}</h3>
                    <Badge variant="secondary" className="rounded-full text-[9px] font-mono mt-1 font-bold">
                      {pos.code}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenEdit(pos)}
                      className="size-8 rounded-full hover:bg-muted"
                    >
                      <Edit2 className="size-3.5 text-muted-foreground hover:text-foreground" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(pos.id)}
                      className="size-8 rounded-full hover:bg-red-500/10 hover:text-red-600"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
                {pos.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 min-h-[32px]">
                    {pos.description}
                  </p>
                )}

                <div className="space-y-2 border-t border-border/40 pt-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                      Công việc được phép tạo (Mặc định)
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {pos.allowedTaskTrackers.length === 0 ? (
                        <span className="text-[10px] text-muted-foreground italic">Chưa giới hạn (Cho phép tất cả)</span>
                      ) : (
                        pos.allowedTaskTrackers.map((t: string) => (
                          <Badge key={t} variant="outline" className="rounded-full text-[9px] px-2 py-0.5 border-border bg-background">
                            {TRACKER_LABELS[t] || t}
                          </Badge>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </PageCard>
          ))}
        </div>
      )}

      {/* Dialog for Create/Edit */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {editingId ? "Chỉnh sửa chức vụ" : "Thêm chức vụ mới"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Thiết lập tên, mã và cấu hình chi tiết các giới hạn mặc định cho chức vụ này.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-bold">Tên chức vụ *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ví dụ: Lập trình viên"
                  className="rounded-full h-10 text-sm"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="code" className="text-xs font-bold">Mã chức vụ (Duy nhất) *</Label>
                <Input
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Ví dụ: developer"
                  className="rounded-full h-10 text-sm font-mono"
                  disabled={!!editingId}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="desc" className="text-xs font-bold">Mô tả chức vụ</Label>
              <Textarea
                id="desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Nhập mô tả ngắn gọn về vai trò/chức năng của chức vụ này..."
                className="rounded-xl min-h-[60px] text-sm"
              />
            </div>

            <div className="space-y-3 border-t border-border/40 pt-4">
              <div>
                <Label className="text-xs font-black uppercase text-foreground">
                  1. Cấu hình loại công việc được tạo (Mặc định)
                </Label>
                <p className="text-[10px] text-muted-foreground mt-0.5 mb-3">
                  Chọn các loại công việc mà chức vụ này được phép tạo (để trống nếu cho phép tạo tất cả).
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Object.entries(TRACKER_LABELS).map(([key, label]) => {
                    const isChecked = allowedTrackers.includes(key)
                    return (
                      <button
                        type="button"
                        key={key}
                        onClick={() => handleToggleTracker(key)}
                        className={`flex items-center gap-2 p-2.5 rounded-full border text-left transition-all duration-200 cursor-pointer ${
                          isChecked
                            ? "bg-primary/5 border-primary text-primary"
                            : "bg-background border-border hover:bg-muted/30"
                        }`}
                      >
                        <CheckSquare className={`size-4 shrink-0 ${isChecked ? "text-primary fill-primary/10" : "text-muted-foreground"}`} />
                        <span className="text-xs font-semibold leading-tight line-clamp-1">{label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            <DialogFooter className="border-t border-border/40 pt-4 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="rounded-full text-xs h-9"
              >
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                className="rounded-full text-xs h-9 bg-primary text-primary-foreground hover:bg-primary/95"
              >
                {editingId ? "Cập nhật thay đổi" : "Tạo chức vụ"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
