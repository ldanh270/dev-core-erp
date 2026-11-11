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
 * Handles notification HTTP requests and manages the SSE stream.
 * Validates input, delegates business logic to the service, and formats HTTP responses.
 */
export class NotificationController {
  constructor(private readonly service: INotificationService) {
    // Inject the service so the controller remains independent of persistence details.
  }

  list = async (
    req: AuthRequest,
    res: Response<ApiResponse<PaginatedNotifications>>,
  ): Promise<Response> => {
    try {
      // Ensure authentication middleware attached the current user to the request.
      if (!req.user) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          data: null,
          error: { message: "Unauthorized", code: "UNAUTHORIZED" },
        })
      }

      // Validate and transform pagination, notification type, and read-state query parameters.
      const query = notificationQuerySchema.parse(req.query)

      // List notifications for the authenticated employee, never using an employee ID from the client.
      const result = await this.service.listNotifications(req.user.empId, query)

      return res.status(HttpStatusCode.OK).json({
        data: result,
        error: null,
      })
    } catch (error) {
      // Return HTTP 400 when Zod validation fails.
      if (error instanceof z.ZodError) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          data: null,
          error: { message: "Validation error", code: "VALIDATION_ERROR" },
        })
      }

      // Delegate all other errors to the application's common error middleware.
      throw error
    }
  }

  getOne = async (
    req: AuthRequest,
    res: Response<ApiResponse<Notification>>,
  ): Promise<Response> => {
    try {
      // Ensure authentication middleware attached the current user to the request.
      if (!req.user) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          data: null,
          error: { message: "Unauthorized", code: "UNAUTHORIZED" },
        })
      }

      // Validate the notification ID before calling the service.
      const { id } = notificationIdParamSchema.parse(req.params)

      // Let the service load the notification and verify access for the current employee.
      const notification = await this.service.getNotification(id, req.user.empId)

      return res.status(HttpStatusCode.OK).json({
        data: notification,
        error: null,
      })
    } catch (error) {
      // Return HTTP 400 when Zod validation fails.
      if (error instanceof z.ZodError) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          data: null,
          error: { message: "Validation error", code: "VALIDATION_ERROR" },
        })
      }

      // Delegate all other errors to the application's common error middleware.
      throw error
    }
  }

  create = async (
    req: AuthRequest,
    res: Response<ApiResponse<Notification>>,
  ): Promise<Response> => {
    try {
      // Ensure authentication middleware attached the current user to the request.
      if (!req.user) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          data: null,
          error: { message: "Unauthorized", code: "UNAUTHORIZED" },
        })
      }

      // Validate the request body against the schema before creating the notification.
      const data = createNotificationSchema.parse(req.body)

      // Let the service persist the notification and publish its real-time event.
      const notification = await this.service.createNotification(data)

      return res.status(HttpStatusCode.CREATED).json({
        data: notification,
        error: null,
      })
    } catch (error) {
      // Return HTTP 400 when Zod validation fails.
      if (error instanceof z.ZodError) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          data: null,
          error: { message: "Validation error", code: "VALIDATION_ERROR" },
        })
      }

      // Delegate all other errors to the application's common error middleware.
      throw error
    }
  }

  markAsRead = async (
    req: AuthRequest,
    res: Response<ApiResponse<Notification>>,
  ): Promise<Response> => {
    try {
      // Ensure authentication middleware attached the current user to the request.
      if (!req.user) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          data: null,
          error: { message: "Unauthorized", code: "UNAUTHORIZED" },
        })
      }

      // Validate the notification ID before calling the service.
      const { id } = notificationIdParamSchema.parse(req.params)

      // Mark the notification as read for the current recipient after service-level authorization.
      const updated = await this.service.markAsRead(id, req.user.empId)

      return res.status(HttpStatusCode.OK).json({
        data: updated,
        error: null,
      })
    } catch (error) {
      // Return HTTP 400 when Zod validation fails.
      if (error instanceof z.ZodError) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          data: null,
          error: { message: "Validation error", code: "VALIDATION_ERROR" },
        })
      }

      // Delegate all other errors to the application's common error middleware.
      throw error
    }
  }

  markAllAsRead = async (
    req: AuthRequest,
    res: Response<ApiResponse<{ updatedCount: number }>>,
  ): Promise<Response> => {
    // Ensure authentication middleware attached the current user to the request.
    if (!req.user) {
      return res.status(HttpStatusCode.UNAUTHORIZED).json({
        data: null,
        error: { message: "Unauthorized", code: "UNAUTHORIZED" },
      })
    }

    // Mark all visible notifications as read and return the number of updates.
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
      // Ensure authentication middleware attached the current user to the request.
      if (!req.user) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          data: null,
          error: { message: "Unauthorized", code: "UNAUTHORIZED" },
        })
      }

      // Validate the notification ID before calling the service.
      const { id } = notificationIdParamSchema.parse(req.params)

      // Let the service verify access and hide the notification from this recipient's inbox.
      await this.service.deleteNotification(id, req.user.empId)

      return res.status(HttpStatusCode.OK).json({
        data: { success: true },
        error: null,
      })
    } catch (error) {
      // Return HTTP 400 when Zod validation fails.
      if (error instanceof z.ZodError) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          data: null,
          error: { message: "Validation error", code: "VALIDATION_ERROR" },
        })
      }

      // Delegate all other errors to the application's common error middleware.
      throw error
    }
  }

  getUnreadCount = async (
    req: AuthRequest,
    res: Response<ApiResponse<{ count: number }>>,
  ): Promise<Response> => {
    // Ensure authentication middleware attached the current user to the request.
    if (!req.user) {
      return res.status(HttpStatusCode.UNAUTHORIZED).json({
        data: null,
        error: { message: "Unauthorized", code: "UNAUTHORIZED" },
      })
    }

    // Retrieve the employee's unread count for display in the frontend badge.
    const count = await this.service.getUnreadCount(req.user.empId)

    return res.status(HttpStatusCode.OK).json({
      data: { count },
      error: null,
    })
  }

  /**
   * Keeps the HTTP response open so the server can push notifications through SSE.
   */
  stream = (req: AuthRequest, res: Response): void => {
    // Ensure authentication middleware attached the current user to the request.
    if (!req.user) {
      res.status(HttpStatusCode.UNAUTHORIZED).json({
        data: null,
        error: { message: "Unauthorized", code: "UNAUTHORIZED" },
      })
      return
    }

    // Use the authenticated employee ID to subscribe to the correct notification channel.
    const empId = req.user.empId

    // Configure the response as SSE, disable caching, and keep the connection open.
    // X-Accel-Buffering tells Nginx to send data without buffering it.
    res.setHeader("Content-Type", "text/event-stream")
    res.setHeader("Cache-Control", "no-cache, no-transform")
    res.setHeader("Connection", "keep-alive")
    res.setHeader("X-Accel-Buffering", "no")

    // Send headers immediately instead of waiting for the first notification.
    res.flushHeaders()

    // Send a connection confirmation without exposing user data in the handshake.
    res.write(`data: ${JSON.stringify({ type: "connected" })}\n\n`)

    // Subscribe to notifications and retain the unsubscribe callback for cleanup.
    const unsubscribe = this.service.subscribeToStream(empId, (notification) => {
      // Encode each notification as JSON and terminate it with the SSE line ending.
      res.write(`data: ${JSON.stringify(notification)}\n\n`)
    })

    // Send periodic heartbeats to prevent timeouts while no notification is available.
    const keepAliveTimer = setInterval(() => {
      // A line starting with ":" is an SSE comment and does not trigger onmessage.
      res.write(": keep-alive\n\n")
    }, NOTIFICATION_STREAM_CONFIG.KEEP_ALIVE_INTERVAL_MS)

    // Attach resource cleanup to the request close event.
    req.on("close", () => {
      // Stop the heartbeat and remove listeners to release resources.
      clearInterval(keepAliveTimer)
      unsubscribe()
    })
  }
}
