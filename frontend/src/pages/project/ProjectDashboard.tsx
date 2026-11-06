// Import layout containers and custom UI elements
import { AppPagination, PageCard, PageContainer, PageHeader, StatusPill } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
// Import custom UI tables
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
// Import project and task API wrappers
import { projectApi } from "@/lib/api/project.api"
import { taskApi } from "@/lib/api/task.api"
// Import authentication store for current employee details
import { useAuthStore } from "@/store/auth-store"
// Import TanStack Query hooks for client state cache and mutations
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
// Import Lucide icons for layouts
import { ClipboardList, ExternalLink, Inbox, Folder, User, Plus } from "lucide-react"
// Import React Router Navigation link
import { Link, useNavigate } from "react-router-dom"
// Import standard React hooks
import { useState, useEffect } from "react"
// Import Toast notifications provider
import { toast } from "sonner"
// Import Spent Time log modal feature component
import LogTimeModal from "@/components/features/project/LogTimeModal"
import { TaskContextMenu } from "./components/task-context-menu"
import { usePermission } from "@/hooks/use-permission"
// Import Task data type structure
import type { Task } from "@/types/task.types"

// Main component to render the employee project portal ("My Page")
/**
 * ProjectDashboard Component.
 */
export default function ProjectDashboard() {
  // Retrieve current user session information
  const { user } = useAuthStore()
  const { hasAnyPermission } = usePermission()
  // Initialize navigation
  const navigate = useNavigate()
  // Initialize react-query client to manage caching
  const queryClient = useQueryClient()
 
  // State to track right-click/context menu positioning, visibility, and targeted task details
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean
    x: number
    y: number
    task: Task | null
  }>({
    isOpen: false,
    x: 0,
    y: 0,
    task: null,
  })

  // State to handle Log Time Modal visibility and target task properties
  const [isLogTimeOpen, setIsLogTimeOpen] = useState(false)
  const [logTimeTask, setLogTimeTask] = useState<{ id: string; title: string } | null>(null)

  // State to handle pagination bounds for the two task tables
  const [assignedPage, setAssignedPage] = useState(1)
  const [reportedPage, setReportedPage] = useState(1)
  const tasksLimit = 10 // Max tasks per page

  // 1. Query hook to fetch tasks assigned to the current employee
  const { data: assignedTasksData, isLoading: isLoadingAssigned } = useQuery({
    queryKey: ["tasks", "assigned", user?.id, assignedPage],
    queryFn: () => taskApi.list({ assigneeId: user?.id, page: assignedPage, limit: tasksLimit }),
    enabled: !!user?.id,
  })

  // 2. Query hook to fetch tasks created/reported by the current employee
  const { data: reportedTasksData, isLoading: isLoadingReported } = useQuery({
    queryKey: ["tasks", "reported", user?.id, reportedPage],
    queryFn: () => taskApi.list({ createdById: user?.id, page: reportedPage, limit: tasksLimit }),
    enabled: !!user?.id,
  })

  // 3. Query hook to fetch projects that the employee is currently involved in
  const { data: projectsData, isLoading: isLoadingProjects } = useQuery({
    queryKey: ["projects", "dashboard", user?.id],
    queryFn: () => projectApi.list({ limit: 100 }),
    enabled: !!user?.id,
  })

  // 4. Query hook to fetch members of the project linked to the active task in the context menu
  const { data: activeProjectMembers } = useQuery({
    queryKey: ["members", contextMenu.task?.projectId],
    queryFn: () => projectApi.getMembers(contextMenu.task?.projectId || ""),
    enabled: !!contextMenu.task?.projectId,
  })

  // Safely extract arrays, defaulting to empty arrays if queries return undefined
  const assignedTasks = assignedTasksData?.data || []
  const reportedTasks = reportedTasksData?.data || []
  const projects = projectsData?.data || []

  // Hook to close the floating context menu if a click occurs outside its boundary
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const menu = document.getElementById("dashboard-context-menu")
      if (menu && !menu.contains(e.target as Node)) {
        setContextMenu({ isOpen: false, x: 0, y: 0, task: null })
      }
    }
    if (contextMenu.isOpen) {
      document.addEventListener("click", handleOutsideClick)
    }
    return () => {
      document.removeEventListener("click", handleOutsideClick)
    }
  }, [contextMenu.isOpen])

  // Mutation hook to handle task updates triggered via context menu submenu selections
  const updateTaskMutation = useMutation({
    mutationFn: async (payload: { taskId: string; data: Record<string, unknown> }) => {
      return taskApi.update(payload.taskId, payload.data)
    },
    // On success, invalidate tasks queries, show success toast, and close the context menu
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tasks"] })
      toast.success("Issue updated successfully")
      setContextMenu({ isOpen: false, x: 0, y: 0, task: null })
    },
    // On error, extract the backend error message if available and display error toast
    onError: (err: unknown) => {
      let errorMessage = "Failed to update issue"
      if (err && typeof err === "object" && "response" in err) {
        const response = (err as { response?: { data?: { error?: { message?: string } } } }).response
        if (response?.data?.error?.message) {
          errorMessage = response.data.error.message
        }
      } else if (err instanceof Error) {
        errorMessage = err.message
      }
      toast.error(errorMessage)
    },
  })

  // Event handler to trigger update mutation from context menu options
  const handleUpdateTask = (data: Record<string, unknown>) => {
    if (!contextMenu.task) return
    updateTaskMutation.mutate({ taskId: contextMenu.task.id, data })
  }

  // Event handler to capture right clicks (contextmenu) on task rows
  const handleRowContextMenu = (e: React.MouseEvent, task: Task) => {
    e.preventDefault()
    let x = e.clientX
    let y = e.clientY
    const menuHeight = 300
    const menuWidth = 160

    // Prevent menu from overflowing screen bottom boundaries
    if (y + menuHeight > window.innerHeight) {
      y = window.innerHeight - menuHeight - 10
    }
    // Prevent menu from overflowing screen right boundaries
    if (x + menuWidth > window.innerWidth) {
      x = window.innerWidth - menuWidth - 10
    }

    // Set context menu state to display the menu at mouse coordinates
    setContextMenu({
      isOpen: true,
      x,
      y,
      task,
    })
  }

  // Translation helper for project statuses mapping
  const formatProjectStatus = (status: string) => {
    if (status === "planning") return "Lập kế hoạch"
    if (status === "active") return "Đang chạy"
    if (status === "on_hold") return "Tạm dừng"
    if (status === "completed") return "Hoàn thành"
    if (status === "cancelled") return "Đã hủy"
    return status
  }

  // Helper function to match project status with visual pill color variations
  const getProjectStatusVariant = (status: string) => {
    if (status === "active") return "success"
    if (status === "planning") return "neutral"
    if (status === "on_hold") return "warning"
    if (status === "completed") return "info"
    if (status === "cancelled") return "danger"
    return "neutral"
  }

  // Helper method to render task table representation or show an empty statement
  const renderTaskTable = (tasks: typeof assignedTasks, emptyMessage: string) => {
    // Render fallback screen if table data is empty
    if (tasks.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-secondary p-3 mb-3 text-muted-foreground">
            <Inbox className="size-6" />
          </div>
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        </div>
      )
    }

    return (
      <div className="relative overflow-x-auto rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent h-12">
              <TableHead className="w-16 font-semibold">ID</TableHead>
              <TableHead className="font-semibold">Dự án</TableHead>
              <TableHead className="w-24 font-semibold">Tracker</TableHead>
              <TableHead className="font-semibold">Tiêu đề</TableHead>
              <TableHead className="w-24 font-semibold">Trạng thái</TableHead>
              <TableHead className="w-24 font-semibold">Độ ưu tiên</TableHead>
              <TableHead className="w-16 text-right font-semibold">%</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => {
              // Calculate custom styling based on task priority
              let priorityColor = "bg-secondary text-secondary-foreground"
              if (task.priority === "urgent") priorityColor = "bg-destructive/10 text-destructive border-destructive/20"
              else if (task.priority === "high") priorityColor = "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-500"
              else if (task.priority === "medium") priorityColor = "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400"

              // Calculate custom styling based on task tracker (type)
              let trackerColor = "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200"
              if (task.tracker === "bug") trackerColor = "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
              else if (task.tracker === "feature") trackerColor = "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
              else if (task.tracker === "support") trackerColor = "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300"

              // Check if context menu is currently active and focused on this task row
              const isMenuOpenForTask = contextMenu.isOpen && contextMenu.task?.id === task.id

              return (
                <TableRow
                  key={task.id}
                  // Attach row level context menu capture
                  onContextMenu={(e) => { handleRowContextMenu(e, task); }}
                  className={`h-14 hover:bg-muted/50 transition-colors cursor-default ${
                    isMenuOpenForTask ? "bg-blue-600/15 hover:bg-blue-600/20 dark:bg-blue-950/30" : ""
                  }`}
                >
                  {/* Shortened Task ID */}
                  <TableCell className="font-mono text-xs font-semibold text-muted-foreground">
                    #{task.id.substring(0, 5)}
                  </TableCell>
                  {/* Project name reference */}
                  <TableCell className="font-medium max-w-[120px] truncate">
                    {task.project?.name || "N/A"}
                  </TableCell>
                  {/* Tracker type label */}
                  <TableCell>
                    <Badge variant="outline" className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${trackerColor}`}>
                      {task.tracker}
                    </Badge>
                  </TableCell>
                  {/* Task subject title with direct link to details page */}
                  <TableCell className="max-w-[200px] truncate">
                    <Link
                      to={`/project/task/${task.id}`}
                      className="text-primary font-medium hover:underline inline-flex items-center gap-1 group"
                    >
                      {task.title}
                      <ExternalLink className="size-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </TableCell>
                  {/* Translated Status indicator pill */}
                  <TableCell>
                    <StatusPill
                      label={
                        task.status === "todo"
                          ? "Đang mở"
                          : task.status === "reopened"
                            ? "Mở lại"
                            : task.status === "in_progress"
                              ? "Đang làm"
                              : task.status === "in_review"
                                ? "Đánh giá"
                                : task.status === "done"
                                  ? "Hoàn thành"
                                  : "Đã hủy"
                      }
                      variant={
                        task.status === "done"
                          ? "success"
                          : task.status === "in_progress"
                            ? "warning"
                            : task.status === "reopened"
                              ? "info"
                              : task.status === "in_review"
                                ? "info"
                                : task.status === "cancelled"
                                  ? "danger"
                                  : "neutral"
                      }
                    />
                  </TableCell>
                  {/* Translated Priority badge */}
                  <TableCell>
                    <Badge variant="outline" className={`rounded-full text-[10px] ${priorityColor}`}>
                      {task.priority === "urgent"
                        ? "Khẩn cấp"
                        : task.priority === "high"
                          ? "Cao"
                          : task.priority === "medium"
                            ? "Trung bình"
                            : "Thấp"}
                    </Badge>
                  </TableCell>
                  {/* Progress percent integer */}
                  <TableCell className="text-right font-semibold text-xs">
                    {task.progress}%
                  </TableCell>
                  {/* Action trigger button to open right-click context menu by left-click */}
                  <TableCell className="text-right pr-4">
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        const rect = e.currentTarget.getBoundingClientRect()
                        setContextMenu({
                          isOpen: true,
                          x: rect.left - 120,
                          y: rect.bottom + 5,
                          task,
                        })
                      }}
                      className="text-muted-foreground hover:text-foreground font-black text-sm p-1 rounded hover:bg-muted/40 transition-colors cursor-pointer"
                    >
                      •••
                    </button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    )
  }

  // Renders skeleton layouts during data fetching states
  const renderSkeleton = () => (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full rounded-full" />
      <Skeleton className="h-12 w-full rounded-xl" />
      <Skeleton className="h-12 w-full rounded-xl" />
      <Skeleton className="h-12 w-full rounded-xl" />
    </div>
  )

  // Reusable pagination layout handler using AppPagination
  const renderPagination = (
    currentPage: number,
    totalPages: number,
    totalItems: number,
    _itemsOnPage: number,
    onPageChange: (page: number) => void
  ) => {
    if (totalPages <= 1) return null

    return (
      <div className="pt-2 border-t border-border mt-4">
        <AppPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={tasksLimit}
          onPageChange={onPageChange}
        />
      </div>
    )
  }

  return (
    <PageContainer variant="default" className="space-y-6">
      {/* Page header title details */}
      <PageHeader
        title="Tổng quan của tôi (My Page)"
        description="Quản lý các dự án và công việc được phân công cho bạn"
      />

      {/* 1. Projects Section - Grid representing active user projects */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <div className="rounded-full bg-primary/10 p-2 text-primary">
            <Folder className="size-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-foreground">
              Dự án của tôi ({projects.length})
            </h3>
            <p className="text-xs text-muted-foreground">Các dự án bạn tham gia hoặc quản lý</p>
          </div>
        </div>

        {/* Fetching loading state for projects */}
        {isLoadingProjects ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        ) : projects.length === 0 ? (
          // Empty state fallback visual
          <div className="flex flex-col items-center justify-center py-12 text-center bg-card rounded-xl border border-border">
            <div className="rounded-full bg-secondary p-3 mb-3 text-muted-foreground">
              <Folder className="size-6" />
            </div>
            <p className="text-sm text-muted-foreground">Bạn chưa được tham gia vào dự án nào.</p>
          </div>
        ) : (
          // Projects grid display list
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((proj) => {
              const isLeader = proj.teamLeaderId === user?.id
              const isAdminOrGM = hasAnyPermission(["project.update", "project.task.approve"])
              const canCreateInProj = isAdminOrGM || isLeader || proj.taskCreationPolicy === "all_members"

              // Map member role to badges
              let memberRole = "Thành viên"
              let roleBadgeColor = "bg-secondary text-secondary-foreground"
              if (isLeader) {
                memberRole = "Trưởng nhóm"
                roleBadgeColor = "bg-indigo-500/10 text-indigo-600 border-indigo-500/20 dark:text-indigo-400"
              } else if (isAdminOrGM) {
                memberRole = "Quản trị viên"
                roleBadgeColor = "bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400"
              }

              return (
                <PageCard
                  key={proj.id}
                  className="hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 border border-border/85 flex flex-col justify-between p-5 min-h-[140px] space-y-4 hover:border-primary/50 cursor-pointer group"
                  onClick={() => {
                    sessionStorage.setItem("activeProjectId", proj.id)
                    navigate(`/project/${proj.id}/overview`)
                  }}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <span className="font-bold text-base text-foreground group-hover:text-primary transition-colors line-clamp-1">
                        {proj.name}
                      </span>
                      <StatusPill
                        label={formatProjectStatus(proj.status)}
                        variant={getProjectStatusVariant(proj.status)}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 min-h-[32px]">
                      {proj.description || "Không có mô tả dự án."}
                    </p>
                  </div>

                  <div className="border-t border-border/40 pt-3 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-medium flex items-center gap-1">
                      <User className="size-3.5" />
                      Trưởng nhóm: <span className="font-semibold text-foreground">{proj.teamLeader?.fullName || "Chưa có"}</span>
                    </span>
                    <div className="flex items-center gap-2">
                      {/* Show create task shortcut link if current user matches creation policies */}
                      {canCreateInProj && (
                        <Link
                          to={`/project/${proj.id}/task/new`}
                          onClick={(e) => { e.stopPropagation(); sessionStorage.setItem("activeProjectId", proj.id); }}
                          className="rounded-full bg-primary/10 hover:bg-primary/20 text-primary px-2.5 py-1 font-bold text-[10px] flex items-center gap-1 transition-all duration-200 cursor-pointer"
                        >
                          <Plus className="size-3" />
                          Tạo CV
                        </Link>
                      )}
                      <Badge variant="outline" className={`rounded-full text-[9px] font-black px-2 py-0.5 ${roleBadgeColor}`}>
                        {memberRole}
                      </Badge>
                    </div>
                  </div>
                </PageCard>
              )
            })}
          </div>
        )}
      </div>

      {/* 2. Tasks Grid - Split display panel for Assigned Tasks (left) and Reported Tasks (right) */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Column - Assigned Tasks */}
        <div className="col-span-12 xl:col-span-6 space-y-4">
          <PageCard className="p-6">
            <div className="flex items-center gap-2 mb-4 border-b border-border pb-3">
              <div className="rounded-full bg-primary/10 p-2 text-primary">
                <ClipboardList className="size-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-foreground">
                  Công việc được giao cho tôi ({assignedTasksData?.meta.total || 0})
                </h3>
                <p className="text-xs text-muted-foreground">Các nhiệm vụ bạn cần thực hiện</p>
              </div>
            </div>

            {isLoadingAssigned
              ? renderSkeleton()
              : (
                  <>
                    {renderTaskTable(assignedTasks, "Không có công việc nào được giao cho bạn.")}
                    {renderPagination(
                      assignedPage,
                      assignedTasksData?.meta.totalPages || 0,
                      assignedTasksData?.meta.total || 0,
                      assignedTasks.length,
                      setAssignedPage
                    )}
                  </>
                )}
          </PageCard>
        </div>

        {/* Right Column - Reported Tasks */}
        <div className="col-span-12 xl:col-span-6 space-y-4">
          <PageCard className="p-6">
            <div className="flex items-center gap-2 mb-4 border-b border-border pb-3">
              <div className="rounded-full bg-indigo-500/10 p-2 text-indigo-500">
                <ClipboardList className="size-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-foreground">
                  Công việc tôi đã tạo / báo cáo ({reportedTasksData?.meta.total || 0})
                </h3>
                <p className="text-xs text-muted-foreground">Các nhiệm vụ do bạn báo cáo hoặc tạo ra</p>
              </div>
            </div>

            {isLoadingReported
              ? renderSkeleton()
              : (
                  <>
                    {renderTaskTable(reportedTasks, "Bạn chưa tạo hoặc báo cáo công việc nào.")}
                    {renderPagination(
                      reportedPage,
                      reportedTasksData?.meta.totalPages || 0,
                      reportedTasksData?.meta.total || 0,
                      reportedTasks.length,
                      setReportedPage
                    )}
                  </>
                )}
          </PageCard>
        </div>
      </div>

      {/* Floating Context Menu - Renders dynamically with auto-positioning */}
      <TaskContextMenu
        isOpen={contextMenu.isOpen}
        x={contextMenu.x}
        y={contextMenu.y}
        task={contextMenu.task}
        projectMembers={activeProjectMembers}
        onClose={() => {
          setContextMenu({ isOpen: false, x: 0, y: 0, task: null })
        }}
        onUpdateTask={handleUpdateTask}
        onLogTime={(t) => {
          setLogTimeTask(t)
          setIsLogTimeOpen(true)
        }}
      />

      {/* Reusable Log Time Modal Dialog */}
      {logTimeTask && (
        <LogTimeModal
          open={isLogTimeOpen}
          onOpenChange={setIsLogTimeOpen}
          taskId={logTimeTask.id}
          taskTitle={logTimeTask.title}
        />
      )}
    </PageContainer>
  )
}

