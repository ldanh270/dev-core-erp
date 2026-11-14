import { ApprovalController } from "@/controllers/approval.controller.ts"
import { prisma } from "@/libs/database.ts"
import { authenticate } from "@/middlewares/auth.middleware.ts"
import { PrismaApplicationRepository } from "@/repositories/application.repository.ts"
import { ApprovalService } from "@/services/approval/approval.service.ts"

import express from "express"

const approvalRoutes = express.Router()

const appRepo = new PrismaApplicationRepository(prisma)
const service = new ApprovalService(appRepo)
const controller = new ApprovalController(service)

approvalRoutes.use(authenticate)

approvalRoutes.get("/", controller.listPending)
approvalRoutes.patch("/:category/:id", controller.process)

export default approvalRoutes
