import { Label } from "@/components/ui/label"
import {
  useCreateProjectTracker,
  useDeleteProjectTracker,
  useUpdateProjectTracker,
} from "@/hooks/project/use-project-tracker"
import type { ProjectTracker } from "@/types/project-tracker.types"
import { Check, CheckSquare, ChevronDown, Edit2, Plus, Square, Trash2, X } from "lucide-react"
import { useState } from "react"

interface TrackerCreateSectionProps {
  newTrackerName: string
  setNewTrackerName: (name: string) => void
  onCreate: () => void
  isCreating: boolean
}

function TrackerCreateSection({
  newTrackerName,
  setNewTrackerName,
  onCreate,
  isCreating,
}: TrackerCreateSectionProps) {
  return (
    <div className="border-t border-border pt-2 mt-2">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Thêm loại yêu cầu mới..."
          value={newTrackerName}
          onChange={(e) => setNewTrackerName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              onCreate()
            }
          }}
          className="flex-1 h-8 text-xs border border-border rounded-full px-3 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <button
          type="button"
          onClick={onCreate}
          disabled={isCreating}
          className="h-8 px-3 rounded-full bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/95 flex items-center justify-center shrink-0 cursor-pointer"
        >
          <Plus className="size-3.5" />
        </button>
      </div>
    </div>
  )
}

interface TrackerItemRowProps {
  tracker: ProjectTracker
  isChecked: boolean
  isEditing: boolean
  editingTrackerName: string
  setEditingTrackerName: (name: string) => void
  onToggle: () => void
  onStartEdit: () => void
  onSaveRename: () => void
  onCancelEdit: () => void
  onDelete: () => void
}

function TrackerItemRow({
  tracker,
  isChecked,
  isEditing,
  editingTrackerName,
  setEditingTrackerName,
  onToggle,
  onStartEdit,
  onSaveRename,
  onCancelEdit,
  onDelete,
}: TrackerItemRowProps) {
  return (
    <div className="group flex items-center justify-between gap-1 p-1 hover:bg-muted/30 rounded-lg">
      <button
        type="button"
        onClick={onToggle}
        className={`flex items-center gap-2 p-1 flex-1 rounded-lg text-left transition-all duration-200 cursor-pointer ${
          isChecked ? "text-primary" : "text-foreground"
        }`}
      >
        {isChecked ? (
          <CheckSquare className="size-3.5 shrink-0 text-primary fill-primary/10" />
        ) : (
          <Square className="size-3.5 shrink-0 text-muted-foreground" />
        )}
        {isEditing ? (
          <input
            type="text"
            value={editingTrackerName}
            onChange={(e) => setEditingTrackerName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onSaveRename()
              } else if (e.key === "Escape") {
                onCancelEdit()
              }
            }}
            onBlur={onSaveRename}
            className="h-6 text-xs border border-border rounded px-1.5 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-full"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="text-xs font-semibold leading-tight line-clamp-1">
            {tracker.name}
          </span>
        )}
      </button>

      {!isEditing && (
        <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onStartEdit()
            }}
            className="p-1 hover:text-primary text-muted-foreground rounded-full cursor-pointer"
          >
            <Edit2 className="size-3" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            className="p-1 hover:text-destructive text-muted-foreground rounded-full cursor-pointer"
          >
            <Trash2 className="size-3" />
          </button>
        </div>
      )}
    </div>
  )
}

function useProjectTrackersDropdown({
  projectId,
  trackers,
  selectedTrackers,
  onApplyTrackers,
  setTempTrackers,
}: {
  projectId: string
  trackers: ProjectTracker[]
  selectedTrackers: string[]
  onApplyTrackers: (trackers: string[]) => void
  setTempTrackers: React.Dispatch<React.SetStateAction<string[]>>
}) {
  const createTrackerMutation = useCreateProjectTracker(projectId)
  const updateTrackerMutation = useUpdateProjectTracker(projectId)
  const deleteTrackerMutation = useDeleteProjectTracker(projectId)

  const [editingTrackerId, setEditingTrackerId] = useState("")
  const [editingTrackerName, setEditingTrackerName] = useState("")
  const [newTrackerName, setNewTrackerName] = useState("")

  const handleCreateTracker = () => {
    if (!newTrackerName.trim()) return
    createTrackerMutation.mutate(
      { name: newTrackerName.trim() },
      {
        onSuccess: (newTracker) => {
          setNewTrackerName("")
          setTempTrackers((prev) => [...prev, newTracker.code])
          onApplyTrackers([...selectedTrackers, newTracker.code])
        },
      },
    )
  }

  const handleSaveRename = (id: string) => {
    if (!editingTrackerName.trim()) {
      setEditingTrackerId("")
      return
    }
    const oldTracker = trackers.find((t) => t.id === id)
    updateTrackerMutation.mutate(
      { id, data: { name: editingTrackerName.trim() } },
      {
        onSuccess: (updatedTracker) => {
          setEditingTrackerId("")
          if (oldTracker) {
            setTempTrackers((prev) =>
              prev.map((code) => (code === oldTracker.code ? updatedTracker.code : code)),
            )
            onApplyTrackers(
              selectedTrackers.map((code) => (code === oldTracker.code ? updatedTracker.code : code)),
            )
          }
        },
      },
    )
  }

  const handleDeleteTracker = (id: string, code: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa loại yêu cầu này?")) {
      deleteTrackerMutation.mutate(id, {
        onSuccess: () => {
          setTempTrackers((prev) => prev.filter((k) => k !== code))
          onApplyTrackers(selectedTrackers.filter((k) => k !== code))
        },
      })
    }
  }

  return {
    editingTrackerId,
    setEditingTrackerId,
    editingTrackerName,
    setEditingTrackerName,
    newTrackerName,
    setNewTrackerName,
    isCreating: createTrackerMutation.isPending,
    handleCreateTracker,
    handleSaveRename,
    handleDeleteTracker,
  }
}

