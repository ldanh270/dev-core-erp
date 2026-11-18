/**
 * Central query keys keep chat list, detail, history, and search caches isolated.
 */
export const CHAT_QUERY_KEYS = {
  ALL: ["chat"] as const,
  CONVERSATIONS: ["chat", "conversations"] as const,
  CONVERSATION: (id: string) => ["chat", "conversation", id] as const,
  MESSAGES: (id: string) => ["chat", "messages", id] as const,
  SEARCH_MESSAGES: (id: string, query: string) => ["chat", "search-messages", id, query] as const,
}
