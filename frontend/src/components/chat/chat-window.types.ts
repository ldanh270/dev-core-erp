import type { ChatMessageDto, ConversationSummaryDto, SendMessageDto } from "@/types/chat.types"

/**
 * Data and action handlers required to render the selected conversation window.
 */
export interface ChatWindowProps {
  /** The currently selected conversation summary and metadata, if any. */
  conversation?: ConversationSummaryDto
  /** Chronological list of chat messages loaded for the current conversation. */
  messages: ChatMessageDto[]
  /** List of all conversations available to the user for message forwarding targets. */
  conversations: ConversationSummaryDto[]
  /** Handler invoked when sending a new text, image, or attachment message. */
  onSendMessage: (data: SendMessageDto) => Promise<void>
  /** Handler invoked when editing an existing message's text content. */
  onEditMessage: (messageId: string, content: string) => void
  /** Handler invoked when recalling a message sent by the current user. */
  onRecallMessage: (messageId: string) => void
  /** Handler invoked when pinning or unpinning a message in the room. */
  onSetMessagePinned: (messageId: string, isPinned: boolean) => void
  /** Handler invoked when forwarding a message to one or more conversations. */
  onForwardMessage: (messageId: string, conversationIds: string[]) => void
  /** List of employee IDs currently online. */
  onlineEmployeeIds: string[]
  /** List of employee IDs currently typing in this room. */
  typingEmployeeIds: string[]
  /** Mapping of employee IDs to their last read timestamp ISO string. */
  readAtByEmployeeId: Record<string, string>
  /** IDs of messages confirmed delivered to recipient devices. */
  deliveredMessageIds: string[]
  /** Handler notifying backend/socket when current user starts or stops typing. */
  onTypingChange: (isTyping: boolean) => void
  /** Handler fetching the previous page of older message history. */
  onLoadPreviousPage: () => Promise<unknown>
  /** Whether older message history pages exist for pagination. */
  hasPreviousPage: boolean
  /** Whether an older message history page is currently being loaded. */
  isLoadingPreviousPage: boolean
  /** Whether the initial message load for the current conversation is in flight. */
  isLoading?: boolean
}
