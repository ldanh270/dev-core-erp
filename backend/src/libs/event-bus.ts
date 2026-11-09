import type { CreateNotificationDto, Notification } from "@/types/notification.types.ts"

import { EventEmitter } from "events"

/**
 * Khai báo tên sự kiện và kiểu dữ liệu tương ứng.
 * TypeScript kiểm tra kiểu payload khi phát hoặc đăng ký sự kiện.
 */
export interface DomainEvents {
  "notification:create": CreateNotificationDto
  "notification:broadcast": Notification
}

/**
 * Event bus dùng chung theo Observer pattern.
 * Cho phép các module phát và nhận sự kiện mà không phụ thuộc trực tiếp vào nhau.
 */
class AppEventBus extends EventEmitter {
  constructor() {
    // Khởi tạo cơ chế đăng ký và phát sự kiện của Node.js.
    super()

    // Đặt ngưỡng cảnh báo ở 200 listener cho mỗi tên sự kiện.
    // Đây là ngưỡng cảnh báo, không phải giới hạn cứng số lượng listener.
    this.setMaxListeners(200)
  }

  emitTyped<K extends keyof DomainEvents>(event: K, payload: DomainEvents[K]): boolean {
    // Phát sự kiện cùng payload tới các listener đã đăng ký.
    // Trả về true nếu sự kiện có listener, ngược lại trả về false.
    return this.emit(event, payload)
  }

  onTyped<K extends keyof DomainEvents>(
    event: K,
    listener: (payload: DomainEvents[K]) => void,
  ): this {
    // Đăng ký callback cho một sự kiện thuộc DomainEvents.
    // Kiểu payload của callback được xác định theo tên sự kiện.
    return this.on(event, listener)
  }

  offTyped<K extends keyof DomainEvents>(
    event: K,
    listener: (payload: DomainEvents[K]) => void,
  ): this {
    // Gỡ callback đã đăng ký cho sự kiện.
    // Cần truyền đúng tham chiếu hàm đã dùng khi gọi onTyped.
    return this.off(event, listener)
  }

  emitNotification(employeeId: string, notification: Notification): boolean {
    // Phát notification trên kênh riêng của nhân viên.
    // Chỉ các listener đăng ký đúng kênh này mới nhận được sự kiện.
    return this.emit(`notification:${employeeId}`, notification)
  }

  onNotification(employeeId: string, listener: (notification: Notification) => void): this {
    // Đăng ký callback nhận notification trên kênh của nhân viên.
    // Service có thể dùng callback này để chuyển dữ liệu tới kết nối SSE.
    return this.on(`notification:${employeeId}`, listener)
  }

  offNotification(employeeId: string, listener: (notification: Notification) => void): this {
    // Gỡ đúng callback khỏi kênh của nhân viên khi không còn sử dụng,
    // chẳng hạn khi kết nối SSE đóng, để tránh giữ listener không cần thiết.
    return this.off(`notification:${employeeId}`, listener)
  }
}

// Dùng chung một instance để các module phát và nhận trên cùng event bus.
export const eventBus = new AppEventBus()
