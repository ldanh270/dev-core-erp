import { chatApi } from "@/lib/chat-api"
import type { CreateDirectConversationDto } from "@/types/chat.types"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { getChatApiErrorMessage } from "./chat-api-error"
import { CHAT_QUERY_KEYS } from "./chat-query-keys"

/**
 * Creates a direct conversation and refreshes the list before resolving.
 */
export function useCreateDirectChat() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (dto: CreateDirectConversationDto) => chatApi.createDirectConversation(dto),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.CONVERSATIONS })
    },
    onError: (error: unknown) => {
      toast.error(getChatApiErrorMessage(error, "Không thể tạo cuộc trò chuyện"))
    },
  })
}
