import { DatePicker, PageCard } from "@/components/common"
import { TaskAttachmentDropzone } from "@/components/features/project/TaskAttachmentDropzone"
import { TaskWatchersSelect } from "@/components/features/project/TaskWatchersSelect"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TASK_PRIORITIES } from "@/config/entities/project.config"
import type { ProjectTaskStatus } from "@/types/project-task-status.types"
import type { ProjectMember } from "@/types/project.types"
import type { Task, TaskPriority, TaskTracker } from "@/types/task.types"
import { formatPriority } from "@/utils/formatters"

import React from "react"

const PROGRESS_OPTIONS: number[] = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]

export interface NewTaskFormProps {
  formId?: string
  onSubmit: (e: React.FormEvent, createAnother: boolean) => void
  taskError: string | null
  taskTracker: TaskTracker
  setTaskTracker: (tracker: TaskTracker) => void
  allowedTrackers: string[]
  formatTracker: (tracker: string) => string
  taskStatusId: string
  setTaskStatusId: (statusId: string) => void
  statuses: ProjectTaskStatus[]
  taskTitle: string
  setTaskTitle: (title: string) => void
  taskDesc: string
  setTaskDesc: (desc: string) => void
  taskPriority: TaskPriority
  setTaskPriority: (priority: TaskPriority) => void
  taskAssignee: string
  setTaskAssignee: (assignee: string) => void
  members: ProjectMember[]
  parentTask: string
  setParentTask: (parentTask: string) => void
  projectTasks: Task[]
  taskStart: string
  setTaskStart: (date: string) => void
  taskDue: string
  setTaskDue: (date: string) => void
  taskEstimate: string
  setTaskEstimate: (estimate: string) => void
  taskProgress: string
  setTaskProgress: (progress: string) => void
  selectedFiles: File[]
  setSelectedFiles: React.Dispatch<React.SetStateAction<File[]>>
  isDragOver: boolean
  setIsDragOver: (dragOver: boolean) => void
  selectedWatchers: string[]
  isLoadingMembers: boolean
  handleToggleWatcher: (empId: string) => void
  handleSelectAllWatchers: () => void
}

/**
 * Presenter component that renders the full New Task form content.
 */
