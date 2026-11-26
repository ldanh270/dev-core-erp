import type { SpentTime } from "@/types/spent-time.types"
import type { Task } from "@/types/task.types"

/**
 * Represents an audit activity event (task creation or spent time logged) in project stream.
 */
export interface ActivityItem {
  id: string
  type: "spent_time" | "task"
  user: string
  text: string
  date: Date
  comment?: string | null
  hours?: number
}

export const PROJECT_TABS = {
  OVERVIEW: "overview",
  ISSUES: "issues",
  KANBAN: "kanban",
  ACTIVITY: "activity",
  GANTT: "gantt",
  RULES: "rules",
} as const

export type ProjectTab = (typeof PROJECT_TABS)[keyof typeof PROJECT_TABS]

/**
 * Merges and sorts logged spent time records and created tasks into chronological activity feed.
 */
export function buildActivitiesList(spentTimes?: SpentTime[], tasks?: Task[]): ActivityItem[] {
  const list: ActivityItem[] = []

  spentTimes?.forEach((st) => {
    list.push({
      id: st.id,
      type: "spent_time",
      user: st.employee?.fullName || "Thành viên",
      text: `đã ghi nhận ${st.hours} giờ (${st.activity}) vào công việc`,
      date: new Date(st.createdAt),
      comment: st.comment,
      hours: st.hours,
    })
  })

  tasks?.forEach((t) => {
    list.push({
      id: `task-create-${t.id}`,
      type: "task",
      user: t.createdBy?.fullName || "Thành viên",
      text: `đã tạo công việc mới [${t.tracker}] "${t.title}"`,
      date: new Date(t.createdAt),
    })
  })

  list.sort((a, b) => b.date.getTime() - a.date.getTime())
  return list
}
