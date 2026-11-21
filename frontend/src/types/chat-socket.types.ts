import type { ChatStreamEvent } from "@/types/chat.types"

/** Event signatures received by the frontend from the chat server. */
export interface ChatSocketServerToClientEvents {
  "chat:message": (event: ChatStreamEvent, acknowledge?: () => void) => void
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

/** Event signatures emitted by the frontend to the chat server. */
export interface ChatSocketClientToServerEvents {
  "conversation:join": (conversationId: string) => void
  "conversation:leave": (conversationId: string) => void
  "typing:changed": (event: { conversationId: string; isTyping: boolean }) => void
  "conversation:read": (event: { conversationId: string }) => void
}
