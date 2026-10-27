import { AppModal, DatePicker } from "@/components/common"
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
import {
  EMPLOYEE_STATUSES,
  EMPLOYMENT_CATEGORY_TYPES,
  type IEmploymentCategoryType,
  getEmployeeStatusLabel,
  getEmployeeTypeLabel,
  getRoleLabel,
  WORK_SCHEDULE_TYPE,
  WORK_SCHEDULE_TYPE_LABELS,
  WORK_SCHEDULE_TYPES,
} from "@/config/entities/employee.config"
import type { EmployeeStatus, WorkScheduleType } from "@/types/employee.types"
import { useEmployeeCreateModal } from "@/hooks/employees/useEmployeeCreateModal"
import { usePositions } from "@/hooks/use-position-query"

import { X } from "lucide-react"

/**
 * Prop definitions for EmployeeCreateModal component.
 */
interface Props {
  /** Boolean state flag indicating if the modal dialog is open */
  isOpen: boolean
  /** Callback event function triggered on closing the modal dialog */
  onClose: () => void
}

/**
 * EmployeeCreateModal Component.
 * Wide, enterprise-grade modal containing a form to register a brand new employee record.
 * Handles inputs validation (via Zod & React Hook Form from the custom hooks helper).
 */
export function EmployeeCreateModal({ isOpen, onClose }: Props) {
  // Extract react hook form fields, submission states, and error mappings
  const { register, handleSubmit, setValue, watch, errors, isPending, handleClose, roles } = useEmployeeCreateModal(onClose)
  const { data: positions = [] } = usePositions()

  return (
    <AppModal isOpen={isOpen} onClose={handleClose} widthClassName="sm:max-w-4xl">
      <div className="flex flex-col h-full max-h-[90vh]">
        {/* Header toolbar banner */}
        <div className="px-10 pt-10 pb-6 bg-muted/10 border-b border-border flex justify-between items-start shrink-0">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Thêm nhân sự mới</h2>
            <p className="text-[13px] text-muted-foreground mt-1.5">
              Điền đầy đủ các thông tin cần thiết để đăng ký hồ sơ nhân viên mới
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors"
          >
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>

        {/* Form content viewport */}
        <div className="p-10 overflow-y-auto hide-scrollbar">
          <form id="create-employee-form" onSubmit={handleSubmit} className="space-y-10">
            {/* Account section */}
            <section className="grid grid-cols-12 gap-8">
              <div className="col-span-4 space-y-1">
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                  Tài khoản & Phân quyền
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Thông tin đăng nhập và quyền truy cập vào hệ thống.
                </p>
              </div>
              <div className="col-span-8 grid grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="username"
                    className="text-[12px] text-muted-foreground font-medium"
                  >
                    Tên đăng nhập *
                  </Label>
                  <Input
                    id="username"
                    {...register("username")}
                    className={`bg-background h-10 ${errors.username ? "border-destructive" : ""}`}
                  />
                  {errors.username && (
                    <p className="text-xs text-destructive">{errors.username.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-[12px] text-muted-foreground font-medium">
                    Email *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    {...register("email")}
                    className={`bg-background h-10 ${errors.email ? "border-destructive" : ""}`}
                  />
                  {errors.email && (
                    <p className="text-xs text-destructive">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="password"
                    className="text-[12px] text-muted-foreground font-medium"
                  >
                    Mật khẩu *
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    {...register("password")}
                    className={`bg-background h-10 ${errors.password ? "border-destructive" : ""}`}
                  />
                  {errors.password && (
                    <p className="text-xs text-destructive">{errors.password.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="role" className="text-[12px] text-muted-foreground font-medium">
                    Phân quyền
                  </Label>
                  <Select
                    value={watch("role") || (roles[0]?.name ?? "")}
                    onValueChange={(val) => {
                      setValue("role", val, { shouldValidate: true, shouldDirty: true })
                    }}
                  >
                    <SelectTrigger id="role" className="h-10 bg-background">
                      <SelectValue placeholder="Chọn phân quyền..." />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((r) => (
                        <SelectItem key={r.id} value={r.name}>
                          {getRoleLabel(r.name)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>

            <div className="w-full h-px bg-border/60" />

            {/* Basic Info section */}
            <section className="grid grid-cols-12 gap-8">
              <div className="col-span-4 space-y-1">
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                  Thông tin cơ bản
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Định danh và phương thức liên lạc cá nhân.
                </p>
              </div>
              <div className="col-span-8 grid grid-cols-2 gap-5">
                <div className="col-span-2 space-y-1.5">
                  <Label
                    htmlFor="fullName"
                    className="text-[12px] text-muted-foreground font-medium"
                  >
                    Họ và tên *
                  </Label>
                  <Input
                    id="fullName"
                    {...register("fullName")}
                    className={`bg-background h-10 ${errors.fullName ? "border-destructive" : ""}`}
                  />
                  {errors.fullName && (
                    <p className="text-xs text-destructive">{errors.fullName.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-[12px] text-muted-foreground font-medium">
                    Số điện thoại
                  </Label>
                  <Input
                    id="phone"
                    {...register("phone")}
                    className={`bg-background h-10 ${errors.phone ? "border-destructive" : ""}`}
                  />
                  {errors.phone && (
                    <p className="text-xs text-destructive">{errors.phone.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="nationalId"
                    className="text-[12px] text-muted-foreground font-medium"
                  >
                    CCCD / CMND
                  </Label>
                  <Input
                    id="nationalId"
                    {...register("nationalId")}
                    className={`bg-background h-10 ${errors.nationalId ? "border-destructive" : ""}`}
                  />
                  {errors.nationalId && (
                    <p className="text-xs text-destructive">{errors.nationalId.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="dateOfBirth"
                    className="text-[12px] text-muted-foreground font-medium"
                  >
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
                  <Label
                    htmlFor="address"
                    className="text-[12px] text-muted-foreground font-medium"
                  >
                    Địa chỉ
                  </Label>
                  <Input
                    id="address"
                    {...register("address")}
                    className={`bg-background h-10 ${errors.address ? "border-destructive" : ""}`}
                  />
                  {errors.address && (
                    <p className="text-xs text-destructive">{errors.address.message}</p>
                  )}
                </div>
              </div>
            </section>

            <div className="w-full h-px bg-border/60" />

            {/* Employment and contract options section */}
            <section className="grid grid-cols-12 gap-8">
              <div className="col-span-4 space-y-1">
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                  Công việc & Hợp đồng
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Thiết lập chức danh và hình thức làm việc tại công ty.
                </p>
              </div>
              <div className="col-span-8 grid grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="positionId"
                    className="text-[12px] text-muted-foreground font-medium"
                  >
                    Chức danh (Vị trí)
                  </Label>
                  <Select
                    value={watch("positionId") || "none"}
                    onValueChange={(val) => {
                      setValue("positionId", val === "none" ? "" : val, { shouldValidate: true, shouldDirty: true })
                    }}
                  >
                    <SelectTrigger
                      id="positionId"
                      className={`h-10 bg-background ${errors.positionId ? "border-destructive" : ""}`}
                    >
                      <SelectValue placeholder="-- Chọn chức danh --" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">-- Chọn chức danh --</SelectItem>
                      {positions.map((pos: { id: string; name: string }) => (
                        <SelectItem key={pos.id} value={pos.id}>
                          {pos.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.positionId && (
                    <p className="text-xs text-destructive">{errors.positionId.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="employeeType"
                    className="text-[12px] text-muted-foreground font-medium"
                  >
                    Loại nhân sự
                  </Label>
                  <Select
                    value={watch("employeeType") || EMPLOYMENT_CATEGORY_TYPES[0]}
                    onValueChange={(val) => {
                      setValue("employeeType", val as IEmploymentCategoryType, { shouldValidate: true, shouldDirty: true })
                    }}
                  >
                    <SelectTrigger id="employeeType" className="h-10 bg-background">
                      <SelectValue placeholder="Chọn loại nhân sự..." />
                    </SelectTrigger>
                    <SelectContent>
                      {EMPLOYMENT_CATEGORY_TYPES.map((typeKey) => (
                        <SelectItem key={typeKey} value={typeKey}>
                          {getEmployeeTypeLabel(typeKey)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="status" className="text-[12px] text-muted-foreground font-medium">
                    Trạng thái ban đầu
                  </Label>
                  <Select
                    value={watch("status") || EMPLOYEE_STATUSES[0]}
                    onValueChange={(val) => {
                      setValue("status", val as EmployeeStatus, { shouldValidate: true, shouldDirty: true })
                    }}
                  >
                    <SelectTrigger id="status" className="h-10 bg-background">
                      <SelectValue placeholder="Chọn trạng thái..." />
                    </SelectTrigger>
                    <SelectContent>
                      {EMPLOYEE_STATUSES.map((statusKey) => (
                        <SelectItem key={statusKey} value={statusKey}>
                          {getEmployeeStatusLabel(statusKey)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>


                {/* Part-time schedule is separate from employment category (contract type). */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="workScheduleType"
                    className="text-[12px] text-muted-foreground font-medium"
                  >
                    Hình thức làm việc
                  </Label>
                  <Select
                    value={watch("workScheduleType") || WORK_SCHEDULE_TYPES[0]}
                    onValueChange={(val) => {
                      setValue("workScheduleType", val as WorkScheduleType, { shouldValidate: true, shouldDirty: true })
                    }}
                  >
                    <SelectTrigger id="workScheduleType" className="h-10 bg-background">
                      <SelectValue placeholder="Chọn hình thức làm việc..." />
                    </SelectTrigger>
                    <SelectContent>
                      {WORK_SCHEDULE_TYPES.map((typeKey) => (
                        <SelectItem key={typeKey} value={typeKey}>
                          {typeKey === WORK_SCHEDULE_TYPE.FULL_TIME
                            ? WORK_SCHEDULE_TYPE_LABELS.full_time
                            : WORK_SCHEDULE_TYPE_LABELS.part_time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2 space-y-1.5">
                  <Label
                    htmlFor="startDate"
                    className="text-[12px] text-muted-foreground font-medium"
                  >
                    Ngày bắt đầu làm việc
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
              </div>
            </section>
          </form>
        </div>

        {/* Actions footer toolbar */}
        <div className="px-10 py-6 bg-muted/10 border-t border-border flex items-center justify-end gap-3 shrink-0">
          <Button variant="outline" onClick={handleClose} type="button" className="min-w-24">
            Hủy
          </Button>
          <Button
            type="submit"
            form="create-employee-form"
            disabled={isPending}
            className="min-w-32"
          >
            {isPending ? "Đang lưu..." : "Lưu nhân sự"}
          </Button>
        </div>
      </div>
    </AppModal>
  )
}
