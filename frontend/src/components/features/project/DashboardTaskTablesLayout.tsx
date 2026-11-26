import React from "react"
import { DashboardTaskTable } from "./DashboardTaskTable"
import type { DataTableColumn } from "@/components/common"
import type { Task } from "@/types/task.types"

export interface DashboardTaskTablesLayoutProps {
  taskColumns: DataTableColumn<Task>[]
  assignedTasks: Task[]
  assignedTotal: number
  assignedTotalPages: number
  assignedPage: number
  assignedLimit: number
  isLoadingAssigned: boolean
  onAssignedPageChange: (page: number) => void
  onAssignedLimitChange: (limit: number) => void
  reportedTasks: Task[]
  reportedTotal: number
  reportedTotalPages: number
  reportedPage: number
  reportedLimit: number
  isLoadingReported: boolean
  onReportedPageChange: (page: number) => void
  onReportedLimitChange: (limit: number) => void
  onRowContextMenu: (e: React.MouseEvent, task: Task) => void
  activeContextMenuTaskId?: string | null
}

/**
 * Presenter component that layouts the assigned and reported task tables in a responsive two-column grid.
 */
export const DashboardTaskTablesLayout: React.FC<DashboardTaskTablesLayoutProps> = ({
  taskColumns,
  assignedTasks,
  assignedTotal,
  assignedTotalPages,
  assignedPage,
  assignedLimit,
  isLoadingAssigned,
  onAssignedPageChange,
  onAssignedLimitChange,
  reportedTasks,
  reportedTotal,
  reportedTotalPages,
  reportedPage,
  reportedLimit,
  isLoadingReported,
  onReportedPageChange,
  onReportedLimitChange,
  onRowContextMenu,
  activeContextMenuTaskId,
}) => {
  return (
    <div className="grid grid-cols-12 gap-6 flex-1 min-h-0">
      <div className="col-span-12 xl:col-span-6 flex flex-col min-w-0 h-full">
        <DashboardTaskTable
          title={`Công việc được giao cho tôi (${assignedTotal})`}
          description="Các nhiệm vụ bạn cần thực hiện"
          columns={taskColumns}
          data={assignedTasks}
          isLoading={isLoadingAssigned}
          totalItems={assignedTotal}
          totalPages={assignedTotalPages}
          currentPage={assignedPage}
          itemsPerPage={assignedLimit}
          onPageChange={onAssignedPageChange}
          onItemsPerPageChange={onAssignedLimitChange}
          onRowContextMenu={onRowContextMenu}
          activeContextMenuTaskId={activeContextMenuTaskId}
          emptyTitle="Không có công việc nào"
          emptyDescription="Không có công việc nào được giao cho bạn."
        />
      </div>

      <div className="col-span-12 xl:col-span-6 flex flex-col min-w-0 h-full">
        <DashboardTaskTable
          title={`Công việc tôi đã tạo / báo cáo (${reportedTotal})`}
          description="Các nhiệm vụ do bạn báo cáo hoặc tạo ra"
          cardIconClassName="bg-indigo-500/10 text-indigo-500"
          columns={taskColumns}
          data={reportedTasks}
          isLoading={isLoadingReported}
          totalItems={reportedTotal}
          totalPages={reportedTotalPages}
          currentPage={reportedPage}
          itemsPerPage={reportedLimit}
          onPageChange={onReportedPageChange}
          onItemsPerPageChange={onReportedLimitChange}
          onRowContextMenu={onRowContextMenu}
          activeContextMenuTaskId={activeContextMenuTaskId}
          emptyTitle="Không có công việc nào"
          emptyDescription="Bạn chưa tạo hoặc báo cáo công việc nào."
        />
      </div>
    </div>
  )
}
