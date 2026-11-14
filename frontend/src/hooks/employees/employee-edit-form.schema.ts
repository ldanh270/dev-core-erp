import {
  EMPLOYEE_STATUSES,
  EMPLOYEE_TYPES,
  WORK_SCHEDULE_TYPES,
} from "@/config/entities/employee.config"

import { z } from "zod"

/** Zod schema for employee edit drawer — all fields optional except validation rules. */
export const employeeEditFormSchema = z.object({
  fullName: z
    .string()
    .min(2, "Họ và tên phải có ít nhất 2 ký tự")
    .max(100, "Họ và tên quá dài")
    .trim()
    .optional(),

  email: z.string().email("Định dạng email không hợp lệ").trim().optional(),

  username: z
    .string()
    .min(3, "Tên đăng nhập phải có ít nhất 3 ký tự")
    .max(50, "Tên đăng nhập quá dài")
    .trim()
    .optional(),

  password: z
    .string()
    .min(8, "Mật khẩu phải có ít nhất 8 ký tự")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      "Mật khẩu phải chứa chữ hoa, chữ thường, số và ký tự đặc biệt",
    )
    .or(z.literal(""))
    .optional(),
  phone: z
    .string()
    .refine(
      (val) => !val || val === "" || /^[0-9+\-\s()]{7,20}$/.test(val),
      "Định dạng số điện thoại không hợp lệ",
    )
    .optional(),

  position: z.string().max(100, "Chức danh quá dài").optional(),
  positionId: z.string().optional(),

  employeeType: z.enum(EMPLOYEE_TYPES).optional(),
  workScheduleType: z.enum(WORK_SCHEDULE_TYPES).optional(),
  status: z.enum(EMPLOYEE_STATUSES).optional(),

  dateOfBirth: z
    .string()
    .refine((val) => !val || val === "" || !isNaN(Date.parse(val)), {
      message: "Ngày sinh không hợp lệ",
    })
    .optional(),

  nationalId: z
    .string()
    .refine(
      (val) => !val || val === "" || (val.length >= 9 && val.length <= 20),
      "CCCD/CMND phải từ 9 đến 20 ký tự",
    )
    .optional(),

  address: z.string().max(500, "Địa chỉ quá dài").optional(),

  startDate: z
    .string()
    .refine((val) => !val || val === "" || !isNaN(Date.parse(val)), {
      message: "Ngày bắt đầu làm việc không hợp lệ",
    })
    .optional(),

  endDate: z
    .string()
    .refine((val) => !val || val === "" || !isNaN(Date.parse(val)), {
      message: "Ngày kết thúc làm việc không hợp lệ",
    })
    .optional(),
})

export type EmployeeEditFormValues = z.infer<typeof employeeEditFormSchema>
