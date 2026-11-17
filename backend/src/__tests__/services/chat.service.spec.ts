/// <reference types="jest" />
import { ChatService } from "../../services/chat.service"
import type {
  ChatMessageDto,
  ChatStreamEvent,
  ConversationSummaryDto,
  IChatRepository,
} from "../../types/chat.types"
import type { IEmployeeRepository } from "../../types/employee.types"
import { AppError } from "../../utils/error.util"

const createMessage = (overrides: Partial<ChatMessageDto> = {}): ChatMessageDto => ({
  id: "message-1",
  conversationId: "conversation-1",
  senderId: "employee-1",
  senderName: "Employee One",
  content: "Original text",
  type: "text",
  fileUrl: null,
  fileName: null,
  fileSize: null,
  mentions: null,
  isRecalled: false,
  isPinned: false,
  pinnedAt: null,
  createdAt: new Date("2026-01-01T10:00:00.000Z"),
  updatedAt: new Date("2026-01-01T10:00:00.000Z"),
  ...overrides,
})

const createConversation = (id = "conversation-1"): ConversationSummaryDto => ({
  id,
  type: "direct",
  title: "Conversation",
  unreadCount: 0,
  isPinned: false,
  isMuted: false,
  isRestricted: false,
  lastMessage: null,
  participants: [
    {
      id: "participant-1",
      employeeId: "employee-1",
      fullName: "Employee One",
      username: "employee-one",
      joinedAt: new Date("2026-01-01T09:00:00.000Z"),
      lastReadAt: new Date("2026-01-01T09:00:00.000Z"),
    },
    {
      id: "participant-2",
      employeeId: "employee-2",
      fullName: "Employee Two",
      username: "employee-two",
      joinedAt: new Date("2026-01-01T09:00:00.000Z"),
      lastReadAt: new Date("2026-01-01T09:00:00.000Z"),
    },
  ],
  createdAt: new Date("2026-01-01T09:00:00.000Z"),
  updatedAt: new Date("2026-01-01T10:00:00.000Z"),
})

describe("ChatService message actions", () => {
  it("only lets the sender edit and broadcasts a typed update event", async () => {
    const updatedMessage = createMessage({ content: "Updated text" })
    const repository = {
      findMessageById: jest.fn().mockResolvedValue(createMessage()),
      editMessage: jest.fn().mockResolvedValue(updatedMessage),
      findConversationById: jest.fn().mockResolvedValue(createConversation()),
    } as unknown as IChatRepository
    const service = new ChatService(repository, {} as IEmployeeRepository)
    const received: ChatStreamEvent[] = []
    const unsubscribe = service.subscribeToChatStream("employee-2", (event) => {
      received.push(event)
    })

    try {
      await expect(service.editMessage("message-1", "employee-2", "Unauthorized")).rejects.toThrow(
        AppError,
      )
      expect(repository.editMessage).not.toHaveBeenCalled()

      const result = await service.editMessage("message-1", "employee-1", "  Updated text  ")

      expect(result.content).toBe("Updated text")
      expect(repository.editMessage).toHaveBeenCalledWith("message-1", "employee-1", "Updated text")
      expect(received).toEqual([{ type: "message.updated", message: updatedMessage }])
    } finally {
      unsubscribe()
    }
  })

  it("deduplicates forwarding targets and publishes each forwarded copy", async () => {
    const sourceMessage = createMessage()
    const forwardedMessage = createMessage({
      id: "forwarded-message",
      conversationId: "conversation-2",
    })
    const repository = {
      findMessageById: jest.fn().mockResolvedValue(sourceMessage),
      forwardMessage: jest.fn().mockResolvedValue([forwardedMessage]),
      findConversationById: jest.fn().mockResolvedValue(createConversation("conversation-2")),
    } as unknown as IChatRepository
    const service = new ChatService(repository, {} as IEmployeeRepository)
    const received: ChatStreamEvent[] = []
    const unsubscribe = service.subscribeToChatStream("employee-2", (event) => {
      received.push(event)
    })

    try {
      const result = await service.forwardMessage("message-1", "employee-1", [
        "conversation-2",
        "conversation-2",
      ])

      expect(result).toEqual([forwardedMessage])
      expect(repository.forwardMessage).toHaveBeenCalledWith("message-1", "employee-1", [
        "conversation-2",
      ])
      expect(received).toEqual([{ type: "message.created", message: forwardedMessage }])
    } finally {
      unsubscribe()
    }
  })
})
