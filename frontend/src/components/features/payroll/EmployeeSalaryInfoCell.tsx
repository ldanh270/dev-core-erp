import { TYPOGRAPHY } from "@/config/typography.config"
import { useActiveSalaryConfig } from "@/hooks/payroll/use-employee-salary-config"
import { cn, formatCurrency } from "@/lib/utils"

/**
 * Table cell presenter displaying employee identity, title, and formatted base salary.
 */
export interface EmployeeSalaryInfoCellProps {
  employeeId: string
  templates?: { id: string; name: string }[]
}

/** Table cell presenter rendering formatted employee salary information and base pay. */
export function EmployeeSalaryInfoCell({
  employeeId,
  templates,
}: EmployeeSalaryInfoCellProps) {
  const { data: config, isLoading } = useActiveSalaryConfig(employeeId)
  const templateName =
    templates?.find((t) => t.id === config?.templateId)?.name || "Chưa thiết lập"

  if (isLoading) {
    return <span className={cn(TYPOGRAPHY.CELL_SECONDARY, "text-xs")}>Đang tải...</span>
  }

  return (
    <div className="flex items-center gap-3">
      <span className={cn(TYPOGRAPHY.CELL_PRIMARY, "font-semibold text-foreground")}>
        {config ? (
          formatCurrency(Number(config.baseSalary))
        ) : (
          <span className="text-destructive font-normal text-xs">Chưa thiết lập</span>
        )}
      </span>
      <span
        className={cn(
          "px-2.5 py-0.5 rounded-full text-xs font-medium border",
          config
            ? "bg-primary/5 text-primary border-primary/20"
            : "bg-muted text-muted-foreground border-border",
        )}
      >
        {templateName}
      </span>
    </div>
  )
}
