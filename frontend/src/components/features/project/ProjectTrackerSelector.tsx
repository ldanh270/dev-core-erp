import { Label } from "@/components/ui/label"
import { TYPOGRAPHY } from "@/config/typography.config"
import { cn } from "@/lib/utils"

import { CheckSquare, ChevronDown, Square } from "lucide-react"

interface ProjectTrackerSelectorProps {
  trackersList: { key: string; label: string }[]
  selectedTrackers: string[]
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onToggleTracker: (trackerKey: string) => void
  onSelectAll: (keys: string[]) => void
  onClearAll: () => void
}

/** Form input selector for assigning a tracker to a task based on project policy. */
export function ProjectTrackerSelector({
  trackersList,
  selectedTrackers,
  isOpen,
  onOpenChange,
  onToggleTracker,
  onSelectAll,
  onClearAll,
}: ProjectTrackerSelectorProps) {
  return (
    <div className="space-y-1.5 relative">
      <Label className={TYPOGRAPHY.FORM_LABEL}>Các loại yêu cầu được phép hoạt động</Label>
      <p className={cn(TYPOGRAPHY.FORM_HELPER, "mt-0.5 mb-2")}>
        Chỉ chọn các loại yêu cầu được phép tạo trong dự án này (để trống nếu cho phép tất cả).
      </p>

      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            onOpenChange(false)
          }}
        />
      )}

      <div className="relative w-full">
        <button
          type="button"
          onClick={() => {
            onOpenChange(!isOpen)
          }}
          className="w-full border border-border rounded-full px-3.5 py-[0.5625rem] bg-background flex items-center justify-between text-xs font-semibold cursor-pointer hover:bg-muted/30 text-foreground"
        >
          <span className="truncate">
            {selectedTrackers.length === 0
              ? "Cho phép tất cả"
              : selectedTrackers
                  .map((k) => trackersList.find((t) => t.key === k)?.label || k)
                  .join(", ")}
          </span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground ml-1" />
        </button>

        {isOpen && (
          <div className="absolute left-0 mt-1 w-full bg-popover border border-border rounded-xl p-3 shadow-lg z-50 space-y-2">
            <div className="flex items-center justify-between border-b border-border pb-1.5 mb-1.5">
              <span className="text-xs font-semibold text-muted-foreground">
                Chọn loại công việc
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onSelectAll(trackersList.map((t) => t.key))
                  }}
                  className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                >
                  Tất cả
                </button>
                <button
                  type="button"
                  onClick={onClearAll}
                  className="text-xs font-semibold text-muted-foreground hover:text-destructive hover:underline cursor-pointer"
                >
                  Xóa tất cả
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-1.5 max-h-60 overflow-y-auto">
              {trackersList.map((tracker) => {
                const isChecked = selectedTrackers.includes(tracker.key)
                return (
                  <button
                    type="button"
                    key={tracker.key}
                    onClick={() => {
                      onToggleTracker(tracker.key)
                    }}
                    className={`flex items-center gap-2 p-2 rounded-lg text-left transition-all duration-200 cursor-pointer ${
                      isChecked ? "bg-primary/5 text-primary" : "hover:bg-muted/40 text-foreground"
                    }`}
                  >
                    {isChecked ? (
                      <CheckSquare className="size-3.5 shrink-0 text-primary fill-primary/10" />
                    ) : (
                      <Square className="size-3.5 shrink-0 text-muted-foreground" />
                    )}
                    <span className="text-xs font-semibold leading-tight line-clamp-1">
                      {tracker.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