export const NewTaskForm: React.FC<NewTaskFormProps> = ({
  formId = "new-task-form",
  onSubmit,
  taskError,
  taskTracker,
  setTaskTracker,
  allowedTrackers,
  formatTracker,
  taskStatusId,
  setTaskStatusId,
  statuses,
  taskTitle,
  setTaskTitle,
  taskDesc,
  setTaskDesc,
  taskPriority,
  setTaskPriority,
  taskAssignee,
  setTaskAssignee,
  members,
  parentTask,
  setParentTask,
  projectTasks,
  taskStart,
  setTaskStart,
  taskDue,
  setTaskDue,
  taskEstimate,
  setTaskEstimate,
  taskProgress,
  setTaskProgress,
  selectedFiles,
  setSelectedFiles,
  isDragOver,
  setIsDragOver,
  selectedWatchers,
  isLoadingMembers,
  handleToggleWatcher,
  handleSelectAllWatchers,
}) => {
  return (
    <form
      id={formId}
      onSubmit={(e) => {
        void onSubmit(e, false)
      }}
      className="space-y-6"
    >
      {taskError && (
        <div className="p-3 text-xs font-semibold text-destructive bg-destructive/10 border border-destructive/20 rounded-xl">
          {taskError}
        </div>
      )}

      <PageCard className="p-6 space-y-6">
        {/* Basic Info: Tracker & Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label
              htmlFor="tracker"
              className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider"
            >
              LOẠI CÔNG VIỆC (TRACKER)
            </Label>
            <Select
              value={taskTracker}
              onValueChange={(val) => {
                setTaskTracker(val as TaskTracker)
              }}
            >
              <SelectTrigger
                id="tracker"
                className="w-full border-border rounded-full bg-background"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" className="rounded-xl border-border bg-popover">
                {allowedTrackers.map((tr) => (
                  <SelectItem key={tr} value={tr} className="rounded-lg">
                    {formatTracker(tr)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="status"
              className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider"
            >
              TRẠNG THÁI
            </Label>
            <Select value={taskStatusId} onValueChange={setTaskStatusId}>
              <SelectTrigger
                id="status"
                className="w-full border-border rounded-full bg-background"
              >
                <SelectValue placeholder="Chọn trạng thái..." />
              </SelectTrigger>
              <SelectContent position="popper" className="rounded-xl border-border bg-popover">
                {statuses.map((st: ProjectTaskStatus) => (
                  <SelectItem key={st.id} value={st.id} className="rounded-lg">
                    <span className="flex items-center gap-2">
                      <span
                        className="size-2 rounded-full shrink-0"
                        style={{ backgroundColor: st.color }}
                      />
                      {st.name} {st.isDefault && " (Mặc định)"}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <Label
            htmlFor="subject"
            className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider"
          >
            TIÊU ĐỀ <span className="text-destructive">*</span>
          </Label>
          <Input
            id="subject"
            placeholder="Mô tả ngắn gọn công việc"
            value={taskTitle}
            onChange={(e) => {
              setTaskTitle(e.target.value)
            }}
            className="border-border rounded-full bg-background font-medium"
            required
          />
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <Label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">
            MÔ TẢ CHI TIẾT
          </Label>
          <RichTextEditor
            value={taskDesc}
            onChange={setTaskDesc}
            placeholder="Nhập mô tả chi tiết, tiêu chí nghiệm thu..."
          />
        </div>

        {/* Planning & Assignments */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-border">
          <div className="space-y-1.5">
            <Label
              htmlFor="priority"
              className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider"
            >
              MỨC ĐỘ ƯU TIÊN
            </Label>
            <Select
              value={taskPriority}
              onValueChange={(val) => {
                setTaskPriority(val as TaskPriority)
              }}
            >
              <SelectTrigger
                id="priority"
                className="w-full border-border rounded-full bg-background"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" className="rounded-xl border-border bg-popover">
                {TASK_PRIORITIES.map((pr: TaskPriority) => (
                  <SelectItem key={pr} value={pr} className="rounded-lg">
                    {formatPriority(pr)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="assignee"
              className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider"
            >
              NGƯỜI THỰC HIỆN
            </Label>
            <Select value={taskAssignee} onValueChange={setTaskAssignee}>
              <SelectTrigger
                id="assignee"
                className="w-full border-border rounded-full bg-background"
              >
                <SelectValue placeholder="Chưa phân công" />
              </SelectTrigger>
              <SelectContent position="popper" className="rounded-xl border-border bg-popover">
                <SelectItem value="none">-- Chưa phân công --</SelectItem>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.employeeId}>
                    {m.employee?.fullName || "Chưa rõ"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="parentTask"
              className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider"
            >
              CÔNG VIỆC CHA (NẾU CÓ)
            </Label>
            <Select value={parentTask} onValueChange={setParentTask}>
              <SelectTrigger
                id="parentTask"
                className="w-full border-border rounded-full bg-background"
              >
                <SelectValue placeholder="Không có" />
              </SelectTrigger>
              <SelectContent position="popper" className="rounded-xl border-border bg-popover">
                <SelectItem value="none">-- Không có --</SelectItem>
                {projectTasks.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    #{t.id ? t.id.slice(-6).toUpperCase() : ""} - {t.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">
              NGÀY BẮT ĐẦU
            </Label>
            <DatePicker
              value={taskStart || null}
              onChange={(val) => {
                setTaskStart(val || "")
              }}
              placeholder="Chọn ngày bắt đầu..."
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">
              HẠN HOÀN THÀNH
            </Label>
            <DatePicker
              value={taskDue || null}
              minDate={taskStart}
              onChange={(val) => {
                setTaskDue(val || "")
              }}
              placeholder="Chọn hạn hoàn thành..."
            />
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="estimate"
              className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider"
            >
              ƯỚC TÍNH (GIỜ)
            </Label>
            <Input
              id="estimate"
              type="number"
              min="0"
              step="0.5"
              placeholder="VD: 8"
              value={taskEstimate}
              onChange={(e) => {
                setTaskEstimate(e.target.value)
              }}
              className="border-border rounded-full bg-background font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="progress"
              className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider"
            >
              TIẾN ĐỘ (%)
            </Label>
            <Select value={taskProgress} onValueChange={setTaskProgress}>
              <SelectTrigger
                id="progress"
                className="w-full border-border rounded-full bg-background font-mono"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" className="rounded-xl border-border bg-popover">
                {PROGRESS_OPTIONS.map((pct: number) => (
                  <SelectItem key={pct} value={String(pct)}>
                    {pct}%
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Attachments & Watchers */}
        <div className="space-y-4 pt-4 border-t border-border">
          <Label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">
            TỆP ĐÍNH KÈM
          </Label>
          <TaskAttachmentDropzone
            selectedFiles={selectedFiles}
            onFilesChange={setSelectedFiles}
            isDragOver={isDragOver}
            onDragOverChange={setIsDragOver}
          />

          <TaskWatchersSelect
            members={members}
            isLoadingMembers={isLoadingMembers}
            selectedWatchers={selectedWatchers}
            onToggleWatcher={handleToggleWatcher}
            onSelectAllWatchers={handleSelectAllWatchers}
          />
        </div>
      </PageCard>
    </form>
  )
}
