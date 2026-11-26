import {
  APPLICATION_STATUS,
  type IApplicationStatus,
} from "@/configs/entities/attendance.config.ts"
import { NOTIFICATION_PRIORITY, NOTIFICATION_TYPE } from "@/configs/entities/notification.config.ts"
import { APPLICATION_NOTIFICATION } from "@/configs/messages/application-notification.message.ts"
import { eventBus } from "@/libs/event-bus.ts"

/**
 * Fields used to address an application notification.
 *
 * @typedef {object} ApplicationNotificationDetailsFields
 * @property {string} employeeId - Identifier of the employee who submitted the application.
 * @property {string} type - Application type used in the message.
 */
interface ApplicationNotificationDetails {
  employeeId: string
  type: string
}

/**
 * Persisted fields that identify the next recipient in the application workflow.
 *
 * @typedef {ApplicationNotificationDetailsFields & object} ApplicationNotificationRoutingFields
 * @property {IApplicationStatus} status - Current workflow status.
 * @property {string | null} assignedToId - Assigned approver identifier, if one exists.
 * @property {{ swapWithEmployeeId: string | null } | null} [shiftSwapDetail] - Optional details identifying the swap partner.
 */
interface ApplicationNotificationRoute extends ApplicationNotificationDetails {
  status: IApplicationStatus
  assignedToId: string | null
  shiftSwapDetail?: { swapWithEmployeeId: string | null } | null
}

/**
 * Confirms receipt to the applicant and alerts the person responsible for the next step.
 *
 * @param {ApplicationNotificationRoute} application - Persisted application with its current routing information.
 * @returns {void}
 */
export function notifyApplicationSubmitted(application: ApplicationNotificationRoute): void {
  const { SUBMITTED, NEEDS_SWAP_CONFIRMATION, ROUTE } = APPLICATION_NOTIFICATION
  eventBus.emitTyped("notification:create", {
    employeeId: application.employeeId,
    title: SUBMITTED.title,
    message: SUBMITTED.message(application.type),
    type: NOTIFICATION_TYPE.APPLICATION,
    priority: NOTIFICATION_PRIORITY.MEDIUM,
    link: ROUTE.MINE,
  })

  if (application.status === APPLICATION_STATUS.PARTNER_PENDING) {
    /**
     * Identifies the colleague who must confirm the swap.
     * @type {string | null | undefined}
     */
    const partnerId = application.shiftSwapDetail?.swapWithEmployeeId
    if (partnerId) {
      eventBus.emitTyped("notification:create", {
        employeeId: partnerId,
        ...NEEDS_SWAP_CONFIRMATION,
        type: NOTIFICATION_TYPE.APPLICATION,
        priority: NOTIFICATION_PRIORITY.HIGH,
        link: ROUTE.MANAGE,
      })
    }
    return
  }

  notifyApplicationApprover(application)
}

/**
 * Alerts the assigned approver when the application is ready for review.
 *
 * @param {ApplicationNotificationRoute} application - Persisted application with its current routing information.
 * @returns {void}
 */
export function notifyApplicationApprover(application: ApplicationNotificationRoute): void {
  if (
    application.status !== APPLICATION_STATUS.PENDING ||
    !application.assignedToId ||
    application.assignedToId === application.employeeId
  ) {
    return
  }

  const { NEEDS_APPROVAL, ROUTE } = APPLICATION_NOTIFICATION
  eventBus.emitTyped("notification:create", {
    employeeId: application.assignedToId,
    title: NEEDS_APPROVAL.title,
    message: NEEDS_APPROVAL.message(application.type),
    type: NOTIFICATION_TYPE.APPLICATION,
    priority: NOTIFICATION_PRIORITY.HIGH,
    link: ROUTE.MANAGE,
  })
}

/**
 * Informs the applicant of a recorded approval or rejection.
 *
 * @param {ApplicationNotificationDetails} application - Applicant identifier and application type.
 * @param {typeof APPLICATION_STATUS.APPROVED | typeof APPLICATION_STATUS.REJECTED} status - Recorded decision.
 * @returns {void}
 */
export function notifyApplicationDecision(
  application: ApplicationNotificationDetails,
  status: typeof APPLICATION_STATUS.APPROVED | typeof APPLICATION_STATUS.REJECTED,
): void {
  const { APPROVED, REJECTED, ROUTE } = APPLICATION_NOTIFICATION
  /**
   * Indicates whether the recorded decision was an approval.
   * @type {boolean}
   */
  const approved = status === APPLICATION_STATUS.APPROVED
  const copy = approved ? APPROVED : REJECTED
  eventBus.emitTyped("notification:create", {
    employeeId: application.employeeId,
    title: copy.title,
    message: copy.message(application.type),
    type: approved ? NOTIFICATION_TYPE.SUCCESS : NOTIFICATION_TYPE.WARNING,
    priority: NOTIFICATION_PRIORITY.HIGH,
    link: ROUTE.MINE,
  })
}
