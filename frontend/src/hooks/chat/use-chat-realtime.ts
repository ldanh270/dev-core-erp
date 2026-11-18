import { API_BASE_URL } from "@/config/api.config"
import { useAuthStore } from "@/store/auth-store"
import type {
  ChatSocketClientToServerEvents,
  ChatSocketServerToClientEvents,
} from "@/types/chat-socket.types"
import type { ChatStreamEvent } from "@/types/chat.types"

import { useEffect, useRef, useState } from "react"

import { useQueryClient } from "@tanstack/react-query"
import { type Socket, io } from "socket.io-client"
import { toast } from "sonner"

import { applyMessageEvent } from "./chat-message-cache"

/**
 * Maintains an authenticated chat socket and exposes active-conversation presence and typing.
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
        socket.emit("conversation:read", { conversationId: event.message.conversationId })
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
          }, 3000),
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
    socket.on("connect", handleConnect)
    socket.on("disconnect", handleDisconnect)
    socket.on("chat:message", handleMessage)
    socket.on("presence:snapshot", handlePresenceSnapshot)
    socket.on("presence:changed", handlePresenceChange)
    socket.on("typing:changed", handleTypingChange)
    socket.on("conversation:read", handleReadReceipt)
    socket.on("message:status", handleMessageStatus)
    socket.on("chat:error", ({ message }) => {
      toast.error(message)
    })
    socket.on("connect_error", (error) => {
      console.error("Chat WebSocket connection failed:", error)
    })

    return () => {
      socket.off("connect", handleConnect)
      socket.off("disconnect", handleDisconnect)
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
      socket.emit("conversation:join", conversationId)
    }
    socket.on("connect", joinConversation)
    if (socket.connected) joinConversation()

    return () => {
      socket.off("connect", joinConversation)
      socket.emit("typing:changed", { conversationId, isTyping: false })
      socket.emit("conversation:leave", conversationId)
    }
  }, [accessToken, conversationId, isAuthenticated])

  const sendTyping = (isTyping: boolean) => {
    if (!conversationId) return
    socketRef.current?.emit("typing:changed", { conversationId, isTyping })
  }

  return {
    onlineEmployeeIds: activeRealtimeConversationId === conversationId ? onlineEmployeeIds : [],
    typingEmployeeIds: activeRealtimeConversationId === conversationId ? typingEmployeeIds : [],
    readAtByEmployeeId: activeRealtimeConversationId === conversationId ? readAtByEmployeeId : {},
    deliveredMessageIds: activeRealtimeConversationId === conversationId ? deliveredMessageIds : [],
    sendTyping,
  }
}
