import { CHAT_CONFIG, CHAT_MESSAGE_TYPES, MENTION_TYPES } from "@/configs/entities/chat.config.ts"
import { ErrorCode, ErrorLayer } from "@/configs/system/error-code.config.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import type { AuthRequest } from "@/middlewares/auth.middleware.ts"
import type { IChatService } from "@/types/chat.types.ts"
import { CloudinaryUtil } from "@/utils/cloudinary.util.ts"
import { AppError } from "@/utils/error.util.ts"

import type { Response } from "express"
import { z } from "zod"

const createDirectSchema = z.object({
  partnerId: z.string().min(1, "Partner ID is required"),
})

const createGroupSchema = z.object({
  title: z.string().min(1, "Group title is required").max(100),
  participantIds: z.array(z.string()).min(2, "At least 2 members are required"),
  avatarUrl: z.string().optional(),
})

const addParticipantsSchema = z.object({
  participantIds: z.array(z.string().min(1)).min(1).max(CHAT_CONFIG.MAX_GROUP_MEMBERS),
})

const mentionItemSchema = z.object({
  type: z.enum(MENTION_TYPES),
  id: z.string(),
  label: z.string(),
  metadata: z
    .object({
      code: z.string().optional(),
      status: z.string().optional(),
      priority: z.string().optional(),
    })
    .optional(),
})

const sendMessageSchema = z.object({
  content: z.string().max(CHAT_CONFIG.MAX_MESSAGE_LENGTH).optional().default(""),
  type: z.enum(CHAT_MESSAGE_TYPES).optional().default("text"),
  fileUrl: z.string().optional(),
  fileName: z.string().optional(),
  fileSize: z.number().optional(),
  mentions: z.array(mentionItemSchema).optional(),
})

const updateSettingsSchema = z.object({
  isPinned: z.boolean().optional(),
  isMuted: z.boolean().optional(),
  isRestricted: z.boolean().optional(),
})

/**
 * Controller handling chat endpoints and SSE streams.
 * Adheres strictly to the standard ApiResponse<T> envelope format.
 */
export class ChatController {
  constructor(private readonly service: IChatService) {}

  /**
   * GET /api/chat/conversations
   * Retrieves all conversations for the authenticated employee.
   */
  getMyConversations = async (req: AuthRequest, res: Response): Promise<void> => {
    const employeeId = req.user?.empId
    if (!employeeId) {
      throw new AppError("Unauthorized", HttpStatusCode.UNAUTHORIZED, ErrorLayer.CONTROLLER)
    }

    const data = await this.service.getMyConversations(employeeId)
    res.status(HttpStatusCode.OK).json({ data, error: null })
  }

  /**
   * GET /api/chat/conversations/:id
   * Retrieves conversation metadata and participant list.
   */
  getConversationDetail = async (req: AuthRequest, res: Response): Promise<void> => {
    const employeeId = req.user?.empId
    if (!employeeId) {
      throw new AppError("Unauthorized", HttpStatusCode.UNAUTHORIZED, ErrorLayer.CONTROLLER)
    }

    const id = String(req.params.id)
    const data = await this.service.getConversationDetail(id, employeeId)
    res.status(HttpStatusCode.OK).json({ data, error: null })
  }

  /**
   * POST /api/chat/conversations/direct
   * Initiates or returns an existing 1-1 conversation.
   */
  createDirectConversation = async (req: AuthRequest, res: Response): Promise<void> => {
    const employeeId = req.user?.empId
    if (!employeeId) {
      throw new AppError("Unauthorized", HttpStatusCode.UNAUTHORIZED, ErrorLayer.CONTROLLER)
    }

    const { partnerId } = createDirectSchema.parse(req.body)
    const data = await this.service.getOrCreateDirectConversation(employeeId, partnerId)
    res.status(HttpStatusCode.OK).json({ data, error: null })
  }

  /**
   * POST /api/chat/conversations/group
   * Creates a new multi-member group conversation.
   */
  createGroupConversation = async (req: AuthRequest, res: Response): Promise<void> => {
    const employeeId = req.user?.empId
    if (!employeeId) {
      throw new AppError("Unauthorized", HttpStatusCode.UNAUTHORIZED, ErrorLayer.CONTROLLER)
    }

    const validated = createGroupSchema.parse(req.body)
    const data = await this.service.createGroupConversation(employeeId, validated)
    res.status(HttpStatusCode.CREATED).json({ data, error: null })
  }

