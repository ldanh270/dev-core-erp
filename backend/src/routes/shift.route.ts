import { ShiftController } from "@/controllers/shift.controller.ts"
import { prisma } from "@/libs/database.ts"
import { authenticate } from "@/middlewares/auth.middleware.ts"
import { requirePermission } from "@/middlewares/permission.middleware.ts"
import { PrismaWorkingShiftRepository } from "@/repositories/shift.repository.ts"
import { ShiftService } from "@/services/shift.service.ts"

import express from "express"

const shiftRoutes = express.Router()

const repository = new PrismaWorkingShiftRepository(prisma)
const service = new ShiftService(repository)
const controller = new ShiftController(service)

shiftRoutes.use(authenticate)

shiftRoutes.get("/", controller.list)
shiftRoutes.get("/:id", controller.getOne)

shiftRoutes.post("/", requirePermission("attendance.create"), controller.create)
shiftRoutes.patch("/:id", requirePermission("attendance.update"), controller.update)
shiftRoutes.delete("/:id", requirePermission("attendance.delete"), controller.delete)

export default shiftRoutes
