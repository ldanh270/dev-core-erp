import { ChatController } from "@/controllers/chat.controller.ts"
import { prisma } from "@/libs/database.ts"
import { authenticate } from "@/middlewares/auth.middleware.ts"
import { PrismaChatRepository } from "@/repositories/chat.repository.ts"
import { PrismaEmployeeRepository } from "@/repositories/employee.repository.ts"
import { ChatService } from "@/services/chat.service.ts"

import express from "express"
import multer from "multer"

/**
 * Route definitions for the independent Chat subsystem.
 * This router is mounted at `/api/chat`; all endpoints require the JWT authentication middleware.
 * Concrete repository, service, and controller dependencies are wired locally to keep the route
 * module as the composition root for this feature.
 */
const chatRoutes = express.Router()

// Buffer attachments in memory for the Cloudinary upload; reject oversized files before the controller.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max
})

// Dependency Injection wiring
const chatRepository = new PrismaChatRepository(prisma)
const employeeRepository = new PrismaEmployeeRepository(prisma)
const chatService = new ChatService(chatRepository, employeeRepository)
const chatController = new ChatController(chatService)

// Apply authentication before every REST endpoint; Socket.IO authenticates its own handshake.
chatRoutes.use(authenticate)

// Conversations management
chatRoutes.get("/conversations", chatController.getMyConversations)
chatRoutes.post("/conversations/direct", chatController.createDirectConversation)
chatRoutes.post("/conversations/group", chatController.createGroupConversation)
chatRoutes.post("/conversations/:id/participants", chatController.addParticipants)
chatRoutes.get("/conversations/:id", chatController.getConversationDetail)

// Messages management
chatRoutes.get("/conversations/:id/messages/search", chatController.searchMessages)
chatRoutes.get("/conversations/:id/messages", chatController.getMessages)
chatRoutes.post("/conversations/:id/messages", chatController.sendMessage)
chatRoutes.patch("/messages/:messageId", chatController.editMessage)
chatRoutes.delete("/messages/:messageId", chatController.recallMessage)
chatRoutes.patch("/messages/:messageId/pin", chatController.setMessagePinned)
chatRoutes.post("/messages/:messageId/forward", chatController.forwardMessage)
chatRoutes.post("/conversations/:id/read", chatController.markAsRead)
chatRoutes.patch("/conversations/:id/settings", chatController.updateSettings)
chatRoutes.delete("/conversations/:id", chatController.deleteConversation)

// Multer exposes the uploaded file as `req.file` for the Cloudinary controller.
chatRoutes.post("/upload", upload.single("file"), chatController.uploadAttachment)

// Mentions autocomplete queries for @ (Employee), # (Project), ! (Task)
chatRoutes.get("/mentions/employees", chatController.searchMentionEmployees)
chatRoutes.get("/mentions/projects", chatController.searchMentionProjects)
chatRoutes.get("/mentions/tasks", chatController.searchMentionTasks)

export default chatRoutes
export { chatService }
