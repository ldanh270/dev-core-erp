import {
  EMPLOYEE_STATUSES,
  EMPLOYMENT_CATEGORY_TYPES,
  WORK_SCHEDULE_TYPES,
  WORK_SCHEDULE_TYPE,
} from "@/config/entities/employee.config"
import type { CreateEmployeeDto } from "@/types/employee.types"

import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { useRoles } from "@/hooks/security/queries/use-security-query"
import { useCreateEmployee } from "./queries/useEmployeeQuery"

const createSchema = z.object({
  fullName: z
    .string()
    .min(2, "Họ và tên phải có ít nhất 2 ký tự")
    .max(100, "Họ và tên quá dài")
    .trim(),

  username: z
    .string()
    .min(3, "Tên đăng nhập phải có ít nhất 3 ký tự")
    .max(50, "Tên đăng nhập quá dài")
    .trim(),

  email: z.string().email("Định dạng email không hợp lệ").trim(),

  password: z
    .string()
    .min(8, "Mật khẩu phải có ít nhất 8 ký tự")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      "Mật khẩu phải chứa chữ hoa, chữ thường, số và ký tự đặc biệt",
    ),

  role: z.string().min(1, "Vui lòng chọn vai trò"),
  employeeType: z.enum(EMPLOYMENT_CATEGORY_TYPES),
  workScheduleType: z.enum(WORK_SCHEDULE_TYPES), // full_time | part_time schedule model
  status: z.enum(EMPLOYEE_STATUSES).optional(),

  phone: z
    .string()
    .refine(
      (val) => val === "" || /^[0-9+\-\s()]{7,20}$/.test(val),
      "Định dạng số điện thoại không hợp lệ",
    )
    .optional(),

  position: z.string().max(100, "Chức danh quá dài").optional(),
  positionId: z.string().optional(),

  dateOfBirth: z
    .string()
    .refine((val) => val === "" || !isNaN(Date.parse(val)), { message: "Ngày sinh không hợp lệ" })
    .optional(),

  nationalId: z
    .string()
    .refine(
      (val) => val === "" || (val.length >= 9 && val.length <= 20),
      "CCCD/CMND phải từ 9 đến 20 ký tự",
    )
    .optional(),

  address: z.string().max(500, "Địa chỉ quá dài").optional(),

  startDate: z
    .string()
    .refine((val) => val === "" || !isNaN(Date.parse(val)), {
      message: "Ngày bắt đầu làm việc không hợp lệ",
    })
    .optional(),
})

type CreateFormValues = z.infer<typeof createSchema>

/**
 * Custom hook to manage employeecreatemodal.
 */
export function useEmployeeCreateModal(onClose: () => void) {
  const createMutation = useCreateEmployee()
  const { data: rolesData, isLoading: isLoadingRoles } = useRoles()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<CreateFormValues>({
    resolver: zodResolver(createSchema),
    mode: "onBlur", // Thêm mode onBlur để validate khi user rời khỏi trường nhập
    defaultValues: {
      role: "",
      employeeType: EMPLOYMENT_CATEGORY_TYPES[0],
      workScheduleType: WORK_SCHEDULE_TYPE.FULL_TIME, // default new hires to company shift model
      status: EMPLOYEE_STATUSES[0],
    },
  })

  // Dynamically set default role when roles finish loading
  useEffect(() => {
    if (rolesData?.data) {
      const defaultRole = rolesData.data.find((r) => r.isDefault)?.name || "employee"
      reset({
        role: defaultRole,
        employeeType: EMPLOYMENT_CATEGORY_TYPES[0],
        workScheduleType: WORK_SCHEDULE_TYPE.FULL_TIME,
        status: EMPLOYEE_STATUSES[0],
      })
    }
  }, [rolesData, reset])

  const onSubmit = async (data: CreateFormValues) => {
    try {
      const formattedData: CreateEmployeeDto = {
        ...data,
        phone: data.phone === "" ? undefined : data.phone,
        position: data.position === "" ? undefined : data.position,
        positionId: data.positionId === "" ? undefined : data.positionId,
        dateOfBirth: data.dateOfBirth === "" ? undefined : data.dateOfBirth,
        nationalId: data.nationalId === "" ? undefined : data.nationalId,
        address: data.address === "" ? undefined : data.address,
        startDate: data.startDate === "" ? undefined : data.startDate,
      }
      await createMutation.mutateAsync(formattedData)
      reset()
      onClose()
    } catch (error) {
      console.error(error)
      const err = error as { response?: { data?: { error?: { message?: string } } } }
      const errorMsg = err.response?.data?.error?.message || "Có lỗi xảy ra khi thêm nhân sự"
      toast.error(errorMsg)
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  return {
    register,
    setValue,
    watch,
    handleSubmit: handleSubmit(onSubmit),
    errors,
    isPending: createMutation.isPending,
    handleClose,
    roles: rolesData?.data || [],
    isLoadingRoles,
  }
}
