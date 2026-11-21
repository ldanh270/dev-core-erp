import type { ChatMessageDto, ConversationSummaryDto, SendMessageDto } from "@/types/chat.types"

/** Data and actions required to render the selected conversation window. */
export interface ChatWindowProps {
  conversation?: ConversationSummaryDto
  messages: ChatMessageDto[]
  conversations: ConversationSummaryDto[]
  onSendMessage: (data: SendMessageDto) => Promise<void>
  onEditMessage: (messageId: string, content: string) => void
  onRecallMessage: (messageId: string) => void
  onSetMessagePinned: (messageId: string, isPinned: boolean) => void
  onForwardMessage: (messageId: string, conversationIds: string[]) => void
  onlineEmployeeIds: string[]
  typingEmployeeIds: string[]
  readAtByEmployeeId: Record<string, string>
  deliveredMessageIds: string[]
  onTypingChange: (isTyping: boolean) => void
  onLoadPreviousPage: () => Promise<unknown>
  hasPreviousPage: boolean
  isLoadingPreviousPage: boolean
  isLoading?: boolean
}
