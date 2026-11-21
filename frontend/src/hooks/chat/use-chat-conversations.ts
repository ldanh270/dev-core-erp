import { chatApi } from "@/lib/chat-api"
import { useAuthStore } from "@/store/auth-store"
import type { ConversationSummaryDto } from "@/types/chat.types"

import { useQuery } from "@tanstack/react-query"

import { CHAT_QUERY_KEYS } from "./chat-query-keys"

/**
 * Loads the signed-in employee's visible conversation summaries.
 */
export function useChatConversations() {
  const { isAuthenticated } = useAuthStore()

  return useQuery<ConversationSummaryDto[]>({
    queryKey: CHAT_QUERY_KEYS.CONVERSATIONS,
    queryFn: () => chatApi.getConversations(),
    enabled: isAuthenticated,
    staleTime: 1000 * 30,
  })
}
