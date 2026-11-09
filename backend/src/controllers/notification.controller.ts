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
 * Controller handling HTTP requests and SSE streaming for notifications.
 * Pure HTTP adapter; delegates all business logic to INotificationService.
 */
export class NotificationController {
  constructor(private readonly service: INotificationService) {}

  list = async (
    req: AuthRequest,
    res: Response<ApiResponse<PaginatedNotifications>>,
  ): Promise<Response> => {
    try {
      if (!req.user) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          data: null,
          error: { message: "Unauthorized", code: "UNAUTHORIZED" },
        })
      }

      const query = notificationQuerySchema.parse(req.query)
      const result = await this.service.listNotifications(req.user.empId, query)

      return res.status(HttpStatusCode.OK).json({ data: result, error: null })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          data: null,
          error: { message: "Validation error", code: "VALIDATION_ERROR" },
        })
      }

      throw error
    }
  }

  getOne = async (
    req: AuthRequest,
    res: Response<ApiResponse<Notification>>,
  ): Promise<Response> => {
    try {
      if (!req.user) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          data: null,
          error: { message: "Unauthorized", code: "UNAUTHORIZED" },
        })
      }

      const { id } = notificationIdParamSchema.parse(req.params)
      const notification = await this.service.getNotification(id, req.user.empId)

      return res.status(HttpStatusCode.OK).json({
        data: notification,
        error: null,
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          data: null,
          error: { message: "Validation error", code: "VALIDATION_ERROR" },
        })
      }

      throw error
    }
  }

  create = async (
    req: AuthRequest,
    res: Response<ApiResponse<Notification>>,
  ): Promise<Response> => {
    try {
      if (!req.user) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          data: null,
          error: { message: "Unauthorized", code: "UNAUTHORIZED" },
        })
      }

      const data = createNotificationSchema.parse(req.body)
      const notification = await this.service.createNotification(data)

      return res.status(HttpStatusCode.CREATED).json({
        data: notification,
        error: null,
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          data: null,
          error: { message: "Validation error", code: "VALIDATION_ERROR" },
        })
      }

      throw error
    }
  }

  markAsRead = async (
    req: AuthRequest,
    res: Response<ApiResponse<Notification>>,
  ): Promise<Response> => {
    try {
      if (!req.user) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          data: null,
          error: { message: "Unauthorized", code: "UNAUTHORIZED" },
        })
      }

      const { id } = notificationIdParamSchema.parse(req.params)
      const updated = await this.service.markAsRead(id, req.user.empId)

      return res.status(HttpStatusCode.OK).json({
        data: updated,
        error: null,
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          data: null,
          error: { message: "Validation error", code: "VALIDATION_ERROR" },
        })
      }

      throw error
    }
  }

  markAllAsRead = async (
    req: AuthRequest,
    res: Response<ApiResponse<{ updatedCount: number }>>,
  ): Promise<Response> => {
    if (!req.user) {
      return res.status(HttpStatusCode.UNAUTHORIZED).json({
        data: null,
        error: { message: "Unauthorized", code: "UNAUTHORIZED" },
      })
    }

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
      if (!req.user) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          data: null,
          error: { message: "Unauthorized", code: "UNAUTHORIZED" },
        })
      }

      const { id } = notificationIdParamSchema.parse(req.params)
      await this.service.deleteNotification(id, req.user.empId)

      return res.status(HttpStatusCode.OK).json({
        data: { success: true },
        error: null,
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          data: null,
          error: { message: "Validation error", code: "VALIDATION_ERROR" },
        })
      }

      throw error
    }
  }

  getUnreadCount = async (
    req: AuthRequest,
    res: Response<ApiResponse<{ count: number }>>,
  ): Promise<Response> => {
    if (!req.user) {
      return res.status(HttpStatusCode.UNAUTHORIZED).json({
        data: null,
        error: { message: "Unauthorized", code: "UNAUTHORIZED" },
      })
    }

    const count = await this.service.getUnreadCount(req.user.empId)

    return res.status(HttpStatusCode.OK).json({
      data: { count },
      error: null,
    })
  }

  /**
   * Real-time Server-Sent Events (SSE) streaming endpoint.
   * Provides live notification delivery to the connected frontend.
   */
  stream = (req: AuthRequest, res: Response): void => {
    if (!req.user) {
      res.status(HttpStatusCode.UNAUTHORIZED).json({
        data: null,
        error: { message: "Unauthorized", code: "UNAUTHORIZED" },
      })
      return
    }

    const empId = req.user.empId

    // Set streaming headers for SSE.
    res.setHeader("Content-Type", "text/event-stream")
    res.setHeader("Cache-Control", "no-cache, no-transform")
    res.setHeader("Connection", "keep-alive")
    res.setHeader("X-Accel-Buffering", "no")
    res.flushHeaders()

    // Send a connection message without echoing user information.
    res.write(`data: ${JSON.stringify({ type: "connected" })}\n\n`)

    // Subscribe to live notifications for this employee.
    const unsubscribe = this.service.subscribeToStream(empId, (notification) => {
      res.write(`data: ${JSON.stringify(notification)}\n\n`)
    })

    // Periodic heartbeat to keep the connection alive through proxies.
    const keepAliveTimer = setInterval(() => {
      res.write(": keep-alive\n\n")
    }, NOTIFICATION_STREAM_CONFIG.KEEP_ALIVE_INTERVAL_MS)

    // Clean up resources upon client disconnect.
    req.on("close", () => {
      clearInterval(keepAliveTimer)
      unsubscribe()
    })
  }
}
