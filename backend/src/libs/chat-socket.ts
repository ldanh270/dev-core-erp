import { EMPLOYEE_STATUS } from "@/configs/entities/employee.config.ts"
import { prisma } from "@/libs/database.ts"
import { eventBus } from "@/libs/event-bus.ts"
import type { DomainEvents } from "@/libs/event-bus.ts"
import { getAllowedOrigins, isOriginAllowed } from "@/middlewares/cors.middleware.ts"
import type {
  ChatSocketClientToServerEvents,
  ChatSocketData,
  ChatSocketServerToClientEvents,
} from "@/types/chat-socket.types.ts"
import type { IChatService } from "@/types/chat.types.ts"
import { JwtUtil } from "@/utils/jwt.util.ts"

import type { Server as HttpServer } from "node:http"
import { Server } from "socket.io"

const employeeRoom = (employeeId: string) => `employee:${employeeId}`
const conversationRoom = (conversationId: string) => `conversation:${conversationId}`

/**
 * Attaches an authenticated Socket.IO gateway for chat events, presence, typing, and read receipts.
 */
export function attachChatSocket(
  httpServer: HttpServer,
  chatService: IChatService,
): Server<ChatSocketClientToServerEvents, ChatSocketServerToClientEvents, object, ChatSocketData> {
  const io = new Server<
    ChatSocketClientToServerEvents,
    ChatSocketServerToClientEvents,
    object,
    ChatSocketData
  >(httpServer, {
    path: "/api/socket.io",
    cors: {
      origin: (origin, callback) => {
        if (!origin || isOriginAllowed(origin, getAllowedOrigins())) {
          callback(null, true)
          return
        }
        callback(new Error("Origin is not allowed"))
      },
      credentials: true,
    },
  })

  const onlineSocketIds = new Map<string, Set<string>>()

  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token
    if (typeof token !== "string") {
      next(new Error("Unauthorized"))
      return
    }

    const decoded = JwtUtil.verifyAccessToken(token)
    if (!decoded || !decoded.version || decoded.version < 3) {
      next(new Error("Unauthorized"))
      return
    }

    try {
      const employee = await prisma.employee.findFirst({
        where: { id: decoded.empId, deletedAt: null },
        select: { id: true, status: true },
      })
      if (!employee || employee.status !== EMPLOYEE_STATUS.ACTIVE) {
        next(new Error("Unauthorized"))
        return
      }

      socket.data.employeeId = employee.id
      next()
    } catch (error) {
      console.error("Failed to authenticate chat socket:", error)
      next(new Error("Authentication failed"))
    }
  })

  io.on("connection", (socket) => {
    const { employeeId } = socket.data
    const socketIds = onlineSocketIds.get(employeeId) ?? new Set<string>()
    socketIds.add(socket.id)
    onlineSocketIds.set(employeeId, socketIds)
    socket.join(employeeRoom(employeeId))

    socket.on("conversation:join", async (conversationId) => {
      try {
        const conversation = await chatService.getConversationDetail(conversationId, employeeId)
        const room = conversationRoom(conversationId)
        await socket.join(room)
        socket.to(room).emit("presence:changed", { employeeId, isOnline: true })
        socket.emit("presence:snapshot", {
          conversationId,
          onlineEmployeeIds: conversation.participants
            .map((participant) => participant.employeeId)
            .filter((id) => onlineSocketIds.has(id)),
        })
        await chatService.markAsRead(conversationId, employeeId)
        io.to(room).emit("conversation:read", {
          conversationId,
          employeeId,
          lastReadAt: new Date().toISOString(),
        })
      } catch (error) {
        console.error("Chat socket conversation join failed:", error)
        socket.emit("chat:error", { message: "Không thể tham gia cuộc trò chuyện." })
      }
    })

    socket.on("conversation:leave", (conversationId) => {
      void socket.leave(conversationRoom(conversationId))
    })

    socket.on("typing:changed", ({ conversationId, isTyping }) => {
      if (!socket.rooms.has(conversationRoom(conversationId))) return
      socket.to(conversationRoom(conversationId)).emit("typing:changed", {
        conversationId,
        employeeId,
        isTyping,
      })
    })

    socket.on("conversation:read", async ({ conversationId }) => {
      if (!socket.rooms.has(conversationRoom(conversationId))) return
      try {
        await chatService.markAsRead(conversationId, employeeId)
        io.to(conversationRoom(conversationId)).emit("conversation:read", {
          conversationId,
          employeeId,
          lastReadAt: new Date().toISOString(),
        })
      } catch (error) {
        console.error("Chat socket read receipt failed:", error)
        socket.emit("chat:error", { message: "Không thể cập nhật trạng thái đã xem." })
      }
    })

    socket.on("disconnecting", () => {
      const activeSocketIds = onlineSocketIds.get(employeeId)
      activeSocketIds?.delete(socket.id)
      if (activeSocketIds?.size === 0) {
        onlineSocketIds.delete(employeeId)
        for (const room of socket.rooms) {
          if (room.startsWith("conversation:")) {
            socket.to(room).emit("presence:changed", { employeeId, isOnline: false })
          }
        }
      }
    })
  })

  const publishChatMessage = ({ recipientEmployeeId, event }: DomainEvents["chat:message"]) => {
    io.to(employeeRoom(recipientEmployeeId))
      .timeout(5000)
      .emit("chat:message", event, (error) => {
        if (!error && recipientEmployeeId !== event.message.senderId) {
          io.to(employeeRoom(event.message.senderId)).emit("message:status", {
            messageId: event.message.id,
            status: "delivered",
            recipientEmployeeId,
          })
        }
      })
  }

  eventBus.onTyped("chat:message", publishChatMessage)

  return io
}
