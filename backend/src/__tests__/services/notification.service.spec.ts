/// <reference types="jest" />
import {
  NOTIFICATION_PRIORITY,
  NOTIFICATION_TYPE,
} from "../../configs/entities/notification.config"
import { NotificationService } from "../../services/notification.service"
import type { Notification } from "../../types/notification.types"
import { AppError } from "../../utils/error.util"
import { InMemoryNotificationRepository } from "../helpers/in-memory-notification.repository"

describe("NotificationService", () => {
  let repository: InMemoryNotificationRepository
  let service: NotificationService
  afterEach(() => {
    service.dispose()
  })
  beforeEach(() => {
    repository = new InMemoryNotificationRepository()
    service = new NotificationService(repository)
    jest.clearAllMocks()
  })

  describe("createNotification & real-time delivery", () => {
    it("UTCID01 - successfully creates a notification and pushes it to subscriber", async () => {
      const empId = "emp-001"
      const received: Notification[] = []

      const unsubscribe = service.subscribeToStream(empId, (notif) => {
        received.push(notif)
      })

      const created = await service.createNotification({
        employeeId: empId,
        title: "Duyệt đơn",
        message: "Đơn nghỉ phép của bạn đã được duyệt.",
        type: NOTIFICATION_TYPE.APPLICATION,
        priority: NOTIFICATION_PRIORITY.HIGH,
        link: "/personal/applications",
      })

      expect(created.id).toBeDefined()
      expect(created.employeeId).toBe(empId)
      expect(created.title).toBe("Duyệt đơn")
      expect(created.read).toBe(false)

      expect(received).toHaveLength(1)
      expect(received[0].id).toBe(created.id)

      unsubscribe()
    })

    it("UTCID02 - broadcasts notification to all employees when employeeId is 'all'", async () => {
      const receivedEmp1: Notification[] = []
      const receivedEmp2: Notification[] = []

      const unsub1 = service.subscribeToStream("emp-001", (n) => receivedEmp1.push(n))
      const unsub2 = service.subscribeToStream("emp-002", (n) => receivedEmp2.push(n))

      const created = await service.createNotification({
        employeeId: "all",
        title: "Thông báo bảo trì",
        message: "Hệ thống bảo trì 23:00 tối nay.",
        type: NOTIFICATION_TYPE.SYSTEM,
      })

      expect(receivedEmp1).toHaveLength(1)
      expect(receivedEmp2).toHaveLength(1)
      expect(receivedEmp1[0].id).toBe(created.id)
      expect(receivedEmp2[0].id).toBe(created.id)

      unsub1()
      unsub2()
    })
  })

  describe("listNotifications & pagination", () => {
    it("UTCID03 - lists notifications for an employee including broadcast ones", async () => {
      const empId = "emp-003"
      await service.createNotification({
        employeeId: empId,
        title: "Task mới",
        message: "Bạn được giao task mới.",
        type: NOTIFICATION_TYPE.TASK,
      })

      const result = await service.listNotifications(empId)
      expect(result.notifications.length).toBeGreaterThanOrEqual(1)
      expect(result.total).toBeGreaterThanOrEqual(1)
      expect(result.unreadCount).toBeGreaterThanOrEqual(1)
    })
  })

  describe("markAsRead & markAllAsRead", () => {
    it("UTCID04 - marks a single notification as read", async () => {
      const empId = "emp-004"
      const created = await service.createNotification({
        employeeId: empId,
        title: "Test",
        message: "Message",
      })

      expect(created.read).toBe(false)

      const updated = await service.markAsRead(created.id, empId)
      expect(updated.read).toBe(true)

      const fetched = await service.getNotification(created.id, empId)
      expect(fetched.read).toBe(true)
    })

    it("UTCID05 - marks all notifications as read for an employee", async () => {
      const empId = "emp-005"
      await service.createNotification({
        employeeId: empId,
        title: "Test 1",
        message: "Message 1",
      })
      await service.createNotification({
        employeeId: empId,
        title: "Test 2",
        message: "Message 2",
      })

      const { updatedCount } = await service.markAllAsRead(empId)
      expect(updatedCount).toBeGreaterThanOrEqual(2)

      const count = await service.getUnreadCount(empId)
      expect(count).toBe(0)
    })
  })

  describe("getNotification access control", () => {
    it("UTCID06 - throws 404 when notification does not exist", async () => {
      await expect(service.getNotification("non-existent-id", "emp-001")).rejects.toThrow(AppError)
    })

    it("UTCID07 - throws 403 when trying to access another employee's notification", async () => {
      const created = await service.createNotification({
        employeeId: "emp-owner",
        title: "Private notification",
        message: "Secret",
      })

      await expect(service.getNotification(created.id, "emp-intruder")).rejects.toThrow(AppError)
    })
  })

  describe("deleteNotification", () => {
    it("UTCID08 - deletes notification successfully", async () => {
      const empId = "emp-006"
      const created = await service.createNotification({
        employeeId: empId,
        title: "To delete",
        message: "Delete me",
      })

      const deleted = await service.deleteNotification(created.id, empId)
      expect(deleted).toBe(true)

      await expect(service.getNotification(created.id, empId)).rejects.toThrow(AppError)
    })
  })
})
