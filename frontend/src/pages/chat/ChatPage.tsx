import { ChatWindow } from "@/components/chat/ChatWindow"
import { ConversationList } from "@/components/chat/ConversationList"
import { NewChatModal } from "@/components/chat/NewChatModal"
import { ROUTES } from "@/config/routes.config"
import {
  useChatConversations,
  useChatMessages,
  useCreateDirectChat,
  useCreateGroupChat,
} from "@/hooks/chat/use-chat"
import { routerNavigate } from "@/lib/router-navigator"

import React, { useEffect, useState } from "react"
import { useParams } from "react-router-dom"

/**
 * Chat Subsystem Main Operational Page.
 * Independent messaging page featuring direct chat, group chat, and multi-entity mentions.
 */
const ChatPage: React.FC = () => {
  const { id: conversationId } = useParams<{ id?: string }>()
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false)

  // Retrieve user conversations & active real-time SSE stream
  const { data: conversations = [], isLoading: isLoadingConversations } = useChatConversations()

  // Active conversation messages & send mutation
  const {
    data: messages = [],
    isLoading: isLoadingMessages,
    sendMessage,
    markAsRead,
  } = useChatMessages(conversationId)

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

  const handleSelectConversation = (id: string) => {
    routerNavigate(`${ROUTES.CHAT.BASE}/${id}`)
  }

  const handleCreateDirect = async (partnerId: string) => {
    const conv = await createDirectMutation.mutateAsync({ partnerId })
    if (conv?.id) {
      routerNavigate(`${ROUTES.CHAT.BASE}/${conv.id}`)
    }
  }

  const handleCreateGroup = async (data: { title: string; participantIds: string[] }) => {
    const conv = await createGroupMutation.mutateAsync(data)
    if (conv?.id) {
      routerNavigate(`${ROUTES.CHAT.BASE}/${conv.id}`)
    }
  }

  return (
    <div className="flex h-[calc(100vh-4.5rem)] rounded-xl border border-border overflow-hidden bg-card shadow-sm m-4">
      {/* Sidebar - Conversation List */}
      <div className="w-80 shrink-0 h-full">
        <ConversationList
          conversations={conversations}
          activeConversationId={conversationId}
          onSelectConversation={handleSelectConversation}
          onOpenNewChatModal={() => setIsNewChatModalOpen(true)}
          isLoading={isLoadingConversations}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 h-full min-w-0">
        <ChatWindow
          conversation={activeConversation}
          messages={messages}
          onSendMessage={async (data) => {
            await sendMessage(data)
          }}
          isLoading={isLoadingMessages}
        />
      </div>

      {/* New Chat Modal */}
      <NewChatModal
        isOpen={isNewChatModalOpen}
        onClose={() => setIsNewChatModalOpen(false)}
        onCreateDirect={handleCreateDirect}
        onCreateGroup={handleCreateGroup}
      />
    </div>
  )
}

export default ChatPage
