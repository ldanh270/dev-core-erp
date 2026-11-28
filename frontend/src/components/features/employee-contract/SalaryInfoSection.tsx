import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChevronDown, ChevronUp } from "lucide-react"

interface SalaryInfoSectionProps {
  isOpen: boolean
  onToggle: () => void
  salary: number | ""
  onSalaryChange: (val: number | "") => void
  probationSalaryRate: number | ""
  onProbationSalaryRateChange: (val: number | "") => void
  insuranceSalary: number | ""
  onInsuranceSalaryChange: (val: number | "") => void
}

export function SalaryInfoSection({
  isOpen,
  onToggle,
  salary,
  onSalaryChange,
  probationSalaryRate,
  onProbationSalaryRateChange,
  insuranceSalary,
  onInsuranceSalaryChange,
}: SalaryInfoSectionProps) {
  return (
    <div className="bg-background border border-border rounded-xl overflow-hidden shadow-none">
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between bg-muted/50 border-b border-border text-left font-semibold text-sm text-foreground cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">
            {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </span>
          <h2 className="font-semibold text-foreground">Thông tin lương</h2>
        </div>
      </button>

      {isOpen && (
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">
              Lương cơ bản <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Input
                type="number"
                value={salary}
                onChange={(e) => {
                  onSalaryChange(e.target.value === "" ? "" : Number(e.target.value))
                }}
                placeholder="0"
                className="rounded-full pr-8 text-right font-mono"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">
              Tỉ lệ hưởng lương (%) <span className="text-destructive">*</span>
            </Label>
            <Input
              type="number"
              value={probationSalaryRate}
              onChange={(e) => {
                onProbationSalaryRateChange(e.target.value === "" ? "" : Number(e.target.value))
              }}
              placeholder="100"
              className="rounded-full text-right font-mono"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">
              Lương đóng bảo hiểm <span className="text-destructive">*</span>
            </Label>
            <Input
              type="number"
              value={insuranceSalary}
              onChange={(e) => {
                onInsuranceSalaryChange(e.target.value === "" ? "" : Number(e.target.value))
              }}
              placeholder="0"
              className="rounded-full text-right font-mono"
              required
            />
          </div>
        </div>
      )}
    </div>
  )
}
