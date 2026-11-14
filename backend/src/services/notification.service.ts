import { NOTIFICATION_AUDIENCE } from "@/configs/entities/notification-audience.config.ts"
import { NOTIFICATION_ERRORS } from "@/configs/entities/notification.config.ts"
import { ErrorLayer } from "@/configs/system/error-code.config.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { eventBus } from "@/libs/event-bus.ts"
import type {
  CreateNotificationDto,
  INotificationRepository,
  INotificationService,
  Notification,
  NotificationQuery,
  PaginatedNotifications,
} from "@/types/notification.types.ts"
import { AppError } from "@/utils/error.util.ts"

/**
 * Notification Service implementing notification access, read state, and real-time delivery logic.
 * Depends on INotificationRepository to keep persistence separate from business rules.
 */
export class NotificationService implements INotificationService {
  /**
   * Injects the notification repository and event bus, then registers the creation listener.
   */
  constructor(
    private readonly repository: INotificationRepository,
    private readonly bus = eventBus,
  ) {
    // Listen for notification creation requests from other modules.
    this.bus.onTyped("notification:create", this.handleCreate)
  }

  /**
   * Handles background creation requests while logging asynchronous failures.
   */
  private readonly handleCreate = (payload: CreateNotificationDto): void => {
    // Catch background failures to prevent unhandled promise rejections.
    void this.createNotification(payload).catch((error) => {
      console.error("Failed to process background notification event:", error)
    })
  }

  /**
   * Builds the standard service error for a missing or recipient-deleted notification.
   */
  private notFoundError(): AppError {
    // Use the same error for missing notifications and recipient-deleted notifications.
    return new AppError(
      NOTIFICATION_ERRORS.NOT_FOUND.message,
      HttpStatusCode.NOT_FOUND,
      ErrorLayer.SERVICE,
      NOTIFICATION_ERRORS.NOT_FOUND.code,
    )
  }

  /**
   * Retrieves paginated notifications with the requesting employee's personal state.
   */
  async listNotifications(
    employeeId: string,
    query?: NotificationQuery,
  ): Promise<PaginatedNotifications> {
    // Delegate filtering and recipient-specific state mapping to the repository.
    return this.repository.findByEmployeeId(employeeId, query)
  }

  /**
   * Retrieves a notification and verifies that the requesting employee belongs to its audience.
   */
  async getNotification(id: string, employeeId: string): Promise<Notification> {
    // Resolve read and deletion state for the requesting employee.
    const notification = await this.repository.findById(id, employeeId)

    if (!notification) {
      throw this.notFoundError()
    }

    // Restrict access to notifications addressed to this employee or everyone.
    if (
      notification.employeeId !== employeeId &&
      notification.employeeId !== NOTIFICATION_AUDIENCE.ALL
    ) {
      throw new AppError(
        NOTIFICATION_ERRORS.UNAUTHORIZED.message,
        HttpStatusCode.FORBIDDEN,
        ErrorLayer.SERVICE,
        NOTIFICATION_ERRORS.UNAUTHORIZED.code,
      )
    }

    return notification
  }

  /**
   * Persists a notification before publishing it to its recipient or all subscribers.
   */
  async createNotification(data: CreateNotificationDto): Promise<Notification> {
    // Publish delivery events only after persistence succeeds.
    const notification = await this.repository.create(data)

    if (notification.employeeId === NOTIFICATION_AUDIENCE.ALL) {
      this.bus.emitTyped("notification:broadcast", notification)
    } else {
      this.bus.emitNotification(notification.employeeId, notification)
    }

    return notification
  }

  /**
   * Verifies access and marks a notification as read for the requesting employee.
   */
  async markAsRead(id: string, employeeId: string): Promise<Notification> {
    // Verify access before updating recipient-specific read state.
    await this.getNotification(id, employeeId)

    const updated = await this.repository.markAsRead(id, employeeId)

    if (!updated) {
      throw this.notFoundError()
    }

    return updated
  }

  /**
   * Marks all visible unread notifications as read and returns the affected count.
   */
  async markAllAsRead(employeeId: string): Promise<{ updatedCount: number }> {
    // Mark notifications that remain visible in this employee's inbox.
    const updatedCount = await this.repository.markAllAsRead(employeeId)

    return { updatedCount }
  }

  /**
   * Verifies access and hides a notification only for the requesting employee.
   */
  async deleteNotification(id: string, employeeId: string): Promise<boolean> {
    // Verify access; the repository hides the notification only for this recipient.
    await this.getNotification(id, employeeId)

    return this.repository.delete(id, employeeId)
  }

  /**
   * Returns the employee's unread count, excluding notifications they have deleted.
   */
  async getUnreadCount(employeeId: string): Promise<number> {
    // Count unread notifications using employee-specific state, excluding deleted items.
    return this.repository.getUnreadCount(employeeId)
  }

  /**
   * Registers personal and broadcast listeners and returns a callback that removes both.
   */
  subscribeToStream(
    employeeId: string,
    onNotification: (notification: Notification) => void,
  ): () => void {
    // Subscribe to both employee-specific delivery and broadcasts.
    this.bus.onNotification(employeeId, onNotification)
    this.bus.onTyped("notification:broadcast", onNotification)

    return () => {
      // Remove the same callback from both channels when the SSE connection closes.
      this.bus.offNotification(employeeId, onNotification)
      this.bus.offTyped("notification:broadcast", onNotification)
    }
  }

  /**
   * Unregisters the background creation listener when the service instance is disposed.
   */
  dispose(): void {
    // Remove the service listener during teardown, including unit test cleanup.
    this.bus.offTyped("notification:create", this.handleCreate)
  }
}
