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

type RecipientState = {
  read: boolean
  deleted: boolean
  updatedAt: Date
}

/** Chỉ dùng trong unit test, không dùng để lưu dữ liệu của ứng dụng. */
export class InMemoryNotificationRepository implements INotificationRepository {
  private readonly items = new Map<string, Notification>()
  private readonly states = new Map<string, RecipientState>()

  private key(id: string, employeeId: string): string {
    // Tạo khóa riêng cho từng cặp thông báo và người nhận.
    return JSON.stringify([id, employeeId])
  }

  private canView(item: Notification, employeeId: string): boolean {
    // Kiểm tra đối tượng nhận và trạng thái xóa cá nhân.
    return (
      (item.employeeId === employeeId || item.employeeId === NOTIFICATION_AUDIENCE.ALL) &&
      !this.states.get(this.key(item.id, employeeId))?.deleted
    )
  }

  async findById(id: string, employeeId: string): Promise<Notification | null> {
    // Ghép trạng thái của người xem; service chịu trách nhiệm kiểm tra quyền.
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

  async findByEmployeeId(
    employeeId: string,
    query?: NotificationQuery,
  ): Promise<PaginatedNotifications> {
    // Mô phỏng bộ lọc và phân trang trên các thông báo có thể xem.
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

  async create(data: CreateNotificationDto): Promise<Notification> {
    // Chỉ tạo dữ liệu khi test gọi, không tự thêm dữ liệu mẫu.
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

  async markAsRead(id: string, employeeId: string): Promise<Notification | null> {
    // Chỉ cập nhật trạng thái của người nhận hiện tại.
    const item = this.items.get(id)

    if (!item || !this.canView(item, employeeId)) return null

    this.states.set(this.key(id, employeeId), {
      read: true,
      deleted: false,
      updatedAt: new Date(),
    })

    return this.findById(id, employeeId)
  }

  async markAllAsRead(employeeId: string): Promise<number> {
    // Duyệt toàn bộ thông báo, không bị giới hạn bởi trang đầu.
    let count = 0

    for (const item of this.items.values()) {
      if (this.canView(item, employeeId) && !this.states.get(this.key(item.id, employeeId))?.read) {
        await this.markAsRead(item.id, employeeId)
        count++
      }
    }

    return count
  }

  async delete(id: string, employeeId: string): Promise<boolean> {
    // Mô phỏng thao tác ẩn thông báo của riêng người nhận.
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

  async getUnreadCount(employeeId: string): Promise<number> {
    // Đếm độc lập với phân trang và bộ lọc.
    return [...this.items.values()].filter(
      (item) =>
        this.canView(item, employeeId) && !this.states.get(this.key(item.id, employeeId))?.read,
    ).length
  }
}