  /**
   * POST /api/chat/conversations/:id/participants
   * Adds active employees to a group conversation.
   */
  addParticipants = async (req: AuthRequest, res: Response): Promise<void> => {
    const employeeId = req.user?.empId
    if (!employeeId) {
      throw new AppError("Unauthorized", HttpStatusCode.UNAUTHORIZED, ErrorLayer.CONTROLLER)
    }

    const { participantIds } = addParticipantsSchema.parse(req.body)
    const id = String(req.params.id)
    const data = await this.service.addParticipants(id, employeeId, participantIds)
    res.status(HttpStatusCode.OK).json({ data, error: null })
  }

  /**
   * GET /api/chat/conversations/:id/messages
   * Loads message history with optional cursor pagination.
   */
  getMessages = async (req: AuthRequest, res: Response): Promise<void> => {
    const employeeId = req.user?.empId
    if (!employeeId) {
      throw new AppError("Unauthorized", HttpStatusCode.UNAUTHORIZED, ErrorLayer.CONTROLLER)
    }

    const id = String(req.params.id)
    const limit = req.query.limit ? Number(req.query.limit) : CHAT_CONFIG.DEFAULT_PAGE_SIZE
    const beforeCursor =
      typeof req.query.beforeCursor === "string" ? req.query.beforeCursor : undefined

    const data = await this.service.getMessages(id, employeeId, limit, beforeCursor)
    res.status(HttpStatusCode.OK).json({ data, error: null })
  }

  /**
   * GET /api/chat/conversations/:id/messages/search?q=...
   * Searches message history for the authenticated conversation participant.
   */
  searchMessages = async (req: AuthRequest, res: Response): Promise<void> => {
    const employeeId = req.user?.empId
    if (!employeeId) {
      throw new AppError("Unauthorized", HttpStatusCode.UNAUTHORIZED, ErrorLayer.CONTROLLER)
    }

    const id = String(req.params.id)
    const query = typeof req.query.q === "string" ? req.query.q : ""
    const data = await this.service.searchMessages(id, employeeId, query)
    res.status(HttpStatusCode.OK).json({ data, error: null })
  }

  /**
   * POST /api/chat/conversations/:id/messages
   * Sends a message with text, media attachments, or structured mentions.
   */
  sendMessage = async (req: AuthRequest, res: Response): Promise<void> => {
    const employeeId = req.user?.empId
    if (!employeeId) {
      throw new AppError("Unauthorized", HttpStatusCode.UNAUTHORIZED, ErrorLayer.CONTROLLER)
    }

    const id = String(req.params.id)
    const validated = sendMessageSchema.parse(req.body)
    const data = await this.service.sendMessage(id, employeeId, validated)
    res.status(HttpStatusCode.CREATED).json({ data, error: null })
  }

  /**
   * POST /api/chat/conversations/:id/read
   * Marks all messages up to the present as read.
   */
  markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
    const employeeId = req.user?.empId
    if (!employeeId) {
      throw new AppError("Unauthorized", HttpStatusCode.UNAUTHORIZED, ErrorLayer.CONTROLLER)
    }

