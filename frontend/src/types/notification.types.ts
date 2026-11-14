import type { NotificationPriority, NotificationType } from "@/config/entities/notification.config"

export interface NotificationItem {
  id: string
  employeeId: string
  title: string
  message: string
  type: NotificationType
  priority: NotificationPriority
  read: boolean
  link: string | null
  metadata: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
}

export interface NotificationListResponse {
  notifications: NotificationItem[]
  total: number
  page: number
  limit: number
  totalPages: number
  unreadCount: number
}
