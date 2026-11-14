import { ProfileController } from "@/controllers/profile.controller.ts"
import { prisma } from "@/libs/database.ts"
import { type AuthRequest, authenticate } from "@/middlewares/auth.middleware.ts"
import { PrismaProfileRepository } from "@/repositories/profile.repository.ts"
import { ProfileService } from "@/services/profile.service.ts"

import express, { type RequestHandler } from "express"
import multer from "multer"

/**
 * profileRoutes defines all /api/profile/* endpoints
 * DI wiring: Repository → Service → Controller (Clean Architecture)
 */
const profileRoutes = express.Router()

// ─── DI Wiring ───────────────────────────────────────────────────────────────
const repository = new PrismaProfileRepository(prisma)
const service = new ProfileService(repository)
const controller = new ProfileController(service)

// ─── Multer (memory storage — no temp files on disk) ─────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (_req, file, cb) => {
    const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      cb(new Error("Only JPEG, PNG, WEBP, or GIF images are allowed"))
    } else {
      cb(null, true)
    }
  },
})

// ─── Routes (all protected) ───────────────────────────────────────────────────

/**
 * @route GET /api/profile/me
 * @desc Get the authenticated user's profile
 * @access Private
 */
profileRoutes.get("/me", authenticate, controller.getMyProfile as any)

/**
 * @route PATCH /api/profile/me
 * @desc Update editable profile fields
 * @access Private
 */
profileRoutes.patch("/me", authenticate, controller.updateMyProfile as any)

/**
 * @route POST /api/profile/me/avatar
 * @desc Upload a new avatar image (multipart/form-data, field: avatar)
 * @access Private
 */
profileRoutes.post(
  "/me/avatar",
  authenticate,
  upload.single("avatar"),
  controller.uploadAvatar as any,
)

/**
 * @route POST /api/profile/me/change-password
 * @desc Change password of authenticated user
 * @access Private
 */
profileRoutes.post("/me/change-password", authenticate, controller.changePassword as any)

profileRoutes.patch("/me/personal-employee-link", authenticate, ((req, res) =>
  controller.updatePersonalEmployeeLink(req as AuthRequest, res)) as RequestHandler)
export default profileRoutes
