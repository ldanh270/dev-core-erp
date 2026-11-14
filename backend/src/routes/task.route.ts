import { TaskController } from "@/controllers/task.controller.ts"
import { prisma } from "@/libs/database.ts"
import { authenticate } from "@/middlewares/auth.middleware.ts"
import { PrismaEmployeeRepository } from "@/repositories/employee.repository.ts"
import { PrismaPositionRepository } from "@/repositories/position.repository.ts"
import { ProjectTaskStatusRepository } from "@/repositories/project-task-status.repository.ts"
import { PrismaProjectRepository } from "@/repositories/project.repository.ts"
import { PrismaTaskRepository } from "@/repositories/task.repository.ts"
import { PositionService } from "@/services/position.service.ts"
import { TaskService } from "@/services/task.service.ts"

import express from "express"

const taskRoutes = express.Router()

const employeeRepository = new PrismaEmployeeRepository(prisma)
const projectRepository = new PrismaProjectRepository(prisma)
const repository = new PrismaTaskRepository(prisma)
const statusRepository = new ProjectTaskStatusRepository(prisma)
const positionRepository = new PrismaPositionRepository(prisma)
const positionService = new PositionService(
  positionRepository,
  employeeRepository,
  projectRepository,
  prisma,
)
const service = new TaskService(
  repository,
  projectRepository,
  employeeRepository,
  statusRepository,
  positionService,
)
const controller = new TaskController(service)

// All task routes require authentication
taskRoutes.use(authenticate)

// Task CRUD
taskRoutes.get("/", controller.list)
taskRoutes.get("/:id", controller.getOne)
taskRoutes.post("/", controller.create)
taskRoutes.patch("/:id", controller.update)
taskRoutes.delete("/:id", controller.delete)

export default taskRoutes
