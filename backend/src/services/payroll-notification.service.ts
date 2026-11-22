import { NOTIFICATION_PRIORITY, NOTIFICATION_TYPE } from "@/configs/entities/notification.config.ts"
import {
  PAYROLL_NOTIFICATION,
  PAYROLL_STATUS,
  type PayrollStatusType,
} from "@/configs/entities/payroll.config.ts"
import { eventBus } from "@/libs/event-bus.ts"
import { logger } from "@/utils/logger.util.ts"

/** Public payroll fields used to build an inbox message. */
type GeneratedPayroll = {
  id: string
  periodMonth: number
  periodYear: number
  status: PayrollStatusType
}

/** Publishes payroll inbox events after payroll and its payslips have committed. */
export class PayrollNotificationService {
  /** Injects the employee lookup and notification transport. */
  constructor(
    private readonly approvers: { findApproverIds(): Promise<string[]> },
    private readonly bus = eventBus,
  ) {}

  /** Notifies employees with persisted payslips and users who can approve the generated payroll. */
  notifyGeneratedPayroll(payroll: GeneratedPayroll, employeeIds: readonly string[]): void {
    const period = `${payroll.periodMonth}/${payroll.periodYear}`
    const query = new URLSearchParams({
      [PAYROLL_NOTIFICATION.PAYROLL_ID_PARAM]: payroll.id,
    }).toString()
    const { PAYSLIP } = PAYROLL_NOTIFICATION
    for (const employeeId of new Set(employeeIds)) {
      this.bus.emitTyped("notification:create", {
        employeeId,
        title: PAYSLIP.TITLE,
        message: PAYSLIP.message(period),
        type: NOTIFICATION_TYPE.PAYROLL,
        priority: NOTIFICATION_PRIORITY.MEDIUM,
        link: `${PAYSLIP.PATH}?${query}`,
      })
    }

    if (
      payroll.status === PAYROLL_STATUS.DRAFT ||
      payroll.status === PAYROLL_STATUS.PENDING_APPROVAL
    ) {
      void this.notifyApprovers(period, query).catch((error) => {
        logger.error("Failed to notify payroll approvers:", error)
      })
    }
  }

  /** Sends one approval notification to each authorized employee. */
  private async notifyApprovers(period: string, query: string): Promise<void> {
    const approverIds = await this.approvers.findApproverIds()
    const { APPROVAL } = PAYROLL_NOTIFICATION
    for (const employeeId of approverIds) {
      this.bus.emitTyped("notification:create", {
        employeeId,
        title: APPROVAL.TITLE,
        message: APPROVAL.message(period),
        type: NOTIFICATION_TYPE.PAYROLL,
        priority: NOTIFICATION_PRIORITY.HIGH,
        link: `${APPROVAL.PATH}?${query}`,
      })
    }
  }
}
