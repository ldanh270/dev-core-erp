import { chatApi } from "@/lib/chat-api"
import { useAuthStore } from "@/store/auth-store"
import type { ConversationSummaryDto, ForwardMessageDto, SendMessageDto } from "@/types/chat.types"

import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { getChatApiErrorMessage } from "./chat-api-error"
import { applyMessageEvent } from "./chat-message-cache"
import { CHAT_QUERY_KEYS } from "./chat-query-keys"

const MESSAGE_PAGE_SIZE = 30

/**
 * Loads conversation history in backward pages and exposes message/read-state mutations.
 */
export function useChatMessages(conversationId?: string) {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  const messagesQuery = useInfiniteQuery({
    queryKey: CHAT_QUERY_KEYS.MESSAGES(conversationId || ""),
    queryFn: ({ pageParam }) =>
      conversationId
        ? chatApi.getMessages(conversationId, MESSAGE_PAGE_SIZE, pageParam)
        : Promise.resolve([]),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.length === MESSAGE_PAGE_SIZE ? lastPage[0]?.id : undefined,
    enabled: !!conversationId,
    staleTime: 1000 * 10,
  })
  const messages = messagesQuery.data?.pages.slice().reverse().flat() ?? []

  const sendMutation = useMutation({
    mutationFn: (dto: SendMessageDto) => {
      if (!conversationId) throw new Error("Conversation ID is required")
      return chatApi.sendMessage(conversationId, dto)
    },
    onSuccess: (message) => {
      applyMessageEvent(queryClient, { type: "message.created", message }, user?.id)
    },
    onError: (error: unknown) => {
      toast.error(getChatApiErrorMessage(error, "Không thể gửi tin nhắn"))
    },
  })

  const editMessageMutation = useMutation({
    mutationFn: ({ messageId, content }: { messageId: string; content: string }) =>
      chatApi.editMessage(messageId, content),
    onSuccess: (message) => {
      applyMessageEvent(queryClient, { type: "message.updated", message }, user?.id)
    },
    onError: (error: unknown) => {
      toast.error(getChatApiErrorMessage(error, "Không thể chỉnh sửa tin nhắn"))
    },
  })

  const recallMessageMutation = useMutation({
    mutationFn: (messageId: string) => chatApi.recallMessage(messageId),
    onSuccess: (message) => {
      applyMessageEvent(queryClient, { type: "message.recalled", message }, user?.id)
    },
    onError: (error: unknown) => {
      toast.error(getChatApiErrorMessage(error, "Không thể thu hồi tin nhắn"))
    },
  })

  const pinMessageMutation = useMutation({
    mutationFn: ({ messageId, isPinned }: { messageId: string; isPinned: boolean }) =>
      chatApi.setMessagePinned(messageId, isPinned),
    onSuccess: (message) => {
      applyMessageEvent(queryClient, { type: "message.updated", message }, user?.id)
    },
    onError: (error: unknown) => {
      toast.error(getChatApiErrorMessage(error, "Không thể cập nhật trạng thái ghim"))
    },
  })

  const forwardMessageMutation = useMutation({
    mutationFn: ({ messageId, ...dto }: { messageId: string } & ForwardMessageDto) =>
      chatApi.forwardMessage(messageId, dto),
    onSuccess: (messages) => {
      messages.forEach((message) => {
        applyMessageEvent(queryClient, { type: "message.created", message }, user?.id)
      })
      toast.success("Đã chuyển tiếp tin nhắn")
    },
    onError: (error: unknown) => {
      toast.error(getChatApiErrorMessage(error, "Không thể chuyển tiếp tin nhắn"))
    },
  })

  const markReadMutation = useMutation({
    mutationFn: () => {
      if (!conversationId) return Promise.resolve()
      return chatApi.markAsRead(conversationId)
    },
    onSuccess: () => {
      queryClient.setQueryData<ConversationSummaryDto[]>(CHAT_QUERY_KEYS.CONVERSATIONS, (old) => {
        if (!old) return old
        return old.map((conversation) =>
          conversation.id === conversationId ? { ...conversation, unreadCount: 0 } : conversation,
        )
      })
    },
  })

  return {
    ...messagesQuery,
    data: messages,
    fetchPreviousPage: messagesQuery.fetchNextPage,
    hasPreviousPage: messagesQuery.hasNextPage,
    isFetchingPreviousPage: messagesQuery.isFetchingNextPage,
    sendMessage: sendMutation.mutateAsync,
    isSending: sendMutation.isPending,
    editMessage: (messageId: string, content: string) => {
      editMessageMutation.mutate({ messageId, content })
    },
    recallMessage: recallMessageMutation.mutate,
    setMessagePinned: (messageId: string, isPinned: boolean) => {
      pinMessageMutation.mutate({ messageId, isPinned })
    },
    forwardMessage: (messageId: string, conversationIds: string[]) => {
      forwardMessageMutation.mutate({ messageId, conversationIds })
    },
    isMessageActionPending:
      editMessageMutation.isPending ||
      recallMessageMutation.isPending ||
      pinMessageMutation.isPending ||
      forwardMessageMutation.isPending,
    markAsRead: markReadMutation.mutate,
  }
}
