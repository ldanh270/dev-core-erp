/// <reference types="jest" />
import { eventBus } from "../../libs/event-bus"
import type { DomainEvents } from "../../libs/event-bus"
import { ChatService } from "../../services/chat.service"
import type {
  ChatMessageDto,
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
    const editMessage = jest.fn().mockResolvedValue(updatedMessage)
    const repository = {
      findMessageById: jest.fn().mockResolvedValue(createMessage()),
      editMessage,
      findConversationById: jest.fn().mockResolvedValue(createConversation()),
    } as unknown as IChatRepository
    const service = new ChatService(repository, {} as IEmployeeRepository)
    const received: DomainEvents["chat:message"][] = []
    const listener = (payload: DomainEvents["chat:message"]) => {
      received.push(payload)
    }
    eventBus.onTyped("chat:message", listener)

    try {
      await expect(service.editMessage("message-1", "employee-2", "Unauthorized")).rejects.toThrow(
        AppError,
      )
      expect(editMessage).not.toHaveBeenCalled()

      const result = await service.editMessage("message-1", "employee-1", "  Updated text  ")

      expect(result.content).toBe("Updated text")
      expect(editMessage).toHaveBeenCalledWith("message-1", "employee-1", "Updated text")
      expect(received).toEqual([
        {
          recipientEmployeeId: "employee-1",
          event: { type: "message.updated", message: updatedMessage },
        },
        {
          recipientEmployeeId: "employee-2",
          event: { type: "message.updated", message: updatedMessage },
        },
      ])
    } finally {
      eventBus.offTyped("chat:message", listener)
    }
  })

  it("deduplicates forwarding targets and publishes each forwarded copy", async () => {
    const sourceMessage = createMessage()
    const forwardedMessage = createMessage({
      id: "forwarded-message",
      conversationId: "conversation-2",
    })
    const forwardMessage = jest.fn().mockResolvedValue([forwardedMessage])
    const repository = {
      findMessageById: jest.fn().mockResolvedValue(sourceMessage),
      forwardMessage,
      findConversationById: jest.fn().mockResolvedValue(createConversation("conversation-2")),
    } as unknown as IChatRepository
    const service = new ChatService(repository, {} as IEmployeeRepository)
    const received: DomainEvents["chat:message"][] = []
    const listener = (payload: DomainEvents["chat:message"]) => {
      received.push(payload)
    }
    eventBus.onTyped("chat:message", listener)

    try {
      const result = await service.forwardMessage("message-1", "employee-1", [
        "conversation-2",
        "conversation-2",
      ])

      expect(result).toEqual([forwardedMessage])
      expect(forwardMessage).toHaveBeenCalledWith("message-1", "employee-1", ["conversation-2"])
      expect(received).toEqual([
        {
          recipientEmployeeId: "employee-1",
          event: { type: "message.created", message: forwardedMessage },
        },
        {
          recipientEmployeeId: "employee-2",
          event: { type: "message.created", message: forwardedMessage },
        },
      ])
    } finally {
      eventBus.offTyped("chat:message", listener)
    }
  })

  it("reactivates both members before returning an existing direct conversation", async () => {
    const existing = createConversation()
    const partner = {
      id: "employee-2",
      status: "active",
      fullName: "Employee Two",
      username: "employee-two",
    }
    const addParticipants = jest.fn().mockResolvedValue(undefined)
    const findConversationById = jest.fn().mockResolvedValue(existing)
    const repository = {
      findById: undefined,
      findDirectConversationBetween: jest.fn().mockResolvedValue(existing),
      addParticipants,
      findConversationById,
    } as unknown as IChatRepository
    const employeeRepository = {
      findById: jest.fn().mockResolvedValue(partner),
    } as unknown as IEmployeeRepository
    const service = new ChatService(repository, employeeRepository)

    const result = await service.getOrCreateDirectConversation("employee-1", "employee-2")

    expect(result).toEqual(existing)
    expect(addParticipants).toHaveBeenCalledWith("conversation-1", ["employee-1", "employee-2"])
  })
})
