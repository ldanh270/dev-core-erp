import { chatApi } from "@/lib/chat-api"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { getChatApiErrorMessage } from "./chat-api-error"
import { CHAT_QUERY_KEYS } from "./chat-query-keys"

/**
 * Hides the conversation for the current employee and refreshes the list.
 */
export function useDeleteConversation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (conversationId: string) => chatApi.deleteConversation(conversationId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.CONVERSATIONS })
      toast.success("Đã xoá cuộc trò chuyện")
    },
    onError: (error: unknown) => {
      toast.error(getChatApiErrorMessage(error, "Không thể xoá cuộc trò chuyện"))
    },
  })
}
