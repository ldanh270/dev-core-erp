import { PageCard } from "@/components/common"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { TASK_TRACKERS, getProjectMemberWorkModeLabel } from "@/config/entities/project.config"
import type { Project, ProjectMember } from "@/types/project.types"
import type { Task } from "@/types/task.types"

import { BarChart3, Clock, TrendingUp, Users } from "lucide-react"

import { ProjectCapacityCopilotCard } from "./project-capacity-copilot-card"

interface ProjectOverviewTabProps {
  project: Project
  projectId: string
  tasks: Task[]
  totalTasksCount: number
  openTasksCount: number
  closedTasksCount: number
  trackerStats: Map<string, { open: number; closed: number; total: number }>
  totalEstimatedHours: number
  totalSpentHours: number
  members: ProjectMember[]
  canManageMembers: boolean
  onRemoveMember: (employeeId: string) => void
  onEditMember?: (member: ProjectMember) => void
}

export function ProjectOverviewTab({
  project,
  projectId,
  tasks,
  totalTasksCount,
  openTasksCount,
  closedTasksCount,
  trackerStats,
  totalEstimatedHours,
  totalSpentHours,
  members,
  canManageMembers,
  onRemoveMember,
  onEditMember,
}: ProjectOverviewTabProps) {
  // Count the number of tasks for each individual status
  const todo = tasks.filter((t) => t.status === "todo").length
  const inProgress = tasks.filter((t) => t.status === "in_progress").length
  const inReview = tasks.filter((t) => t.status === "in_review").length
  const done = tasks.filter((t) => t.status === "done").length
  const reopened = tasks.filter((t) => t.status === "reopened").length
  const cancelled = tasks.filter((t) => t.status === "cancelled").length

  // Calculate the overall task completion percentage
  const completionRate = totalTasksCount > 0 ? Math.round((done / totalTasksCount) * 100) : 0

  // Configuration for the SVG Donut chart segments
  const radius = 50
  const strokeWidth = 14
  const circumference = 2 * Math.PI * radius // ~314.16

  // Define details for each status segment including labels, styling classes, and values
  const segments = [
    {
      value: done,
      label: "Đã xong (Done)",
      color: "stroke-emerald-500",
      text: "text-emerald-500",
      bg: "bg-emerald-500",
    },
    {
      value: inProgress,
      label: "Đang làm (In Progress)",
      color: "stroke-blue-500",
      text: "text-blue-500",
      bg: "bg-blue-500",
    },
    {
      value: inReview,
      label: "Đang duyệt (In Review)",
      color: "stroke-yellow-500",
      text: "text-yellow-500",
      bg: "bg-yellow-500",
    },
    {
      value: reopened,
      label: "Mở lại (Reopened)",
      color: "stroke-purple-500",
      text: "text-purple-500",
      bg: "bg-purple-500",
    },
    {
      value: todo,
      label: "Cần làm (To Do)",
      color: "stroke-slate-400",
      text: "text-slate-400",
      bg: "bg-slate-400",
    },
    {
      value: cancelled,
      label: "Đã hủy (Cancelled)",
      color: "stroke-red-500",
      text: "text-red-500",
      bg: "bg-red-500",
    },
  ].filter((s) => s.value > 0) // Only render segments with positive values

  // Track the accumulated offset while rendering consecutive SVG circles
  let currentAccumulated = 0

  return (
    <div className="grid grid-cols-12 gap-6 outline-none">
      {/* Dashboard KPI cards section */}
      <div className="col-span-12 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card showing the visual circular project completion percentage */}
        <PageCard className="p-6 flex flex-col items-center justify-center text-center relative overflow-hidden bg-linear-to-br from-card to-card/50">
          <div className="absolute top-3 left-4 flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
            <TrendingUp className="size-3.5 text-emerald-500" />
            Tiến độ dự án (Progress)
          </div>
          <div className="relative flex items-center justify-center my-6">
            {/* SVG Progress Circle */}
            <svg className="size-32 transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="50"
                className="stroke-muted/30"
                strokeWidth="10"
                fill="transparent"
              />
              <circle
                cx="64"
                cy="64"
                r="50"
                className="stroke-emerald-500 transition-all duration-500"
                strokeWidth="10"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 50}
                strokeDashoffset={2 * Math.PI * 50 * (1 - completionRate / 100)}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-foreground">{completionRate}%</span>
              <span className="text-[10px] text-muted-foreground font-medium">Hoàn thành</span>
            </div>
          </div>
          <div className="text-xs font-semibold text-muted-foreground">
            Đã hoàn thành <span className="text-emerald-500 font-bold">{done}</span> trên tổng số{" "}
            <span className="text-foreground font-bold">{totalTasksCount}</span> công việc
          </div>
        </PageCard>

        {/* Status Distribution Chart Card */}
        <PageCard className="p-6 col-span-1 lg:col-span-2 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden bg-linear-to-br from-card to-card/50">
          <div className="absolute top-3 left-4 flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
            <BarChart3 className="size-3.5 text-blue-500" />
            Trạng thái công việc (Task Status)
          </div>

          {/* Donut Chart SVG */}
          <div className="relative flex items-center justify-center size-36 mt-4 md:mt-0 shrink-0">
            {totalTasksCount === 0 ? (
              <div className="flex flex-col items-center justify-center text-center">
                <svg className="size-32">
                  <circle
                    cx="64"
                    cy="64"
                    r="50"
                    className="stroke-muted/20"
                    strokeWidth="12"
                    fill="transparent"
                  />
                </svg>
                <div className="absolute text-[10px] text-muted-foreground font-medium">
                  Không có dữ liệu
                </div>
              </div>
            ) : (
              <>
                <svg className="size-32 transform -rotate-90">
                  {segments.map((seg, idx) => {
                    const segmentPercent = (seg.value / totalTasksCount) * 100
                    const accumulatedOffset = -(currentAccumulated / 100) * circumference
                    currentAccumulated += segmentPercent
                    return (
                      <circle
                        key={idx}
                        cx="64"
                        cy="64"
                        r={radius}
                        className={`${seg.color} transition-all duration-300 hover:opacity-85`}
                        strokeWidth={strokeWidth}
                        fill="transparent"
                        strokeDasharray={`${(segmentPercent / 100) * circumference} ${circumference}`}
                        strokeDashoffset={accumulatedOffset}
                      />
                    )
                  })}
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-2xl font-black text-foreground">{totalTasksCount}</span>
                  <span className="text-[10px] text-muted-foreground font-medium">Công việc</span>
                </div>
              </>
            )}
          </div>

          {/* Legend Grid */}
          <div className="w-full grid grid-cols-2 gap-3 mt-4 md:mt-0">
            {segments.length === 0 ? (
              <div className="col-span-2 text-xs text-muted-foreground italic text-center py-4">
                Chưa có thống kê trạng thái.
              </div>
            ) : (
              segments.map((seg, idx) => {
                const percent =
                  totalTasksCount > 0 ? Math.round((seg.value / totalTasksCount) * 100) : 0
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-xl border border-border/40 bg-muted/10 hover:bg-muted/20 transition-all duration-200"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`size-2.5 rounded-full ${seg.bg} shrink-0`} />
                      <span className="text-xs font-semibold text-muted-foreground truncate">
                        {seg.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <span className="text-xs font-bold text-foreground">{seg.value}</span>
                      <span className="text-[9px] text-muted-foreground font-medium">
                        ({percent}%)
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </PageCard>
      </div>
      {/* Issue Tracking statistics panel */}
      <div className="col-span-12 xl:col-span-7 space-y-6">
        <PageCard className="p-6">
          <h3 className="font-bold text-base text-foreground mb-4 border-b border-border pb-2">
            Thống kê công việc (Issue Tracking)
          </h3>
          <div className="relative overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent h-10">
                  <TableHead className="font-semibold text-xs">Loại Tracker</TableHead>
                  <TableHead className="font-semibold text-xs text-center w-24">
                    Đang mở (Open)
                  </TableHead>
                  <TableHead className="font-semibold text-xs text-center w-24">
                    Đã đóng (Closed)
                  </TableHead>
                  <TableHead className="font-semibold text-xs text-right w-24">Tổng cộng</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Render status totals for each task tracker type */}
                {TASK_TRACKERS.map((tr) => {
                  const stat = trackerStats.get(tr) || { open: 0, closed: 0, total: 0 }
                  if (stat.total === 0) return null // Skip showing trackers that contain no tasks
                  return (
                    <TableRow key={tr} className="h-12 hover:bg-muted/30">
                      <TableCell className="font-bold text-xs uppercase text-muted-foreground">
                        {tr}
                      </TableCell>
                      <TableCell className="text-center font-semibold text-xs text-blue-600 dark:text-blue-400">
                        {stat.open}
                      </TableCell>
                      <TableCell className="text-center font-semibold text-xs text-emerald-600 dark:text-emerald-400">
                        {stat.closed}
                      </TableCell>
                      <TableCell className="text-right font-bold text-xs">{stat.total}</TableCell>
                    </TableRow>
                  )
                })}
                {/* Show empty placeholder text if no tasks are present in project */}
                {totalTasksCount === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-xs text-muted-foreground py-6"
                    >
                      Chưa có công việc nào được tạo.
                    </TableCell>
                  </TableRow>
                )}
                {/* Render total summary row representing all tasks */}
                {totalTasksCount > 0 && (
                  <TableRow className="bg-muted/20 font-bold">
                    <TableCell className="font-bold text-xs">Tổng hợp</TableCell>
                    <TableCell className="text-center text-xs text-blue-600 dark:text-blue-400">
                      {openTasksCount}
                    </TableCell>
                    <TableCell className="text-center text-xs text-emerald-600 dark:text-emerald-400">
                      {closedTasksCount}
                    </TableCell>
                    <TableCell className="text-right text-xs">{totalTasksCount}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </PageCard>

        {/* Spent Time tracking metrics summary card */}
        <PageCard className="p-6">
          <h3 className="font-bold text-base text-foreground mb-4 border-b border-border pb-2 flex items-center gap-1.5">
            <Clock className="size-4 text-muted-foreground" />
            Thời gian hoạt động (Spent Time)
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-border p-4 bg-muted/20 flex flex-col justify-center">
              <span className="text-xs text-muted-foreground font-semibold">
                Ước tính (Estimated)
              </span>
              <span className="text-2xl font-black mt-1 text-foreground">
                {totalEstimatedHours.toFixed(1)} <span className="text-xs font-normal">giờ</span>
              </span>
            </div>
            <div className="rounded-xl border border-border p-4 bg-primary/5 flex flex-col justify-center">
              <span className="text-xs text-primary font-semibold">Thực tế đã dùng (Spent)</span>
              <span className="text-2xl font-black mt-1 text-primary">
                {totalSpentHours.toFixed(1)} <span className="text-xs font-normal">giờ</span>
              </span>
            </div>
          </div>
        </PageCard>

        <ProjectCapacityCopilotCard
          projectId={projectId}
          members={members}
          dealTargetPercent={project.dealTargetPercent}
        />
      </div>

      {/* Members and team assignment list panel */}
      <div className="col-span-12 xl:col-span-5 space-y-6">
        <PageCard className="p-6">
          <div className="flex items-center justify-between mb-4 border-b border-border pb-2">
            <h3 className="font-bold text-base text-foreground flex items-center gap-1.5">
              <Users className="size-4 text-muted-foreground" />
              Thành viên ({members.length})
            </h3>
          </div>
          <div className="space-y-4">
            {/* Team Leader details block */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Trưởng dự án (Leader)
              </span>
              {project.teamLeader ? (
                <div className="flex items-center justify-between mt-1.5 bg-muted/20 p-2.5 rounded-xl border border-border/50">
                  <div>
                    <div className="text-sm font-semibold text-foreground">
                      {project.teamLeader.fullName}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      {project.teamLeader.email}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic mt-1">Chưa có Trưởng nhóm</p>
              )}
            </div>

            {/* Team Members scroll area mapping */}
            <div className="space-y-2 pt-2 border-t border-border/40">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-2">
                Thành viên tham gia
              </span>
              <div className="space-y-2 max-h-70 overflow-y-auto pr-1">
                {members.length > 0 ? (
                  members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-2 rounded-xl hover:bg-muted/30 border border-transparent transition-colors"
                    >
                      <div>
                        <div className="text-xs font-semibold text-foreground">
                          {member.employee?.fullName || "Chưa rõ"}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          {member.employee?.email || ""}
                          {member.role?.name ? ` · ${member.role.name}` : ""}
                        </div>
                        {(member.hourlyRate != null || member.workMode) && (
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            {/* PT: rate × approved hours = payroll; workMode drives GPS rules */}
                            {member.hourlyRate != null
                              ? `${member.hourlyRate.toLocaleString("vi-VN")} đ/giờ`
                              : null}
                            {member.hourlyRate != null && member.workMode ? " · " : null}
                            {member.workMode
                              ? getProjectMemberWorkModeLabel(member.workMode)
                              : null}
                          </div>
                        )}
                      </div>

                      {/* Edit / remove actions for project team managers */}
                      {canManageMembers && (
                        <div className="flex items-center gap-1">
                          {onEditMember && (
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              className="text-primary hover:bg-primary/10 rounded-full cursor-pointer text-xs h-7 px-3"
                              onClick={() => {
                                onEditMember(member)
                              }}
                            >
                              Sửa
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            className="text-destructive hover:bg-destructive/10 rounded-full cursor-pointer text-xs h-7 px-3"
                            onClick={() => {
                              onRemoveMember(member.employeeId)
                            }}
                          >
                            Xóa
                          </Button>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground italic">Chưa có thành viên nào.</p>
                )}
              </div>
            </div>
          </div>
        </PageCard>
      </div>
    </div>
  )
}
