import { ENVIRONMENT, ENV_ENVIRONMENT, RATE_LIMIT } from "@/configs/system/server.config.ts"
import { NotificationController } from "@/controllers/notification.controller.ts"
import { prisma } from "@/libs/database.ts"
import { authenticate } from "@/middlewares/auth.middleware.ts"
import { PrismaNotificationRepository } from "@/repositories/notification.repository.ts"
import { NotificationService } from "@/services/notification.service.ts"

import express from "express"
import rateLimit from "express-rate-limit"

const notificationRoutes = express.Router({ mergeParams: true })

// Giới hạn số request theo cấu hình của môi trường đang chạy.
const notificationLimiter = rateLimit({
  windowMs: RATE_LIMIT.WINDOW_MS,
  max:
    ENV_ENVIRONMENT === ENVIRONMENT.DEVELOPMENT
      ? RATE_LIMIT.MAX_LIMIT_DEV
      : RATE_LIMIT.MAX_LIMIT_PROD,
})

// Khởi tạo repository dùng Prisma để lưu notification vào database.
const repository = new PrismaNotificationRepository(prisma)

// Truyền repository vào service và service vào controller.
const service = new NotificationService(repository)
const controller = new NotificationController(service)

// Áp dụng giới hạn request và xác thực JWT cho các endpoint bên dưới.
notificationRoutes.use(notificationLimiter as unknown as express.RequestHandler)
notificationRoutes.use(authenticate)

// Mở kết nối SSE để nhận notification trực tiếp.
notificationRoutes.get("/stream", controller.stream)

// Đặt các đường dẫn cố định trước "/:id" để tránh bị hiểu là notification ID.
notificationRoutes.get("/unread-count", controller.getUnreadCount)
notificationRoutes.patch("/read-all", controller.markAllAsRead)

// Lấy danh sách và tạo notification.
notificationRoutes.get("/", controller.list)
notificationRoutes.post("/", controller.create)

// Xem chi tiết, đánh dấu đã đọc và xóa notification của người nhận.
notificationRoutes.get("/:id", controller.getOne)
notificationRoutes.patch("/:id/read", controller.markAsRead)
notificationRoutes.delete("/:id", controller.delete)

export default notificationRoutes
