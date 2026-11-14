import { WeeklyScheduleTemplateController } from "@/controllers/weekly-schedule-template.controller.ts"
import { prisma } from "@/libs/database.ts"
import { authenticate } from "@/middlewares/auth.middleware.ts"
import { requirePermission } from "@/middlewares/permission.middleware.ts"
import { PrismaEmployeeShiftRepository } from "@/repositories/employee-shift.repository.ts"
import { PrismaEmployeeRepository } from "@/repositories/employee.repository.ts"
import { PrismaShiftScheduleRepository } from "@/repositories/schedule.repository.ts"
import { PrismaWeeklyScheduleTemplateRepository } from "@/repositories/weekly-schedule-template.repository.ts"
import { WeeklyScheduleTemplateService } from "@/services/weekly-schedule-template.service.ts"

import express from "express"

const weeklyScheduleTemplateRoutes = express.Router()

const templateRepo = new PrismaWeeklyScheduleTemplateRepository(prisma)
const scheduleRepo = new PrismaShiftScheduleRepository(prisma)
const employeeShiftRepo = new PrismaEmployeeShiftRepository(prisma)
// employeeRepo: WeeklyScheduleTemplateService blocks apply for PART_TIME (project Spent Time model).
const employeeRepo = new PrismaEmployeeRepository(prisma)
const service = new WeeklyScheduleTemplateService(
  templateRepo,
  scheduleRepo,
  employeeShiftRepo,
  employeeRepo,
)
const controller = new WeeklyScheduleTemplateController(service)

weeklyScheduleTemplateRoutes.use(authenticate)
weeklyScheduleTemplateRoutes.use(requirePermission("attendance.read"))

weeklyScheduleTemplateRoutes.get("/", controller.list)
weeklyScheduleTemplateRoutes.get("/:id", controller.getOne)
weeklyScheduleTemplateRoutes.post("/", requirePermission("attendance.create"), controller.create)
weeklyScheduleTemplateRoutes.patch(
  "/:id",
  requirePermission("attendance.update"),
  controller.update,
)
weeklyScheduleTemplateRoutes.delete(
  "/:id",
  requirePermission("attendance.delete"),
  controller.delete,
)
weeklyScheduleTemplateRoutes.post(
  "/:id/apply",
  requirePermission("attendance.update"),
  controller.apply,
)

export default weeklyScheduleTemplateRoutes
