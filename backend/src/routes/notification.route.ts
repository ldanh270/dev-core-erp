import { ENVIRONMENT, ENV_ENVIRONMENT, RATE_LIMIT } from "@/configs/system/server.config.ts"
import { NotificationController } from "@/controllers/notification.controller.ts"
import { prisma } from "@/libs/database.ts"
import { authenticate } from "@/middlewares/auth.middleware.ts"
import { PrismaNotificationRepository } from "@/repositories/notification.repository.ts"
import { NotificationService } from "@/services/notification.service.ts"

import express from "express"
import rateLimit from "express-rate-limit"

/**
 * Notification router composing persistence, business logic, and HTTP handlers.
 */
const notificationRoutes = express.Router({ mergeParams: true })

/**
 * Limits notification requests using the rate limit configured for the current environment.
 */
const notificationLimiter = rateLimit({
  windowMs: RATE_LIMIT.WINDOW_MS,
  max:
    ENV_ENVIRONMENT === ENVIRONMENT.DEVELOPMENT
      ? RATE_LIMIT.MAX_LIMIT_DEV
      : RATE_LIMIT.MAX_LIMIT_PROD,
})

// Initialize notification persistence using the shared Prisma client.
const repository = new PrismaNotificationRepository(prisma)

// Inject the repository into the service and the service into the controller.
const service = new NotificationService(repository)
const controller = new NotificationController(service)

// Apply rate limiting and JWT authentication to all notification endpoints.
notificationRoutes.use(notificationLimiter as unknown as express.RequestHandler)
notificationRoutes.use(authenticate)

// Open an SSE connection for real-time notification delivery.
notificationRoutes.get("/stream", controller.stream)

// Register static paths before "/:id" so they are not treated as notification IDs.
notificationRoutes.get("/unread-count", controller.getUnreadCount)
notificationRoutes.patch("/read-all", controller.markAllAsRead)

// List notifications for the authenticated employee or create a notification.
notificationRoutes.get("/", controller.list)
notificationRoutes.post("/", controller.create)

// Retrieve, mark as read, or hide a notification for the authenticated recipient.
notificationRoutes.get("/:id", controller.getOne)
notificationRoutes.patch("/:id/read", controller.markAsRead)
notificationRoutes.delete("/:id", controller.delete)

export default notificationRoutes
