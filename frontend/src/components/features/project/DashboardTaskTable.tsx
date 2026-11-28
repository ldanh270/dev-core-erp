import { type DataTableColumn, DataTablePage } from "@/components/common"
import type { Task } from "@/types/task.types"

import { ClipboardList, Inbox } from "lucide-react"

export interface DashboardTaskTableProps {
  title: string
  description: string
  cardIconClassName?: string
  columns: DataTableColumn<Task>[]
  data: Task[]
  isLoading: boolean
  totalItems: number
  totalPages: number
  currentPage: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  onItemsPerPageChange: (limit: number) => void
  onRowContextMenu: (e: React.MouseEvent, task: Task) => void
  activeContextMenuTaskId?: string | null
  emptyTitle: string
  emptyDescription: string
}

/** Paginated task list table for the Project Dashboard view. */
export function DashboardTaskTable({
  title,
  description,
  cardIconClassName,
  columns,
  data,
  isLoading,
  totalItems,
  totalPages,
  currentPage,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  onRowContextMenu,
  activeContextMenuTaskId,
  emptyTitle,
  emptyDescription,
}: DashboardTaskTableProps) {
  return (
    <DataTablePage<Task>
      variant="card"
      className="h-full"
      cardIcon={ClipboardList}
      cardIconClassName={cardIconClassName}
      title={title}
      description={description}
      columns={columns}
      data={data}
      isLoading={isLoading}
      keyExtractor={(task) => task.id}
      onRowContextMenu={onRowContextMenu}
      rowClassName={(task) =>
        activeContextMenuTaskId === task.id ? "bg-primary/10 hover:bg-primary/15" : undefined
      }
      emptyState={{
        icon: Inbox,
        title: emptyTitle,
        description: emptyDescription,
      }}
      pagination={{
        currentPage,
        totalPages,
        totalItems,
        itemsPerPage,
        onPageChange,
        onItemsPerPageChange,
        pageSizeOptions: [10, 20, 50],
      }}
    />
  )
}
