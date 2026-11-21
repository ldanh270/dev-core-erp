import { chatApi } from "@/lib/chat-api"
import type { UpdateParticipantSettingsDto } from "@/types/chat.types"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { getChatApiErrorMessage } from "./chat-api-error"
import { CHAT_QUERY_KEYS } from "./chat-query-keys"

/**
 * Updates the current employee's conversation preferences and refreshes the conversation list.
 */
export function useUpdateChatSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      conversationId,
      settings,
    }: {
      conversationId: string
      settings: UpdateParticipantSettingsDto
    }) => chatApi.updateSettings(conversationId, settings),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.CONVERSATIONS })
    },
    onError: (error: unknown) => {
      toast.error(getChatApiErrorMessage(error, "Không thể cập nhật cài đặt"))
    },
  })
}
