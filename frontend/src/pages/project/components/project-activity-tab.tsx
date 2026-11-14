import { PageCard } from "@/components/common"
import { Skeleton } from "@/components/ui/skeleton"

import { Activity } from "lucide-react"

interface ActivityItem {
  id: string
  type: "spent_time" | "task"
  user: string
  text: string
  date: Date
  comment?: string | null
  hours?: number
}

interface ProjectActivityTabProps {
  activitiesList: ActivityItem[]
  isLoading: boolean
}

export function ProjectActivityTab({ activitiesList, isLoading }: ProjectActivityTabProps) {
  return (
    <PageCard className="p-6">
      <h3 className="font-bold text-base text-foreground mb-6 border-b border-border pb-2 flex items-center gap-1.5">
        <Activity className="size-4 text-muted-foreground" />
        Nhật ký hoạt động (Recent Activity)
      </h3>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-1/3 rounded-full" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      ) : activitiesList.length === 0 ? (
        <p className="text-xs text-muted-foreground italic py-4 text-center">
          Không có hoạt động gần đây nào.
        </p>
      ) : (
        <div className="relative pl-6 border-l border-border space-y-6">
          {activitiesList.map((act, idx) => (
            <div key={`${act.id}-${idx}`} className="relative">
              {/* Circle bullet on timeline vertical axis */}
              <div
                className={`absolute -left-[31px] top-1.5 size-2.5 rounded-full border-2 border-background ${
                  act.type === "spent_time" ? "bg-primary" : "bg-indigo-500"
                }`}
              />

              <div className="space-y-1">
                <div className="text-xs text-foreground">
                  <span className="font-bold">{act.user}</span> {act.text}
                  {act.type === "spent_time" && (
                    <span className="font-semibold text-primary ml-1">({act.hours} giờ)</span>
                  )}
                </div>
                {act.comment && (
                  <div className="text-xs bg-muted/30 p-2.5 rounded-xl border border-border/40 max-w-[500px] text-muted-foreground italic">
                    "{act.comment}"
                  </div>
                )}
                <div className="text-[10px] text-muted-foreground">
                  {act.date.toLocaleString("vi-VN")}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageCard>
  )
}
