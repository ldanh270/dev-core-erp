import { CHAT_SOCKET_EVENT } from "@/configs/entities/chat.config.ts"
import type { ChatStreamEvent } from "@/types/chat.types.ts"

/** Event signatures emitted by the chat server to authenticated sockets. */
export interface ChatSocketServerToClientEvents {
  [CHAT_SOCKET_EVENT.MESSAGE]: (event: ChatStreamEvent, acknowledge: () => void) => void
  [CHAT_SOCKET_EVENT.PRESENCE_CHANGED]: (event: { employeeId: string; isOnline: boolean }) => void
  [CHAT_SOCKET_EVENT.PRESENCE_SNAPSHOT]: (event: {
    conversationId: string
    onlineEmployeeIds: string[]
  }) => void
  [CHAT_SOCKET_EVENT.TYPING_CHANGED]: (event: {
    conversationId: string
    employeeId: string
    isTyping: boolean
  }) => void
  [CHAT_SOCKET_EVENT.CONVERSATION_READ]: (event: {
    conversationId: string
    employeeId: string
    lastReadAt: string
  }) => void
  [CHAT_SOCKET_EVENT.MESSAGE_STATUS]: (event: {
    messageId: string
    status: "delivered"
    recipientEmployeeId: string
  }) => void
  [CHAT_SOCKET_EVENT.ERROR]: (event: { message: string }) => void
}

/** Event signatures accepted from authenticated chat clients. */
export interface ChatSocketClientToServerEvents {
  [CHAT_SOCKET_EVENT.CONVERSATION_JOIN]: (conversationId: string) => void
  [CHAT_SOCKET_EVENT.CONVERSATION_LEAVE]: (conversationId: string) => void
  [CHAT_SOCKET_EVENT.TYPING_CHANGED]: (event: { conversationId: string; isTyping: boolean }) => void
  [CHAT_SOCKET_EVENT.CONVERSATION_READ]: (event: { conversationId: string }) => void
}

/** Authenticated identity attached to a chat socket after handshake validation. */
export interface ChatSocketData {
  employeeId: string
}
