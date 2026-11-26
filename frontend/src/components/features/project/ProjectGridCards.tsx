import { PageCard, StatusPill } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import type { Project } from "@/types/project.types"
import { Folder, Plus, User } from "lucide-react"
import { Link } from "react-router-dom"

export interface ProjectGridCardsProps {
  projects: Project[]
  isLoading: boolean
  currentUserId?: string
  hasAnyPermission: (permissions: string[]) => boolean
  onSelectProject: (projectId: string) => void
}

function formatProjectStatus(status: string) {
  if (status === "planning") return "Lập kế hoạch"
  if (status === "active") return "Đang chạy"
  if (status === "on_hold") return "Tạm dừng"
  if (status === "completed") return "Hoàn thành"
  if (status === "cancelled") return "Đã hủy"
  return status
}

function getProjectStatusVariant(status: string) {
  if (status === "active") return "success"
  if (status === "planning") return "neutral"
  if (status === "on_hold") return "warning"
  if (status === "completed") return "info"
  if (status === "cancelled") return "danger"
  return "neutral"
}

/** Grid card visualization of active projects with summary metrics and progress bars. */
export function ProjectGridCards({
  projects,
  isLoading,
  currentUserId,
  hasAnyPermission,
  onSelectProject,
}: ProjectGridCardsProps) {
  return (
    <div className="shrink-0 space-y-2">
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <div className="rounded-full bg-primary/10 p-2 text-primary">
          <Folder className="size-4" />
        </div>
        <div>
          <h3 className="font-bold text-sm text-foreground">Dự án của tôi ({projects.length})</h3>
          <p className="text-xs text-muted-foreground">Các dự án bạn tham gia hoặc quản lý</p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-center bg-card rounded-xl border border-border">
          <div className="rounded-full bg-secondary p-2.5 mb-2 text-muted-foreground">
            <Folder className="size-5" />
          </div>
          <p className="text-xs text-muted-foreground">Bạn chưa được tham gia vào dự án nào.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 max-h-[160px] overflow-y-auto pr-1">
          {projects.map((proj) => {
            const isLeader = proj.teamLeaderId === currentUserId
            const isAdminOrGM = hasAnyPermission(["project.update", "project.task.approve"])
            const canCreateInProj =
              isAdminOrGM || isLeader || proj.taskCreationPolicy === "all_members"

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
                onClick={() => onSelectProject(proj.id)}
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
                      Trưởng nhóm:{" "}
                      <span className="font-semibold text-foreground">
                        {proj.teamLeader?.fullName || "Chưa có"}
                      </span>
                    </span>
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {canCreateInProj && (
                      <Link
                        to={`/project/${proj.id}/task/new`}
                        onClick={(e) => {
                          e.stopPropagation()
                          sessionStorage.setItem("activeProjectId", proj.id)
                        }}
                        className="rounded-full bg-primary/10 hover:bg-primary/20 text-primary px-2.5 py-0.5 font-semibold text-xs flex items-center gap-1 transition-all duration-200 cursor-pointer"
                      >
                        <Plus className="size-3" />
                        Tạo CV
                      </Link>
                    )}
                    <Badge
                      variant="outline"
                      className={cn(
                        "rounded-full text-xs font-semibold px-2 py-0.5",
                        roleBadgeColor,
                      )}
                    >
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
  )
}
