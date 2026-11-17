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
 * Wire concrete dependencies strictly inside this route module.
 */
const chatRoutes = express.Router()

// Multer in-memory storage for attachment uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max
})

// Dependency Injection wiring
const chatRepository = new PrismaChatRepository(prisma)
const employeeRepository = new PrismaEmployeeRepository(prisma)
const chatService = new ChatService(chatRepository, employeeRepository)
const chatController = new ChatController(chatService)

// Guard all chat routes with JWT authentication
chatRoutes.use(authenticate)

// Real-time SSE stream endpoint
chatRoutes.get("/stream", chatController.streamMessages)

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
chatRoutes.post("/conversations/:id/read", chatController.markAsRead)
chatRoutes.patch("/conversations/:id/settings", chatController.updateSettings)
chatRoutes.delete("/conversations/:id", chatController.deleteConversation)

// Attachments upload
chatRoutes.post("/upload", upload.single("file"), chatController.uploadAttachment)

// Mentions autocomplete queries for @ (Employee), # (Project), ! (Task)
chatRoutes.get("/mentions/employees", chatController.searchMentionEmployees)
chatRoutes.get("/mentions/projects", chatController.searchMentionProjects)
chatRoutes.get("/mentions/tasks", chatController.searchMentionTasks)

export default chatRoutes
