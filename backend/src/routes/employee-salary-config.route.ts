import { EmployeeSalaryConfigController } from "@/controllers/employee-salary-config.controller.ts"
import { prisma } from "@/libs/database.ts"
import { authenticate } from "@/middlewares/auth.middleware.ts"
import { requirePermission } from "@/middlewares/permission.middleware.ts"
import { PrismaEmployeeSalaryConfigRepository } from "@/repositories/employee-salary-config.repository.ts"
import { EmployeeSalaryConfigService } from "@/services/employee-salary-config.service.ts"

import express from "express"

const employeeSalaryConfigRoutes = express.Router()

const repo = new PrismaEmployeeSalaryConfigRepository(prisma)
const service = new EmployeeSalaryConfigService(repo, prisma)
const controller = new EmployeeSalaryConfigController(service)

employeeSalaryConfigRoutes.use(authenticate)
employeeSalaryConfigRoutes.use(requirePermission("payroll.read"))

employeeSalaryConfigRoutes.post(
  "/salary-config/bulk-assign",
  requirePermission("payroll.create"),
  controller.bulkAssignTemplate,
)
employeeSalaryConfigRoutes.get("/:id/salary-config", controller.getActiveConfig)
employeeSalaryConfigRoutes.get("/:id/salary-config/history", controller.getConfigHistory)
employeeSalaryConfigRoutes.post(
  "/:id/salary-config",
  requirePermission("payroll.create"),
  controller.assignConfig,
)

export default employeeSalaryConfigRoutes
