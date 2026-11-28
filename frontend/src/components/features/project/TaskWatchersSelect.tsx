import { Label } from "@/components/ui/label"
import type { ProjectMember } from "@/types/project.types"

export interface TaskWatchersSelectProps {
  members: ProjectMember[]
  isLoadingMembers: boolean
  selectedWatchers: string[]
  onToggleWatcher: (empId: string) => void
  onSelectAllWatchers: () => void
}

const AVATAR_COLORS = [
  "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800/30",
  "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800/30",
  "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800/30",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/30",
  "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800/30",
  "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/30",
  "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 border-violet-200 dark:border-violet-800/30",
  "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400 border-pink-200 dark:border-pink-800/30",
]

function getAvatarColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length
  return AVATAR_COLORS.at(index) ?? ""
}

/** Multi-select component for designating task watchers/subscribers. */
export function TaskWatchersSelect({
  members,
  isLoadingMembers,
  selectedWatchers,
  onToggleWatcher,
  onSelectAllWatchers,
}: TaskWatchersSelectProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <Label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">
          NGƯỜI THEO DÕI
        </Label>
        <button
          type="button"
          onClick={onSelectAllWatchers}
          className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
        >
          {members && selectedWatchers.length === members.length ? "Bỏ chọn tất cả" : "Chọn tất cả"}
        </button>
      </div>

      <div className="border border-border rounded-lg p-3 bg-background max-h-[140px] overflow-y-auto space-y-2">
        {isLoadingMembers ? (
          <span className="text-xs text-muted-foreground italic">
            Đang tải danh sách thành viên...
          </span>
        ) : !members || members.length === 0 ? (
          <span className="text-xs text-muted-foreground italic">
            Không có thành viên nào trong dự án này
          </span>
        ) : (
          members.map((m) => {
            const isChecked = selectedWatchers.includes(m.employeeId)
            const fullName = m.employee?.fullName || "Chưa rõ"
            return (
              <label
                key={m.id}
                className="flex items-center gap-3 text-xs text-foreground cursor-pointer hover:bg-muted/30 p-1.5 rounded-lg transition-colors"
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => onToggleWatcher(m.employeeId)}
                  className="size-3.5 rounded border-border text-primary focus:ring-primary"
                />
                <div
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold border ${getAvatarColor(fullName)}`}
                >
                  {fullName.charAt(0).toUpperCase()}
                </div>
                <span className="font-semibold text-muted-foreground hover:text-foreground">
                  {fullName}
                </span>
              </label>
            )
          })
        )}
      </div>
    </div>
  )
}
