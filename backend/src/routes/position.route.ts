import { PositionController } from "@/controllers/position.controller.ts"
import { prisma } from "@/libs/database.ts"
import { authenticate } from "@/middlewares/auth.middleware.ts"
import { requirePermission } from "@/middlewares/permission.middleware.ts"
import { PrismaEmployeeRepository } from "@/repositories/employee.repository.ts"
import { PrismaPositionRepository } from "@/repositories/position.repository.ts"
import { PrismaProjectRepository } from "@/repositories/project.repository.ts"
import { PositionService } from "@/services/position.service.ts"

import express from "express"

/**
 * Routes config for Positions and Position Rules.
 * Constructor injects Prisma repositories into PositionService and PositionController.
 */
const positionRoutes = express.Router()

// Wire dependencies via Constructor Injection
const positionRepo = new PrismaPositionRepository(prisma)
const employeeRepo = new PrismaEmployeeRepository(prisma)
const projectRepo = new PrismaProjectRepository(prisma)
const service = new PositionService(positionRepo, employeeRepo, projectRepo, prisma)
const controller = new PositionController(service)

// All position routes require authentication
positionRoutes.use(authenticate)

// CRUD for positions
positionRoutes.get("/", controller.list as express.RequestHandler)
positionRoutes.get("/:id", controller.getOne as express.RequestHandler)

positionRoutes.post(
  "/",
  requirePermission("permission.create"),
  controller.create as express.RequestHandler,
)

positionRoutes.put(
  "/:id",
  requirePermission("permission.update"),
  controller.update as express.RequestHandler,
)

positionRoutes.delete(
  "/:id",
  requirePermission("permission.delete"),
  controller.delete as express.RequestHandler,
)

// Project-specific Position rules
positionRoutes.get(
  "/projects/:projectId/position-rules",
  controller.listProjectRules as express.RequestHandler,
)
positionRoutes.post(
  "/projects/:projectId/position-rules",
  controller.saveProjectRules as express.RequestHandler,
)

export default positionRoutes
