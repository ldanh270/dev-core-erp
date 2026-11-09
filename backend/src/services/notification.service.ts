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

export class NotificationService implements INotificationService {
  constructor(
    private readonly repository: INotificationRepository,
    private readonly bus = eventBus,
  ) {
    // Đăng ký listener để xử lý yêu cầu tạo notification từ các module khác.
    this.bus.onTyped("notification:create", this.handleCreate)
  }

  private readonly handleCreate = (payload: CreateNotificationDto): void => {
    // Bắt lỗi của tác vụ nền để tránh promise bị reject mà không được xử lý.
    void this.createNotification(payload).catch((error) => {
      console.error("Failed to process background notification event:", error)
    })
  }

  private notFoundError(): AppError {
    // Dùng cùng mã lỗi khi thông báo không tồn tại hoặc người nhận đã xóa.
    return new AppError(
      NOTIFICATION_ERRORS.NOT_FOUND.message,
      HttpStatusCode.NOT_FOUND,
      ErrorLayer.SERVICE,
      NOTIFICATION_ERRORS.NOT_FOUND.code,
    )
  }

  async listNotifications(
    employeeId: string,
    query?: NotificationQuery,
  ): Promise<PaginatedNotifications> {
    // Repository lọc dữ liệu và ghép trạng thái cá nhân của người nhận.
    return this.repository.findByEmployeeId(employeeId, query)
  }

  async getNotification(
    id: string,
    employeeId: string,
  ): Promise<Notification> {
    // Truyền người xem để lấy đúng trạng thái đọc/xóa của họ.
    const notification = await this.repository.findById(id, employeeId)

    if (!notification) {
      throw this.notFoundError()
    }

    // Chỉ cho phép xem thông báo cá nhân hoặc thông báo chung.
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

  async createNotification(
    data: CreateNotificationDto,
  ): Promise<Notification> {
    // Chỉ phát sự kiện sau khi lưu DB thành công.
    const notification = await this.repository.create(data)

    if (notification.employeeId === NOTIFICATION_AUDIENCE.ALL) {
      this.bus.emitTyped("notification:broadcast", notification)
    } else {
      this.bus.emitNotification(notification.employeeId, notification)
    }

    return notification
  }

  async markAsRead(
    id: string,
    employeeId: string,
  ): Promise<Notification> {
    // Xác minh quyền trước khi cập nhật trạng thái riêng của người nhận.
    await this.getNotification(id, employeeId)

    const updated = await this.repository.markAsRead(id, employeeId)

    if (!updated) {
      throw this.notFoundError()
    }

    return updated
  }

  async markAllAsRead(
    employeeId: string,
  ): Promise<{ updatedCount: number }> {
    // Đánh dấu những thông báo còn hiển thị trong hộp thông báo cá nhân.
    const updatedCount = await this.repository.markAllAsRead(employeeId)

    return { updatedCount }
  }

  async deleteNotification(
    id: string,
    employeeId: string,
  ): Promise<boolean> {
    // Kiểm tra quyền; repository chỉ ẩn thông báo đối với người đang thao tác.
    await this.getNotification(id, employeeId)

    return this.repository.delete(id, employeeId)
  }

  async getUnreadCount(employeeId: string): Promise<number> {
    // Đếm theo trạng thái riêng của nhân viên, không tính thông báo đã xóa.
    return this.repository.getUnreadCount(employeeId)
  }

  subscribeToStream(
    employeeId: string,
    onNotification: (notification: Notification) => void,
  ): () => void {
    // Theo dõi cả kênh cá nhân và kênh thông báo chung.
    this.bus.onNotification(employeeId, onNotification)
    this.bus.onTyped("notification:broadcast", onNotification)

    return () => {
      // Gỡ đúng callback khỏi cả hai kênh khi kết nối SSE đóng.
      this.bus.offNotification(employeeId, onNotification)
      this.bus.offTyped("notification:broadcast", onNotification)
    }
  }

  dispose(): void {
    // Gỡ listener của service khi hủy instance, đặc biệt sau mỗi unit test.
    this.bus.offTyped("notification:create", this.handleCreate)
  }
}