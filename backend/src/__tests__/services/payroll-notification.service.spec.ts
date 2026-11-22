import { PAYROLL_STATUS } from "@/configs/entities/payroll.config.ts"
import { NotificationService } from "@/services/notification.service.ts"
import { PayrollNotificationService } from "@/services/payroll-notification.service.ts"
import type { Notification } from "@/types/notification.types.ts"

import { InMemoryNotificationRepository } from "../helpers/in-memory-notification.repository"

/** Verifies that payroll events reach only their intended live inboxes. */
describe("PayrollNotificationService", () => {
  const payroll = {
    id: "payroll-1",
    periodMonth: 11,
    periodYear: 2026,
    status: PAYROLL_STATUS.DRAFT,
  }

  /** Uses the real notification subscriber and an isolated persistence fixture. */
  it("delivers one payslip alert per employee and a separate approval alert", async () => {
    const findApproverIds = jest.fn().mockResolvedValue(["approver"])
    const inbox = new NotificationService(new InMemoryNotificationRepository())
    const received: Notification[] = []
    const unsubscribeOther = inbox.subscribeToStream("other-employee", (notification) => {
      received.push(notification)
    })
    const unsubscribeEmployee = inbox.subscribeToStream("employee", (notification) => {
      received.push(notification)
    })
    const approvals: Notification[] = []
    const unsubscribeApprover = inbox.subscribeToStream("approver", (notification) => {
      approvals.push(notification)
    })

    try {
      new PayrollNotificationService({ findApproverIds }).notifyGeneratedPayroll(payroll, [
        "employee",
        "employee",
      ])

      await new Promise<void>((resolve) => setImmediate(resolve))

      expect(approvals).toHaveLength(1)
      expect(approvals[0]).toMatchObject({
        employeeId: "approver",
        link: "/payroll/list?payrollId=payroll-1",
        message: "Kỳ lương 11/2026 đã được tạo và đang chờ duyệt.",
      })
      expect(received).toHaveLength(1)
      expect(received[0]).toMatchObject({
        employeeId: "employee",
        link: "/payroll/my-payslips?payrollId=payroll-1",
        message: "Bạn có thể kiểm tra phiếu lương kỳ 11/2026.",
      })
      expect(findApproverIds).toHaveBeenCalledTimes(1)
    } finally {
      unsubscribeApprover()
      unsubscribeEmployee()
      unsubscribeOther()
      inbox.dispose()
    }
  })
})
