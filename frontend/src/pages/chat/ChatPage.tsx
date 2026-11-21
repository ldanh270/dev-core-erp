import { ChatWindow } from "@/components/chat/ChatWindow"
import { ConversationList } from "@/components/chat/ConversationList"
import { NewChatModal } from "@/components/chat/NewChatModal"
import { ROUTES } from "@/config/routes.config"
import {
  useChatConversations,
  useChatMessages,
  useChatRealtime,
  useCreateDirectChat,
  useCreateGroupChat,
} from "@/hooks/chat/use-chat"
import { routerNavigate } from "@/lib/router-navigator"
import type { SendMessageDto } from "@/types/chat.types"

import React, { useCallback, useEffect, useState } from "react"
import { useParams } from "react-router-dom"

/**
 * Main chat page coordinating the conversation list, active message window, and creation dialog.
 * The optional conversation ID in the route is the single source of truth for selection and
 * determines which message query is enabled.
 */
const ChatPage: React.FC = () => {
  const { id: conversationId } = useParams<{ id?: string }>()
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false)

  // Retrieve conversations and maintain the active chat WebSocket.
  const { data: conversations = [], isLoading: isLoadingConversations } = useChatConversations()

  // Active conversation messages & send mutation
  const {
    data: messages = [],
    isLoading: isLoadingMessages,
    sendMessage,
    editMessage,
    recallMessage,
    setMessagePinned,
    forwardMessage,
    markAsRead,
    fetchPreviousPage,
    hasPreviousPage,
    isFetchingPreviousPage,
  } = useChatMessages(conversationId)

  const {
    onlineEmployeeIds,
    typingEmployeeIds,
    readAtByEmployeeId,
    deliveredMessageIds,
    sendTyping,
  } = useChatRealtime(conversationId)

  // Creation mutations
  const createDirectMutation = useCreateDirectChat()
  const createGroupMutation = useCreateGroupChat()

  // Selected conversation summary object
  const activeConversation = conversations.find((c) => c.id === conversationId)

  // Auto mark as read on open
  useEffect(() => {
    if (conversationId) {
      markAsRead()
    }
  }, [conversationId, markAsRead])

  // The route ID is the source of truth for the active chat and drives the message query above.
  const handleSelectConversation = useCallback((id: string) => {
    routerNavigate(`${ROUTES.CHAT.BASE}/${id}`)
  }, [])

  const handleOpenNewChatModal = useCallback(() => {
    setIsNewChatModalOpen(true)
  }, [])

  const handleCloseNewChatModal = useCallback(() => {
    setIsNewChatModalOpen(false)
  }, [])

  // Navigate only after creation returns an ID; failed mutations leave error handling to the modal flow.
  const handleCreateDirect = useCallback(
    async (partnerId: string) => {
      const conv = await createDirectMutation.mutateAsync({ partnerId })
      if (conv?.id) {
        routerNavigate(`${ROUTES.CHAT.BASE}/${conv.id}`)
      }
    },
    [createDirectMutation],
  )

  const handleCreateGroup = useCallback(
    async (data: { title: string; participantIds: string[] }) => {
      const conv = await createGroupMutation.mutateAsync(data)
      if (conv?.id) {
        routerNavigate(`${ROUTES.CHAT.BASE}/${conv.id}`)
      }
    },
    [createGroupMutation],
  )

  const handleSendMessage = useCallback(
    async (data: SendMessageDto) => {
      await sendMessage(data)
    },
    [sendMessage],
  )

  return (
    <div className="flex h-[calc(100vh-4.5rem)] rounded-xl border border-border overflow-hidden bg-card shadow-sm m-4">
      {/* Sidebar - Conversation List */}
      <div className="w-80 shrink-0 h-full">
        <ConversationList
          conversations={conversations}
          activeConversationId={conversationId}
          onSelectConversation={handleSelectConversation}
          onOpenNewChatModal={handleOpenNewChatModal}
          isLoading={isLoadingConversations}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 h-full min-w-0">
        <ChatWindow
          conversation={activeConversation}
          messages={messages}
          conversations={conversations}
          onSendMessage={handleSendMessage}
          onEditMessage={editMessage}
          onRecallMessage={recallMessage}
          onSetMessagePinned={setMessagePinned}
          onForwardMessage={forwardMessage}
          onlineEmployeeIds={onlineEmployeeIds}
          typingEmployeeIds={typingEmployeeIds}
          readAtByEmployeeId={readAtByEmployeeId}
          deliveredMessageIds={deliveredMessageIds}
          onTypingChange={sendTyping}
          onLoadPreviousPage={fetchPreviousPage}
          hasPreviousPage={hasPreviousPage}
          isLoadingPreviousPage={isFetchingPreviousPage}
          isLoading={isLoadingMessages}
        />
      </div>

      {/* New Chat Modal */}
      <NewChatModal
        isOpen={isNewChatModalOpen}
        onClose={handleCloseNewChatModal}
        onCreateDirect={handleCreateDirect}
        onCreateGroup={handleCreateGroup}
      />
    </div>
  )
}

export default ChatPage
