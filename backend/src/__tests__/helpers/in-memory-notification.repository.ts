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

import { randomUUID } from "node:crypto"

/**
 * Personal read and deletion state tracked for a notification recipient.
 */
type RecipientState = {
  read: boolean
  deleted: boolean
  updatedAt: Date
}

/**
 * In-memory notification repository used only for isolated unit tests.
 * Implements the persistence contract without accessing the application database.
 */
export class InMemoryNotificationRepository implements INotificationRepository {
  private readonly items = new Map<string, Notification>()
  private readonly states = new Map<string, RecipientState>()

  /**
   * Generates the storage key for a notification and employee pair.
   */
  private key(id: string, employeeId: string): string {
    // Build a distinct key for each notification and recipient pair.
    return JSON.stringify([id, employeeId])
  }

  /**
   * Checks audience membership and excludes notifications deleted by this employee.
   */
  private canView(item: Notification, employeeId: string): boolean {
    // Check the notification audience and recipient-specific deletion state.
    return (
      (item.employeeId === employeeId || item.employeeId === NOTIFICATION_AUDIENCE.ALL) &&
      !this.states.get(this.key(item.id, employeeId))?.deleted
    )
  }

  /**
   * Returns a notification with personal state, or null when missing or personally deleted.
   */
  async findById(id: string, employeeId: string): Promise<Notification | null> {
    // Merge the viewer's state; audience authorization remains the service's responsibility.
    const item = this.items.get(id)
    const state = this.states.get(this.key(id, employeeId))

    return !item || state?.deleted
      ? null
      : {
          ...item,
          read: state?.read ?? false,
          updatedAt: state?.updatedAt ?? item.updatedAt,
        }
  }

  /**
   * Simulates recipient visibility, filtering, sorting, and pagination in memory.
   */
  async findByEmployeeId(
    employeeId: string,
    query?: NotificationQuery,
  ): Promise<PaginatedNotifications> {
    // Apply filtering and pagination to notifications visible to the employee.
    const page = Math.max(1, query?.page ?? NOTIFICATION_PAGINATION.DEFAULT_PAGE)
    const limit = Math.min(
      NOTIFICATION_PAGINATION.MAX_LIMIT,
      Math.max(1, query?.limit ?? NOTIFICATION_PAGINATION.DEFAULT_LIMIT),
    )

    const visible = await Promise.all(
      [...this.items.values()]
        .filter((item) => this.canView(item, employeeId))
        .map((item) => this.findById(item.id, employeeId)),
    )

    const items = visible.filter((item): item is Notification => item !== null)
    const filtered = items
      .filter(
        (item) =>
          (query?.type === undefined || item.type === query.type) &&
          (query?.read === undefined || item.read === query.read),
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime() || b.id.localeCompare(a.id))

    return {
      notifications: filtered.slice((page - 1) * limit, page * limit),
      total: filtered.length,
      page,
      limit,
      totalPages: Math.ceil(filtered.length / limit) || 1,
      unreadCount: items.filter((item) => !item.read).length,
    }
  }

  /**
   * Stores a notification with generated identity, timestamps, and configured defaults.
   */
  async create(data: CreateNotificationDto): Promise<Notification> {
    // Create data only when requested by a test; do not add seed records.
    const now = new Date()
    const item: Notification = {
      id: randomUUID(),
      employeeId: data.employeeId,
      title: data.title,
      message: data.message,
      type: data.type ?? NOTIFICATION_TYPE.INFO,
      priority: data.priority ?? NOTIFICATION_PRIORITY.MEDIUM,
      read: false,
      link: data.link ?? null,
      metadata: data.metadata ?? null,
      createdAt: now,
      updatedAt: now,
    }

    this.items.set(item.id, item)
    return { ...item }
  }

  /**
   * Marks a visible notification as read for one employee.
   */
  async markAsRead(id: string, employeeId: string): Promise<Notification | null> {
    // Update only the requesting recipient's state.
    const item = this.items.get(id)

    if (!item || !this.canView(item, employeeId)) return null

    this.states.set(this.key(id, employeeId), {
      read: true,
      deleted: false,
      updatedAt: new Date(),
    })

    return this.findById(id, employeeId)
  }

  /**
   * Marks every visible unread notification as read and returns the affected count.
   */
  async markAllAsRead(employeeId: string): Promise<number> {
    // Process all stored notifications rather than only the first page.
    let count = 0

    for (const item of this.items.values()) {
      if (this.canView(item, employeeId) && !this.states.get(this.key(item.id, employeeId))?.read) {
        await this.markAsRead(item.id, employeeId)
        count++
      }
    }

    return count
  }

  /**
   * Hides a notification for one employee while preserving its previous read state.
   */
  async delete(id: string, employeeId: string): Promise<boolean> {
    // Simulate hiding a notification for one recipient only.
    const item = this.items.get(id)

    if (!item || !this.canView(item, employeeId)) return false

    const previous = this.states.get(this.key(id, employeeId))

    this.states.set(this.key(id, employeeId), {
      read: previous?.read ?? false,
      deleted: true,
      updatedAt: new Date(),
    })

    return true
  }

  /**
   * Counts visible notifications without a read state for the requesting employee.
   */
  async getUnreadCount(employeeId: string): Promise<number> {
    // Count independently of pagination and list filters.
    return [...this.items.values()].filter(
      (item) =>
        this.canView(item, employeeId) && !this.states.get(this.key(item.id, employeeId))?.read,
    ).length
  }
}
