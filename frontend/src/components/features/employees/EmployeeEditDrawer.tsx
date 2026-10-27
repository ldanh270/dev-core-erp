import { AppDrawer } from "@/components/common"
import { EmployeeWeeklyScheduleSection } from "@/components/features/employees/employee-weekly-schedule-section"
import { DatePicker } from "@/components/common"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  EMPLOYEE_STATUSES,
  EMPLOYEE_STATUS_LABELS,
  EMPLOYMENT_CATEGORY_TYPES,
  WORK_SCHEDULE_TYPES,
  getEmployeeTypeLabel,
  getRoleLabel,
  getWorkScheduleTypeLabel,
} from "@/config/entities/employee.config"
import { useEmployeeWeeklyScheduleSection } from "@/hooks/employees/use-employee-weekly-schedule-section"
import { useEmployeeEditModal } from "@/hooks/employees/useEmployeeEditModal"
import {
  useEmployeeRoles,
  useRoles,
  useUpdateEmployeeRoles,
} from "@/hooks/security/queries/use-security-query"
import { usePositions } from "@/hooks/use-position-query"
import type { Employee } from "@/types/employee.types"
import { isPartTimeWorkSchedule } from "@/utils/employee/is-part-time-work-schedule.util"

import { useState } from "react"

import { toast } from "sonner"

interface Props {
  isOpen: boolean
  onClose: () => void
  employee: Employee | null
}

