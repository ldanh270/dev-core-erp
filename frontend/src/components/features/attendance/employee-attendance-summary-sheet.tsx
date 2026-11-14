import { AttendanceSummaryContent } from "@/components/features/attendance/attendance-summary-content"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"

export interface SelectedEmployeeSummary {
  id: string
  fullName: string
  email?: string
}

interface EmployeeAttendanceSummarySheetProps {
  employee: SelectedEmployeeSummary | null
  onClose: () => void
}

export function EmployeeAttendanceSummarySheet({
  employee,
  onClose,
}: EmployeeAttendanceSummarySheetProps) {
  return (
    <Sheet
      open={Boolean(employee)}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <SheetContent className="w-[95vw] max-w-[95vw]! sm:max-w-300! overflow-y-auto p-6 sm:p-8">
        {employee ? (
          <>
            <SheetHeader className="mb-6 px-0 pt-0 pb-0">
              <SheetTitle className="text-2xl">Tổng hợp chấm công</SheetTitle>
              <p className="text-lg font-bold tracking-tight text-foreground">
                {employee.fullName}
              </p>
              {employee.email ? (
                <p className="text-sm text-muted-foreground">{employee.email}</p>
              ) : null}
              <p className="text-xs text-muted-foreground leading-relaxed">
                Tóm tắt tình hình đi làm, giờ công và kỷ luật chấm công trong tháng.
              </p>
            </SheetHeader>

            <AttendanceSummaryContent employeeId={employee.id} />
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
