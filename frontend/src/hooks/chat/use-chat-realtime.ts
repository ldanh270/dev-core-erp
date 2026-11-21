import { API_BASE_URL } from "@/config/api.config"
import { CHAT_CONFIG, CHAT_SOCKET_EVENT } from "@/config/entities/chat.config"
import { useAuthStore } from "@/store/auth-store"
import type {
  ChatSocketClientToServerEvents,
  ChatSocketServerToClientEvents,
} from "@/types/chat-socket.types"
import type { ChatStreamEvent } from "@/types/chat.types"

import { useCallback, useEffect, useRef, useState } from "react"

import { useQueryClient } from "@tanstack/react-query"
import { type Socket, io } from "socket.io-client"
import { toast } from "sonner"

import { applyMessageEvent } from "./chat-message-cache"

/**
 * Maintains an authenticated WebSocket connection for chat, tracking online presence,
 * typing indicators, read receipts, and message delivery status for an active conversation.
 *
 * @param conversationId Unique identifier of the currently focused conversation, if any
 * @returns Realtime status vectors and a memoized sendTyping notification callback
 */
export function useChatRealtime(conversationId?: string) {
  const queryClient = useQueryClient()
  const { isAuthenticated, accessToken, user } = useAuthStore()
  const [onlineEmployeeIds, setOnlineEmployeeIds] = useState<string[]>([])
  const [typingEmployeeIds, setTypingEmployeeIds] = useState<string[]>([])
  const [readAtByEmployeeId, setReadAtByEmployeeId] = useState<Record<string, string>>({})
  const [deliveredMessageIds, setDeliveredMessageIds] = useState<string[]>([])
  const [activeRealtimeConversationId, setActiveRealtimeConversationId] = useState<string | null>(
    null,
  )
  const socketRef = useRef<Socket<
    ChatSocketServerToClientEvents,
    ChatSocketClientToServerEvents
  > | null>(null)
  const conversationIdRef = useRef(conversationId)
  const typingTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>())

  useEffect(() => {
    conversationIdRef.current = conversationId
  }, [conversationId])

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return

    const activeTypingTimers = typingTimers.current
    const socketOrigin = API_BASE_URL.startsWith("http")
      ? API_BASE_URL.replace(/\/api\/?$/, "")
      : window.location.origin
    const socket: Socket<ChatSocketServerToClientEvents, ChatSocketClientToServerEvents> = io(
      socketOrigin,
      {
        path: "/api/socket.io",
        auth: { token: accessToken },
        withCredentials: true,
      },
    )
    socketRef.current = socket

    const handleMessage = (event: ChatStreamEvent, acknowledge?: () => void) => {
      applyMessageEvent(queryClient, event, user?.id)
      acknowledge?.()
      if (event.message.conversationId === conversationIdRef.current) {
        socket.emit(CHAT_SOCKET_EVENT.CONVERSATION_READ, {
          conversationId: event.message.conversationId,
        })
      }
    }
    const handlePresenceSnapshot = ({
      conversationId: joinedId,
      onlineEmployeeIds: onlineIds,
    }: {
      conversationId: string
      onlineEmployeeIds: string[]
    }) => {
      if (joinedId !== conversationIdRef.current) return
      setActiveRealtimeConversationId(joinedId)
      setOnlineEmployeeIds(onlineIds)
      setTypingEmployeeIds([])
      setReadAtByEmployeeId({})
      setDeliveredMessageIds([])
      activeTypingTimers.forEach(clearTimeout)
      activeTypingTimers.clear()
    }
    const handlePresenceChange = ({
      employeeId,
      isOnline,
    }: {
      employeeId: string
      isOnline: boolean
    }) => {
      setOnlineEmployeeIds((current) =>
        isOnline
          ? current.includes(employeeId)
            ? current
            : [...current, employeeId]
          : current.filter((id) => id !== employeeId),
      )
    }
    const handleTypingChange = ({
      conversationId: eventConversationId,
      employeeId,
      isTyping,
    }: {
      conversationId: string
      employeeId: string
      isTyping: boolean
    }) => {
      if (eventConversationId !== conversationIdRef.current) return
      const currentTimer = typingTimers.current.get(employeeId)
      if (currentTimer) clearTimeout(currentTimer)
      if (isTyping) {
        setTypingEmployeeIds((current) =>
          current.includes(employeeId) ? current : [...current, employeeId],
        )
        typingTimers.current.set(
          employeeId,
          setTimeout(() => {
            setTypingEmployeeIds((current) => current.filter((id) => id !== employeeId))
            typingTimers.current.delete(employeeId)
          }, CHAT_CONFIG.TYPING_TIMEOUT_MS),
        )
      } else {
        setTypingEmployeeIds((current) => current.filter((id) => id !== employeeId))
        typingTimers.current.delete(employeeId)
      }
    }
    const handleReadReceipt = ({
      conversationId: eventConversationId,
      employeeId,
      lastReadAt,
    }: {
      conversationId: string
      employeeId: string
      lastReadAt: string
    }) => {
      if (eventConversationId !== conversationIdRef.current) return
      setReadAtByEmployeeId((current) => ({ ...current, [employeeId]: lastReadAt }))
    }
    const handleMessageStatus = ({ messageId }: { messageId: string }) => {
      setDeliveredMessageIds((current) =>
        current.includes(messageId) ? current : [...current, messageId],
      )
    }

    const handleConnect = () => {
      setActiveRealtimeConversationId(null)
    }
    const handleDisconnect = () => {
      setActiveRealtimeConversationId(null)
    }
    socket.on(CHAT_SOCKET_EVENT.CONNECT, handleConnect)
    socket.on(CHAT_SOCKET_EVENT.DISCONNECT, handleDisconnect)
    socket.on(CHAT_SOCKET_EVENT.MESSAGE, handleMessage)
    socket.on(CHAT_SOCKET_EVENT.PRESENCE_SNAPSHOT, handlePresenceSnapshot)
    socket.on(CHAT_SOCKET_EVENT.PRESENCE_CHANGED, handlePresenceChange)
    socket.on(CHAT_SOCKET_EVENT.TYPING_CHANGED, handleTypingChange)
    socket.on(CHAT_SOCKET_EVENT.CONVERSATION_READ, handleReadReceipt)
    socket.on(CHAT_SOCKET_EVENT.MESSAGE_STATUS, handleMessageStatus)
    socket.on(CHAT_SOCKET_EVENT.ERROR, ({ message }) => {
      toast.error(message)
    })
    socket.on(CHAT_SOCKET_EVENT.CONNECT_ERROR, (error) => {
      console.error("Chat WebSocket connection failed:", error)
    })

    return () => {
      socket.off(CHAT_SOCKET_EVENT.CONNECT, handleConnect)
      socket.off(CHAT_SOCKET_EVENT.DISCONNECT, handleDisconnect)
      socket.disconnect()
      socketRef.current = null
      activeTypingTimers.forEach(clearTimeout)
      activeTypingTimers.clear()
    }
  }, [isAuthenticated, accessToken, queryClient, user?.id])

  useEffect(() => {
    const socket = socketRef.current
    if (!socket || !isAuthenticated || !accessToken || !conversationId) return

    const joinConversation = () => {
      socket.emit(CHAT_SOCKET_EVENT.CONVERSATION_JOIN, conversationId)
    }
    socket.on(CHAT_SOCKET_EVENT.CONNECT, joinConversation)
    if (socket.connected) joinConversation()

    return () => {
      socket.off(CHAT_SOCKET_EVENT.CONNECT, joinConversation)
      socket.emit(CHAT_SOCKET_EVENT.TYPING_CHANGED, { conversationId, isTyping: false })
      socket.emit(CHAT_SOCKET_EVENT.CONVERSATION_LEAVE, conversationId)
    }
  }, [accessToken, conversationId, isAuthenticated])

  /**
   * Emits typing indicator event for the active conversation.
   */
  const sendTyping = useCallback(
    (isTyping: boolean) => {
      if (!conversationId) return
      socketRef.current?.emit(CHAT_SOCKET_EVENT.TYPING_CHANGED, { conversationId, isTyping })
    },
    [conversationId],
  )

  return {
    onlineEmployeeIds: activeRealtimeConversationId === conversationId ? onlineEmployeeIds : [],
    typingEmployeeIds: activeRealtimeConversationId === conversationId ? typingEmployeeIds : [],
    readAtByEmployeeId: activeRealtimeConversationId === conversationId ? readAtByEmployeeId : {},
    deliveredMessageIds: activeRealtimeConversationId === conversationId ? deliveredMessageIds : [],
    sendTyping,
  }
}
