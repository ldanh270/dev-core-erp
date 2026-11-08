import {
  NOTIFICATION_PAGINATION,
  NOTIFICATION_PRIORITY,
  NOTIFICATION_TYPE,
} from "@/configs/entities/notification.config.ts"
import {
  CreateNotificationDto,
  INotificationRepository,
  Notification,
  NotificationQuery,
  PaginatedNotifications,
} from "@/types/notification.types.ts"

import crypto from "crypto"

/**
 * In-memory repository implementing INotificationRepository.
 * Fully compliant with SOLID principles (LSP & SRP).
 * Thread-safe and independent of external DB outages.
 */
export class InMemoryNotificationRepository implements INotificationRepository {
  private items = new Map<string, Notification>()

  constructor() {
    this.seedSampleNotifications()
  }

  private seedSampleNotifications(): void {
    const now = new Date()
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000)
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    const samples: Omit<Notification, "id">[] = [
      {
        employeeId: "all",
        title: "Đơn nghỉ phép được duyệt",
        message: "Trưởng phòng đã duyệt đơn nghỉ phép của bạn.",
        type: NOTIFICATION_TYPE.APPLICATION,
        priority: NOTIFICATION_PRIORITY.MEDIUM,
        read: false,
        link: "/personal/applications",
        metadata: null,
        createdAt: fiveMinutesAgo,
        updatedAt: fiveMinutesAgo,
      },
      {
        employeeId: "all",
        title: "Nhắc nhở chấm công",
        message: "Bạn chưa chấm công vào lúc 08:00 hôm nay.",
        type: NOTIFICATION_TYPE.WARNING,
        priority: NOTIFICATION_PRIORITY.HIGH,
        read: false,
        link: "/personal/schedules",
        metadata: null,
        createdAt: twoHoursAgo,
        updatedAt: twoHoursAgo,
      },
      {
        employeeId: "all",
        title: "Cập nhật chính sách",
        message: "Công ty vừa cập nhật chính sách phúc lợi mới cho năm 2026.",
        type: NOTIFICATION_TYPE.SYSTEM,
        priority: NOTIFICATION_PRIORITY.LOW,
        read: true,
        link: null,
        metadata: null,
        createdAt: oneDayAgo,
        updatedAt: oneDayAgo,
      },
    ]

    for (const sample of samples) {
      const id = crypto.randomUUID()
      this.items.set(id, { id, ...sample })
    }
  }

  async findById(id: string): Promise<Notification | null> {
    const item = this.items.get(id)
    return item ? { ...item } : null
  }

  async findByEmployeeId(
    employeeId: string,
    query?: NotificationQuery,
  ): Promise<PaginatedNotifications> {
    const page = Math.max(1, query?.page ?? NOTIFICATION_PAGINATION.DEFAULT_PAGE)
    const limit = Math.min(
      NOTIFICATION_PAGINATION.MAX_LIMIT,
      Math.max(1, query?.limit ?? NOTIFICATION_PAGINATION.DEFAULT_LIMIT),
    )

    const userItems = Array.from(this.items.values()).filter(
      (item) => item.employeeId === employeeId || item.employeeId === "all",
    )

    const filtered = userItems.filter((item) => {
      if (query?.type !== undefined && item.type !== query.type) return false
      if (query?.read !== undefined && item.read !== query.read) return false
      return true
    })

    filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    const total = filtered.length
    const totalPages = Math.ceil(total / limit) || 1
    const offset = (page - 1) * limit
    const paginatedItems = filtered.slice(offset, offset + limit)

    const unreadCount = userItems.filter((item) => !item.read).length

    return {
      notifications: paginatedItems.map((item) => ({ ...item })),
      total,
      page,
      limit,
      totalPages,
      unreadCount,
    }
  }

  async create(data: CreateNotificationDto): Promise<Notification> {
    const now = new Date()
    const id = crypto.randomUUID()
    const notification: Notification = {
      id,
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

    this.items.set(id, notification)
    return { ...notification }
  }

  async markAsRead(id: string, employeeId: string): Promise<Notification | null> {
    const item = this.items.get(id)
    if (!item) return null
    if (item.employeeId !== employeeId && item.employeeId !== "all") return null

    const updated: Notification = {
      ...item,
      read: true,
      updatedAt: new Date(),
    }
    this.items.set(id, updated)
    return { ...updated }
  }

  async markAllAsRead(employeeId: string): Promise<number> {
    let count = 0
    const now = new Date()

    for (const [id, item] of this.items.entries()) {
      if ((item.employeeId === employeeId || item.employeeId === "all") && !item.read) {
        this.items.set(id, {
          ...item,
          read: true,
          updatedAt: now,
        })
        count++
      }
    }

    return count
  }

  async delete(id: string, employeeId: string): Promise<boolean> {
    const item = this.items.get(id)
    if (!item) return false
    if (item.employeeId !== employeeId && item.employeeId !== "all") return false

    return this.items.delete(id)
  }

  async getUnreadCount(employeeId: string): Promise<number> {
    return Array.from(this.items.values()).filter(
      (item) => (item.employeeId === employeeId || item.employeeId === "all") && !item.read,
    ).length
  }
}
