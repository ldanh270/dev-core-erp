import { DashboardLayout } from "@/components/common"
import { AttendanceDashboardStats } from "@/components/features/attendance/attendance-dashboard-stats"
import { AttendanceExportAction } from "@/components/features/attendance/attendance-export-action"
import { AttendanceMatrix } from "@/components/features/attendance/attendance-matrix"
import {
  AttendanceAttentionCards,
  AttendanceRecordsTable,
} from "@/components/features/attendance/attendance-records-table"
import { EmployeeAttendanceSummarySheet } from "@/components/features/attendance/employee-attendance-summary-sheet"
import { ROLE } from "@/config/entities/employee.config"
import { ROUTES } from "@/config/routes.config"
import { useAdminAttendanceDashboard } from "@/hooks/attendance/use-admin-attendance-dashboard"
import { usePermission } from "@/hooks/use-permission"
import { getCurrentMonthRange } from "@/utils/attendance/get-current-month-range"

import { Navigate } from "react-router-dom"

/**
 * AttendanceDashboard Component.
 * Route guard wrapper around AdminAttendanceDashboard.
 */
export default function AttendanceDashboard() {
  const { hasPermission, hasRole } = usePermission()

  if (!hasPermission("attendance.read") || !hasRole(ROLE.ADMIN)) {
    return <Navigate to={ROUTES.ATTENDANCE.MY_SCHEDULE} replace />
  }

  return <AdminAttendanceDashboard />
}

/**
 * AdminAttendanceDashboard Component.
 * Pure orchestrator shell connecting useAdminAttendanceDashboard hook with T3 presenters.
 */
function AdminAttendanceDashboard() {
  const {
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    statusFilter,
    setStatusFilter,
    selectedEmployee,
    setSelectedEmployee,
    records,
    isLoading,
    isError,
    presentToday,
    lateToday,
    absentToday,
    openCheckoutToday,
    attentionRecords,
    handleExport,
  } = useAdminAttendanceDashboard()

  const correctedTodayCount = records?.filter((r) => r.correctedByApplication).length ?? 0

  return (
    <>
      <DashboardLayout
        title="Tổng quan chấm công"
        description="Dữ liệu chấm công toàn bộ nhân sự và cá nhân bạn."
        actions={<AttendanceExportAction onExport={handleExport} />}
        statsSection={
          <AttendanceDashboardStats
            totalRecords={records?.length}
            presentToday={presentToday}
            lateToday={lateToday}
            absentToday={absentToday}
          />
        }
        chartsSection={<AttendanceMatrix />}
      >
        <AttendanceAttentionCards
          openCheckoutCount={openCheckoutToday.length}
          attentionRecordsCount={attentionRecords.length}
          correctedCount={correctedTodayCount}
        />

        <AttendanceRecordsTable
          records={records}
          isLoading={isLoading}
          isError={isError}
          startDate={startDate}
          endDate={endDate}
          statusFilter={statusFilter}
          onDateChange={({ startDate: s, endDate: e }) => {
            if (s) setStartDate(s)
            if (e) setEndDate(e)
          }}
          onStatusFilterChange={setStatusFilter}
          onResetFilters={() => {
            const range = getCurrentMonthRange()
            setStartDate(range.startDate)
            setEndDate(range.endDate)
            setStatusFilter("all")
          }}
          selectedEmployee={selectedEmployee}
          onSelectEmployee={setSelectedEmployee}
        />
      </DashboardLayout>

      <EmployeeAttendanceSummarySheet
        employee={selectedEmployee}
        onClose={() => {
          setSelectedEmployee(null)
        }}
      />
    </>
  )
}
