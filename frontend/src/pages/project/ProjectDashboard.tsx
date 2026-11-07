// Import layout containers and custom UI elements
import {
  DataTablePage,
  type DataTableColumn,
  PageCard,
  PageContainer,
  PageHeader,
  StatusPill,
} from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { TYPOGRAPHY } from "@/config/typography.config"
import { cn } from "@/lib/utils"
// Import project and task API wrappers
import { projectApi } from "@/lib/api/project.api"
import { taskApi } from "@/lib/api/task.api"
// Import authentication store for current employee details
import { useAuthStore } from "@/store/auth-store"
// Import TanStack Query hooks for client state cache and mutations
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
// Import Lucide icons for layouts
import {
  ClipboardList,
  ExternalLink,
  Inbox,
  Folder,
  User,
  Plus,
  MoreHorizontal,
} from "lucide-react"
// Import React Router Navigation link
import { Link, useNavigate } from "react-router-dom"
// Import standard React hooks
import { useState, useEffect, useMemo } from "react"
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
  const [assignedLimit, setAssignedLimit] = useState(10)
  const [reportedPage, setReportedPage] = useState(1)
  const [reportedLimit, setReportedLimit] = useState(10)

  // 1. Query hook to fetch tasks assigned to the current employee
  const { data: assignedTasksData, isLoading: isLoadingAssigned } = useQuery({
    queryKey: ["tasks", "assigned", user?.id, assignedPage, assignedLimit],
    queryFn: () => taskApi.list({ assigneeId: user?.id, page: assignedPage, limit: assignedLimit }),
    enabled: !!user?.id,
  })

  // 2. Query hook to fetch tasks created/reported by the current employee
  const { data: reportedTasksData, isLoading: isLoadingReported } = useQuery({
    queryKey: ["tasks", "reported", user?.id, reportedPage, reportedLimit],
    queryFn: () => taskApi.list({ createdById: user?.id, page: reportedPage, limit: reportedLimit }),
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

  // Columns configuration for tasks DataTablePage
  const taskColumns = useMemo<DataTableColumn<Task>[]>(
    () => [
      {
        id: "id",
        header: "ID",
        width: "60px",
        cell: (task) => (
          <span className={TYPOGRAPHY.CELL_CODE}>
            #{task.id.substring(0, 5)}
          </span>
        ),
      },
      {
        id: "project",
        header: "Dự án",
        width: "130px",
        truncate: true,
        cell: (task) => (
          <span className={cn(TYPOGRAPHY.CELL_SECONDARY, "truncate")}>
            {task.project?.name || "N/A"}
          </span>
        ),
      },
      {
        id: "tracker",
        header: "Tracker",
        width: "90px",
        cell: (task) => {
          let trackerColor = "bg-secondary text-secondary-foreground"
          if (task.tracker === "bug") {
            trackerColor = "bg-destructive/10 text-destructive border-destructive/20"
          } else if (task.tracker === "feature") {
            trackerColor = "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400"
          } else if (task.tracker === "support") {
            trackerColor = "bg-sky-500/10 text-sky-600 border-sky-500/20 dark:text-sky-400"
          }

          return (
            <Badge
              variant="outline"
              className={cn("rounded-full px-2 py-0.5 text-xs font-semibold uppercase", trackerColor)}
            >
              {task.tracker}
            </Badge>
          )
        },
      },
      {
        id: "title",
        header: "Tiêu đề",
        minWidth: "180px",
        truncate: true,
        cell: (task) => (
          <Link
            to={`/project/task/${task.id}`}
            className={cn(
              TYPOGRAPHY.CELL_PRIMARY,
              "text-primary hover:underline inline-flex items-center gap-1 group truncate",
            )}
          >
            <span className="truncate">{task.title}</span>
            <ExternalLink className="size-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        ),
      },
      {
        id: "status",
        header: "Trạng thái",
        width: "110px",
        cell: (task) => (
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
                  : task.status === "reopened" || task.status === "in_review"
                    ? "info"
                    : task.status === "cancelled"
                      ? "danger"
                      : "neutral"
            }
          />
        ),
      },
      {
        id: "priority",
        header: "Độ ưu tiên",
        width: "100px",
        cell: (task) => {
          let priorityColor = "bg-secondary text-secondary-foreground"
          if (task.priority === "urgent") {
            priorityColor = "bg-destructive/10 text-destructive border-destructive/20"
          } else if (task.priority === "high") {
            priorityColor = "bg-warning/10 text-warning border-warning/20"
          } else if (task.priority === "medium") {
            priorityColor = "bg-info/10 text-info border-info/20"
          }

          return (
            <Badge
              variant="outline"
              className={cn("rounded-full text-xs font-semibold px-2 py-0.5", priorityColor)}
            >
              {task.priority === "urgent"
                ? "Khẩn cấp"
                : task.priority === "high"
                  ? "Cao"
                  : task.priority === "medium"
                    ? "Trung bình"
                    : "Thấp"}
            </Badge>
          )
        },
      },
      {
        id: "progress",
        header: "%",
        align: "right",
        width: "50px",
        cell: (task) => (
          <span className={cn(TYPOGRAPHY.CELL_SECONDARY, "font-semibold")}>
            {task.progress}%
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        align: "right",
        width: "44px",
        cell: (task) => (
          <button
            type="button"
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
            className="rounded-full p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
            aria-label="Thao tác"
          >
            <MoreHorizontal className="size-4" />
          </button>
        ),
      },
    ],
    [],
  )

  return (
    <PageContainer variant="table">
      {/* Page header title details */}
      <PageHeader
        title="Tổng quan của tôi (My Page)"
        description="Quản lý các dự án và công việc được phân công cho bạn"
      />

      {/* 1. Projects Section - Grid representing active user projects */}
      <div className="shrink-0 space-y-2">
        <div className="flex items-center gap-2 border-b border-border pb-2">
          <div className="rounded-full bg-primary/10 p-2 text-primary">
            <Folder className="size-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-foreground">
              Dự án của tôi ({projects.length})
            </h3>
            <p className="text-xs text-muted-foreground">Các dự án bạn tham gia hoặc quản lý</p>
          </div>
        </div>

        {/* Fetching loading state for projects */}
        {isLoadingProjects ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-28 w-full rounded-xl" />
          </div>
        ) : projects.length === 0 ? (
          // Empty state fallback visual
          <div className="flex flex-col items-center justify-center py-6 text-center bg-card rounded-xl border border-border">
            <div className="rounded-full bg-secondary p-2.5 mb-2 text-muted-foreground">
              <Folder className="size-5" />
            </div>
            <p className="text-xs text-muted-foreground">Bạn chưa được tham gia vào dự án nào.</p>
          </div>
        ) : (
          // Projects grid display list
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 max-h-[160px] overflow-y-auto pr-1">
            {projects.map((proj) => {
              const isLeader = proj.teamLeaderId === user?.id
              const isAdminOrGM = hasAnyPermission(["project.update", "project.task.approve"])
              const canCreateInProj = isAdminOrGM || isLeader || proj.taskCreationPolicy === "all_members"

              // Map member role to badges
              let memberRole = "Thành viên"
              let roleBadgeColor = "bg-secondary text-secondary-foreground"
              if (isLeader) {
                memberRole = "Trưởng nhóm"
                roleBadgeColor = "bg-primary/10 text-primary border-primary/20"
              } else if (isAdminOrGM) {
                memberRole = "Quản trị viên"
                roleBadgeColor = "bg-destructive/10 text-destructive border-destructive/20"
              }

              return (
                <PageCard
                  key={proj.id}
                  className="hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 border border-border/85 flex flex-col justify-between p-4 min-h-[120px] space-y-3 hover:border-primary/50 cursor-pointer group"
                  onClick={() => {
                    sessionStorage.setItem("activeProjectId", proj.id)
                    navigate(`/project/${proj.id}/overview`)
                  }}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-1">
                        {proj.name}
                      </span>
                      <StatusPill
                        label={formatProjectStatus(proj.status)}
                        variant={getProjectStatusVariant(proj.status)}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {proj.description || "Không có mô tả dự án."}
                    </p>
                  </div>

                  <div className="border-t border-border/40 pt-2 flex items-center justify-between text-xs gap-2">
                    <span className="text-muted-foreground font-medium flex items-center gap-1 min-w-0 truncate">
                      <User className="size-3.5 shrink-0" />
                      <span className="truncate">
                        Trưởng nhóm: <span className="font-semibold text-foreground">{proj.teamLeader?.fullName || "Chưa có"}</span>
                      </span>
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Show create task shortcut link if current user matches creation policies */}
                      {canCreateInProj && (
                        <Link
                          to={`/project/${proj.id}/task/new`}
                          onClick={(e) => { e.stopPropagation(); sessionStorage.setItem("activeProjectId", proj.id); }}
                          className="rounded-full bg-primary/10 hover:bg-primary/20 text-primary px-2.5 py-0.5 font-semibold text-xs flex items-center gap-1 transition-all duration-200 cursor-pointer"
                        >
                          <Plus className="size-3" />
                          Tạo CV
                        </Link>
                      )}
                      <Badge variant="outline" className={cn("rounded-full text-xs font-semibold px-2 py-0.5", roleBadgeColor)}>
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
      <div className="grid grid-cols-12 gap-6 flex-1 min-h-0">
        {/* Left Column - Assigned Tasks */}
        <div className="col-span-12 xl:col-span-6 flex flex-col min-w-0 h-full">
          <DataTablePage<Task>
            variant="card"
            className="h-full"
            cardIcon={ClipboardList}
            title={`Công việc được giao cho tôi (${assignedTasksData?.meta.total || 0})`}
            description="Các nhiệm vụ bạn cần thực hiện"
            columns={taskColumns}
            data={assignedTasks}
            isLoading={isLoadingAssigned}
            keyExtractor={(task) => task.id}
            onRowContextMenu={handleRowContextMenu}
            rowClassName={(task) =>
              contextMenu.isOpen && contextMenu.task?.id === task.id
                ? "bg-primary/10 hover:bg-primary/15"
                : undefined
            }
            emptyState={{
              icon: Inbox,
              title: "Không có công việc nào",
              description: "Không có công việc nào được giao cho bạn.",
            }}
            pagination={{
              currentPage: assignedPage,
              totalPages: assignedTasksData?.meta.totalPages || 0,
              totalItems: assignedTasksData?.meta.total || 0,
              itemsPerPage: assignedLimit,
              onPageChange: setAssignedPage,
              onItemsPerPageChange: (newLimit) => {
                setAssignedLimit(newLimit)
                setAssignedPage(1)
              },
              pageSizeOptions: [10, 20, 50],
            }}
          />
        </div>

        {/* Right Column - Reported Tasks */}
        <div className="col-span-12 xl:col-span-6 flex flex-col min-w-0 h-full">
          <DataTablePage<Task>
            variant="card"
            className="h-full"
            cardIcon={ClipboardList}
            cardIconClassName="bg-indigo-500/10 text-indigo-500"
            title={`Công việc tôi đã tạo / báo cáo (${reportedTasksData?.meta.total || 0})`}
            description="Các nhiệm vụ do bạn báo cáo hoặc tạo ra"
            columns={taskColumns}
            data={reportedTasks}
            isLoading={isLoadingReported}
            keyExtractor={(task) => task.id}
            onRowContextMenu={handleRowContextMenu}
            rowClassName={(task) =>
              contextMenu.isOpen && contextMenu.task?.id === task.id
                ? "bg-primary/10 hover:bg-primary/15"
                : undefined
            }
            emptyState={{
              icon: Inbox,
              title: "Không có công việc nào",
              description: "Bạn chưa tạo hoặc báo cáo công việc nào.",
            }}
            pagination={{
              currentPage: reportedPage,
              totalPages: reportedTasksData?.meta.totalPages || 0,
              totalItems: reportedTasksData?.meta.total || 0,
              itemsPerPage: reportedLimit,
              onPageChange: setReportedPage,
              onItemsPerPageChange: (newLimit) => {
                setReportedLimit(newLimit)
                setReportedPage(1)
              },
              pageSizeOptions: [10, 20, 50],
            }}
          />
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

