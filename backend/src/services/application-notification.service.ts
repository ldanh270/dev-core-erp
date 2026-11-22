import {
  APPLICATION_STATUS,
  type IApplicationStatus,
} from "@/configs/entities/attendance.config.ts"
import { NOTIFICATION_PRIORITY, NOTIFICATION_TYPE } from "@/configs/entities/notification.config.ts"
import { APPLICATION_NOTIFICATION } from "@/configs/messages/application-notification.message.ts"
import { eventBus } from "@/libs/event-bus.ts"

/** The application fields required to address and describe a notification. */
interface ApplicationNotificationDetails {
  employeeId: string
  type: string
}

/** The persisted routing information for a submitted or partner-confirmed application. */
interface ApplicationNotificationRoute extends ApplicationNotificationDetails {
  status: IApplicationStatus
  assignedToId: string | null
  shiftSwapDetail?: { swapWithEmployeeId: string | null } | null
}

/** Sends the existing submission receipt and alerts the person responsible for the next step. */
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

/** Alerts the assigned approver after the request enters the manager's queue. */
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

/** Sends the applicant the outcome of a committed manager or swap-partner decision. */
export function notifyApplicationDecision(
  application: ApplicationNotificationDetails,
  status: typeof APPLICATION_STATUS.APPROVED | typeof APPLICATION_STATUS.REJECTED,
): void {
  const { APPROVED, REJECTED, ROUTE } = APPLICATION_NOTIFICATION
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
