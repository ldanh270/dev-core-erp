import { COMPONENT_TYPE } from "@/config/entities/payroll.config"
import { formatCurrency } from "@/lib/utils"
import type { IPayslipDetail } from "@/types/payroll.types"

interface PayslipComponentsTabProps {
  details: IPayslipDetail[]
  type: (typeof COMPONENT_TYPE)[keyof typeof COMPONENT_TYPE]
}

/**
 * Presenter tab listing line-item salary components, base pay, and custom allowances.
 */
export function PayslipComponentsTab({ details, type }: PayslipComponentsTabProps) {
  const filtered = details.filter((d) => d.type === type)
  const isAddition = type === COMPONENT_TYPE.ADDITION

  return (
    <div className="p-6 space-y-3">
      {filtered.map((detail, idx) => (
        <div
          key={idx}
          className="flex justify-between items-center gap-4 py-3 border-b border-border/50 last:border-0"
        >
          <span className="text-muted-foreground font-medium">{detail.name}</span>
          <span
            className={`font-semibold whitespace-nowrap ${
              isAddition ? "text-success" : "text-destructive"
            }`}
          >
            {isAddition ? "+" : "-"}
            {formatCurrency(detail.value)}
          </span>
        </div>
      ))}
      {filtered.length === 0 && (
        <div className="flex h-24 items-center justify-center">
          <p className="text-muted-foreground italic text-sm">
            {isAddition ? "Không có phụ cấp" : "Không có khấu trừ"}
          </p>
        </div>
      )}
    </div>
  )
}
