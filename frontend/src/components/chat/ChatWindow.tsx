import type { ChatWindowProps } from "@/components/chat/chat-window.types"
import { EmptyState } from "@/components/common/empty-state"
import { Button } from "@/components/ui/button"
import { CONVERSATION_TYPE } from "@/config/entities/chat.config"
import { useChatWindow } from "@/hooks/chat/use-chat-window"
import { useAuthStore } from "@/store/auth-store"

import React from "react"

import { MessageSquare, Users } from "lucide-react"

import { ChatMessageList } from "./ChatMessageList"
import { ChatWindowDialogs } from "./ChatWindowDialogs"
import { ConversationDetailsPanel } from "./ConversationDetailsPanel"
import { MentionInput } from "./MentionInput"

export const ChatWindow: React.FC<ChatWindowProps> = ({
  conversation,
  messages,
  conversations,
  onSendMessage,
  onEditMessage,
  onRecallMessage,
  onSetMessagePinned,
  onForwardMessage,
  onlineEmployeeIds,
  typingEmployeeIds,
  readAtByEmployeeId,
  deliveredMessageIds,
  onTypingChange,
  onLoadPreviousPage,
  hasPreviousPage,
  isLoadingPreviousPage,
  isLoading,
}) => {
  const { user } = useAuthStore()
  const {
    messagesEndRef,
    messagesContainerRef,
    previewImage,
    setPreviewImage,
    isDetailsOpen,
    toggleDetails,
    closeDetails,
    editingMessageId,
    editContent,
    setEditContent,
    cancelEditing,
    saveEditedMessage,
    forwardingMessageId,
    handleForwardDialogChange,
    forwardConversationIds,
    typingNames,
    onlineCount,
    handleMessagesScroll,
    getMessageReceipt,
    startEditingMessage,
    recallMessage,
    startForwardingMessage,
    toggleForwardConversation,
    submitForward,
    setMessagePinned,
  } = useChatWindow({
    conversation,
    messages,
    onlineEmployeeIds,
    typingEmployeeIds,
    readAtByEmployeeId,
    deliveredMessageIds,
    onLoadPreviousPage,
    hasPreviousPage,
    isLoadingPreviousPage,
    onEditMessage,
    onRecallMessage,
    onSetMessagePinned,
    onForwardMessage,
    currentEmployeeId: user?.id,
  })

  return (
    <>
      {!conversation && (
        <EmptyState
          icon={MessageSquare}
          title="Chào mừng đến với phân hệ Tin nhắn"
          description="Trò chuyện trực tiếp 1-1 hoặc theo nhóm. Gõ @ để nhắc nhân viên, # để gắn thẻ dự án, ! để gắn thẻ công việc."
          className="flex-1 bg-muted/10 h-full"
        />
      )}
      {conversation && (
        <>
          <div className="flex-1 flex flex-col h-full bg-background relative overflow-hidden">
            <div className="p-3.5 border-b border-border bg-card flex items-center justify-between gap-3 shrink-0 shadow-xs">
              <Button
                type="button"
                variant="ghost"
                onClick={toggleDetails}
                aria-expanded={isDetailsOpen}
                aria-label="Mở thông tin cuộc trò chuyện"
                className="h-auto min-w-0 justify-start gap-3 p-0 text-left hover:bg-transparent hover:scale-100 active:scale-100"
              >
                {conversation.type === CONVERSATION_TYPE.GROUP ? (
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold">
                    <Users className="w-5 h-5" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                    {conversation.avatarUrl ? (
                      <img
                        src={conversation.avatarUrl}
                        alt={conversation.title}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      conversation.title.charAt(0).toUpperCase()
                    )}
                  </div>
                )}

                <div className="flex flex-col min-w-0">
                  <h3 className="font-semibold text-sm text-foreground truncate">
                    {conversation.title}
                  </h3>
                  <span className="text-[11px] text-muted-foreground truncate">
                    {conversation.type === CONVERSATION_TYPE.GROUP
                      ? `${conversation.participants.length} thành viên · ${onlineCount} đang hoạt động`
                      : onlineCount > 0
                        ? "Đang hoạt động"
                        : "Ngoại tuyến"}
                  </span>
                </div>
              </Button>
            </div>

            <ChatMessageList
              messages={messages}
              currentEmployeeId={user?.id}
              conversationType={conversation.type}
              isLoading={Boolean(isLoading)}
              isLoadingPreviousPage={isLoadingPreviousPage}
              typingNames={typingNames}
              editingMessageId={editingMessageId}
              editContent={editContent}
              messagesContainerRef={messagesContainerRef}
              messagesEndRef={messagesEndRef}
              onMessagesScroll={handleMessagesScroll}
              getMessageReceipt={getMessageReceipt}
              onEditContentChange={setEditContent}
              onCancelEdit={cancelEditing}
              onSaveEdit={saveEditedMessage}
              onStartEdit={startEditingMessage}
              onForward={startForwardingMessage}
              onTogglePin={setMessagePinned}
              onRecall={recallMessage}
              onPreviewImage={setPreviewImage}
            />

            <MentionInput onSendMessage={onSendMessage} onTypingChange={onTypingChange} />

            {isDetailsOpen && (
              <ConversationDetailsPanel conversation={conversation} onClose={closeDetails} />
            )}
          </div>

          <ChatWindowDialogs
            conversations={conversations}
            isForwardDialogOpen={Boolean(forwardingMessageId)}
            selectedConversationIds={forwardConversationIds}
            previewImage={previewImage}
            onForwardDialogChange={handleForwardDialogChange}
            onToggleConversation={toggleForwardConversation}
            onSubmitForward={submitForward}
            onClosePreview={() => setPreviewImage(null)}
          />
        </>
      )}
    </>
  )
}
