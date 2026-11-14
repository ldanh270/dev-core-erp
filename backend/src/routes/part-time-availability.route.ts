/**
 * Composition root for the part-time availability feature.
 * It wires repositories/services once and protects employee/admin endpoints with route permissions.
 */
import { PartTimeAvailabilityController } from "@/controllers/part-time-availability.controller.ts"
import { capacityCopilotService } from "@/libs/capacity-copilot-runtime.ts"
import { prisma } from "@/libs/database.ts"
import { authenticate } from "@/middlewares/auth.middleware.ts"
import { requirePermission } from "@/middlewares/permission.middleware.ts"
import { PrismaAttendanceRepository } from "@/repositories/attendance.repository.ts"
import { PrismaEmployeeShiftRepository } from "@/repositories/employee-shift.repository.ts"
import { PrismaEmployeeRepository } from "@/repositories/employee.repository.ts"
import { PrismaPartTimeAvailabilityRepository } from "@/repositories/part-time-availability.repository.ts"
import { PrismaWorkingShiftRepository } from "@/repositories/shift.repository.ts"
import { PartTimeAvailabilityService } from "@/services/part-time-availability.service.ts"
import { PtShiftSuggestionService } from "@/services/pt-shift-suggestion.service.ts"

import express from "express"

const partTimeAvailabilityRoutes = express.Router()

// Manual DI: availability repo + shift repos needed to validate slots and persist assigned shifts.
const availabilityRepo = new PrismaPartTimeAvailabilityRepository(prisma)
const employeeRepo = new PrismaEmployeeRepository(prisma)
const employeeShiftRepo = new PrismaEmployeeShiftRepository(prisma)
const workingShiftRepo = new PrismaWorkingShiftRepository(prisma)
const attendanceRepo = new PrismaAttendanceRepository(prisma)
const service = new PartTimeAvailabilityService(
  availabilityRepo,
  employeeRepo,
  employeeShiftRepo,
  workingShiftRepo,
  capacityCopilotService,
)
const suggestionService = new PtShiftSuggestionService(
  service,
  attendanceRepo,
  workingShiftRepo,
  employeeShiftRepo,
)
const controller = new PartTimeAvailabilityController(service, suggestionService)

partTimeAvailabilityRoutes.use(authenticate)

// Employee self-service — any authenticated PT worker can declare their own week.
partTimeAvailabilityRoutes.get("/mine", controller.getMine)
partTimeAvailabilityRoutes.put("/mine", controller.upsertMine)

// Admin-only: roster for a week, per-employee drill-down, suggest + assign shifts.
partTimeAvailabilityRoutes.get("/", requirePermission("attendance.update"), controller.listForWeek)
partTimeAvailabilityRoutes.get(
  "/employee/:employeeId",
  requirePermission("attendance.update"),
  controller.getByEmployee,
)
// Static path before /:id/assign-shifts so "suggest" is not captured as an id.
partTimeAvailabilityRoutes.post(
  "/suggest",
  requirePermission("attendance.update"),
  controller.suggest,
)
partTimeAvailabilityRoutes.post(
  "/:id/assign-shifts",
  requirePermission("attendance.update"),
  controller.assignShifts,
)

// No approve/reject routes: workflow is submit → admin assign; submitted rows are assignable immediately.

export default partTimeAvailabilityRoutes
