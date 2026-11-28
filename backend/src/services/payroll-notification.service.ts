import { NOTIFICATION_PRIORITY, NOTIFICATION_TYPE } from "@/configs/entities/notification.config.ts"
import {
  PAYROLL_NOTIFICATION,
  PAYROLL_STATUS,
  type PayrollStatusType,
} from "@/configs/entities/payroll.config.ts"
import { eventBus } from "@/libs/event-bus.ts"
import { logger } from "@/utils/logger.util.ts"

/**
 * Describes the committed payroll fields used by notification messages.
 *
 * @typedef {object} GeneratedPayrollFields
 * @property {string} id - Payroll identifier used in the detail link.
 * @property {number} periodMonth - Payroll month.
 * @property {number} periodYear - Payroll year.
 * @property {PayrollStatusType} status - Current payroll status.
 */
type GeneratedPayroll = {
  id: string
  periodMonth: number
  periodYear: number
  status: PayrollStatusType
}

/** Publishes payroll inbox events after payroll and its payslips have committed. */
export class PayrollNotificationService {
  /**
   * Sets up payroll recipient lookup and notification delivery.
   *
   * @param {{ findApproverIds(): Promise<string[]> }} approvers - Lookup for employees authorized to approve payroll.
   * @param {typeof eventBus} [bus] - Event bus for delivery to notification subscribers.
   */
  constructor(
    private readonly approvers: { findApproverIds(): Promise<string[]> },
    private readonly bus = eventBus,
  ) {}

  /**
   * Alerts employees about new payslips and eligible approvers about payroll awaiting review.
   *
   * @param {GeneratedPayroll} payroll - The committed payroll record.
   * @param {readonly string[]} employeeIds - Employees whose payslips were created.
   * @returns {void}
   */
  notifyGeneratedPayroll(payroll: GeneratedPayroll, employeeIds: readonly string[]): void {
    /**
     * Labels the payroll period in employee and approver alerts.
     * @type {string}
     */
    const period = `${payroll.periodMonth}/${payroll.periodYear}`
    /**
     * Encodes the payroll identifier for both notification destinations.
     * @type {string}
     */
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

  /**
   * Sends the payroll review alert to each authorized approver.
   *
   * @param {string} period - Display label for the payroll period.
   * @param {string} query - Serialized query string linking to the payroll record.
   * @returns {Promise<void>} Resolves after the approval events are published.
   */
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
