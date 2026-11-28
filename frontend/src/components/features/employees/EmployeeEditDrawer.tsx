import { AppDrawer, DatePicker } from "@/components/common"
import { EmployeeWeeklyScheduleSection } from "@/components/features/employees/employee-weekly-schedule-section"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getRoleLabel } from "@/config/entities/employee.config"
import type { EmployeeEditFormValues } from "@/hooks/employees/employee-edit-form.schema"
import { useEmployeeWeeklyScheduleSection } from "@/hooks/employees/use-employee-weekly-schedule-section"
import { useEmployeeEditModal } from "@/hooks/employees/useEmployeeEditModal"
import {
  useEmployeeRoles,
  useRoles,
  useUpdateEmployeeRoles,
} from "@/hooks/security/queries/use-security-query"
import { usePositions } from "@/hooks/use-position-query"
import type { Employee } from "@/types/employee.types"
import type { Role } from "@/types/security.types"
import { isPartTimeWorkSchedule } from "@/utils/employee/is-part-time-work-schedule.util"

import { useState } from "react"

import type { FieldErrors, UseFormRegister, UseFormSetValue, UseFormWatch } from "react-hook-form"
import { toast } from "sonner"

import { EmployeeJobFieldsSection } from "./EmployeeJobFieldsSection"

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
            <EditAccountSection
              register={register}
              errors={errors}
              selectedRoleIds={selectedRoleIds}
              employeeRoles={employeeRoles}
              allRoles={allRoles}
              onRoleSelectionChange={handleRoleSelectionChange}
            />

            <EditBasicInfoSection
              register={register}
              errors={errors}
              watch={watch}
              setValue={setValue}
            />

            <EmployeeJobFieldsSection
              errors={errors}
              watch={watch}
              setValue={setValue}
              positions={positions}
              isEdit
            />

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

function EditAccountSection({
  register,
  errors,
  selectedRoleIds,
  employeeRoles,
  allRoles,
  onRoleSelectionChange,
}: {
  register: UseFormRegister<EmployeeEditFormValues>
  errors: FieldErrors<EmployeeEditFormValues>
  selectedRoleIds: string[]
  employeeRoles?: Array<{ id: string; name: string }>
  allRoles?: { data: Role[] }
  onRoleSelectionChange: (roleIds: string[]) => void
}) {
  return (
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
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-[12px] text-muted-foreground">Vai trò & Quyền hạn</Label>
          <Select
            value={selectedRoleIds[0] || (employeeRoles?.[0]?.id ?? "none")}
            onValueChange={(val) => {
              if (val === "none") {
                onRoleSelectionChange([])
              } else {
                onRoleSelectionChange([val])
              }
            }}
          >
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Chọn vai trò..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">-- Không gán vai trò --</SelectItem>
              {allRoles?.data?.map((role) => (
                <SelectItem key={role.id} value={role.id}>
                  {getRoleLabel(role.name)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </section>
  )
}

function EditBasicInfoSection({
  register,
  errors,
  watch,
  setValue,
}: {
  register: UseFormRegister<EmployeeEditFormValues>
  errors: FieldErrors<EmployeeEditFormValues>
  watch: UseFormWatch<EmployeeEditFormValues>
  setValue: UseFormSetValue<EmployeeEditFormValues>
}) {
  return (
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
          {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="phone" className="text-[12px] text-muted-foreground">
              Số điện thoại
            </Label>
            <Input
              id="phone"
              {...register("phone")}
              className={`bg-background ${errors.phone ? "border-destructive" : ""}`}
            />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
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
          <Label htmlFor="dateOfBirth" className="text-[12px] text-muted-foreground">
            Ngày sinh
          </Label>
          <DatePicker
            id="dateOfBirth"
            value={watch("dateOfBirth") || null}
            onChange={(val) => {
              setValue("dateOfBirth", val || "", {
                shouldValidate: true,
                shouldDirty: true,
              })
            }}
            placeholder="Chọn ngày sinh..."
          />
          {errors.dateOfBirth && (
            <p className="text-xs text-destructive">{errors.dateOfBirth.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="address" className="text-[12px] text-muted-foreground">
            Địa chỉ thường trú
          </Label>
          <Input
            id="address"
            {...register("address")}
            className={`bg-background ${errors.address ? "border-destructive" : ""}`}
          />
          {errors.address && <p className="text-xs text-destructive">{errors.address.message}</p>}
        </div>
      </div>
    </section>
  )
}
