import { EntityFormPage } from "@/components/common"
import { NewTaskForm } from "@/components/features/project/NewTaskForm"
import { useNewTaskForm } from "@/hooks/project/use-new-task-form"

import { useNavigate } from "react-router-dom"

/**
 * Tier 2 Page Orchestrator for creating a new task within a project.
 */
export default function NewTask() {
  const navigate = useNavigate()
  const {
    project,
    members,
    isLoadingMembers,
    projectTasks,
    statuses,
    allowedTrackers,
    taskTitle,
    setTaskTitle,
    taskDesc,
    setTaskDesc,
    taskTracker,
    setTaskTracker,
    taskStatusId,
    setTaskStatusId,
    taskPriority,
    setTaskPriority,
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
    parentTask,
    setParentTask,
    taskError,
    selectedWatchers,
    selectedFiles,
    setSelectedFiles,
    isDragOver,
    setIsDragOver,
    isPending,
    handleSubmit,
    handleSubmitAnother,
    formatTracker,
    handleSelectAllWatchers,
    handleToggleWatcher,
  } = useNewTaskForm()

  return (
    <EntityFormPage
      title={`Tạo công việc mới — ${project?.name || "Dự án"}`}
      onBack={() => {
        navigate(-1)
      }}
      formId="new-task-form"
      isPending={isPending}
      submitLabel="Tạo công việc"
      cancelLabel="Hủy"
      secondaryAction={{
        label: "Tạo và thêm tiếp",
        onClick: handleSubmitAnother,
      }}
    >
      <NewTaskForm
        formId="new-task-form"
        onSubmit={handleSubmit}
        taskError={taskError}
        taskTracker={taskTracker}
        setTaskTracker={setTaskTracker}
        allowedTrackers={allowedTrackers}
        formatTracker={formatTracker}
        taskStatusId={taskStatusId}
        setTaskStatusId={setTaskStatusId}
        statuses={statuses}
        taskTitle={taskTitle}
        setTaskTitle={setTaskTitle}
        taskDesc={taskDesc}
        setTaskDesc={setTaskDesc}
        taskPriority={taskPriority}
        setTaskPriority={setTaskPriority}
        taskAssignee={taskAssignee}
        setTaskAssignee={setTaskAssignee}
        members={members}
        parentTask={parentTask}
        setParentTask={setParentTask}
        projectTasks={projectTasks}
        taskStart={taskStart}
        setTaskStart={setTaskStart}
        taskDue={taskDue}
        setTaskDue={setTaskDue}
        taskEstimate={taskEstimate}
        setTaskEstimate={setTaskEstimate}
        taskProgress={taskProgress}
        setTaskProgress={setTaskProgress}
        selectedFiles={selectedFiles}
        setSelectedFiles={setSelectedFiles}
        isDragOver={isDragOver}
        setIsDragOver={setIsDragOver}
        selectedWatchers={selectedWatchers}
        isLoadingMembers={isLoadingMembers}
        handleToggleWatcher={handleToggleWatcher}
        handleSelectAllWatchers={handleSelectAllWatchers}
      />
    </EntityFormPage>
  )
}
