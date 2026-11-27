import {
  useCreatePosition,
  useDeletePosition,
  usePositions,
  useUpdatePosition,
} from "@/hooks/use-position-query"
import type { Position } from "@/lib/api/position.api"
import { useCallback, useState } from "react"
import { toast } from "sonner"

/**
 * Mapping of tracker keys to localized Vietnamese labels.
 */
export const TRACKER_LABELS: Record<string, string> = {
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
 * Custom hook managing position CRUD operations, tracker selections, and modal state.
 */
export function usePositionsManagement() {
  const { data: positions = [], isLoading, refetch } = usePositions()
  const createMutation = useCreatePosition()
  const updateMutation = useUpdatePosition()
  const deleteMutation = useDeletePosition()

  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [code, setCode] = useState("")
  const [description, setDescription] = useState("")
  const [allowedTrackers, setAllowedTrackers] = useState<string[]>([])

  const handleOpenCreate = useCallback(() => {
    setEditingId(null)
    setName("")
    setCode("")
    setDescription("")
    setAllowedTrackers([])
    setIsOpen(true)
  }, [])

  const handleOpenEdit = useCallback((pos: Position) => {
    setEditingId(pos.id)
    setName(pos.name)
    setCode(pos.code)
    setDescription(pos.description || "")
    setAllowedTrackers(pos.allowedTaskTrackers || [])
    setIsOpen(true)
  }, [])

  const handleToggleTracker = useCallback((tracker: string) => {
    setAllowedTrackers((prev) =>
      prev.includes(tracker) ? prev.filter((t) => t !== tracker) : [...prev, tracker],
    )
  }, [])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
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
    },
    [
      name,
      code,
      description,
      allowedTrackers,
      editingId,
      updateMutation,
      createMutation,
      refetch,
    ],
  )

  const handleDelete = useCallback(
    async (id: string) => {
      if (window.confirm("Bạn có chắc chắn muốn xóa chức vụ này?")) {
        try {
          await deleteMutation.mutateAsync(id)
          toast.success("Xóa chức vụ thành công")
          refetch()
        } catch {
          toast.error("Xóa chức vụ thất bại")
        }
      }
    },
    [deleteMutation, refetch],
  )

  return {
    positions,
    isLoading,
    isOpen,
    setIsOpen,
    editingId,
    name,
    setName,
    code,
    setCode,
    description,
    setDescription,
    allowedTrackers,
    handleOpenCreate,
    handleOpenEdit,
    handleToggleTracker,
    handleSubmit,
    handleDelete,
  }
}
