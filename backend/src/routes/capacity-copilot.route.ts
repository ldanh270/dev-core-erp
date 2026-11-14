import { PERMISSION_CODE } from "@/configs/entities/permission.config.ts"
import { CapacityCopilotController } from "@/controllers/capacity-copilot.controller.ts"
import { capacityCopilotService } from "@/libs/capacity-copilot-runtime.ts"
/**
 * Express routes for project capacity forecasting.
 */
import { authenticate } from "@/middlewares/auth.middleware.ts"
import { requirePermission } from "@/middlewares/permission.middleware.ts"

import express from "express"

const capacityCopilotRoutes = express.Router()

const controller = new CapacityCopilotController(capacityCopilotService)

// Dedicated route keeps capacity forecasting separate from Project Task assignment AI.
capacityCopilotRoutes.use(authenticate)
// Weekly board is read-only: Admin/PM compares shortage/surplus projects from cron-refreshed forecasts.
capacityCopilotRoutes.get(
  "/weekly-board",
  requirePermission(PERMISSION_CODE.PROJECT_UPDATE),
  controller.forecastCapacityBoard,
)
capacityCopilotRoutes.post(
  "/projects/:projectId/forecast",
  requirePermission(PERMISSION_CODE.PROJECT_UPDATE),
  controller.forecastProjectCapacity,
)

export default capacityCopilotRoutes
