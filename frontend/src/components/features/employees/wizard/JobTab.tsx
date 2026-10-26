import { DatePicker } from "@/components/common"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useRoles } from "@/hooks/security/queries/use-security-query"
import { cn } from "@/lib/utils"
import { getJobFieldError } from "@/lib/employee-form-validation"
import type { IEmployeeWizardFormData } from "@/types/employee-wizard.types"
import { ChevronDown, ChevronUp } from "lucide-react"

interface JobTabProps {
  formData: IEmployeeWizardFormData
  updateField: <K extends keyof IEmployeeWizardFormData>(
    field: K,
    value: IEmployeeWizardFormData[K]
  ) => void
  hasAttemptedSubmit?: boolean
}

export function JobTab({ formData, updateField, hasAttemptedSubmit }: JobTabProps) {
  const { data: rolesData } = useRoles()
  const roles = Array.isArray(rolesData?.data) ? rolesData.data : []

  const [openJobInfo, setOpenJobInfo] = useState(true)
  const [openAccountInfo, setOpenAccountInfo] = useState(true)

  // OnBlur touch tracking
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({})
  const handleBlur = (field: string) => {
    setTouchedFields((prev) => ({ ...prev, [field]: true }))
  }
  const employeeCodeError = getJobFieldError("employeeCode", formData.employeeCode)
  const workLocationError = getJobFieldError("workLocation", formData.workLocation)
  const departmentError = getJobFieldError("department", formData.department)
  const positionError = getJobFieldError("positionId", formData.positionId)
  const startDateError = getJobFieldError("startDate", formData.startDate)

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ── 1. Thông tin công việc ────────────────────────────────────────── */}
      <div className="bg-background border border-border rounded-xl overflow-hidden shadow-none">
        <button
          type="button"
          onClick={() => { setOpenJobInfo(!openJobInfo) }}
          className="w-full px-6 py-4 flex items-center justify-between bg-muted/50 border-b border-border text-left font-semibold text-sm text-foreground"
        >
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">
              {openJobInfo ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </span>
            <h2 className="font-semibold text-foreground">Thông tin công việc</h2>
          </div>
        </button>

        {openJobInfo && (
          <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                Mã nhân sự <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="Nhập mã nhân sự"
                value={formData.employeeCode}
                onChange={(e) => { updateField("employeeCode", e.target.value); }}
                onBlur={() => { handleBlur("employeeCode"); }}
                className={cn(
                  "rounded-full bg-muted/40 font-mono",
                  (touchedFields.employeeCode || hasAttemptedSubmit) && employeeCodeError && "border-destructive ring-1 ring-destructive"
                )}
                required
              />
              {(touchedFields.employeeCode || hasAttemptedSubmit) && employeeCodeError && (
                <p className="text-xs text-destructive font-medium mt-1">{employeeCodeError}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                Nơi làm việc <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.workLocation}
                onValueChange={(val) => {
                  updateField("workLocation", val)
                  handleBlur("workLocation")
                }}
              >
                <SelectTrigger
                  onBlur={() => { handleBlur("workLocation"); }}
                  className={cn(
                    "rounded-full",
                    (touchedFields.workLocation || hasAttemptedSubmit) && workLocationError && "border-destructive ring-1 ring-destructive"
                  )}
                >
                  <SelectValue placeholder="Nơi làm việc" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hanoi">Hà Nội - Trụ sở chính</SelectItem>
                  <SelectItem value="hcm">TP. Hồ Chí Minh - Chi nhánh</SelectItem>
                  <SelectItem value="danang">Đà Nẵng - Văn phòng đại diện</SelectItem>
                </SelectContent>
              </Select>
              {(touchedFields.workLocation || hasAttemptedSubmit) && workLocationError && (
                <p className="text-xs text-destructive font-medium mt-1">{workLocationError}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                Bộ phận <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.department}
                onValueChange={(val) => {
                  updateField("department", val)
                  handleBlur("department")
                }}
              >
                <SelectTrigger
                  onBlur={() => { handleBlur("department"); }}
                  className={cn(
                    "rounded-full",
                    (touchedFields.department || hasAttemptedSubmit) && departmentError && "border-destructive ring-1 ring-destructive"
                  )}
                >
                  <SelectValue placeholder="Bộ phận" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hr">Phòng Nhân sự</SelectItem>
                  <SelectItem value="it">Phòng Công nghệ Thông tin</SelectItem>
                  <SelectItem value="sales">Phòng Kinh doanh</SelectItem>
                  <SelectItem value="accounting">Phòng Kế toán</SelectItem>
                </SelectContent>
              </Select>
              {(touchedFields.department || hasAttemptedSubmit) && departmentError && (
                <p className="text-xs text-destructive font-medium mt-1">{departmentError}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                Vị trí <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="Vị trí / Chức danh"
                value={formData.positionId}
                onChange={(e) => { updateField("positionId", e.target.value); }}
                onBlur={() => { handleBlur("positionId"); }}
                className={cn(
                  "rounded-full",
                  (touchedFields.positionId || hasAttemptedSubmit) && positionError && "border-destructive ring-1 ring-destructive"
                )}
                required
              />
              {(touchedFields.positionId || hasAttemptedSubmit) && positionError && (
                <p className="text-xs text-destructive font-medium mt-1">{positionError}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                Ngày vào làm <span className="text-destructive">*</span>
              </Label>
              <DatePicker
                value={formData.startDate || null}
                onChange={(val: string | null) => {
                  updateField("startDate", val || "");
                  handleBlur("startDate");
                }}
                placeholder="Chọn ngày vào làm..."
              />
              {(touchedFields.startDate || hasAttemptedSubmit) && startDateError && (
                <p className="text-xs text-destructive font-medium mt-1">{startDateError}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                Hình thức làm việc <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.workScheduleType}
                onValueChange={(val) => { updateField("workScheduleType", val); }}
              >
                <SelectTrigger className="rounded-full">
                  <SelectValue placeholder="Hình thức làm việc" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full_time">Chính thức (Full-time)</SelectItem>
                  <SelectItem value="part_time">Bán thời gian (Part-time)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs font-medium">Quản lý trực tiếp</Label>
              <Input
                placeholder="Chọn nhân sự quản lý"
                value={formData.managerId}
                onChange={(e) => { updateField("managerId", e.target.value); }}
                className="rounded-full"
              />
            </div>
          </div>
        )}
      </div>

      {/* ── 2. Thông tin tài khoản ────────────────────────────────────────── */}
      <div className="bg-background border border-border rounded-xl overflow-hidden shadow-none">
        <button
          type="button"
          onClick={() => { setOpenAccountInfo(!openAccountInfo); }}
          className="w-full px-6 py-4 flex items-center justify-between bg-muted/50 border-b border-border text-left font-semibold text-sm text-foreground"
        >
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">
              {openAccountInfo ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </span>
            <h2 className="font-semibold text-foreground">Thông tin tài khoản</h2>
          </div>
        </button>

        {openAccountInfo && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">
                  Tên đăng nhập <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="Nhập tên đăng nhập"
                  value={formData.username}
                  onChange={(e) => { updateField("username", e.target.value); }}
                  disabled={formData.autoGenUsername}
                  className="rounded-full bg-muted/30"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">
                  Mật khẩu <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => { updateField("password", e.target.value); }}
                  disabled={formData.autoGenPassword}
                  className="rounded-full bg-muted/30"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">
                  Nhóm quyền <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.role}
                  onValueChange={(val) => { updateField("role", val); }}
                >
                  <SelectTrigger className="rounded-full">
                    <SelectValue placeholder="Nhóm quyền" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.length > 0 ? (
                      roles.map((r) => (
                        <SelectItem key={r.id} value={r.name}>
                          {r.name}
                        </SelectItem>
                      ))
                    ) : (
                      <>
                        <SelectItem value="EMPLOYEE">Nhân viên (Employee)</SelectItem>
                        <SelectItem value="HR_MANAGER">Quản lý HR (HR Manager)</SelectItem>
                        <SelectItem value="ADMIN">Quản trị viên (Admin)</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="autoGenUsername"
                  checked={formData.autoGenUsername}
                  onChange={(e) => { updateField("autoGenUsername", e.target.checked); }}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                />
                <Label
                  htmlFor="autoGenUsername"
                  className="text-xs font-medium text-foreground cursor-pointer"
                >
                  Tự động tạo tên đăng nhập (Mã nhân viên)
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="autoGenPassword"
                  checked={formData.autoGenPassword}
                  onChange={(e) => { updateField("autoGenPassword", e.target.checked); }}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                />
                <Label
                  htmlFor="autoGenPassword"
                  className="text-xs font-medium text-foreground cursor-pointer"
                >
                  Tự động tạo mật khẩu
                </Label>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
