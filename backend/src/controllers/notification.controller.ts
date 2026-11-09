import { NOTIFICATION_STREAM_CONFIG } from "@/configs/entities/notification.config.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { AuthRequest } from "@/middlewares/auth.middleware.ts"
import {
  createNotificationSchema,
  notificationIdParamSchema,
  notificationQuerySchema,
} from "@/schemas/notification.schema.ts"
import { ApiResponse } from "@/types"
import {
  INotificationService,
  Notification,
  PaginatedNotifications,
} from "@/types/notification.types.ts"

import { Response } from "express"
import { z } from "zod"

/**
 * Tiếp nhận HTTP request cho notification và quản lý luồng SSE.
 * Controller kiểm tra dữ liệu đầu vào, gọi service và định dạng HTTP response.
 */
export class NotificationController {
  constructor(private readonly service: INotificationService) {
    // Nhận service từ bên ngoài để controller không phụ thuộc vào cách lưu dữ liệu.
  }

  list = async (
    req: AuthRequest,
    res: Response<ApiResponse<PaginatedNotifications>>,
  ): Promise<Response> => {
    try {
      // Kiểm tra thông tin người dùng đã được middleware xác thực gắn vào request.
      if (!req.user) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          data: null,
          error: { message: "Unauthorized", code: "UNAUTHORIZED" },
        })
      }

      // Kiểm tra và chuyển đổi query phân trang, loại thông báo và trạng thái đã đọc.
      const query = notificationQuerySchema.parse(req.query)

      // Lấy danh sách theo danh tính người đang đăng nhập, không lấy employeeId từ client.
      const result = await this.service.listNotifications(req.user.empId, query)

      return res.status(HttpStatusCode.OK).json({
        data: result,
        error: null,
      })
    } catch (error) {
      // Trả HTTP 400 khi gặp lỗi kiểm tra dữ liệu bằng Zod.
      if (error instanceof z.ZodError) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          data: null,
          error: { message: "Validation error", code: "VALIDATION_ERROR" },
        })
      }

      // Chuyển các lỗi còn lại cho middleware xử lý lỗi chung của ứng dụng.
      throw error
    }
  }

  getOne = async (
    req: AuthRequest,
    res: Response<ApiResponse<Notification>>,
  ): Promise<Response> => {
    try {
      // Kiểm tra thông tin người dùng đã được middleware xác thực gắn vào request.
      if (!req.user) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          data: null,
          error: { message: "Unauthorized", code: "UNAUTHORIZED" },
        })
      }

      // Kiểm tra notification ID trong tham số đường dẫn trước khi gọi service.
      const { id } = notificationIdParamSchema.parse(req.params)

      // Service lấy thông báo và kiểm tra quyền truy cập của nhân viên hiện tại.
      const notification = await this.service.getNotification(id, req.user.empId)

      return res.status(HttpStatusCode.OK).json({
        data: notification,
        error: null,
      })
    } catch (error) {
      // Trả HTTP 400 khi gặp lỗi kiểm tra dữ liệu bằng Zod.
      if (error instanceof z.ZodError) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          data: null,
          error: { message: "Validation error", code: "VALIDATION_ERROR" },
        })
      }

      // Chuyển các lỗi còn lại cho middleware xử lý lỗi chung của ứng dụng.
      throw error
    }
  }

  create = async (
    req: AuthRequest,
    res: Response<ApiResponse<Notification>>,
  ): Promise<Response> => {
    try {
      // Kiểm tra thông tin người dùng đã được middleware xác thực gắn vào request.
      if (!req.user) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          data: null,
          error: { message: "Unauthorized", code: "UNAUTHORIZED" },
        })
      }

      // Kiểm tra nội dung request body theo schema trước khi tạo thông báo.
      const data = createNotificationSchema.parse(req.body)

      // Service lưu thông báo qua repository rồi phát sự kiện real-time.
      const notification = await this.service.createNotification(data)

      return res.status(HttpStatusCode.CREATED).json({
        data: notification,
        error: null,
      })
    } catch (error) {
      // Trả HTTP 400 khi gặp lỗi kiểm tra dữ liệu bằng Zod.
      if (error instanceof z.ZodError) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          data: null,
          error: { message: "Validation error", code: "VALIDATION_ERROR" },
        })
      }

      // Chuyển các lỗi còn lại cho middleware xử lý lỗi chung của ứng dụng.
      throw error
    }
  }

  markAsRead = async (
    req: AuthRequest,
    res: Response<ApiResponse<Notification>>,
  ): Promise<Response> => {
    try {
      // Kiểm tra thông tin người dùng đã được middleware xác thực gắn vào request.
      if (!req.user) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          data: null,
          error: { message: "Unauthorized", code: "UNAUTHORIZED" },
        })
      }

      // Kiểm tra notification ID trong tham số đường dẫn trước khi gọi service.
      const { id } = notificationIdParamSchema.parse(req.params)

      // Đánh dấu đã đọc theo người nhận hiện tại; service kiểm tra quyền thao tác.
      const updated = await this.service.markAsRead(id, req.user.empId)

      return res.status(HttpStatusCode.OK).json({
        data: updated,
        error: null,
      })
    } catch (error) {
      // Trả HTTP 400 khi gặp lỗi kiểm tra dữ liệu bằng Zod.
      if (error instanceof z.ZodError) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          data: null,
          error: { message: "Validation error", code: "VALIDATION_ERROR" },
        })
      }

      // Chuyển các lỗi còn lại cho middleware xử lý lỗi chung của ứng dụng.
      throw error
    }
  }

  markAllAsRead = async (
    req: AuthRequest,
    res: Response<ApiResponse<{ updatedCount: number }>>,
  ): Promise<Response> => {
    // Kiểm tra thông tin người dùng đã được middleware xác thực gắn vào request.
    if (!req.user) {
      return res.status(HttpStatusCode.UNAUTHORIZED).json({
        data: null,
        error: { message: "Unauthorized", code: "UNAUTHORIZED" },
      })
    }

    // Đánh dấu các thông báo còn hiển thị của nhân viên này và nhận số lượng cập nhật.
    const result = await this.service.markAllAsRead(req.user.empId)

    return res.status(HttpStatusCode.OK).json({
      data: result,
      error: null,
    })
  }

  delete = async (
    req: AuthRequest,
    res: Response<ApiResponse<{ success: boolean }>>,
  ): Promise<Response> => {
    try {
      // Kiểm tra thông tin người dùng đã được middleware xác thực gắn vào request.
      if (!req.user) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          data: null,
          error: { message: "Unauthorized", code: "UNAUTHORIZED" },
        })
      }

      // Kiểm tra notification ID trong tham số đường dẫn trước khi gọi service.
      const { id } = notificationIdParamSchema.parse(req.params)

      // Service kiểm tra quyền và yêu cầu repository xóa khỏi hộp thông báo cá nhân.
      await this.service.deleteNotification(id, req.user.empId)

      return res.status(HttpStatusCode.OK).json({
        data: { success: true },
        error: null,
      })
    } catch (error) {
      // Trả HTTP 400 khi gặp lỗi kiểm tra dữ liệu bằng Zod.
      if (error instanceof z.ZodError) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          data: null,
          error: { message: "Validation error", code: "VALIDATION_ERROR" },
        })
      }

      // Chuyển các lỗi còn lại cho middleware xử lý lỗi chung của ứng dụng.
      throw error
    }
  }

  getUnreadCount = async (
    req: AuthRequest,
    res: Response<ApiResponse<{ count: number }>>,
  ): Promise<Response> => {
    // Kiểm tra thông tin người dùng đã được middleware xác thực gắn vào request.
    if (!req.user) {
      return res.status(HttpStatusCode.UNAUTHORIZED).json({
        data: null,
        error: { message: "Unauthorized", code: "UNAUTHORIZED" },
      })
    }

    // Lấy tổng số thông báo chưa đọc của nhân viên để frontend hiển thị badge.
    const count = await this.service.getUnreadCount(req.user.empId)

    return res.status(HttpStatusCode.OK).json({
      data: { count },
      error: null,
    })
  }

  /**
   * Giữ HTTP response mở để server đẩy thông báo tới trình duyệt bằng SSE.
   */
  stream = (req: AuthRequest, res: Response): void => {
    // Kiểm tra thông tin người dùng đã được middleware xác thực gắn vào request.
    if (!req.user) {
      res.status(HttpStatusCode.UNAUTHORIZED).json({
        data: null,
        error: { message: "Unauthorized", code: "UNAUTHORIZED" },
      })
      return
    }

    // Dùng mã nhân viên đã xác thực để đăng ký đúng kênh nhận thông báo.
    const empId = req.user.empId

    // Khai báo response dạng SSE; hạn chế cache và yêu cầu giữ kết nối.
    // X-Accel-Buffering yêu cầu Nginx không gom dữ liệu vào bộ đệm.
    res.setHeader("Content-Type", "text/event-stream")
    res.setHeader("Cache-Control", "no-cache, no-transform")
    res.setHeader("Connection", "keep-alive")
    res.setHeader("X-Accel-Buffering", "no")

    // Gửi header ngay, không chờ đến lúc có thông báo mới.
    res.flushHeaders()

    // Gửi sự kiện xác nhận kết nối; không đưa thông tin người dùng vào handshake.
    res.write(`data: ${JSON.stringify({ type: "connected" })}\n\n`)

    // Đăng ký nhận thông báo; service trả về hàm unsubscribe để gỡ listener sau này.
    const unsubscribe = this.service.subscribeToStream(empId, (notification) => {
      // Mỗi notification được mã hóa JSON và kết thúc bằng hai ký tự xuống dòng theo SSE.
      res.write(`data: ${JSON.stringify(notification)}\n\n`)
    })

    // Gửi heartbeat định kỳ để giúp tránh timeout khi luồng chưa có thông báo mới.
    const keepAliveTimer = setInterval(() => {
      // Dòng bắt đầu bằng dấu ":" là SSE comment, không tạo sự kiện onmessage.
      res.write(": keep-alive\n\n")
    }, NOTIFICATION_STREAM_CONFIG.KEEP_ALIVE_INTERVAL_MS)

    // Gắn thao tác dọn tài nguyên vào sự kiện close của request.
    req.on("close", () => {
      // Dừng heartbeat và gỡ các listener để tránh giữ tài nguyên không cần thiết.
      clearInterval(keepAliveTimer)
      unsubscribe()
    })
  }
}
