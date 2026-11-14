import { SalaryComponentController } from "@/controllers/salary-component.controller.ts"
import { prisma } from "@/libs/database.ts"
import { authenticate } from "@/middlewares/auth.middleware.ts"
import { requirePermission } from "@/middlewares/permission.middleware.ts"
import { PrismaSalaryComponentRepository } from "@/repositories/salary-component.repository.ts"
import { SalaryComponentService } from "@/services/salary-component.service.ts"

import express from "express"

const salaryComponentRoutes = express.Router()

const repo = new PrismaSalaryComponentRepository(prisma)
const service = new SalaryComponentService(repo)
const controller = new SalaryComponentController(service)

salaryComponentRoutes.use(authenticate)
salaryComponentRoutes.use(requirePermission("payroll.read"))

salaryComponentRoutes.get("/", controller.listComponents)
salaryComponentRoutes.post("/", requirePermission("payroll.create"), controller.createComponent)
salaryComponentRoutes.put("/:id", requirePermission("payroll.update"), controller.updateComponent)
salaryComponentRoutes.delete(
  "/:id",
  requirePermission("payroll.delete"),
  controller.deleteComponent,
)
salaryComponentRoutes.post(
  "/validate",
  requirePermission("payroll.create"),
  controller.validateFormula,
)

export default salaryComponentRoutes
