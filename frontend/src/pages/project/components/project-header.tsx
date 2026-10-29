import { Button } from "@/components/ui/button"
import { Plus, Settings, UserPlus, Sparkles } from "lucide-react"
import { useNavigate } from "react-router-dom"

interface ProjectHeaderProps {
  projectId: string
  name: string
  description?: string | null
  canCreateTask: boolean
  canManageMembers: boolean
  onOpenEditProject: () => void
  onOpenAddMember: () => void
  onOpenAiDecompose?: () => void
}

export function ProjectHeader({
  projectId,
  name,
  description,
  canCreateTask,
  canManageMembers,
  onOpenEditProject,
  onOpenAddMember,
  onOpenAiDecompose,
}: ProjectHeaderProps) {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-6">
      <div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Dự án chi tiết
        </span>
        <h1 className="text-2xl font-bold text-foreground mt-0.5">{name}</h1>
        {description && (
          <p className="text-sm text-muted-foreground mt-1 max-w-[600px]">{description}</p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {canCreateTask && (
          <>
            <Button
              onClick={() => {
                navigate(`/project/${projectId}/task/new`)
              }}
              className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5 h-9 text-xs px-4 font-semibold"
            >
              <Plus className="size-3.5" />
              Công việc mới
            </Button>
            {onOpenAiDecompose && (
              <Button
                variant="outline"
                onClick={onOpenAiDecompose}
                className="rounded-full border-purple-500/30 hover:bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center gap-1.5 h-9 text-xs px-4 font-semibold"
              >
                <Sparkles className="size-3.5" />
                AI phân rã task
              </Button>
            )}
          </>
        )}

        {canManageMembers && (
          <>
            <Button
              variant="outline"
              onClick={onOpenEditProject}
              className="rounded-full border-border hover:bg-muted/50 flex items-center gap-1.5 h-9 text-xs px-4 font-semibold"
            >
              <Settings className="size-3.5" />
              Chỉnh sửa dự án
            </Button>
            <Button
              variant="outline"
              onClick={onOpenAddMember}
              className="rounded-full border-border hover:bg-muted/50 flex items-center gap-1.5 h-9 text-xs px-4 font-semibold"
            >
              <UserPlus className="size-3.5" />
              Thêm thành viên
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
