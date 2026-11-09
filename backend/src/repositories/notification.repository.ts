import { NOTIFICATION_AUDIENCE } from "@/configs/entities/notification-audience.config.ts"
import {
  NOTIFICATION_PAGINATION,
  NOTIFICATION_PRIORITY,
  NOTIFICATION_TYPE,
} from "@/configs/entities/notification.config.ts"
import type {
  CreateNotificationDto,
  INotificationRepository,
  Notification,
  NotificationQuery,
  PaginatedNotifications,
} from "@/types/notification.types.ts"

import { Prisma, type PrismaClient } from "@prisma/client"
import { z } from "zod"

type StoredNotification = Prisma.NotificationGetPayload<{
  include: { states: true }
}>

export class PrismaNotificationRepository implements INotificationRepository {
  constructor(private readonly db: PrismaClient) {
    // Sử dụng Prisma client được truyền vào, không tự tạo dữ liệu mẫu.
  }

  private visibleWhere(employeeId: string): Prisma.NotificationWhereInput {
    // Lấy thông báo cá nhân và thông báo chung chưa bị nhân viên này xóa.
    return {
      OR: [{ employeeId }, { employeeId: null }],
      states: {
        none: {
          employeeId,
          deleted: true,
        },
      },
    }
  }

  private toDomain(row: StoredNotification): Notification {
    // Mảng states có thể rỗng khi nhân viên chưa tương tác với thông báo.
    // Các truy vấn lấy dữ liệu chỉ bao gồm state của người đang xem.
    const state = row.states.length > 0 ? row.states[0] : undefined

    return {
      id: row.id,
      employeeId: row.employeeId ?? NOTIFICATION_AUDIENCE.ALL,
      title: row.title,
      message: row.message,
      type: z.enum(NOTIFICATION_TYPE).parse(row.type),
      priority: z.enum(NOTIFICATION_PRIORITY).parse(row.priority),
      read: state?.read ?? false,
      link: row.link,
      metadata: z.record(z.string(), z.unknown()).nullable().parse(row.metadata),
      createdAt: row.createdAt,
      updatedAt: state?.updatedAt ?? row.updatedAt,
    }
  }

  async findById(
    id: string,
    employeeId: string,
  ): Promise<Notification | null> {
    // Lấy thông báo cùng trạng thái riêng của người xem.
    // Service chịu trách nhiệm kiểm tra quyền trước khi trả dữ liệu ra ngoài.
    const row = await this.db.notification.findUnique({
      where: { id },
      include: {
        states: {
          where: { employeeId },
        },
      },
    })

    if (!row || row.states.some((state) => state.deleted)) {
      return null
    }

    return this.toDomain(row)
  }

