import type { ChatStreamEvent } from "@/types/chat.types.ts"

/** Event signatures emitted by the chat server to authenticated sockets. */
export interface ChatSocketServerToClientEvents {
  "chat:message": (event: ChatStreamEvent, acknowledge: () => void) => void
  "presence:changed": (event: { employeeId: string; isOnline: boolean }) => void
  "presence:snapshot": (event: { conversationId: string; onlineEmployeeIds: string[] }) => void
  "typing:changed": (event: {
    conversationId: string
    employeeId: string
    isTyping: boolean
  }) => void
  "conversation:read": (event: {
    conversationId: string
    employeeId: string
    lastReadAt: string
  }) => void
  "message:status": (event: {
    messageId: string
    status: "delivered"
    recipientEmployeeId: string
  }) => void
  "chat:error": (event: { message: string }) => void
}

/** Event signatures accepted from authenticated chat clients. */
export interface ChatSocketClientToServerEvents {
  "conversation:join": (conversationId: string) => void
  "conversation:leave": (conversationId: string) => void
  "typing:changed": (event: { conversationId: string; isTyping: boolean }) => void
  "conversation:read": (event: { conversationId: string }) => void
}

/** Authenticated identity attached to a chat socket after handshake validation. */
export interface ChatSocketData {
  employeeId: string
}
