import { APPLICATION_STATUS, APPLICATION_TYPES } from "@/configs/entities/attendance.config.ts"
import { APPLICATION_NOTIFICATION } from "@/configs/messages/application-notification.message.ts"
import { eventBus } from "@/libs/event-bus.ts"
import {
  notifyApplicationApprover,
  notifyApplicationDecision,
  notifyApplicationSubmitted,
} from "@/services/application-notification.service.ts"
import type { CreateNotificationDto } from "@/types/notification.types.ts"

/** Covers recipient selection and routing at each application handoff. */
describe("Application notifications", () => {
  const applicant = { employeeId: "applicant", type: APPLICATION_TYPES.SHIFT_SWAP.LABEL }
  const received: CreateNotificationDto[] = []
  const collect = (payload: CreateNotificationDto) => received.push(payload)

  beforeEach(() => {
    received.length = 0
    eventBus.onTyped("notification:create", collect)
  })

  afterEach(() => {
    eventBus.offTyped("notification:create", collect)
  })

  /** Confirms only the swap partner receives the first actionable notification. */
  it("waits for the swap partner before notifying the approver", () => {
    const application = {
      ...applicant,
      status: APPLICATION_STATUS.PARTNER_PENDING,
      assignedToId: "approver",
      shiftSwapDetail: { swapWithEmployeeId: "partner" },
    }

    notifyApplicationSubmitted(application)
    expect(received.map(({ employeeId }) => employeeId)).toEqual(["applicant", "partner"])
    expect(received[1].link).toBe(APPLICATION_NOTIFICATION.ROUTE.MANAGE)

    notifyApplicationApprover({ ...application, status: APPLICATION_STATUS.PENDING })
    expect(received.map(({ employeeId }) => employeeId)).toEqual([
      "applicant",
      "partner",
      "approver",
    ])
  })

  /** Confirms a request requiring no partner goes straight to its assigned approver. */
  it("alerts the assigned approver when a request enters the approval queue", () => {
    notifyApplicationSubmitted({
      ...applicant,
      status: APPLICATION_STATUS.PENDING,
      assignedToId: "approver",
    })

    expect(received.map(({ employeeId }) => employeeId)).toEqual(["applicant", "approver"])
  })

  /** Confirms outcome alerts are personal and point to the employee's application list. */
  it.each([APPLICATION_STATUS.APPROVED, APPLICATION_STATUS.REJECTED])(
    "alerts only the applicant after a decision of %s",
    (status) => {
      notifyApplicationDecision(applicant, status)
      expect(received).toHaveLength(1)
      expect(received[0]).toEqual(
        expect.objectContaining({
          employeeId: applicant.employeeId,
          link: APPLICATION_NOTIFICATION.ROUTE.MINE,
        }),
      )
    },
  )
})
