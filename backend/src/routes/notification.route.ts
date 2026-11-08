import { ENVIRONMENT, ENV_ENVIRONMENT, RATE_LIMIT } from "@/configs/system/server.config.ts"
import { NotificationController } from "@/controllers/notification.controller.ts"
import { authenticate } from "@/middlewares/auth.middleware.ts"
import { InMemoryNotificationRepository } from "@/repositories/notification.repository.ts"
import { NotificationService } from "@/services/notification.service.ts"

import express from "express"
import rateLimit from "express-rate-limit"

const notificationRoutes = express.Router({ mergeParams: true })

const notificationLimiter = rateLimit({
  windowMs: RATE_LIMIT.WINDOW_MS,
  max:
    ENV_ENVIRONMENT === ENVIRONMENT.DEVELOPMENT
      ? RATE_LIMIT.MAX_LIMIT_DEV
      : RATE_LIMIT.MAX_LIMIT_PROD,
})

// Wire concrete instances (Dependency Injection - SOLID DIP)
const repository = new InMemoryNotificationRepository()
const service = new NotificationService(repository)
const controller = new NotificationController(service)

// Rate limiting & JWT authentication
notificationRoutes.use(notificationLimiter as unknown as express.RequestHandler)
notificationRoutes.use(authenticate)

// SSE real-time streaming endpoint
notificationRoutes.get("/stream", controller.stream)

// REST collection endpoints
notificationRoutes.get("/unread-count", controller.getUnreadCount)
notificationRoutes.patch("/read-all", controller.markAllAsRead)
notificationRoutes.get("/", controller.list)
notificationRoutes.post("/", controller.create)

// Single notification operations
notificationRoutes.get("/:id", controller.getOne)
notificationRoutes.patch("/:id/read", controller.markAsRead)
notificationRoutes.delete("/:id", controller.delete)

export default notificationRoutes
