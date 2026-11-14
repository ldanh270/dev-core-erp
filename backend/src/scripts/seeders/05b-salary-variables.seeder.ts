import { PART_TIME_PAYROLL_VARIABLE_SEED } from "@/configs/entities/part-time-payroll.config.ts"
import { prisma } from "@/libs/database.ts"

import { SeedContext } from "./seed-context.ts"
import { ISeeder } from "./seeder.interface.ts"
import { registry } from "./seeder.registry.ts"

export class SalaryVariablesSeeder implements ISeeder {
  name = "SalaryVariables"
  order = 5.5

  async run(context: SeedContext): Promise<Partial<SeedContext>> {
    const adminId = context.adminId

    if (!adminId) {
      console.log("No admin employee found to create salary variables. Skipping.")
      return {}
    }

    const variables = [
      {
        code: "minimumWage",
        name: "Mức lương cơ sở (NN)",
        value: 2340000, // 2,340,000 VND
        description: "Mức lương cơ sở dùng để tính mức đóng bảo hiểm tối đa.",
        isActive: true,
        createdById: adminId,
      },
      {
        code: "mealAllowance",
        name: "Phụ cấp ăn trưa",
        value: 700000, // 700,000
        description: "Phụ cấp ăn trưa hàng tháng.",
        isActive: true,
        createdById: adminId,
      },
      {
        code: "transportAllowance",
        name: "Phụ cấp xăng xe",
        value: 500000, // 500,000
        description: "Hỗ trợ chi phí đi lại.",
        isActive: true,
        createdById: adminId,
      },
      {
        code: "healthInsuranceRate",
        name: "Tỷ lệ BHYT (%)",
        value: 0.015, // 1.5%
        description: "Tỷ lệ đóng bảo hiểm y tế do NLĐ chi trả.",
        isActive: true,
        createdById: adminId,
      },
      {
        code: "socialInsuranceRate",
        name: "Tỷ lệ BHXH (%)",
        value: 0.08, // 8%
        description: "Tỷ lệ đóng bảo hiểm xã hội do NLĐ chi trả.",
        isActive: true,
        createdById: adminId,
      },
      {
        code: "unemploymentInsuranceRate",
        name: "Tỷ lệ BHTN (%)",
        value: 0.01, // 1%
        description: "Tỷ lệ đóng bảo hiểm thất nghiệp do NLĐ chi trả.",
        isActive: true,
        createdById: adminId,
      },
      {
        code: "standardWorkingHours",
        name: "Số giờ làm chuẩn/ngày",
        value: 8,
        description: "Số giờ quy định cho mỗi ngày làm việc.",
        isActive: true,
        createdById: adminId,
      },
      {
        code: "standardWorkingDays",
        name: "Số ngày công chuẩn/tháng",
        value: 22,
        description: "Số ngày công chuẩn trong tháng để tính lương.",
        isActive: true,
        createdById: adminId,
      },
    ]

    for (const data of variables) {
      await prisma.salaryVariable.upsert({
        where: { code: data.code },
        update: {},
        create: data,
      })
    }

    // Seed editable part-time payroll multipliers (partTimeOvertimeMultiplier, etc.).
    for (const data of PART_TIME_PAYROLL_VARIABLE_SEED) {
      await prisma.salaryVariable.upsert({
        where: { code: data.code },
        update: {
          name: data.name,
          description: data.description,
          value: data.value,
          isActive: true,
        },
        create: {
          ...data,
          isActive: true,
          createdById: adminId,
        },
      })
    }

    return {}
  }
}

registry.register(new SalaryVariablesSeeder())
