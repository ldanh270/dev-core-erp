import {
  NOTIFICATION_PRIORITIES,
  NOTIFICATION_TYPES,
} from "@/configs/entities/notification.config.ts"

import { z } from "zod"

export const notificationQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  type: z.enum(NOTIFICATION_TYPES).optional(),
  read: z
    .preprocess((val) => {
      if (val === "true" || val === true) return true
      if (val === "false" || val === false) return false
      return undefined
    }, z.boolean().optional())
    .optional(),
})

export const createNotificationSchema = z.object({
  employeeId: z.string().min(1, "employeeId is required"),
  title: z.string().min(1, "title is required").max(200, "title too long"),
  message: z.string().min(1, "message is required").max(1000, "message too long"),
  type: z.enum(NOTIFICATION_TYPES).optional(),
  priority: z.enum(NOTIFICATION_PRIORITIES).optional(),
  link: z.string().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
})

export const notificationIdParamSchema = z.object({
  id: z.string().min(1, "Notification ID is required"),
})
