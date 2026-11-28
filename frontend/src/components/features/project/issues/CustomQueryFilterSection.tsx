import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TASK_PRIORITIES, TASK_TRACKERS } from "@/config/entities/project.config"
import type { ProjectMember } from "@/types/project.types"

import type { ReactNode } from "react"

interface FilterOption {
  value: string
  label: string
}

interface CustomQueryFilterRowProps {
  label: string
  enabled: boolean
  onEnabledChange: (enabled: boolean) => void
  value: string
  onValueChange: (value: string) => void
  options?: FilterOption[]
  children?: ReactNode
}

function CustomQueryFilterRow({
  label,
  enabled,
  onEnabledChange,
  value,
  onValueChange,
  options,
  children,
}: CustomQueryFilterRowProps) {
  return (
    <div className="flex items-center gap-4 py-1">
      <label className="flex items-center gap-2 text-xs font-semibold w-32 shrink-0">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => {
            onEnabledChange(e.target.checked)
          }}
          className="rounded border-border size-3.5"
        />
        {label}
      </label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-44 h-8 text-xs border-border rounded-full bg-background">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="rounded-xl bg-popover">
          {children ||
            options?.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
    </div>
  )
}

interface CustomQueryFilterSectionProps {
  newQueryFilters: {
    status: { enabled: boolean; value: string }
    tracker: { enabled: boolean; value: string }
    priority: { enabled: boolean; value: string }
    assignee: { enabled: boolean; value: string }
    createdBy: { enabled: boolean; value: string }
  }
  setNewQueryFilters: React.Dispatch<
    React.SetStateAction<{
      status: { enabled: boolean; value: string }
      tracker: { enabled: boolean; value: string }
      priority: { enabled: boolean; value: string }
      assignee: { enabled: boolean; value: string }
      createdBy: { enabled: boolean; value: string }
    }>
  >
  statuses: { id: string; name: string; isCompleted: boolean }[]
  teamLeader?: { id: string; fullName: string; email: string } | null
  members: ProjectMember[]
}

/** Filter builder form section for adding constraints to custom queries. */
export function CustomQueryFilterSection({
  newQueryFilters,
  setNewQueryFilters,
  statuses,
  teamLeader,
  members,
}: CustomQueryFilterSectionProps) {
  const updateFilter = (
    key: "status" | "tracker" | "priority" | "assignee" | "createdBy",
    field: "enabled" | "value",
    val: boolean | string,
  ) => {
    setNewQueryFilters((prev) => {
      switch (key) {
        case "status":
          return { ...prev, status: { ...prev.status, [field]: val } }
        case "tracker":
          return { ...prev, tracker: { ...prev.tracker, [field]: val } }
        case "priority":
          return { ...prev, priority: { ...prev.priority, [field]: val } }
        case "assignee":
          return { ...prev, assignee: { ...prev.assignee, [field]: val } }
        case "createdBy":
          return { ...prev, createdBy: { ...prev.createdBy, [field]: val } }
      }
    })
  }

  return (
    <div className="space-y-2 border-t border-border pt-3">
      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
        Bộ lọc
      </span>

      <div className="flex flex-col gap-2 pt-1">
        {/* Status filter */}
        <CustomQueryFilterRow
          label="Trạng thái"
          enabled={newQueryFilters.status.enabled}
          onEnabledChange={(checked) => {
            updateFilter("status", "enabled", checked)
          }}
          value={newQueryFilters.status.value}
          onValueChange={(val) => {
            updateFilter("status", "value", val)
          }}
        >
          <SelectItem value="open">đang mở</SelectItem>
          <SelectItem value="all">tất cả</SelectItem>
          <SelectItem value="closed">đã đóng</SelectItem>
          {statuses.map((st) => (
            <SelectItem key={st.id} value={st.id}>
              {st.name}
            </SelectItem>
          ))}
        </CustomQueryFilterRow>

        {/* Tracker filter */}
        <CustomQueryFilterRow
          label="Kiểu công việc"
          enabled={newQueryFilters.tracker.enabled}
          onEnabledChange={(checked) => {
            updateFilter("tracker", "enabled", checked)
          }}
          value={newQueryFilters.tracker.value}
          onValueChange={(val) => {
            updateFilter("tracker", "value", val)
          }}
          options={[
            { value: "all", label: "tất cả" },
            ...TASK_TRACKERS.map((tr) => ({ value: tr, label: tr })),
          ]}
        />

        {/* Priority filter */}
        <CustomQueryFilterRow
          label="Mức ưu tiên"
          enabled={newQueryFilters.priority.enabled}
          onEnabledChange={(checked) => {
            updateFilter("priority", "enabled", checked)
          }}
          value={newQueryFilters.priority.value}
          onValueChange={(val) => {
            updateFilter("priority", "value", val)
          }}
          options={[
            { value: "all", label: "tất cả" },
            ...TASK_PRIORITIES.map((pr) => ({ value: pr, label: pr })),
          ]}
        />

        {/* Assignee filter */}
        <CustomQueryFilterRow
          label="Người thực hiện"
          enabled={newQueryFilters.assignee.enabled}
          onEnabledChange={(checked) => {
            updateFilter("assignee", "enabled", checked)
          }}
          value={newQueryFilters.assignee.value}
          onValueChange={(val) => {
            updateFilter("assignee", "value", val)
          }}
        >
          <SelectItem value="all">tất cả</SelectItem>
          <SelectItem value="me">Tôi (Người đăng nhập)</SelectItem>
          {teamLeader && <SelectItem value={teamLeader.id}>{teamLeader.fullName} (TL)</SelectItem>}
          {members.map((m) => (
            <SelectItem key={m.employeeId} value={m.employeeId}>
              {m.employee?.fullName || "Chưa rõ"}
            </SelectItem>
          ))}
        </CustomQueryFilterRow>

        {/* CreatedBy filter */}
        <CustomQueryFilterRow
          label="Tác giả"
          enabled={newQueryFilters.createdBy.enabled}
          onEnabledChange={(checked) => {
            updateFilter("createdBy", "enabled", checked)
          }}
          value={newQueryFilters.createdBy.value}
          onValueChange={(val) => {
            updateFilter("createdBy", "value", val)
          }}
        >
          <SelectItem value="all">tất cả</SelectItem>
          <SelectItem value="me">Tôi (Người tạo)</SelectItem>
          {teamLeader && <SelectItem value={teamLeader.id}>{teamLeader.fullName} (TL)</SelectItem>}
          {members.map((m) => (
            <SelectItem key={m.employeeId} value={m.employeeId}>
              {m.employee?.fullName || "Chưa rõ"}
            </SelectItem>
          ))}
        </CustomQueryFilterRow>
      </div>
    </div>
  )
}
