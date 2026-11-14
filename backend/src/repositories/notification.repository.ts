import { NOTIFICATION_AUDIENCE } from "@/configs/entities/notification-audience.config.ts"
import {
  NOTIFICATION_PAGINATION,
  NOTIFICATION_PRIORITY,
  NOTIFICATION_TYPE,
} from "@/configs/entities/notification.config.ts"
import type {
  CreateNotificationDto,
  INotificationRepository,
  Notification,
  NotificationQuery,
  PaginatedNotifications,
} from "@/types/notification.types.ts"

import { Prisma, type PrismaClient } from "@prisma/client"
import { z } from "zod"

/**
 * Prisma notification record including recipient states for domain mapping.
 */
type StoredNotification = Prisma.NotificationGetPayload<{
  include: { states: true }
}>

/**
 * Prisma repository implementing notification persistence and recipient-specific state.
 * Keeps database queries separate from notification business logic.
 */
export class PrismaNotificationRepository implements INotificationRepository {
  /**
   * Injects the Prisma client used for notification queries and transactions.
   */
  constructor(private readonly db: PrismaClient) {
    // Use the injected Prisma client without creating seed data.
  }

  /**
   * Builds the visibility filter for personal and broadcast notifications.
   */
  private visibleWhere(employeeId: string): Prisma.NotificationWhereInput {
    // Include personal and broadcast notifications that this employee has not deleted.
    return {
      OR: [{ employeeId }, { employeeId: null }],
      states: {
        none: {
          employeeId,
          deleted: true,
        },
      },
    }
  }

  /**
   * Maps a stored notification and the requesting employee's state into the domain model.
   */
  private toDomain(row: StoredNotification): Notification {
    // Queries include only the requesting employee's recipient state.
    // Missing state means the employee has not interacted with the notification.
    const state = row.states.length > 0 ? row.states[0] : undefined

    return {
      id: row.id,
      employeeId: row.employeeId ?? NOTIFICATION_AUDIENCE.ALL,
      title: row.title,
      message: row.message,
      type: z.enum(NOTIFICATION_TYPE).parse(row.type),
      priority: z.enum(NOTIFICATION_PRIORITY).parse(row.priority),
      read: state?.read ?? false,
      link: row.link,
      metadata: z.record(z.string(), z.unknown()).nullable().parse(row.metadata),
      createdAt: row.createdAt,
      updatedAt: state?.updatedAt ?? row.updatedAt,
    }
  }

  /**
   * Finds a notification with recipient state, returning null if missing or personally deleted.
   */
  async findById(id: string, employeeId: string): Promise<Notification | null> {
    // Load the notification with the requesting employee's state.
    // The service verifies audience access before returning the result.
    const row = await this.db.notification.findUnique({
      where: { id },
      include: {
        states: {
          where: { employeeId },
        },
      },
    })

    if (!row || row.states.some((state) => state.deleted)) {
      return null
    }

    return this.toDomain(row)
  }

