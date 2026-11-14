import { PERMISSION_CODE } from "@/configs/entities/permission.config.ts"
import { UPLOAD_CONFIG } from "@/configs/system/upload.config.ts"
import { ApplicationController } from "@/controllers/application.controller.ts"
import { prisma } from "@/libs/database.ts"
import { authenticate } from "@/middlewares/auth.middleware.ts"
import { requireAnyPermission, requirePermission } from "@/middlewares/permission.middleware.ts"
import { PrismaApplicationRepository } from "@/repositories/application.repository.ts"
import { PrismaEmployeeRepository } from "@/repositories/employee.repository.ts"
import { PrismaPositionRepository } from "@/repositories/position.repository.ts"
import { PrismaProjectRepository } from "@/repositories/project.repository.ts"
import { ApplicationService } from "@/services/application.service.ts"
import { PositionService } from "@/services/position.service.ts"

import express from "express"
import multer from "multer"

/**
 * Application workflow routing configuration.
 * Instantiates dependencies for PrismaApplicationRepository, PrismaEmployeeRepository,
 * PrismaProjectRepository, PrismaPositionRepository, PositionService, and ApplicationService,
 * wiring them into the ApplicationController endpoints.
 */
const applicationRoutes = express.Router()

const repository = new PrismaApplicationRepository(prisma)
const employeeRepository = new PrismaEmployeeRepository(prisma)
const projectRepository = new PrismaProjectRepository(prisma)
const positionRepository = new PrismaPositionRepository(prisma)
const positionService = new PositionService(
  positionRepository,
  employeeRepository,
  projectRepository,
  prisma,
)
const service = new ApplicationService(repository, positionService)
const controller = new ApplicationController(service)

// All routes require authentication
applicationRoutes.use(authenticate)

// ─── Multer (memory storage — no temp files on disk) ─────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: UPLOAD_CONFIG.MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (!(UPLOAD_CONFIG.ALLOWED_MIME_TYPES as readonly string[]).includes(file.mimetype)) {
      cb(new Error("Only JPEG, PNG, WEBP, GIF, or PDF files are allowed"))
    } else {
      cb(null, true)
    }
  },
})

// ─── Employee endpoints ───────────────────────────────────────

// Upload an attachment for an application
applicationRoutes.post(
  "/upload-attachment",
  upload.single("attachment"),
  controller.uploadAttachment as unknown as express.RequestHandler,
)

// Submit a new application (any authenticated employee)
applicationRoutes.post("/", controller.submit)

// Submit multiple applications in bulk
applicationRoutes.post("/bulk", controller.submitBulk)

// List own applications (with pagination + filters)
applicationRoutes.get("/me", controller.listMine)

// ─── Manager endpoints ────────────────────────────────────────

// List applications that the current user has permission to approve (or is a swap partner for)
applicationRoutes.get("/approvals", controller.listApprovals)

// List all applications across all employees
applicationRoutes.get("/", requirePermission(PERMISSION_CODE.APPLICATION_READ), controller.listAll)

// List applications for a specific employee
applicationRoutes.get(
  "/employee/:employeeId",
  requireAnyPermission([PERMISSION_CODE.APPLICATION_READ, PERMISSION_CODE.APPLICATION_APPROVE]),
  controller.listByEmployee,
)

// Approve an application (sets status=approved)
applicationRoutes.patch(
  "/:id/approve",
  requirePermission(PERMISSION_CODE.APPLICATION_APPROVE),
  controller.approve,
)

// Reject an application with a mandatory rejectReason
applicationRoutes.patch(
  "/:id/reject",
  requirePermission(PERMISSION_CODE.APPLICATION_APPROVE),
  controller.reject,
)

// Shift swap partner confirms (no approval permission needed — service validates identity)
applicationRoutes.patch("/:id/swap-confirm", controller.swapConfirm)

// Shift swap partner rejects
applicationRoutes.patch("/:id/swap-reject", controller.swapReject)

// Get specific application by ID (own or manager)
applicationRoutes.get("/:id", controller.getById)

// Cancel own pending application
applicationRoutes.patch("/:id/cancel", controller.cancel)

export default applicationRoutes
