import { NotificationPriority, NotificationType } from "@/configs/entities/notification.config.ts"

/**
 * Domain model representing a Notification
 */
export interface Notification {
  id: string
  employeeId: string
  title: string
  message: string
  type: NotificationType
  priority: NotificationPriority
  read: boolean
  link: string | null
  metadata: Record<string, unknown> | null
  createdAt: Date
  updatedAt: Date
}

/**
 * Data Transfer Object for creating a new Notification
 */
export interface CreateNotificationDto {
  employeeId: string
  title: string
  message: string
  type?: NotificationType
  priority?: NotificationPriority
  link?: string | null
  metadata?: Record<string, unknown> | null
}

/**
 * Query parameters for filtering and paginating notifications
 */
export interface NotificationQuery {
  page?: number
  limit?: number
  type?: NotificationType
  read?: boolean
}

/**
 * Paginated response structure for notifications
 */
export interface PaginatedNotifications {
  notifications: Notification[]
  total: number
  page: number
  limit: number
  totalPages: number
  unreadCount: number
}

/**
 * Repository contract for Notification persistence
 */
export interface INotificationRepository {
  findById(id: string, employeeId: string): Promise<Notification | null>
  findByEmployeeId(employeeId: string, query?: NotificationQuery): Promise<PaginatedNotifications>
  create(data: CreateNotificationDto): Promise<Notification>
  markAsRead(id: string, employeeId: string): Promise<Notification | null>
  markAllAsRead(employeeId: string): Promise<number>
  delete(id: string, employeeId: string): Promise<boolean>
  getUnreadCount(employeeId: string): Promise<number>
}

/**
 * Service contract for Notification business logic
 */
export interface INotificationService {
  listNotifications(employeeId: string, query?: NotificationQuery): Promise<PaginatedNotifications>
  getNotification(id: string, employeeId: string): Promise<Notification>
  createNotification(data: CreateNotificationDto): Promise<Notification>
  markAsRead(id: string, employeeId: string): Promise<Notification>
  markAllAsRead(employeeId: string): Promise<{ updatedCount: number }>
  deleteNotification(id: string, employeeId: string): Promise<boolean>
  getUnreadCount(employeeId: string): Promise<number>
  subscribeToStream(
    employeeId: string,
    onNotification: (notification: Notification) => void,
  ): () => void
}