    const id = String(req.params.id)
    await this.service.markAsRead(id, employeeId)
    res.status(HttpStatusCode.OK).json({ data: { success: true }, error: null })
  }

  /**
   * PATCH /api/chat/conversations/:id/settings
   * Updates participant preferences (isPinned, isMuted, isRestricted).
   */
  updateSettings = async (req: AuthRequest, res: Response): Promise<void> => {
    const employeeId = req.user?.empId
    if (!employeeId) {
      throw new AppError("Unauthorized", HttpStatusCode.UNAUTHORIZED, ErrorLayer.CONTROLLER)
    }

    const id = String(req.params.id)
    const validated = updateSettingsSchema.parse(req.body)
    await this.service.updateParticipantSettings(id, employeeId, validated)
    res.status(HttpStatusCode.OK).json({ data: { success: true }, error: null })
  }

  /**
   * DELETE /api/chat/conversations/:id
   * Soft deletes or hides conversation for the current employee.
   */
  deleteConversation = async (req: AuthRequest, res: Response): Promise<void> => {
    const employeeId = req.user?.empId
    if (!employeeId) {
      throw new AppError("Unauthorized", HttpStatusCode.UNAUTHORIZED, ErrorLayer.CONTROLLER)
    }

    const id = String(req.params.id)
    await this.service.deleteConversationForEmployee(id, employeeId)
    res.status(HttpStatusCode.OK).json({ data: { success: true }, error: null })
  }

  /**
   * POST /api/chat/upload
   * Uploads an image or file attachment to Cloudinary for chat message inclusion.
   */
  uploadAttachment = async (req: AuthRequest, res: Response): Promise<void> => {
    const employeeId = req.user?.empId
    if (!employeeId) {
      throw new AppError("Unauthorized", HttpStatusCode.UNAUTHORIZED, ErrorLayer.CONTROLLER)
    }

    if (!req.file) {
      throw new AppError("No file uploaded", HttpStatusCode.BAD_REQUEST, ErrorLayer.CONTROLLER)
    }

    const isImage = req.file.mimetype.startsWith("image/")
    const { url } = await CloudinaryUtil.uploadStream(req.file.buffer, {
      folder: "devcore/chat_attachments",
      resource_type: isImage ? "image" : "auto",
      public_id: `chat_${Date.now()}_${employeeId}`,
      overwrite: true,
    })

    res.status(HttpStatusCode.OK).json({
      data: {
        fileUrl: url,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        type: isImage ? "image" : "file",
      },
      error: null,
    })
  }

  /**
   * GET /api/chat/stream
   * Real-time Server-Sent Events (SSE) stream delivering instant incoming chat messages.
   */
  streamMessages = (req: AuthRequest, res: Response): void => {
    const employeeId = req.user?.empId
    if (!employeeId) {
      res.status(HttpStatusCode.UNAUTHORIZED).json({
        data: null,
        error: { message: "Unauthorized", code: ErrorCode.UNAUTHORIZED },
      })
      return
    }

    res.setHeader("Content-Type", "text/event-stream")
    res.setHeader("Cache-Control", "no-cache, no-transform")
    res.setHeader("Connection", "keep-alive")
    res.setHeader("X-Accel-Buffering", "no")
    res.flushHeaders()

    // Send connection established handshake
    res.write(`data: ${JSON.stringify({ type: "connected" })}\n\n`)

    // Subscribe to employee channel on EventBus
    const unsubscribe = this.service.subscribeToChatStream(employeeId, (message) => {
      res.write(`data: ${JSON.stringify({ type: "message", payload: message })}\n\n`)
    })

    // Keep-alive heartbeat
    const keepAliveTimer = setInterval(() => {
      res.write(": keep-alive\n\n")
    }, CHAT_CONFIG.KEEP_ALIVE_INTERVAL_MS)

    req.on("close", () => {
      clearInterval(keepAliveTimer)
      unsubscribe()
    })
  }

  /**
   * GET /api/chat/mentions/employees?q=...
   * Autocomplete query for @ mention syntax (Employees)
   */
  searchMentionEmployees = async (req: AuthRequest, res: Response): Promise<void> => {
    const q = typeof req.query.q === "string" ? req.query.q : ""
    const limit = req.query.limit ? Number(req.query.limit) : 10
    const data = await this.service.searchMentionEmployees(q, limit)
    res.status(HttpStatusCode.OK).json({ data, error: null })
  }

  /**
   * GET /api/chat/mentions/projects?q=...
   * Autocomplete query for # mention syntax (Projects)
   */
  searchMentionProjects = async (req: AuthRequest, res: Response): Promise<void> => {
    const q = typeof req.query.q === "string" ? req.query.q : ""
    const limit = req.query.limit ? Number(req.query.limit) : 10
    const data = await this.service.searchMentionProjects(q, limit)
    res.status(HttpStatusCode.OK).json({ data, error: null })
  }

  /**
   * GET /api/chat/mentions/tasks?q=...&projectId=...
   * Autocomplete query for ! mention syntax (Tasks)
   */
  searchMentionTasks = async (req: AuthRequest, res: Response): Promise<void> => {
    const q = typeof req.query.q === "string" ? req.query.q : ""
    const limit = req.query.limit ? Number(req.query.limit) : 10
    const projectId = typeof req.query.projectId === "string" ? req.query.projectId : undefined
    const data = await this.service.searchMentionTasks(q, limit, projectId)
    res.status(HttpStatusCode.OK).json({ data, error: null })
  }
}
