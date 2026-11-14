import { BackButton } from "@/components/common"
import { Button } from "@/components/ui/button"

import { Plus, Settings, Sparkles, UserPlus } from "lucide-react"
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
      <div className="flex items-start gap-3">
        <BackButton backHref="/project/list" />
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Dự án chi tiết
          </span>
          <h1 className="text-2xl font-bold text-foreground mt-0.5">{name}</h1>
          {description && (
            <p className="text-sm text-muted-foreground mt-1 max-w-[600px]">{description}</p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {canCreateTask && (
          <>
            <Button
              onClick={() => {
                navigate(`/project/${projectId}/task/new`)
              }}
              size="default"
              className="rounded-full shadow-xs gap-1.5 font-semibold"
            >
              <Plus className="size-4" />
              Công việc mới
            </Button>
            {onOpenAiDecompose && (
              <Button
                variant="outline"
                size="default"
                onClick={onOpenAiDecompose}
                className="rounded-full border-purple-500/30 hover:bg-purple-500/10 text-purple-600 dark:text-purple-400 gap-1.5 font-semibold shadow-xs"
              >
                <Sparkles className="size-4" />
                AI phân rã task
              </Button>
            )}
          </>
        )}

        {canManageMembers && (
          <>
            <Button
              variant="outline"
              size="default"
              onClick={onOpenEditProject}
              className="rounded-full border-border hover:bg-muted/50 gap-1.5 font-semibold shadow-xs"
            >
              <Settings className="size-4" />
              Chỉnh sửa dự án
            </Button>
            <Button
              variant="outline"
              size="default"
              onClick={onOpenAddMember}
              className="rounded-full border-border hover:bg-muted/50 gap-1.5 font-semibold shadow-xs"
            >
              <UserPlus className="size-4" />
              Thêm thành viên
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
