import { ProjectRoleController } from "@/controllers/project-role.controller.ts"
import { ProjectTaskStatusController } from "@/controllers/project-task-status.controller.ts"
import { ProjectTrackerController } from "@/controllers/project-tracker.controller.ts"
import { ProjectController } from "@/controllers/project.controller.ts"
import { prisma } from "@/libs/database.ts"
import { authenticate } from "@/middlewares/auth.middleware.ts"
import { PrismaEmployeeRepository } from "@/repositories/employee.repository.ts"
// Project Roles CRUD
import { ProjectRoleRepository } from "@/repositories/project-role.repository.ts"
import { ProjectTaskStatusRepository } from "@/repositories/project-task-status.repository.ts"
import { ProjectTrackerRepository } from "@/repositories/project-tracker.repository.ts"
import { PrismaProjectRepository } from "@/repositories/project.repository.ts"
import { PrismaTaskRepository } from "@/repositories/task.repository.ts"
import { ProjectRoleService } from "@/services/project-role.service.ts"
import { ProjectTaskStatusService } from "@/services/project-task-status.service.ts"
import { ProjectTrackerService } from "@/services/project-tracker.service.ts"
import { ProjectService } from "@/services/project.service.ts"

import express from "express"

/**
 * Router configuration for projects, project member mappings, gantt data,
 * task statuses (Kanban columns), project-scoped task trackers, and roles.
 * Constructor injection wires repositories and services into controllers.
 */
const projectRoutes = express.Router()
const employeeRepository = new PrismaEmployeeRepository(prisma)
const repository = new PrismaProjectRepository(prisma)
const taskRepository = new PrismaTaskRepository(prisma)
const statusRepository = new ProjectTaskStatusRepository(prisma)
const trackerRepository = new ProjectTrackerRepository(prisma)
const statusService = new ProjectTaskStatusService(statusRepository, repository, taskRepository)
const trackerService = new ProjectTrackerService(trackerRepository, repository)
const service = new ProjectService(repository, employeeRepository, prisma, statusService)

const controller = new ProjectController(service)
const statusController = new ProjectTaskStatusController(statusService)
const trackerController = new ProjectTrackerController(trackerService)

// All project routes require authentication (must have JWT token)
projectRoutes.use(authenticate)

// Project CRUD
projectRoutes.get("/", controller.list)
projectRoutes.get("/:id", controller.getOne)
projectRoutes.post("/", controller.create)
projectRoutes.patch("/:id", controller.update)
projectRoutes.delete("/:id", controller.delete)

// Project Members
projectRoutes.get("/:id/members", controller.getMembers)
projectRoutes.post("/:id/members", controller.addMember)
// PT member rate/mode — payroll and attendance rules depend on these fields.
projectRoutes.patch("/:id/members/:employeeId", controller.updateMember)
projectRoutes.delete("/:id/members/:employeeId", controller.removeMember)

// Gantt Chart Data
projectRoutes.get("/:id/gantt", controller.getGanttData)

// Project Task Statuses (Kanban Columns) CRUD
projectRoutes.get("/:projectId/statuses", statusController.list)
projectRoutes.post("/:projectId/statuses", statusController.create)
projectRoutes.patch("/:projectId/statuses/:id", statusController.update)
projectRoutes.delete("/:projectId/statuses/:id", statusController.delete)

// Project Trackers CRUD
projectRoutes.get("/:projectId/trackers", trackerController.list)
projectRoutes.post("/:projectId/trackers", trackerController.create)
projectRoutes.patch("/:projectId/trackers/:id", trackerController.update)
projectRoutes.delete("/:projectId/trackers/:id", trackerController.delete)

const roleRepository = new ProjectRoleRepository(prisma)
const roleService = new ProjectRoleService(roleRepository, repository)
const roleController = new ProjectRoleController(roleService)

projectRoutes.get("/:projectId/roles", roleController.list)
projectRoutes.post("/:projectId/roles", roleController.create)
projectRoutes.patch("/:projectId/roles/:id", roleController.update)
projectRoutes.delete("/:projectId/roles/:id", roleController.delete)

export default projectRoutes
