import React from "react"

import { CheckSquare, ChevronDown, Square } from "lucide-react"

interface TrackerDropdownProps {
  roleId: string
  allowed: string[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  trackers: any[]
  onToggle: (key: string) => void
  onSelectAll: () => void
  onClearAll: () => void
  openDropdown: { roleId: string; type: "tracker" | null }
  setOpenDropdown: React.Dispatch<React.SetStateAction<{ roleId: string; type: "tracker" | null }>>
  openUpward?: boolean
}

export function TrackerDropdown({
  roleId,
  allowed,
  trackers,
  onToggle,
  onSelectAll,
  onClearAll,
  openDropdown,
  setOpenDropdown,
  openUpward,
}: TrackerDropdownProps) {
  const isOpen = openDropdown.roleId === roleId && openDropdown.type === "tracker"

  const getLabel = () => {
    if (allowed.length === trackers.length) return "Cho phép tất cả"
    if (allowed.length === 0) return "Chọn nhất 1 loại yêu cầu"
    const selectedLabels = allowed.map((k) => {
      const match = trackers.find((t) => t.code === k)
      return match ? match.name : k
    })
    return selectedLabels.join(", ")
  }

  const label = getLabel()

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={(e) => {
            e.stopPropagation()
            setOpenDropdown({ roleId: "", type: null })
          }}
        />
      )}
      <div className="relative w-full">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setOpenDropdown(isOpen ? { roleId: "", type: null } : { roleId, type: "tracker" })
          }}
          className="w-full h-10 border border-border rounded-full px-4 bg-background flex items-center justify-between text-xs font-semibold cursor-pointer hover:bg-muted/30 text-foreground"
        >
          <span className="truncate">{label}</span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground ml-1" />
        </button>

        {isOpen && (
          <div
            className={`absolute right-0 md:left-0 w-72 bg-popover border border-border rounded-xl p-3 shadow-lg z-50 space-y-2 ${
              openUpward ? "bottom-full mb-1" : "mt-1"
            }`}
          >
            <div className="flex items-center justify-between border-b border-border pb-1.5 mb-1.5">
              <span className="text-[10px] font-bold text-muted-foreground">
                Chọn loại công việc
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onSelectAll()
                  }}
                  className="text-[9px] font-extrabold text-primary hover:underline cursor-pointer"
                >
                  Tất cả
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onClearAll()
                  }}
                  className="text-[9px] font-extrabold text-muted-foreground hover:text-red-500 hover:underline cursor-pointer"
                >
                  Xóa tất cả
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-1 max-h-60 overflow-y-auto">
              {trackers.map((tracker) => {
                const isChecked = allowed.includes(tracker.code)
                return (
                  <button
                    type="button"
                    key={tracker.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      onToggle(tracker.code)
                    }}
                    className={`flex items-center gap-2 p-1.5 rounded-lg text-left transition-all duration-200 cursor-pointer ${
                      isChecked ? "bg-primary/5 text-primary" : "hover:bg-muted/40 text-foreground"
                    }`}
                  >
                    {isChecked ? (
                      <CheckSquare className="size-3.5 shrink-0 text-primary fill-primary/10" />
                    ) : (
                      <Square className="size-3.5 shrink-0 text-muted-foreground" />
                    )}
                    <span className="text-xs font-semibold">{tracker.name}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