export interface ProjectTrackersDropdownProps {
  projectId: string
  trackers: ProjectTracker[]
  selectedTrackers: string[]
  onApplyTrackers: (trackers: string[]) => void
  tempTrackers: string[]
  setTempTrackers: React.Dispatch<React.SetStateAction<string[]>>
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

/** Dropdown selector for filtering or switching project trackers. */
export function ProjectTrackersDropdown({
  projectId,
  trackers,
  selectedTrackers,
  onApplyTrackers,
  tempTrackers,
  setTempTrackers,
  isOpen,
  onOpenChange,
}: ProjectTrackersDropdownProps) {
  const {
    editingTrackerId,
    setEditingTrackerId,
    editingTrackerName,
    setEditingTrackerName,
    newTrackerName,
    setNewTrackerName,
    isCreating,
    handleCreateTracker,
    handleSaveRename,
    handleDeleteTracker,
  } = useProjectTrackersDropdown({
    projectId,
    trackers,
    selectedTrackers,
    onApplyTrackers,
    setTempTrackers,
  })

  return (
    <div className="space-y-1.5 relative">
      <Label className="text-xs font-semibold text-muted-foreground">
        Các loại yêu cầu được phép hoạt động
      </Label>
      <p className="text-[10px] text-muted-foreground mt-0.5 mb-2">
        Chỉ chọn các loại yêu cầu được phép tạo trong dự án này (để trống nếu cho phép tất cả).
      </p>

      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => onOpenChange(false)}
        />
      )}

      <div className="relative w-full">
        <button
          type="button"
          onClick={() => {
            setTempTrackers(selectedTrackers)
            onOpenChange(!isOpen)
          }}
          className="w-full h-10 border border-border rounded-full px-4 bg-background flex items-center justify-between text-xs font-semibold cursor-pointer hover:bg-muted/30 text-foreground"
        >
          <span className="truncate">
            {selectedTrackers.length === trackers.length
              ? "Cho phép tất cả"
              : selectedTrackers.length === 0
                ? "Chọn ít nhất 1 loại yêu cầu"
                : selectedTrackers
                    .map((k) => trackers.find((t) => t.code === k)?.name || k)
                    .join(", ")}
          </span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground ml-1" />
        </button>

        {isOpen && (
          <div className="absolute left-0 mt-1 w-full bg-popover border border-border rounded-xl p-3 shadow-lg z-50 space-y-2">
            <div className="flex items-center justify-between border-b border-border pb-1.5 mb-1.5">
              <span className="text-[10px] font-bold text-muted-foreground">
                Chọn loại công việc
              </span>
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5 mr-1 border-r border-border pr-2">
                  <button
                    type="button"
                    onClick={() => setTempTrackers(trackers.map((t) => t.code))}
                    className="text-[9px] font-extrabold text-primary hover:underline cursor-pointer"
                  >
                    Tất cả
                  </button>
                  <button
                    type="button"
                    onClick={() => setTempTrackers([])}
                    className="text-[9px] font-extrabold text-muted-foreground hover:text-destructive hover:underline cursor-pointer"
                  >
                    Xóa tất cả
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onApplyTrackers(tempTrackers)
                    onOpenChange(false)
                  }}
                  className="size-5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary flex items-center justify-center cursor-pointer transition-colors"
                  title="Lưu"
                >
                  <Check className="size-3" />
                </button>
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="size-5 rounded-full bg-muted hover:bg-muted-hover text-muted-foreground flex items-center justify-center cursor-pointer transition-colors"
                  title="Hủy"
                >
                  <X className="size-3" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-1.5 max-h-60 overflow-y-auto pr-1">
              {trackers.map((tracker) => (
                <TrackerItemRow
                  key={tracker.id}
                  tracker={tracker}
                  isChecked={tempTrackers.includes(tracker.code)}
                  isEditing={editingTrackerId === tracker.id}
                  editingTrackerName={editingTrackerName}
                  setEditingTrackerName={setEditingTrackerName}
                  onToggle={() =>
                    setTempTrackers((prev) =>
                      prev.includes(tracker.code)
                        ? prev.filter((k) => k !== tracker.code)
                        : [...prev, tracker.code],
                    )
                  }
                  onStartEdit={() => {
                    setEditingTrackerId(tracker.id)
                    setEditingTrackerName(tracker.name)
                  }}
                  onSaveRename={() => handleSaveRename(tracker.id)}
                  onCancelEdit={() => setEditingTrackerId("")}
                  onDelete={() => handleDeleteTracker(tracker.id, tracker.code)}
                />
              ))}
            </div>

            <TrackerCreateSection
              newTrackerName={newTrackerName}
              setNewTrackerName={setNewTrackerName}
              onCreate={handleCreateTracker}
              isCreating={isCreating}
            />
          </div>
        )}
      </div>
    </div>
  )
}

