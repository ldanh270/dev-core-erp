import { chatApi } from "@/lib/chat-api"
import type { CreateGroupConversationDto } from "@/types/chat.types"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { getChatApiErrorMessage } from "./chat-api-error"
import { CHAT_QUERY_KEYS } from "./chat-query-keys"

/**
 * Creates a group conversation, refreshes the list, and reports success or failure.
 */
export function useCreateGroupChat() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (dto: CreateGroupConversationDto) => chatApi.createGroupConversation(dto),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.CONVERSATIONS })
      toast.success("Tạo nhóm chat thành công")
    },
    onError: (error: unknown) => {
      toast.error(getChatApiErrorMessage(error, "Không thể tạo nhóm chat"))
    },
  })
}