  /**
   * Retrieves a filtered page and consistent totals using a repeatable-read transaction.
   */
  async findByEmployeeId(
    employeeId: string,
    query?: NotificationQuery,
  ): Promise<PaginatedNotifications> {
    // Clamp pagination values to the configured limits.
    const page = Math.max(1, query?.page ?? NOTIFICATION_PAGINATION.DEFAULT_PAGE)

    const limit = Math.min(
      NOTIFICATION_PAGINATION.MAX_LIMIT,
      Math.max(1, query?.limit ?? NOTIFICATION_PAGINATION.DEFAULT_LIMIT),
    )

    // Count unread notifications independently of list filters and pagination.
    const unreadWhere: Prisma.NotificationWhereInput = {
      AND: [
        this.visibleWhere(employeeId),
        {
          states: {
            none: {
              employeeId,
              read: true,
            },
          },
        },
      ],
    }

    // Add only defined filters to avoid passing undefined values to Prisma.
    const where: Prisma.NotificationWhereInput = {
      AND: [
        this.visibleWhere(employeeId),
        {
          ...(query?.type === undefined ? {} : { type: query.type }),
          ...(query?.read === undefined
            ? {}
            : {
                states: query.read
                  ? {
                      some: {
                        employeeId,
                        read: true,
                      },
                    }
                  : {
                      none: {
                        employeeId,
                        read: true,
                      },
                    },
              }),
        },
      ],
    }

    // Read the list and counts from the same snapshot for consistent pagination.
    // Use the ID as a secondary sort key when creation timestamps match.
    const [rows, total, unreadCount] = await this.db.$transaction(
      [
        this.db.notification.findMany({
          where,
          include: {
            states: {
              where: { employeeId },
            },
          },
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          skip: (page - 1) * limit,
          take: limit,
        }),
        this.db.notification.count({ where }),
        this.db.notification.count({ where: unreadWhere }),
      ],
      {
        isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
      },
    )

    return {
      notifications: rows.map((row) => this.toDomain(row)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      unreadCount,
    }
  }

  /**
   * Creates a notification with configured defaults and maps broadcast audiences to null.
   */
  async create(data: CreateNotificationDto): Promise<Notification> {
    // Persist before the service publishes SSE delivery events.
    // Store broadcast notifications with a null employeeId.
    const row = await this.db.notification.create({
      data: {
        employeeId: data.employeeId === NOTIFICATION_AUDIENCE.ALL ? null : data.employeeId,
        title: data.title,
        message: data.message,
        type: data.type ?? NOTIFICATION_TYPE.INFO,
        priority: data.priority ?? NOTIFICATION_PRIORITY.MEDIUM,
        link: data.link ?? null,
        metadata:
          data.metadata === undefined || data.metadata === null
            ? Prisma.DbNull
            : z.record(z.string(), z.json()).parse(data.metadata),
      },
      include: { states: true },
    })

    return this.toDomain(row)
  }

  /**
   * Marks a visible notification as read by upserting the employee's recipient state.
   */
  async markAsRead(id: string, employeeId: string): Promise<Notification | null> {
    // Verify visibility before updating recipient-specific state.
    return this.db.$transaction(async (tx) => {
      const row = await tx.notification.findFirst({
        where: {
          id,
          ...this.visibleWhere(employeeId),
        },
      })

      if (!row) {
        return null
      }

      const state = await tx.notificationRecipientState.upsert({
        where: {
          notificationId_employeeId: {
            notificationId: id,
            employeeId,
          },
        },
        create: {
          notificationId: id,
          employeeId,
          read: true,
        },
        update: {
          read: true,
        },
      })

      // Do not return a notification deleted by this recipient during the update.
      if (state.deleted) {
        return null
      }

      return this.toDomain({
        ...row,
        states: [state],
      })
    })
  }

  /**
   * Marks all visible unread notifications as read within a transaction.
   */
  async markAllAsRead(employeeId: string): Promise<number> {
    // Select only unread notifications that remain visible to this recipient.
    return this.db.$transaction(async (tx) => {
      const rows = await tx.notification.findMany({
        where: {
          AND: [
            this.visibleWhere(employeeId),
            {
              states: {
                none: {
                  employeeId,
                  read: true,
                },
              },
            },
          ],
        },
        select: { id: true },
      })

      if (rows.length === 0) {
        return 0
      }

      // Create read states for notifications without an existing recipient state.
      const created = await tx.notificationRecipientState.createMany({
        data: rows.map(({ id }) => ({
          notificationId: id,
          employeeId,
          read: true,
        })),
        skipDuplicates: true,
      })

      // Update existing unread states.
      // Exclude deleted states to avoid restoring hidden notifications.
      const updated = await tx.notificationRecipientState.updateMany({
        where: {
          employeeId,
          notificationId: {
            in: rows.map(({ id }) => id),
          },
          read: false,
          deleted: false,
        },
        data: {
          read: true,
        },
      })

      return created.count + updated.count
    })
  }

  /**
   * Soft-deletes a visible notification for one employee without affecting other recipients.
   */
  async delete(id: string, employeeId: string): Promise<boolean> {
    // Hide the notification only for the requesting employee.
    // Preserve the notification and personal state of other recipients.
    return this.db.$transaction(async (tx) => {
      const row = await tx.notification.findFirst({
        where: {
          id,
          ...this.visibleWhere(employeeId),
        },
      })

      if (!row) {
        return false
      }

      await tx.notificationRecipientState.upsert({
        where: {
          notificationId_employeeId: {
            notificationId: id,
            employeeId,
          },
        },
        create: {
          notificationId: id,
          employeeId,
          deleted: true,
        },
        update: {
          deleted: true,
        },
      })

      return true
    })
  }

  /**
   * Counts visible unread notifications for the requesting employee.
   */
  async getUnreadCount(employeeId: string): Promise<number> {
    // Count notifications that this employee has neither read nor deleted.
    return this.db.notification.count({
      where: {
        AND: [
          this.visibleWhere(employeeId),
          {
            states: {
              none: {
                employeeId,
                read: true,
              },
            },
          },
        ],
      },
    })
  }
}
