import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type { Employee } from "@/types/employee.types"

import { ChevronDown, ChevronUp } from "lucide-react"

interface EmployeeInfoSectionProps {
  isOpen: boolean
  onToggle: () => void
  employees: Employee[]
  selectedEmployeeId: string
  onSelectEmployeeId: (id: string) => void
  selectedEmployee?: Employee | null
  onBlur: (field: string) => void
  isError: boolean
}

export function EmployeeInfoSection({
  isOpen,
  onToggle,
  employees,
  selectedEmployeeId,
  onSelectEmployeeId,
  selectedEmployee,
  onBlur,
  isError,
}: EmployeeInfoSectionProps) {
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
          <h2 className="font-semibold text-foreground">Thông tin nhân sự</h2>
        </div>
      </button>

      {isOpen && (
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">
              Họ và tên NLĐ <span className="text-destructive">*</span>
            </Label>
            <Select
              value={selectedEmployeeId}
              onValueChange={(val) => {
                onSelectEmployeeId(val)
                onBlur("selectedEmployeeId")
              }}
            >
              <SelectTrigger
                className={cn(
                  "rounded-full",
                  isError && "border-destructive ring-1 ring-destructive",
                )}
              >
                <SelectValue placeholder="Chọn nhân sự" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.fullName} ({emp.username})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isError && (
              <p className="text-xs text-destructive font-medium mt-1">
                Vui lòng chọn người lao động
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Mã nhân sự</Label>
            <Input
              value={selectedEmployee?.id ? selectedEmployee.id.slice(-6).toUpperCase() : ""}
              placeholder="Mã nhân sự"
              disabled
              className="rounded-full bg-muted/40 font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Bộ phận</Label>
            <Input
              value={selectedEmployee ? "Phòng Công nghệ Thông tin" : ""}
              placeholder="Chọn phòng ban"
              disabled
              className="rounded-full bg-muted/40"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Vị trí</Label>
            <Input
              value={selectedEmployee?.position || ""}
              placeholder="Vị trí"
              disabled
              className="rounded-full bg-muted/40"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Nơi làm việc</Label>
            <Input
              value={selectedEmployee ? "Hà Nội - Trụ sở chính" : ""}
              placeholder="Nơi làm việc"
              disabled
              className="rounded-full bg-muted/40"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Hình thức làm việc</Label>
            <Input
              value={
                selectedEmployee
                  ? selectedEmployee.workScheduleType === "full_time"
                    ? "Chính thức (Full-time)"
                    : "Bán thời gian (Part-time)"
                  : ""
              }
              placeholder="Hình thức làm việc"
              disabled
              className="rounded-full bg-muted/40"
            />
          </div>
        </div>
      )}
    </div>
  )
}
