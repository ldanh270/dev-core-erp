import { chatApi } from "@/lib/chat-api"
import type { AddChatParticipantsDto, ConversationSummaryDto } from "@/types/chat.types"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { getChatApiErrorMessage } from "./chat-api-error"
import { CHAT_QUERY_KEYS } from "./chat-query-keys"

/**
 * Adds participants and replaces the cached conversation summary with the server response.
 */
export function useAddChatParticipants() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ conversationId, ...dto }: { conversationId: string } & AddChatParticipantsDto) =>
      chatApi.addParticipants(conversationId, dto),
    onSuccess: (updatedConversation) => {
      queryClient.setQueryData<ConversationSummaryDto[]>(CHAT_QUERY_KEYS.CONVERSATIONS, (old) =>
        old?.map((conversation) =>
          conversation.id === updatedConversation.id ? updatedConversation : conversation,
        ),
      )
      toast.success("Đã thêm thành viên vào nhóm")
    },
    onError: (error: unknown) => {
      toast.error(getChatApiErrorMessage(error, "Không thể thêm thành viên"))
    },
  })
}
