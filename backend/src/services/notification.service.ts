import {
  NOTIFICATION_ERRORS,
} from "@/configs/entities/notification.config.ts"
import { ErrorLayer } from "@/configs/system/error-code.config.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { eventBus } from "@/libs/event-bus.ts"
import {
  CreateNotificationDto,
  INotificationRepository,
  INotificationService,
  Notification,
  NotificationQuery,
  PaginatedNotifications,
} from "@/types/notification.types.ts"
import { AppError } from "@/utils/error.util.ts"

/**
 * Service orchestrating notification business logic, persistence, and real-time streaming.
 * Adheres strictly to SOLID:
 * - Single Responsibility: Manages notification domain operations and event dispatching.
 * - Dependency Inversion: Depends on INotificationRepository interface.
 */
export class NotificationService implements INotificationService {
  constructor(
    private readonly repository: INotificationRepository,
    private readonly bus = eventBus,
  ) {
    this.registerDomainEventListeners()
  }

  /**
   * Listen for domain events dispatched by other subsystems (e.g. applications, tasks, payroll).
   */
  private registerDomainEventListeners(): void {
    this.bus.onTyped("notification:create", (payload: CreateNotificationDto) => {
      void this.createNotification(payload).catch((error) => {
        console.error("Failed to process background notification event:", error)
      })
    })
  }

  async listNotifications(
    employeeId: string,
    query?: NotificationQuery,
  ): Promise<PaginatedNotifications> {
    return this.repository.findByEmployeeId(employeeId, query)
  }

  async getNotification(id: string, employeeId: string): Promise<Notification> {
    const notification = await this.repository.findById(id)
    if (!notification) {
      throw new AppError(
        NOTIFICATION_ERRORS.NOT_FOUND.message,
        HttpStatusCode.NOT_FOUND,
        ErrorLayer.SERVICE,
        NOTIFICATION_ERRORS.NOT_FOUND.code,
      )
    }

    if (notification.employeeId !== employeeId && notification.employeeId !== "all") {
      throw new AppError(
        NOTIFICATION_ERRORS.UNAUTHORIZED.message,
        HttpStatusCode.FORBIDDEN,
        ErrorLayer.SERVICE,
        NOTIFICATION_ERRORS.UNAUTHORIZED.code,
      )
    }

    return notification
  }

  async createNotification(data: CreateNotificationDto): Promise<Notification> {
    const notification = await this.repository.create(data)

    // Broadcast or targeted emit
    if (data.employeeId === "all") {
      this.bus.emitTyped("notification:broadcast", notification)
    } else {
      this.bus.emitNotification(data.employeeId, notification)
    }

    return notification
  }

  async markAsRead(id: string, employeeId: string): Promise<Notification> {
    const updated = await this.repository.markAsRead(id, employeeId)
    if (!updated) {
      throw new AppError(
        NOTIFICATION_ERRORS.NOT_FOUND.message,
        HttpStatusCode.NOT_FOUND,
        ErrorLayer.SERVICE,
        NOTIFICATION_ERRORS.NOT_FOUND.code,
      )
    }

    return updated
  }

  async markAllAsRead(employeeId: string): Promise<{ updatedCount: number }> {
    const updatedCount = await this.repository.markAllAsRead(employeeId)
    return { updatedCount }
  }

  async deleteNotification(id: string, employeeId: string): Promise<boolean> {
    const existing = await this.repository.findById(id)
    if (!existing) {
      throw new AppError(
        NOTIFICATION_ERRORS.NOT_FOUND.message,
        HttpStatusCode.NOT_FOUND,
        ErrorLayer.SERVICE,
        NOTIFICATION_ERRORS.NOT_FOUND.code,
      )
    }

    if (existing.employeeId !== employeeId && existing.employeeId !== "all") {
      throw new AppError(
        NOTIFICATION_ERRORS.UNAUTHORIZED.message,
        HttpStatusCode.FORBIDDEN,
        ErrorLayer.SERVICE,
        NOTIFICATION_ERRORS.UNAUTHORIZED.code,
      )
    }

    return this.repository.delete(id, employeeId)
  }

  async getUnreadCount(employeeId: string): Promise<number> {
    return this.repository.getUnreadCount(employeeId)
  }

  subscribeToStream(
    employeeId: string,
    onNotification: (notification: Notification) => void,
  ): () => void {
    const directHandler = (notification: Notification) => {
      onNotification(notification)
    }

    const broadcastHandler = (notification: Notification) => {
      onNotification(notification)
    }

    this.bus.onNotification(employeeId, directHandler)
    this.bus.onTyped("notification:broadcast", broadcastHandler)

    // Return cleanup function
    return () => {
      this.bus.offNotification(employeeId, directHandler)
      this.bus.offTyped("notification:broadcast", broadcastHandler)
    }
  }
}
