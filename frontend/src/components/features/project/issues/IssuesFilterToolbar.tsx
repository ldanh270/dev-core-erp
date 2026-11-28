import { PageCard } from "@/components/common"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TASK_PRIORITIES, TASK_TRACKERS } from "@/config/entities/project.config"
import type { ProjectMember } from "@/types/project.types"

import { Search } from "lucide-react"

import { ALL_FILTER_VALUE } from "./issue-columns.config"

interface IssuesFilterToolbarProps {
  issueSearch: string
  setIssueSearch: (val: string) => void
  trackerFilter: string
  setTrackerFilter: (val: string) => void
  statusFilter: string
  setStatusFilter: (val: string) => void
  priorityFilter: string
  setPriorityFilter: (val: string) => void
  assigneeFilter: string
  setAssigneeFilter: (val: string) => void
  statuses: { id: string; name: string; isCompleted: boolean }[]
  teamLeader?: { id: string; fullName: string; email: string } | null
  members: ProjectMember[]
}

/** Top filtering bar containing search input, quick filters, and query triggers. */
export function IssuesFilterToolbar({
  issueSearch,
  setIssueSearch,
  trackerFilter,
  setTrackerFilter,
  statusFilter,
  setStatusFilter,
  priorityFilter,
  setPriorityFilter,
  assigneeFilter,
  setAssigneeFilter,
  statuses,
  teamLeader,
  members,
}: IssuesFilterToolbarProps) {
  return (
    <PageCard className="p-4 flex flex-wrap gap-4 items-center justify-between">
      <div className="relative w-full lg:w-64">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Tìm công việc..."
          value={issueSearch}
          onChange={(e) => {
            setIssueSearch(e.target.value)
          }}
          className="pl-11 h-9 text-xs border-border rounded-full"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Tracker Filter */}
        <div className="flex items-center gap-1.5">
          <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Tracker:
          </Label>
          <Select value={trackerFilter} onValueChange={setTrackerFilter}>
            <SelectTrigger className="w-24 h-9 border-border rounded-full text-xs bg-background">
              <SelectValue placeholder="Tất cả" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value={ALL_FILTER_VALUE}>Tất cả</SelectItem>
              {TASK_TRACKERS.map((tr) => (
                <SelectItem key={tr} value={tr}>
                  {tr}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5">
          <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Trạng thái:
          </Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-28 h-9 border-border rounded-full text-xs bg-background">
              <SelectValue placeholder="Tất cả" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value={ALL_FILTER_VALUE}>Tất cả</SelectItem>
              {statuses.map((st) => (
                <SelectItem key={st.id} value={st.id}>
                  {st.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-1.5">
          <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Độ ưu tiên:
          </Label>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-28 h-9 border-border rounded-full text-xs bg-background">
              <SelectValue placeholder="Tất cả" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value={ALL_FILTER_VALUE}>Tất cả</SelectItem>
              {TASK_PRIORITIES.map((pr) => (
                <SelectItem key={pr} value={pr}>
                  {pr}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Assignee Filter */}
        <div className="flex items-center gap-1.5">
          <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Người thực hiện:
          </Label>
          <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
            <SelectTrigger className="w-32 h-9 border-border rounded-full text-xs bg-background">
              <SelectValue placeholder="Tất cả" />
            </SelectTrigger>
            <SelectContent className="rounded-xl bg-popover">
              <SelectItem value={ALL_FILTER_VALUE}>Tất cả</SelectItem>
              {teamLeader && (
                <SelectItem value={teamLeader.id}>{teamLeader.fullName} (TL)</SelectItem>
              )}
              {members.map((m) => (
                <SelectItem key={m.employeeId} value={m.employeeId}>
                  {m.employee?.fullName || "Chưa rõ"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </PageCard>
  )
}