  async findByEmployeeId(
    employeeId: string,
    query?: NotificationQuery,
  ): Promise<PaginatedNotifications> {
    // Chuẩn hóa phân trang theo giới hạn cấu hình.
    const page = Math.max(
      1,
      query?.page ?? NOTIFICATION_PAGINATION.DEFAULT_PAGE,
    )

    const limit = Math.min(
      NOTIFICATION_PAGINATION.MAX_LIMIT,
      Math.max(1, query?.limit ?? NOTIFICATION_PAGINATION.DEFAULT_LIMIT),
    )

    // Số chưa đọc độc lập với bộ lọc và trang hiện tại.
    const unreadWhere: Prisma.NotificationWhereInput = {
      AND: [
        this.visibleWhere(employeeId),
        {
          states: {
            none: {
              employeeId,
              read: true,
            },
          },
        },
      ],
    }

    // Chỉ bổ sung bộ lọc khi có giá trị, tránh truyền undefined vào Prisma.
    const where: Prisma.NotificationWhereInput = {
      AND: [
        this.visibleWhere(employeeId),
        {
          ...(query?.type === undefined ? {} : { type: query.type }),
          ...(query?.read === undefined
            ? {}
            : {
                states: query.read
                  ? {
                      some: {
                        employeeId,
                        read: true,
                      },
                    }
                  : {
                      none: {
                        employeeId,
                        read: true,
                      },
                    },
              }),
        },
      ],
    }

    // Dùng cùng snapshot để danh sách và các số đếm nhất quán.
    // Sắp xếp thêm theo id để phân trang ổn định khi trùng thời gian tạo.
    const [rows, total, unreadCount] = await this.db.$transaction(
      [
        this.db.notification.findMany({
          where,
          include: {
            states: {
              where: { employeeId },
            },
          },
          orderBy: [
            { createdAt: "desc" },
            { id: "desc" },
          ],
          skip: (page - 1) * limit,
          take: limit,
        }),
        this.db.notification.count({ where }),
        this.db.notification.count({ where: unreadWhere }),
      ],
      {
        isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
      },
    )

    return {
      notifications: rows.map((row) => this.toDomain(row)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      unreadCount,
    }
  }

  async create(data: CreateNotificationDto): Promise<Notification> {
    // Lưu vào DB trước khi service phát sự kiện SSE.
    // Thông báo chung dùng employeeId = null trong DB.
    const row = await this.db.notification.create({
      data: {
        employeeId:
          data.employeeId === NOTIFICATION_AUDIENCE.ALL
            ? null
            : data.employeeId,
        title: data.title,
        message: data.message,
        type: data.type ?? NOTIFICATION_TYPE.INFO,
        priority: data.priority ?? NOTIFICATION_PRIORITY.MEDIUM,
        link: data.link ?? null,
        metadata:
          data.metadata === undefined || data.metadata === null
            ? Prisma.DbNull
            : z.record(z.string(), z.json()).parse(data.metadata),
      },
      include: { states: true },
    })

    return this.toDomain(row)
  }

  async markAsRead(
    id: string,
    employeeId: string,
  ): Promise<Notification | null> {
    // Kiểm tra thông báo có thể xem trước khi cập nhật state cá nhân.
    return this.db.$transaction(async (tx) => {
      const row = await tx.notification.findFirst({
        where: {
          id,
          ...this.visibleWhere(employeeId),
        },
      })

      if (!row) {
        return null
      }

      const state = await tx.notificationRecipientState.upsert({
        where: {
          notificationId_employeeId: {
            notificationId: id,
            employeeId,
          },
        },
        create: {
          notificationId: id,
          employeeId,
          read: true,
        },
        update: {
          read: true,
        },
      })

      // Không trả lại thông báo nếu người nhận đã xóa trong lúc cập nhật.
      if (state.deleted) {
        return null
      }

      return this.toDomain({
        ...row,
        states: [state],
      })
    })
  }

  async markAllAsRead(employeeId: string): Promise<number> {
    // Chỉ đánh dấu các thông báo chưa đọc còn hiển thị với người nhận.
    return this.db.$transaction(async (tx) => {
      const rows = await tx.notification.findMany({
        where: {
          AND: [
            this.visibleWhere(employeeId),
            {
              states: {
                none: {
                  employeeId,
                  read: true,
                },
              },
            },
          ],
        },
        select: { id: true },
      })

      if (rows.length === 0) {
        return 0
      }

      // Tạo state đã đọc cho những thông báo chưa có state cá nhân.
      const created = await tx.notificationRecipientState.createMany({
        data: rows.map(({ id }) => ({
          notificationId: id,
          employeeId,
          read: true,
        })),
        skipDuplicates: true,
      })

      // Cập nhật những state đã tồn tại nhưng vẫn chưa đọc.
      // Loại trừ state đã xóa để không khôi phục thông báo.
      const updated = await tx.notificationRecipientState.updateMany({
        where: {
          employeeId,
          notificationId: {
            in: rows.map(({ id }) => id),
          },
          read: false,
          deleted: false,
        },
        data: {
          read: true,
        },
      })

      return created.count + updated.count
    })
  }

  async delete(id: string, employeeId: string): Promise<boolean> {
    // Chỉ ẩn thông báo đối với người hiện tại.
    // Người nhận khác vẫn giữ nguyên nội dung và trạng thái của họ.
    return this.db.$transaction(async (tx) => {
      const row = await tx.notification.findFirst({
        where: {
          id,
          ...this.visibleWhere(employeeId),
        },
      })

      if (!row) {
        return false
      }

      await tx.notificationRecipientState.upsert({
        where: {
          notificationId_employeeId: {
            notificationId: id,
            employeeId,
          },
        },
        create: {
          notificationId: id,
          employeeId,
          deleted: true,
        },
        update: {
          deleted: true,
        },
      })

      return true
    })
  }

  async getUnreadCount(employeeId: string): Promise<number> {
    // Đếm thông báo chưa được nhân viên này đọc và chưa bị họ xóa.
    return this.db.notification.count({
      where: {
        AND: [
          this.visibleWhere(employeeId),
          {
            states: {
              none: {
                employeeId,
                read: true,
              },
            },
          },
        ],
      },
    })
  }
}