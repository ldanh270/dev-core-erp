import { DatePicker } from "@/components/common"
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
  WORK_SCHEDULE_TYPE,
  WORK_SCHEDULE_TYPES,
  WORK_SCHEDULE_TYPE_LABELS,
  getEmployeeStatusLabel,
  getEmployeeTypeLabel,
} from "@/config/entities/employee.config"
import type { EmployeeStatus, WorkScheduleType } from "@/types/employee.types"

import type { FieldErrors, FieldValues, Path, PathValue, UseFormSetValue, UseFormWatch } from "react-hook-form"

export interface EmployeeJobFieldsValues {
  positionId?: string
  employeeType?: IEmploymentCategoryType | string
  status?: EmployeeStatus | string
  workScheduleType?: WorkScheduleType | string
  startDate?: string
  endDate?: string
}

interface EmployeeJobFieldsSectionProps<TFieldValues extends FieldValues & EmployeeJobFieldsValues = EmployeeJobFieldsValues> {
  errors: FieldErrors<TFieldValues>
  watch: UseFormWatch<TFieldValues>
  setValue: UseFormSetValue<TFieldValues>
  positions: Array<{ id: string; name: string }>
  isEdit?: boolean
}

/**
 * Reusable Job & Contract form section for Employee Creation and Editing.
 * Consolidates position, employee type, status, work schedule, and date pickers.
 */
export function EmployeeJobFieldsSection<TFieldValues extends FieldValues & EmployeeJobFieldsValues>({
  errors,
  watch,
  setValue,
  positions,
  isEdit = false,
}: EmployeeJobFieldsSectionProps<TFieldValues>) {
  return (
    <section className={isEdit ? "" : "grid grid-cols-12 gap-8"}>
      {!isEdit ? (
        <div className="col-span-4 space-y-1">
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
            Công việc & Hợp đồng
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Thiết lập chức danh và hình thức làm việc tại công ty.
          </p>
        </div>
      ) : (
        <h3 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Công việc & Hợp đồng
        </h3>
      )}

      <div
        className={
          isEdit
            ? "border border-border rounded-xl p-4 bg-card space-y-4"
            : "col-span-8 grid grid-cols-2 gap-5"
        }
      >
        <div className={isEdit ? "grid grid-cols-2 gap-4" : "contents"}>
          <div className="space-y-1.5">
            <Label htmlFor="positionId" className="text-[12px] text-muted-foreground font-medium">
              Chức danh (Vị trí)
            </Label>
            <Select
              value={(watch("positionId" as Path<TFieldValues>) as string) || "none"}
              onValueChange={(val) => {
                setValue(
                  "positionId" as Path<TFieldValues>,
                  (val === "none" ? "" : val) as PathValue<TFieldValues, Path<TFieldValues>>,
                  {
                    shouldValidate: true,
                    shouldDirty: true,
                  },
                )
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
                {positions.map((pos) => (
                  <SelectItem key={pos.id} value={pos.id}>
                    {pos.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.positionId && (
              <p className="text-xs text-destructive">{errors.positionId.message as string}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="employeeType" className="text-[12px] text-muted-foreground font-medium">
              Loại nhân sự
            </Label>
            <Select
              value={
                (watch("employeeType" as Path<TFieldValues>) as string) ||
                EMPLOYMENT_CATEGORY_TYPES[0]
              }
              onValueChange={(val) => {
                setValue(
                  "employeeType" as Path<TFieldValues>,
                  val as PathValue<TFieldValues, Path<TFieldValues>>,
                  {
                    shouldValidate: true,
                    shouldDirty: true,
                  },
                )
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
        </div>

        <div className={isEdit ? "grid grid-cols-2 gap-4" : "contents"}>
          <div className="space-y-1.5">
            <Label htmlFor="status" className="text-[12px] text-muted-foreground font-medium">
              Trạng thái{isEdit ? "" : " ban đầu"}
            </Label>
            <Select
              value={(watch("status" as Path<TFieldValues>) as string) || EMPLOYEE_STATUSES[0]}
              onValueChange={(val) => {
                setValue(
                  "status" as Path<TFieldValues>,
                  val as PathValue<TFieldValues, Path<TFieldValues>>,
                  {
                    shouldValidate: true,
                    shouldDirty: true,
                  },
                )
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

          <div className="space-y-1.5">
            <Label
              htmlFor="workScheduleType"
              className="text-[12px] text-muted-foreground font-medium"
            >
              Hình thức làm việc
            </Label>
            <Select
              value={
                (watch("workScheduleType" as Path<TFieldValues>) as string) ||
                WORK_SCHEDULE_TYPES[0]
              }
              onValueChange={(val) => {
                setValue(
                  "workScheduleType" as Path<TFieldValues>,
                  val as PathValue<TFieldValues, Path<TFieldValues>>,
                  {
                    shouldValidate: true,
                    shouldDirty: true,
                  },
                )
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
        </div>

        <div className={isEdit ? "grid grid-cols-2 gap-4" : "col-span-2 space-y-1.5"}>
          <div className="space-y-1.5">
            <Label htmlFor="startDate" className="text-[12px] text-muted-foreground font-medium">
              Ngày bắt đầu{isEdit ? "" : " làm việc"}
            </Label>
            <DatePicker
              id="startDate"
              value={(watch("startDate" as Path<TFieldValues>) as string) || null}
              onChange={(val) => {
                setValue(
                  "startDate" as Path<TFieldValues>,
                  (val || "") as PathValue<TFieldValues, Path<TFieldValues>>,
                  { shouldValidate: true, shouldDirty: true },
                )
              }}
              placeholder="Chọn ngày bắt đầu..."
            />
            {errors.startDate && (
              <p className="text-xs text-destructive">{errors.startDate.message as string}</p>
            )}
          </div>

          {isEdit && (
            <div className="space-y-1.5">
              <Label htmlFor="endDate" className="text-[12px] text-muted-foreground">
                Ngày kết thúc
              </Label>
              <DatePicker
                id="endDate"
                value={(watch("endDate" as Path<TFieldValues>) as string) || null}
                onChange={(val) => {
                  setValue(
                    "endDate" as Path<TFieldValues>,
                    (val || "") as PathValue<TFieldValues, Path<TFieldValues>>,
                    { shouldValidate: true, shouldDirty: true },
                  )
                }}
                placeholder="Chọn ngày kết thúc..."
              />
              {errors.endDate && (
                <p className="text-xs text-destructive">{errors.endDate.message as string}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
