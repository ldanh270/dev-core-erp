import LogTimeModal from "@/components/features/project/LogTimeModal"
import { TaskAssigneeAiModal } from "@/components/features/project/TaskAssigneeAiModal"
import { TaskDetailEditDialog } from "@/components/features/project/task-detail/TaskDetailEditDialog"
import type { ProjectTaskStatus } from "@/types/project-task-status.types"
import type { ProjectMember } from "@/types/project.types"
import type { SpentTime } from "@/types/spent-time.types"
import type { Task } from "@/types/task.types"

interface TaskDetailModalsProps {
  task: Task
  isOpenLogTimeModal: boolean
  setIsOpenLogTimeModal: (open: boolean) => void
  editingSpentTime?: SpentTime
  totalSpentHours: number
  isOpenAiModal: boolean
  setIsOpenAiModal: (open: boolean) => void
  onAssign: (assigneeId: string) => void
  isOpenEditModal: boolean
  setIsOpenEditModal: (open: boolean) => void
  taskTitle: string
  setTaskTitle: (v: string) => void
  taskDesc: string
  setTaskDesc: (v: string) => void
  taskTracker: string
  setTaskTracker: (v: string) => void
  taskPriority: string
  setTaskPriority: (v: string) => void
  taskStatusId: string
  setTaskStatusId: (v: string) => void
  taskAssignee: string
  setTaskAssignee: (v: string) => void
  taskStart: string
  setTaskStart: (v: string) => void
  taskDue: string
  setTaskDue: (v: string) => void
  taskEstimate: string
  setTaskEstimate: (v: string) => void
  taskProgress: number
  setTaskProgress: (v: number) => void
  resultNotes: string
  setResultNotes: (v: string) => void
  resultUrl: string
  setResultUrl: (v: string) => void
  resultTab: "report" | "optional"
  setResultTab: (v: "report" | "optional") => void
  editError: string | null
  trackersToDisplay: string[]
  formatTracker: (code: string) => string
  statuses: ProjectTaskStatus[]
  members: ProjectMember[]
  isUpdating: boolean
  onSubmit: (e: React.FormEvent) => void
  onOpenAiModal: () => void
}

/** Modal coordinator for task modification, time logging, and review flows. */
export function TaskDetailModals({
  task,
  isOpenLogTimeModal,
  setIsOpenLogTimeModal,
  editingSpentTime,
  totalSpentHours,
  isOpenAiModal,
  setIsOpenAiModal,
  onAssign,
  isOpenEditModal,
  setIsOpenEditModal,
  taskTitle,
  setTaskTitle,
  taskDesc,
  setTaskDesc,
  taskTracker,
  setTaskTracker,
  taskPriority,
  setTaskPriority,
  taskStatusId,
  setTaskStatusId,
  taskAssignee,
  setTaskAssignee,
  taskStart,
  setTaskStart,
  taskDue,
  setTaskDue,
  taskEstimate,
  setTaskEstimate,
  taskProgress,
  setTaskProgress,
  resultNotes,
  setResultNotes,
  resultUrl,
  setResultUrl,
  resultTab,
  setResultTab,
  editError,
  trackersToDisplay,
  formatTracker,
  statuses,
  members,
  isUpdating,
  onSubmit,
  onOpenAiModal,
}: TaskDetailModalsProps) {
  return (
    <>
      <LogTimeModal
        open={isOpenLogTimeModal}
        onOpenChange={setIsOpenLogTimeModal}
        taskId={task.id}
        taskTitle={task.title}
        spentTime={editingSpentTime}
        estimatedTime={task.estimatedTime}
        loggedHours={totalSpentHours}
      />

      <TaskAssigneeAiModal
        isOpen={isOpenAiModal}
        onOpenChange={setIsOpenAiModal}
        taskId={task.id}
        onAssign={onAssign}
      />

      <TaskDetailEditDialog
        open={isOpenEditModal}
        onOpenChange={setIsOpenEditModal}
        taskTitle={taskTitle}
        setTaskTitle={setTaskTitle}
        taskDesc={taskDesc}
        setTaskDesc={setTaskDesc}
        taskTracker={taskTracker}
        setTaskTracker={setTaskTracker}
        taskPriority={taskPriority}
        setTaskPriority={setTaskPriority}
        taskStatusId={taskStatusId}
        setTaskStatusId={setTaskStatusId}
        taskAssignee={taskAssignee}
        setTaskAssignee={setTaskAssignee}
        taskStart={taskStart}
        setTaskStart={setTaskStart}
        taskDue={taskDue}
        setTaskDue={setTaskDue}
        taskEstimate={taskEstimate}
        setTaskEstimate={setTaskEstimate}
        taskProgress={taskProgress}
        setTaskProgress={setTaskProgress}
        resultNotes={resultNotes}
        setResultNotes={setResultNotes}
        resultUrl={resultUrl}
        setResultUrl={setResultUrl}
        resultTab={resultTab}
        setResultTab={setResultTab}
        editError={editError}
        trackersToDisplay={trackersToDisplay}
        formatTracker={formatTracker}
        statuses={statuses}
        members={members}
        isUpdating={isUpdating}
        onSubmit={onSubmit}
        onOpenAiModal={onOpenAiModal}
      />
    </>
  )
}
