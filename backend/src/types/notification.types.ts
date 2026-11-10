import { NotificationPriority, NotificationType } from "@/configs/entities/notification.config.ts"

/**
 * Domain model representing a notification with the requesting employee's read state.
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
 * Data Transfer Object for creating a notification with optional delivery attributes.
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
 * Query parameters for filtering and paginating visible notifications.
 */
export interface NotificationQuery {
  page?: number
  limit?: number
  type?: NotificationType
  read?: boolean
}

/**
 * Paginated notification response including an unread count independent of list filters.
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
 * Repository contract for notification persistence and recipient-specific state.
 * Allows the service to depend on an abstraction rather than a database implementation.
 */
export interface INotificationRepository {
  /**
   * Finds a notification with the requesting employee's state, or null if missing or deleted.
   */
  findById(id: string, employeeId: string): Promise<Notification | null>
  /**
   * Lists visible notifications with filters, pagination, and the employee's unread count.
   */
  findByEmployeeId(employeeId: string, query?: NotificationQuery): Promise<PaginatedNotifications>
  /**
   * Persists a notification using configured defaults for optional fields.
   */
  create(data: CreateNotificationDto): Promise<Notification>
  /**
   * Marks a visible notification as read for one employee, or returns null if unavailable.
   */
  markAsRead(id: string, employeeId: string): Promise<Notification | null>
  /**
   * Marks all visible unread notifications as read and returns the affected count.
   */
  markAllAsRead(employeeId: string): Promise<number>
  /**
   * Hides a notification for one employee and reports whether it was found.
   */
  delete(id: string, employeeId: string): Promise<boolean>
  /**
   * Counts visible unread notifications for one employee.
   */
  getUnreadCount(employeeId: string): Promise<number>
}

/**
 * Service contract for notification business logic and real-time subscriptions.
 */
export interface INotificationService {
  /**
   * Retrieves the employee's visible notifications with filtering and pagination.
   */
  listNotifications(employeeId: string, query?: NotificationQuery): Promise<PaginatedNotifications>
  /**
   * Retrieves a notification after verifying the requesting employee's audience access.
   */
  getNotification(id: string, employeeId: string): Promise<Notification>
  /**
   * Persists a notification before publishing its real-time delivery event.
   */
  createNotification(data: CreateNotificationDto): Promise<Notification>
  /**
   * Verifies access and updates the requesting employee's read state.
   */
  markAsRead(id: string, employeeId: string): Promise<Notification>
  /**
   * Marks all visible unread notifications as read and returns the affected count.
   */
  markAllAsRead(employeeId: string): Promise<{ updatedCount: number }>
  /**
   * Verifies access and hides a notification for the requesting employee.
   */
  deleteNotification(id: string, employeeId: string): Promise<boolean>
  /**
   * Returns the requesting employee's visible unread count.
   */
  getUnreadCount(employeeId: string): Promise<number>
  /**
   * Subscribes to personal and broadcast delivery and returns an unsubscribe callback.
   */
  subscribeToStream(
    employeeId: string,
    onNotification: (notification: Notification) => void,
  ): () => void
}
