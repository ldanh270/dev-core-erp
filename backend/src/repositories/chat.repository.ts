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
   * including unread message count and the latest non-deleted message.
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
              where: { deletedAt: null },
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

    const summaries: ConversationSummaryDto[] = []

    for (const item of participations) {
      const conv = item.conversation
      const lastMsg = conv.messages[0]

      // Count unread messages created after participant's lastReadAt
      const unreadCount = await this.prisma.chatMessage.count({
        where: {
          conversationId: conv.id,
          createdAt: { gt: item.lastReadAt },
          senderId: { not: employeeId },
          deletedAt: null,
        },
      })

      summaries.push(this.mapToConversationSummary(conv, employeeId, unreadCount, lastMsg))
    }

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
          where: { deletedAt: null },
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
          { participants: { some: { employeeId: employeeId1, isDeleted: false } } },
          { participants: { some: { employeeId: employeeId2, isDeleted: false } } },
        ],
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
          where: { deletedAt: null },
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
   * Retrieves a page of visible messages and returns it in chronological display order.
   * The cursor is resolved to a timestamp boundary; optional text search is applied in the same query.
   */
  async findMessages(
    conversationId: string,
    options: { limit: number; beforeCursor?: string; searchQuery?: string },
  ): Promise<ChatMessageDto[]> {
    const where: Prisma.ChatMessageWhereInput = {
      conversationId,
      deletedAt: null,
    }

    if (options.beforeCursor) {
      // The API accepts a message ID; use its timestamp as the boundary for descending pagination.
      const cursorMessage = await this.prisma.chatMessage.findUnique({
        where: { id: options.beforeCursor },
        select: { createdAt: true },
      })
      if (cursorMessage) {
        where.createdAt = { lt: cursorMessage.createdAt }
      }
    }

    if (options.searchQuery) {
      where.content = { contains: options.searchQuery, mode: "insensitive" }
    }

    const messages = await this.prisma.chatMessage.findMany({
      where,
      orderBy: { createdAt: "desc" },
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
        data: { lastReadAt: new Date() },
      })

      return message
    })

    return this.mapToChatMessageDto(result)
  }

  /**
   * Updates participant's lastReadAt timestamp.
   */
  async updateLastRead(conversationId: string, employeeId: string): Promise<void> {
    await this.prisma.conversationParticipant.updateMany({
      where: {
        conversationId,
        employeeId,
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

  // =========================================================================
  // Private Helper Mappings
  // =========================================================================

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
    createdAt: Date
    updatedAt: Date
    sender: {
      id: string
      fullName: string
      username: string
      avatarUrl: string | null
    }
  }): ChatMessageDto {
    return {
      id: raw.id,
      conversationId: raw.conversationId,
      senderId: raw.senderId,
      senderName: raw.sender.fullName,
      senderAvatar: raw.sender.avatarUrl,
      content: raw.content,
      type: raw.type as ChatMessageDto["type"],
      fileUrl: raw.fileUrl,
      fileName: raw.fileName,
      fileSize: raw.fileSize,
      mentions: (raw.mentions as ChatMessageMention[] | null) ?? null,
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
