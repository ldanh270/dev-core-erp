import { PageCard } from "@/components/common"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Task } from "@/types/task.types"

import { AlertCircle, MoreVertical } from "lucide-react"

import { COLUMN_METADATA } from "./issue-columns.config"

const columnMetadataMap = new Map(Object.entries(COLUMN_METADATA))

interface IssuesTableProps {
  isLoadingTasks: boolean
  tasks: Task[]
  displayColumns: string[]
  statuses: { id: string; name: string; isCompleted: boolean }[]
  onOpenContextMenu: (task: Task, clientX: number, clientY: number) => void
}

/** Table presentation component rendering project issues and task records. */
export function IssuesTable({
  isLoadingTasks,
  tasks,
  displayColumns,
  statuses,
  onOpenContextMenu,
}: IssuesTableProps) {
  return (
    <PageCard className="p-6">
      {isLoadingTasks ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full rounded-full" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-secondary p-3 mb-4 text-muted-foreground">
            <AlertCircle className="size-6" />
          </div>
          <h3 className="text-sm font-bold text-foreground">Không tìm thấy công việc nào</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Hãy thiết lập bộ lọc khác hoặc tạo công việc mới.
          </p>
        </div>
      ) : (
        <div className="relative overflow-auto max-h-[calc(100vh-280px)] rounded-lg border border-border">
          <Table>
            <TableHeader className="sticky top-0 z-20 bg-background shadow-xs">
              <TableRow className="hover:bg-transparent h-10">
                {displayColumns.map((colKey) => {
                  const col = columnMetadataMap.get(colKey)
                  if (!col) return null
                  return (
                    <TableHead key={colKey} className={col.className}>
                      {col.label}
                    </TableHead>
                  )
                })}
                <TableHead className="w-10 font-semibold text-xs"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => (
                <TableRow
                  key={task.id}
                  className="h-14 hover:bg-muted/30 cursor-pointer"
                  onContextMenu={(e) => {
                    e.preventDefault()
                    onOpenContextMenu(task, e.clientX, e.clientY)
                  }}
                >
                  {displayColumns.map((colKey) => {
                    const col = columnMetadataMap.get(colKey)
                    if (!col) return null
                    if (colKey === "status") {
                      return col.render(task, statuses)
                    }
                    return col.render(task)
                  })}
                  <TableCell
                    onClick={(e) => {
                      e.stopPropagation()
                    }}
                  >
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="rounded-full cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation()
                        const rect = e.currentTarget.getBoundingClientRect()
                        onOpenContextMenu(task, rect.left, rect.bottom)
                      }}
                    >
                      <MoreVertical className="size-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </PageCard>
  )
}