/** Slide-out drawer to edit employee profile, roles, and weekly schedule. */
export function EmployeeEditDrawer({ isOpen, onClose, employee }: Props) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    onSubmitEmployee,
    errors,
    isPending: isEmployeePending,
  } = useEmployeeEditModal(employee, isOpen)
  const { data: positions = [] } = usePositions()

  const weeklySchedule = useEmployeeWeeklyScheduleSection(employee?.id, isOpen)
  const { data: allRoles } = useRoles()
  const { data: employeeRoles } = useEmployeeRoles(employee?.id || "")
  const updateEmployeeRoles = useUpdateEmployeeRoles()

  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([])
  const roleSeedKey = employeeRoles?.map((role) => role.id).join(",") ?? ""
  const [prevRoleSeed, setPrevRoleSeed] = useState(roleSeedKey)

  if (roleSeedKey !== prevRoleSeed) {
    setPrevRoleSeed(roleSeedKey)
    setSelectedRoleIds(employeeRoles?.map((role) => role.id) ?? [])
  }

  const handleRoleSelectionChange = (roleIds: string[]) => {
    setSelectedRoleIds(roleIds)
  }

  const onSubmit = handleSubmit(async (data) => {
    if (!employee) return
    try {
      await onSubmitEmployee(data)
      await updateEmployeeRoles.mutateAsync({
        employeeId: employee.id,
        roleIds: selectedRoleIds,
        version: employee.version || 1,
      })
      const scheduleApplied = await weeklySchedule.applyIfNeeded()
      toast.success(
        scheduleApplied
          ? "Đã cập nhật thông tin nhân sự, vai trò và lịch tuần"
          : "Đã cập nhật thông tin nhân sự và vai trò",
      )
      onClose()
    } catch (error) {
      console.error(error)
    }
  })

  const isPending = isEmployeePending || weeklySchedule.isPending || updateEmployeeRoles.isPending

  if (!employee) return null

  return (
    <AppDrawer isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col h-full">
        <div className="px-10 pt-14 pb-8 bg-muted/20 border-b border-border">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Chỉnh sửa nhân sự</h2>
          <p className="text-[13px] text-muted-foreground mt-1.5">
            Cập nhật thông tin cho {employee.fullName}
          </p>
        </div>

        <div className="p-10 flex-1 overflow-y-auto">
          <form id="edit-employee-form" onSubmit={onSubmit} className="space-y-8">
            <section>
              <h3 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Tài khoản & Phân quyền
              </h3>
              <div className="border border-border rounded-xl p-4 bg-card space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="username" className="text-[12px] text-muted-foreground">
                      Tên đăng nhập
                    </Label>
                    <Input
                      id="username"
                      {...register("username")}
                      className={`bg-background ${errors.username ? "border-destructive" : ""}`}
                    />
                    {errors.username && (
                      <p className="text-xs text-destructive">{errors.username.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-[12px] text-muted-foreground">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      {...register("email")}
                      className={`bg-background ${errors.email ? "border-destructive" : ""}`}
                    />
                    {errors.email && (
                      <p className="text-xs text-destructive">{errors.email.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-[12px] text-muted-foreground">
                      Mật khẩu mới (Tùy chọn)
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Để trống nếu không đổi"
                      {...register("password")}
                      className={`bg-background ${errors.password ? "border-destructive" : ""}`}
                    />
                    {errors.password && (
                      <p className="text-xs text-destructive">{errors.password.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="role-select" className="text-[12px] text-muted-foreground">
                      Phân quyền
                    </Label>
                    <select
                      key={roleSeedKey}
                      id="role-select"
                      className="flex h-12 w-full rounded-full border border-input bg-background px-6 py-3 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      defaultValue={employeeRoles?.[0]?.id || ""}
                      onChange={(e) => { handleRoleSelectionChange([e.target.value]); }}
                    >
                      <option value="">-- Chọn phân quyền --</option>
                      {allRoles?.data?.map((r) => (
                        <option key={r.id} value={r.id}>
                          {getRoleLabel(r.name)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Thông tin cơ bản
              </h3>
              <div className="border border-border rounded-xl p-4 bg-card space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="fullName" className="text-[12px] text-muted-foreground">
                    Họ và tên
                  </Label>
                  <Input
                    id="fullName"
                    {...register("fullName")}
                    className={`bg-background ${errors.fullName ? "border-destructive" : ""}`}
                  />
                  {errors.fullName && (
                    <p className="text-xs text-destructive">{errors.fullName.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-[12px] text-muted-foreground">
                    Số điện thoại
                  </Label>
                  <Input
                    id="phone"
                    {...register("phone")}
                    className={`bg-background ${errors.phone ? "border-destructive" : ""}`}
                  />
                  {errors.phone && (
                    <p className="text-xs text-destructive">{errors.phone.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="dateOfBirth" className="text-[12px] text-muted-foreground">
                      Ngày sinh
                    </Label>
                    <DatePicker
                      id="dateOfBirth"
                      value={watch("dateOfBirth") || null}
                      onChange={(val) => {
                        setValue("dateOfBirth", val || "", { shouldValidate: true, shouldDirty: true });
                      }}
                      placeholder="Chọn ngày sinh..."
                    />
                    {errors.dateOfBirth && (
                      <p className="text-xs text-destructive">{errors.dateOfBirth.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="nationalId" className="text-[12px] text-muted-foreground">
                      CCCD / CMND
                    </Label>
                    <Input
                      id="nationalId"
                      {...register("nationalId")}
                      className={`bg-background ${errors.nationalId ? "border-destructive" : ""}`}
                    />
                    {errors.nationalId && (
                      <p className="text-xs text-destructive">{errors.nationalId.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="address" className="text-[12px] text-muted-foreground">
                    Địa chỉ
                  </Label>
                  <Input
                    id="address"
                    {...register("address")}
                    className={`bg-background ${errors.address ? "border-destructive" : ""}`}
                  />
                  {errors.address && (
                    <p className="text-xs text-destructive">{errors.address.message}</p>
                  )}
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Công việc & Hợp đồng
              </h3>
              <div className="border border-border rounded-xl p-4 bg-card space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="positionId" className="text-[12px] text-muted-foreground">
                      Chức danh (Vị trí)
                    </Label>
                    <select
                      id="positionId"
                      {...register("positionId")}
                      className="flex h-12 w-full rounded-full border border-input bg-background px-6 py-3 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="">-- Chọn chức danh --</option>
                      {positions.map((pos: { id: string; name: string }) => (
                        <option key={pos.id} value={pos.id}>
                          {pos.name}
                        </option>
                      ))}
                    </select>
                    {errors.positionId && (
                      <p className="text-xs text-destructive">{errors.positionId.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="employeeType" className="text-[12px] text-muted-foreground">
                      Loại nhân sự
                    </Label>
                    <select
                      id="employeeType"
                      {...register("employeeType")}
                      className="flex h-12 w-full rounded-full border border-input bg-background px-6 py-3 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      {EMPLOYMENT_CATEGORY_TYPES.map((typeKey) => (
                        <option key={typeKey} value={typeKey}>
                          {getEmployeeTypeLabel(typeKey)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="status" className="text-[12px] text-muted-foreground">
                      Trạng thái
                    </Label>
                    <select
                      id="status"
                      {...register("status")}
                      className="flex h-12 w-full rounded-full border border-input bg-background px-6 py-3 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      {EMPLOYEE_STATUSES.map((statusKey) => (
                        <option key={statusKey} value={statusKey}>
                          {EMPLOYEE_STATUS_LABELS[statusKey]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="workScheduleType" className="text-[12px] text-muted-foreground">
                      Hình thức làm việc
                    </Label>
                    <select
                      id="workScheduleType"
                      {...register("workScheduleType")}
                      className="flex h-12 w-full rounded-full border border-input bg-background px-6 py-3 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      {WORK_SCHEDULE_TYPES.map((typeKey) => (
                        <option key={typeKey} value={typeKey}>
                          {getWorkScheduleTypeLabel(typeKey)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="startDate" className="text-[12px] text-muted-foreground">
                      Ngày bắt đầu
                    </Label>
                    <DatePicker
                      id="startDate"
                      value={watch("startDate") || null}
                      onChange={(val) => {
                        setValue("startDate", val || "", { shouldValidate: true, shouldDirty: true });
                      }}
                      placeholder="Chọn ngày bắt đầu..."
                    />
                    {errors.startDate && (
                      <p className="text-xs text-destructive">{errors.startDate.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="endDate" className="text-[12px] text-muted-foreground">
                      Ngày kết thúc
                    </Label>
                    <DatePicker
                      id="endDate"
                      value={watch("endDate") || null}
                      onChange={(val) => {
                        setValue("endDate", val || "", { shouldValidate: true, shouldDirty: true });
                      }}
                      placeholder="Chọn ngày kết thúc..."
                    />
                    {errors.endDate && (
                      <p className="text-xs text-destructive">{errors.endDate.message}</p>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <EmployeeWeeklyScheduleSection
              section={weeklySchedule}
              hidden={isPartTimeWorkSchedule({
                workScheduleType: watch("workScheduleType") ?? employee.workScheduleType,
                employeeType: watch("employeeType") ?? employee.employeeType,
              })}
            />
          </form>
        </div>

        <div className="p-6 bg-muted/20 border-t border-border flex items-center justify-end gap-3 shrink-0">
          <Button variant="outline" onClick={onClose} type="button">
            Hủy
          </Button>
          <Button type="submit" form="edit-employee-form" disabled={isPending}>
            {isPending ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </div>
      </div>
    </AppDrawer>
  )
}
