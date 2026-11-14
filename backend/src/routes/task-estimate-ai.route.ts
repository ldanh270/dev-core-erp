import { TaskEstimateAiController } from "@/controllers/task-estimate-ai.controller.ts"
import { prisma } from "@/libs/database.ts"
import { authenticate } from "@/middlewares/auth.middleware.ts"
import { PrismaApplicationRepository } from "@/repositories/application.repository.ts"
import { PrismaEmployeeRepository } from "@/repositories/employee.repository.ts"
import { PrismaProjectRepository } from "@/repositories/project.repository.ts"
import { PrismaSpentTimeRepository } from "@/repositories/spent-time.repository.ts"
import { PrismaTaskRepository } from "@/repositories/task.repository.ts"
import { TaskEstimateAiService } from "@/services/task-estimate-ai.service.ts"

import express from "express"

const taskEstimateAiRoutes = express.Router()

const taskRepository = new PrismaTaskRepository(prisma)
const projectRepository = new PrismaProjectRepository(prisma)
const employeeRepository = new PrismaEmployeeRepository(prisma)
const applicationRepository = new PrismaApplicationRepository(prisma)
const spentTimeRepository = new PrismaSpentTimeRepository(prisma)

const service = new TaskEstimateAiService(
  taskRepository,
  projectRepository,
  employeeRepository,
  applicationRepository,
  spentTimeRepository,
)
const controller = new TaskEstimateAiController(service)

// Protect all routes with authentication middleware
taskEstimateAiRoutes.use(authenticate)

// Endpoints
taskEstimateAiRoutes.get("/tasks/:id/suggestions", controller.getSuggestions)
taskEstimateAiRoutes.post("/projects/:projectId/generate-tasks", controller.generateTasks)

export default taskEstimateAiRoutes
