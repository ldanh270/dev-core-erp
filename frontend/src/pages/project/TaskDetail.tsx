import { DetailNotFound, PageContainer } from "@/components/common"
import { TaskDetailContentLayout } from "@/components/features/project/TaskDetailContentLayout"
import { TaskDetailSkeleton } from "@/components/features/project/TaskDetailSkeleton"
import { TaskDetailHeader } from "@/components/features/project/task-detail/TaskDetailHeader"
import { TaskDetailModals } from "@/components/features/project/task-detail/TaskDetailModals"
import { useTaskDetail } from "@/hooks/project/use-task-detail"

import { useNavigate } from "react-router-dom"

/**
 * Tier 2 Page Orchestrator for project task detail.
 */
export default function TaskDetail() {
  const navigate = useNavigate()
  const {
    projectId,
    task,
    isLoadingTask,
    spentTimes,
    isLoadingSpent,
    totalSpentHours,
    members,
    statuses,
    siblingTasks,
    prevTaskId,
    nextTaskId,
    currentTaskIndex,
    trackersToDisplay,
    formatTracker,
    canEditTask,
    isAdminOrGM,
    isLeader,
    isCreator,
    canApproveSpentTime,
    user,
    isOpenLogTimeModal,
    setIsOpenLogTimeModal,
    isOpenEditModal,
    setIsOpenEditModal,
    isOpenAiModal,
    setIsOpenAiModal,
    editingSpentTime,
    setEditingSpentTime,
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
    handleOpenEdit,
    handleDeleteTask,
    handleNavigateSibling,
    handleUpdateSubmit,
    isUpdating,
    approveSpentTimeMutation,
    rejectSpentTimeMutation,
    deleteSpentTimeMutation,
  } = useTaskDetail()

  if (isLoadingTask) {
    return <TaskDetailSkeleton />
  }

  if (!task) {
    return (
      <DetailNotFound
        title="Không tìm thấy công việc"
        description="Công việc không tồn tại hoặc đã bị xóa."
        onBack={() => navigate(-1)}
      />
    )
  }

  const canDeleteTask = isAdminOrGM || isLeader || isCreator

  return (
    <PageContainer variant="default" className="space-y-6">
      <TaskDetailHeader
        task={task}
        projectId={projectId}
        siblingTasksLength={siblingTasks.length}
        currentTaskIndex={currentTaskIndex}
        prevTaskId={prevTaskId}
        nextTaskId={nextTaskId}
        canEditTask={canEditTask}
        canDeleteTask={canDeleteTask}
        onNavigateSibling={handleNavigateSibling}
        onLogTime={() => {
          setEditingSpentTime(undefined)
          setIsOpenLogTimeModal(true)
        }}
        onOpenEdit={handleOpenEdit}
        onDeleteTask={handleDeleteTask}
      />

      <TaskDetailContentLayout
        task={task}
        statuses={statuses}
        spentTimes={spentTimes}
        isLoadingSpent={isLoadingSpent}
        totalSpentHours={totalSpentHours}
        currentUserId={user?.id}
        isAdminOrGM={isAdminOrGM}
        canApproveSpentTime={canApproveSpentTime}
        onApproveSpentTime={(logId) => approveSpentTimeMutation.mutate(logId)}
        onRejectSpentTime={(logId, reason) => rejectSpentTimeMutation.mutate({ logId, reason })}
        onEditSpentTime={(st) => {
          setEditingSpentTime(st)
          setIsOpenLogTimeModal(true)
        }}
        onDeleteSpentTime={(logId) => deleteSpentTimeMutation.mutate(logId)}
      />

      <TaskDetailModals
        task={task}
        isOpenLogTimeModal={isOpenLogTimeModal}
        setIsOpenLogTimeModal={setIsOpenLogTimeModal}
        editingSpentTime={editingSpentTime}
        totalSpentHours={totalSpentHours}
        isOpenAiModal={isOpenAiModal}
        setIsOpenAiModal={setIsOpenAiModal}
        onAssign={setTaskAssignee}
        isOpenEditModal={isOpenEditModal}
        setIsOpenEditModal={setIsOpenEditModal}
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
        onSubmit={handleUpdateSubmit}
        onOpenAiModal={() => setIsOpenAiModal(true)}
      />
    </PageContainer>
  )
}
