import { SecurityController } from "@/controllers/security.controller.ts"
import { prisma } from "@/libs/database.ts"
import { authenticate } from "@/middlewares/auth.middleware.ts"
import { requirePermission } from "@/middlewares/permission.middleware.ts"
import { PrismaAuthRepository } from "@/repositories/auth.repository.ts"
import { AuthService } from "@/services/auth.service.ts"

import express from "express"

/**
 * securityRoutes defines the API endpoints for security monitoring and management
 */
const securityRoutes = express.Router()

// Reuse AuthRepository and AuthService
const repository = new PrismaAuthRepository(prisma)
const authService = new AuthService(repository)

const controller = new SecurityController(authService)

// All routes require authentication
securityRoutes.use(authenticate)

/**
 * @route GET /api/security/dashboard
 * @desc Get security summary for dashboard
 * @access Private (security.read permission)
 */
securityRoutes.get("/dashboard", requirePermission("security.read"), controller.getSummary as any)

/**
 * @route GET /api/security/locked-accounts
 * @desc Get all currently locked accounts
 * @access Private (security.read permission)
 */
securityRoutes.get(
  "/locked-accounts",
  requirePermission("security.read"),
  controller.getLockedAccounts as any,
)

/**
 * @route PATCH /api/security/unlock/:employeeId
 * @desc Unlock an employee account
 * @access Private (security.update permission)
 */
securityRoutes.patch(
  "/unlock/:employeeId",
  requirePermission("security.update"),
  controller.unlockAccount as any,
)

export default securityRoutes
