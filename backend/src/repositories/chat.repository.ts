import { CONVERSATION_TYPE, type IConversationType } from "@/configs/entities/chat.config.ts"
import { EMPLOYEE_STATUS } from "@/configs/entities/employee.config.ts"
import { BaseRepository } from "@/repositories/base.repository.ts"
import type {
  ChatMessageDto,
  ChatMessageMention,
  ConversationParticipantDto,
  ConversationSummaryDto,
  IChatRepository,
  MentionEmployeeItem,
  MentionProjectItem,
  MentionTaskItem,
  SendMessageDto,
  UpdateParticipantSettingsDto,
} from "@/types/chat.types.ts"

import { Prisma, type PrismaClient } from "@prisma/client"

/**
 * Chat Repository implementation using Prisma ORM.
 * Implements IChatRepository according to Clean Architecture and SOLID standards.
 */
export class PrismaChatRepository extends BaseRepository implements IChatRepository {
  constructor(prisma: PrismaClient) {
    super(prisma)
  }

  /**
   * Retrieves all conversations an employee is participating in,
   * including unread counts and the latest message; recalled payloads are redacted during mapping.
   * Hidden memberships and globally deleted conversations are excluded; pinning is applied before
   * activity-time ordering because pin state belongs to this employee's membership.
   */
  async findConversationsByEmployeeId(employeeId: string): Promise<ConversationSummaryDto[]> {
    const participations = await this.prisma.conversationParticipant.findMany({
      where: {
        employeeId,
        isDeleted: false,
        conversation: {
          deletedAt: null,
        },
      },
      include: {
        conversation: {
          include: {
            participants: {
              where: { isDeleted: false },
              include: {
                employee: {
                  select: {
                    id: true,
                    fullName: true,
                    username: true,
                    avatarUrl: true,
                  },
                },
              },
            },
            messages: {
              orderBy: { createdAt: "desc" },
              take: 1,
              include: {
                sender: {
                  select: {
                    id: true,
                    fullName: true,
                    username: true,
                    avatarUrl: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        conversation: {
          updatedAt: "desc",
        },
      },
    })

    if (participations.length === 0) return []

    const unreadCounts = await this.prisma.$queryRaw<
      Array<{ conversationId: string; unreadCount: bigint }>
    >(Prisma.sql`
      SELECT participant."conversationId", COUNT(message."id") AS "unreadCount"
      FROM "ConversationParticipant" AS participant
      INNER JOIN "Conversation" AS conversation
        ON conversation."id" = participant."conversationId"
        AND conversation."deletedAt" IS NULL
      LEFT JOIN "ChatMessage" AS message
        ON message."conversationId" = participant."conversationId"
        AND message."createdAt" > participant."lastReadAt"
        AND message."senderId" <> ${employeeId}
        AND message."deletedAt" IS NULL
      WHERE participant."employeeId" = ${employeeId}
        AND participant."isDeleted" = false
      GROUP BY participant."conversationId"
    `)
    const unreadCountByConversation = new Map(
      unreadCounts.map(({ conversationId, unreadCount }) => [conversationId, Number(unreadCount)]),
    )

    const summaries = participations.map((item) => {
      const conv = item.conversation
      const lastMsg = conv.messages[0]
      const unreadCount = unreadCountByConversation.get(conv.id) ?? 0
      return this.mapToConversationSummary(conv, employeeId, unreadCount, lastMsg)
    })

    // Pinned conversations stay at the very top, followed by most recent activity
    summaries.sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })

    return summaries
  }

  /**
   * Finds a conversation by ID if the employee is an authorized participant.
   * Including the employee ID in the query makes the membership check part of the database read,
   * rather than relying on callers to filter a conversation after loading it.
   */
  async findConversationById(
    conversationId: string,
    employeeId: string,
  ): Promise<ConversationSummaryDto | null> {
    const conv = await this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        deletedAt: null,
        participants: {
          some: { employeeId, isDeleted: false },
        },
      },
      include: {
        participants: {
          where: { isDeleted: false },
          include: {
            employee: {
              select: {
                id: true,
                fullName: true,
                username: true,
                avatarUrl: true,
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            sender: {
              select: {
                id: true,
                fullName: true,
                username: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    })

    if (!conv) return null

    const participant = conv.participants.find((p) => p.employeeId === employeeId)
    const lastReadAt = participant?.lastReadAt ?? new Date(0)

    const unreadCount = await this.prisma.chatMessage.count({
      where: {
        conversationId: conv.id,
        createdAt: { gt: lastReadAt },
        senderId: { not: employeeId },
        deletedAt: null,
      },
    })

    return this.mapToConversationSummary(conv, employeeId, unreadCount, conv.messages[0])
  }

  /**
   * Finds an existing direct conversation between two employees.
   */
  async findDirectConversationBetween(
    employeeId1: string,
    employeeId2: string,
  ): Promise<ConversationSummaryDto | null> {
    const conv = await this.prisma.conversation.findFirst({
      where: {
        type: CONVERSATION_TYPE.DIRECT,
        deletedAt: null,
        AND: [
          { participants: { some: { employeeId: employeeId1 } } },
          { participants: { some: { employeeId: employeeId2 } } },
        ],
      },
      include: {
        participants: {
          include: {
            employee: {
              select: {
                id: true,
                fullName: true,
                username: true,
                avatarUrl: true,
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            sender: {
              select: {
                id: true,
                fullName: true,
                username: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    })

    if (!conv) return null

    return this.mapToConversationSummary(conv, employeeId1, 0, conv.messages[0])
  }

  /**
   * Creates a new conversation and its initial memberships in one database transaction.
   * Duplicate participant IDs are collapsed before writing to satisfy the unique membership key.
   */
  async createConversation(data: {
    type: IConversationType
    title?: string
    avatarUrl?: string
    creatorId: string
    participantIds: string[]
  }): Promise<ConversationSummaryDto> {
    const uniqueParticipantIds = Array.from(new Set(data.participantIds))

    const created = await this.prisma.$transaction(async (tx) => {
      if (data.type === CONVERSATION_TYPE.DIRECT && uniqueParticipantIds.length === 2) {
        const sortedIds = [...uniqueParticipantIds].sort()
        const lockKey = sortedIds.join(":")
        await tx.$queryRaw(Prisma.sql`
          SELECT pg_advisory_xact_lock(hashtext(${lockKey}))
        `)

        const existing = await tx.conversation.findFirst({
          where: {
            type: CONVERSATION_TYPE.DIRECT,
            deletedAt: null,
            AND: [
              { participants: { some: { employeeId: sortedIds[0] } } },
              { participants: { some: { employeeId: sortedIds[1] } } },
            ],
          },
          include: {
            participants: {
              include: {
                employee: {
                  select: { id: true, fullName: true, username: true, avatarUrl: true },
                },
              },
            },
          },
        })

        if (existing) {
          for (const employeeId of uniqueParticipantIds) {
            await tx.conversationParticipant.updateMany({
              where: { conversationId: existing.id, employeeId },
              data: { isDeleted: false, joinedAt: new Date(), lastReadAt: new Date() },
            })
          }
          return existing
        }
      }

      const conv = await tx.conversation.create({
        data: {
          type: data.type,
          title: data.title,
          avatarUrl: data.avatarUrl,
          creatorId: data.creatorId,
          participants: {
            create: uniqueParticipantIds.map((empId) => ({
              employeeId: empId,
            })),
          },
        },
        include: {
          participants: {
            include: {
              employee: {
                select: {
                  id: true,
                  fullName: true,
                  username: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      })

      return conv
    })

    return this.mapToConversationSummary(created, data.creatorId, 0, undefined)
  }

  /**
   * Fast existence check for participant membership.
   */
  async isParticipant(conversationId: string, employeeId: string): Promise<boolean> {
    const count = await this.prisma.conversationParticipant.count({
      where: {
        conversationId,
        employeeId,
        isDeleted: false,
      },
    })
    return count > 0
  }

  /**
   * Add members in a transaction, reactivating a prior hidden membership when the unique pair exists.
   */
  async addParticipants(conversationId: string, participantIds: string[]): Promise<void> {
    // Upsert reactivates a soft-deleted membership row instead of creating a duplicate unique key.
    await this.prisma.$transaction(async (tx) => {
      for (const employeeId of participantIds) {
        await tx.conversationParticipant.upsert({
          where: {
            conversationId_employeeId: { conversationId, employeeId },
          },
          update: {
            isDeleted: false,
            joinedAt: new Date(),
            lastReadAt: new Date(),
          },
          create: {
            conversationId,
            employeeId,
          },
        })
      }
    })
  }

  /**
   * Retrieves message history, including recalled placeholders, and returns it chronologically.
   * The cursor is resolved to a timestamp boundary; optional text search is applied in the same query.
   */
  async findMessages(
    conversationId: string,
    options: { limit: number; beforeCursor?: string; searchQuery?: string },
  ): Promise<ChatMessageDto[]> {
    const where: Prisma.ChatMessageWhereInput = {
      conversationId,
    }

    if (options.beforeCursor) {
      // Use a composite timestamp/ID boundary so messages sharing a timestamp are not skipped.
      const cursorMessage = await this.prisma.chatMessage.findUnique({
        where: { id: options.beforeCursor },
        select: { id: true, createdAt: true },
      })
      if (cursorMessage) {
        where.OR = [
          { createdAt: { lt: cursorMessage.createdAt } },
          { createdAt: cursorMessage.createdAt, id: { lt: cursorMessage.id } },
        ]
      }
    }

    if (options.searchQuery) {
      where.deletedAt = null
      where.content = { contains: options.searchQuery, mode: "insensitive" }
    }

    const messages = await this.prisma.chatMessage.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: options.limit,
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    })

    // Return in chronological order (oldest to newest)
    return messages.reverse().map((msg) => this.mapToChatMessageDto(msg))
  }

  /**
   * Persist the message and update conversation activity plus the sender's read watermark atomically.
   * Keeping these writes together prevents the list preview and unread count from diverging.
   */
  async createMessage(
    conversationId: string,
    senderId: string,
    data: SendMessageDto,
  ): Promise<ChatMessageDto> {
    const result = await this.prisma.$transaction(async (tx) => {
      const message = await tx.chatMessage.create({
        data: {
          conversationId,
          senderId,
          content: data.content,
          type: data.type ?? "text",
          fileUrl: data.fileUrl,
          fileName: data.fileName,
          fileSize: data.fileSize,
          mentions: (data.mentions as unknown as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        },
        include: {
          sender: {
            select: {
              id: true,
              fullName: true,
              username: true,
              avatarUrl: true,
            },
          },
        },
      })

      // Update parent conversation timestamp so it floats to top
      await tx.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      })

      // Update sender's last read timestamp automatically
      await tx.conversationParticipant.updateMany({
        where: { conversationId, employeeId: senderId },
        data: { lastReadAt: new Date(), isDeleted: false },
      })

      return message
    })

    return this.mapToChatMessageDto(result)
  }

  /** Find a message through an active conversation membership, including recalled tombstones. */
  async findMessageById(messageId: string, employeeId: string): Promise<ChatMessageDto | null> {
    const message = await this.prisma.chatMessage.findFirst({
      where: {
        id: messageId,
        conversation: {
          deletedAt: null,
          participants: { some: { employeeId, isDeleted: false } },
        },
      },
      include: {
        sender: {
          select: { id: true, fullName: true, username: true, avatarUrl: true },
        },
      },
    })

    return message ? this.mapToChatMessageDto(message) : null
  }

  /** Update text only when the caller owns a visible, non-recalled message. */
  async editMessage(
    messageId: string,
    senderId: string,
    content: string,
  ): Promise<ChatMessageDto | null> {
    const result = await this.prisma.chatMessage.updateMany({
      where: {
        id: messageId,
        senderId,
        deletedAt: null,
        conversation: {
          deletedAt: null,
          participants: { some: { employeeId: senderId, isDeleted: false } },
        },
      },
      data: { content },
    })
    if (!result.count) return null

    return this.findMessageById(messageId, senderId)
  }

  /** Soft-recall a sender-owned message for every participant. */
  async recallMessage(messageId: string, senderId: string): Promise<ChatMessageDto | null> {
    const result = await this.prisma.chatMessage.updateMany({
      where: {
        id: messageId,
        senderId,
        deletedAt: null,
        conversation: {
          deletedAt: null,
          participants: { some: { employeeId: senderId, isDeleted: false } },
        },
      },
      data: { deletedAt: new Date() },
    })
    if (!result.count) return null

    return this.findMessageById(messageId, senderId)
  }

  /** Change the shared pin state for an active message in an accessible conversation. */
  async setMessagePinned(
    messageId: string,
    employeeId: string,
    isPinned: boolean,
  ): Promise<ChatMessageDto | null> {
    const result = await this.prisma.chatMessage.updateMany({
      where: {
        id: messageId,
        deletedAt: null,
        conversation: {
          deletedAt: null,
          participants: { some: { employeeId, isDeleted: false } },
        },
      },
      data: { isPinned, pinnedAt: isPinned ? new Date() : null },
    })
    if (!result.count) return null

    return this.findMessageById(messageId, employeeId)
  }

  /**
   * Copy one active source message into all requested destinations in a single transaction.
   * Source visibility and destination memberships are rechecked before any copies are committed.
   */
  async forwardMessage(
    messageId: string,
    senderId: string,
    conversationIds: string[],
  ): Promise<ChatMessageDto[] | null> {
    return this.prisma.$transaction(async (tx) => {
      const source = await tx.chatMessage.findFirst({
        where: {
          id: messageId,
          deletedAt: null,
          conversation: {
            deletedAt: null,
            participants: { some: { employeeId: senderId, isDeleted: false } },
          },
        },
      })
      if (!source) return null

      const accessibleTargets = await tx.conversation.findMany({
        where: {
          id: { in: conversationIds },
          deletedAt: null,
          participants: { some: { employeeId: senderId, isDeleted: false } },
        },
        select: { id: true },
      })
      if (accessibleTargets.length !== conversationIds.length) return null

      const forwardedMessages: ChatMessageDto[] = []
      for (const conversationId of conversationIds) {
        const message = await tx.chatMessage.create({
          data: {
            conversationId,
            senderId,
            content: source.content,
            type: source.type,
            fileUrl: source.fileUrl,
            fileName: source.fileName,
            fileSize: source.fileSize,
            mentions:
              source.mentions === null
                ? Prisma.JsonNull
                : (source.mentions as Prisma.InputJsonValue),
          },
          include: {
            sender: {
              select: { id: true, fullName: true, username: true, avatarUrl: true },
            },
          },
        })

        await tx.conversation.update({
          where: { id: conversationId },
          data: { updatedAt: new Date() },
        })
        await tx.conversationParticipant.updateMany({
          where: { conversationId, employeeId: senderId, isDeleted: false },
          data: { lastReadAt: new Date() },
        })
        forwardedMessages.push(this.mapToChatMessageDto(message))
      }

      return forwardedMessages
    })
  }

  /**
   * Updates participant's lastReadAt timestamp.
   */
  async updateLastRead(conversationId: string, employeeId: string): Promise<void> {
    await this.prisma.conversationParticipant.updateMany({
      where: {
        conversationId,
        employeeId,
        isDeleted: false,
      },
      data: {
        lastReadAt: new Date(),
      },
    })
  }

  /**
   * Mentions Autocomplete: Search employees (@)
   */
  async searchEmployeesForMention(query: string, limit = 10): Promise<MentionEmployeeItem[]> {
    const employees = await this.prisma.employee.findMany({
      where: {
        status: EMPLOYEE_STATUS.ACTIVE,
        deletedAt: null,
        OR: [
          { fullName: { contains: query, mode: "insensitive" } },
          { username: { contains: query, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        fullName: true,
        username: true,
        avatarUrl: true,
        position: true,
      },
      take: limit,
      orderBy: { fullName: "asc" },
    })

    return employees
  }

  /**
   * Mentions Autocomplete: Search projects (#)
   */
  async searchProjectsForMention(query: string, limit = 10): Promise<MentionProjectItem[]> {
    const projects = await this.prisma.project.findMany({
      where: {
        name: { contains: query, mode: "insensitive" },
      },
      select: {
        id: true,
        name: true,
        status: true,
        techStack: true,
      },
      take: limit,
      orderBy: { updatedAt: "desc" },
    })

    return projects.map((p) => ({
      id: p.id,
      name: p.name,
      status: p.status,
      techStack: p.techStack,
    }))
  }

  /**
   * Mentions Autocomplete: Search tasks (!)
   */
  async searchTasksForMention(
    query: string,
    limit = 10,
    projectId?: string,
  ): Promise<MentionTaskItem[]> {
    const where: Prisma.TaskWhereInput = {
      title: { contains: query, mode: "insensitive" },
    }

    if (projectId) {
      where.projectId = projectId
    }

    const tasks = await this.prisma.task.findMany({
      where,
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        projectId: true,
        project: {
          select: {
            name: true,
          },
        },
      },
      take: limit,
      orderBy: { updatedAt: "desc" },
    })

    return tasks.map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      projectId: t.projectId,
      projectName: t.project?.name,
    }))
  }

  /** Convert a Prisma message record and its selected sender fields into the service DTO. */
  private mapToChatMessageDto(raw: {
    id: string
    conversationId: string
    senderId: string
    content: string
    type: string
    fileUrl: string | null
    fileName: string | null
    fileSize: number | null
    mentions: unknown
    deletedAt: Date | null
    isPinned: boolean
    pinnedAt: Date | null
    createdAt: Date
    updatedAt: Date
    sender: {
      id: string
      fullName: string
      username: string
      avatarUrl: string | null
    }
  }): ChatMessageDto {
    const isRecalled = raw.deletedAt !== null

    return {
      id: raw.id,
      conversationId: raw.conversationId,
      senderId: raw.senderId,
      senderName: raw.sender.fullName,
      senderAvatar: raw.sender.avatarUrl,
      content: isRecalled ? "" : raw.content,
      type: raw.type as ChatMessageDto["type"],
      fileUrl: isRecalled ? null : raw.fileUrl,
      fileName: isRecalled ? null : raw.fileName,
      fileSize: isRecalled ? null : raw.fileSize,
      mentions: isRecalled ? null : ((raw.mentions as ChatMessageMention[] | null) ?? null),
      isRecalled,
      isPinned: isRecalled ? false : raw.isPinned,
      pinnedAt: isRecalled ? null : raw.pinnedAt,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    }
  }

  /**
   * Build a viewer-specific conversation DTO.
   * Direct conversations derive their title/avatar from the other participant; preference flags
   * are copied only from the current employee's membership.
   */
  private mapToConversationSummary(
    conv: {
      id: string
      type: string
      title: string | null
      avatarUrl: string | null
      createdAt: Date
      updatedAt: Date
      participants: Array<{
        id: string
        employeeId: string
        joinedAt: Date
        lastReadAt: Date
        isPinned?: boolean
        isMuted?: boolean
        isRestricted?: boolean
        isDeleted?: boolean
        employee: {
          id: string
          fullName: string
          username: string
          avatarUrl: string | null
        }
      }>
    },
    currentEmployeeId: string,
    unreadCount: number,
    lastMsgRaw?: {
      id: string
      conversationId: string
      senderId: string
      content: string
      type: string
      fileUrl: string | null
      fileName: string | null
      fileSize: number | null
      mentions: unknown
      deletedAt: Date | null
      isPinned: boolean
      pinnedAt: Date | null
      createdAt: Date
      updatedAt: Date
      sender: {
        id: string
        fullName: string
        username: string
        avatarUrl: string | null
      }
    },
  ): ConversationSummaryDto {
    const participants: ConversationParticipantDto[] = conv.participants.map((p) => ({
      id: p.id,
      employeeId: p.employeeId,
      fullName: p.employee.fullName,
      username: p.employee.username,
      avatarUrl: p.employee.avatarUrl,
      joinedAt: p.joinedAt,
      lastReadAt: p.lastReadAt,
    }))

    // For direct chat, default title to partner's fullName and partner's avatar
    let title = conv.title ?? "Cuộc trò chuyện"
    let avatarUrl: string | null = conv.avatarUrl

    if (conv.type === CONVERSATION_TYPE.DIRECT) {
      const partner = participants.find((p) => p.employeeId !== currentEmployeeId)
      if (partner) {
        title = partner.fullName
        avatarUrl = partner.avatarUrl ?? null
      }
    }

    const currentMember = conv.participants.find((p) => p.employeeId === currentEmployeeId)
    const isPinned = currentMember?.isPinned ?? false
    const isMuted = currentMember?.isMuted ?? false
    const isRestricted = currentMember?.isRestricted ?? false

    return {
      id: conv.id,
      type: conv.type as IConversationType,
      title,
      avatarUrl,
      unreadCount,
      isPinned,
      isMuted,
      isRestricted,
      lastMessage: lastMsgRaw ? this.mapToChatMessageDto(lastMsgRaw) : null,
      participants,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
    }
  }

  /**
   * Updates participant preferences (Pin, Mute, Restrict)
   */
  async updateParticipantSettings(
    conversationId: string,
    employeeId: string,
    settings: UpdateParticipantSettingsDto,
  ): Promise<void> {
    await this.prisma.conversationParticipant.updateMany({
      where: { conversationId, employeeId },
      data: settings,
    })
  }

  /**
   * Soft deletes / hides a conversation for an employee
   */
  async deleteConversationForEmployee(conversationId: string, employeeId: string): Promise<void> {
    await this.prisma.conversationParticipant.updateMany({
      where: { conversationId, employeeId },
      data: { isDeleted: true },
    })
  }
}
