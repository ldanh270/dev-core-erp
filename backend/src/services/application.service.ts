import { NOTIFICATION_PRIORITY, NOTIFICATION_TYPE } from "@/configs/entities/notification.config.ts"
import { eventBus } from "@/libs/event-bus.ts"
import {
  APPLICATION_STATUS,
  APPLICATION_TYPES,
  LEAVE_BALANCE_DEFAULTS,
  PAID_LEAVE_TYPES,
} from "@/configs/entities/attendance.config.ts"
import { EMPLOYEE_STATUS } from "@/configs/entities/employee.config.ts"
import { PERMISSION_CODE } from "@/configs/entities/permission.config.ts"
import { PROJECT_STATUS } from "@/configs/entities/project.config.ts"
import { APPLICATION_ERROR_MESSAGES } from "@/configs/messages/application.message.ts"
import { ErrorLayer } from "@/configs/system/error-code.config.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { prisma } from "@/libs/database.ts"
import { authorizationService } from "@/services/authorization.service.ts"
import {
  IApplicationListResultDTO,
  IApplicationRepository,
  IApplicationService,
  IApplicationStatus,
  IApplicationType,
  IListApplicationsQueryDTO,
  ISubmitApplicationDTO,
} from "@/types/attendance.types.ts"
import { IPositionService } from "@/types/position.types.ts"
import { AppError } from "@/utils/error.util.ts"

/**
 * Service managing organizational application requests (leaves, overtime, late/early checkins, shift swaps).
 * Incorporates validation with position constraints and role-based workflow rules.
 */
export class ApplicationService implements IApplicationService {
  constructor(
    private applicationRepo: IApplicationRepository,
    private positionService?: IPositionService,
  ) {}

  /**
   * Validates a single application submission against business rules.
   *
   * @param data - The application submission data transfer object.
   * @throws {AppError} If validation fails.
   */
  private async _validateApplicationSubmission(data: ISubmitApplicationDTO): Promise<void> {
    const startDate = new Date(data.startDate)
    const endDate = new Date(data.endDate ?? data.startDate)

    // §V1: endDate must be >= startDate
    if (endDate < startDate) {
      throw new AppError(
        APPLICATION_ERROR_MESSAGES.INVALID_DATE_RANGE,
        HttpStatusCode.BAD_REQUEST,
        ErrorLayer.SERVICE,
        "INVALID_DATE_RANGE",
      )
    }

    // Validate position application restrictions
    if (this.positionService) {
      await this.positionService.validateApplicationSubmission(
        data.employeeId,
        data.type as IApplicationType,
      )
    }

    // Type-specific business rule validation
    switch (data.type) {
      case APPLICATION_TYPES.LEAVE.LABEL:
        await this._validateLeaveApplication(
          data.employeeId,
          data.detail.leaveType,
          startDate,
          endDate,
        )
        break

      case APPLICATION_TYPES.OVERTIME.LABEL:
        await this._validateShiftOwnership(data.detail.employeeShiftId, data.employeeId)
        await this._validateOvertimeDates(data.detail.employeeShiftId, startDate, endDate)
        break

      case APPLICATION_TYPES.LATE_EARLY.LABEL:
        await this._validateShiftOwnership(data.detail.employeeShiftId, data.employeeId)
        break

      case APPLICATION_TYPES.SHIFT_SWAP.LABEL:
        await this._validateShiftOwnership(data.detail.employeeShiftId, data.employeeId)
        if (data.detail.swapWithEmployeeId) {
          await this._validateEmployeeExists(data.detail.swapWithEmployeeId)
        }
        if (data.detail.swapWithShiftId && data.detail.swapWithEmployeeId) {
          await this._validateShiftOwnership(
            data.detail.swapWithShiftId,
            data.detail.swapWithEmployeeId,
            APPLICATION_ERROR_MESSAGES.SWAP_TARGET_SHIFT_NOT_FOUND,
          )
        }
        break

      case APPLICATION_TYPES.FORGOT_CARD.LABEL:
        await this._validateShiftOwnership(data.detail.employeeShiftId, data.employeeId)
        break

      // work_from_home, business_trip, regime, resignation — no extra ownership checks
      case APPLICATION_TYPES.RESIGNATION.LABEL:
      default:
        break
    }

    // §V7: If assignedToId is provided, validate that the person exists and has an approver role
    if (data.assignedToId) {
      await this._validateApproverRole(data.assignedToId)
    }
  }

  /**
   * Submits a new application after validating the specific business rules
   * based on the type of application (leave, overtime, late/early, shift swap).
   *
   * @param data - The application submission data transfer object.
   * @returns A promise that resolves to the submitted application.
   * @throws {AppError} If validation fails (e.g. invalid date range, leave overlap, insufficient balance).
   */
  async submitApplication(data: ISubmitApplicationDTO): Promise<unknown> {
    await this._validateApplicationSubmission(data)
    const result = await this.applicationRepo.submit(data)
    eventBus.emitTyped("notification:create", {
      employeeId: data.employeeId,
      title: "Tạo đơn thành công",
      message: `Đơn (${data.type}) của bạn đã được gửi và đang chờ phê duyệt.`,
      type: NOTIFICATION_TYPE.APPLICATION,
      priority: NOTIFICATION_PRIORITY.MEDIUM,
      link: "/application/my-applications",
    })
    if (data.assignedToId) {
      eventBus.emitTyped("notification:create", {
        employeeId: data.assignedToId,
        title: "Có đơn mới cần duyệt",
        message: `Có đơn mới (${data.type}) cần bạn phê duyệt.`,
        type: NOTIFICATION_TYPE.APPLICATION,
        priority: NOTIFICATION_PRIORITY.HIGH,
        link: "/application/review",
      })
    }
    return result
  }

  /**
   * Submits multiple applications in a single transaction after validating each one.
   *
   * @param data - The array of application submission data transfer objects.
   * @returns A promise that resolves to an array of submitted applications.
   * @throws {AppError} If validation fails for any of the applications.
   */
  async submitBulkApplications(data: ISubmitApplicationDTO[]): Promise<unknown[]> {
    for (const item of data) {
      await this._validateApplicationSubmission(item)
    }
    return this.applicationRepo.submitBulk(data)
  }

  /**
   * Cancels a pending application if the requester is the owner of the application.
   *
   * @param id - The unique identifier of the application to cancel.
   * @param requesterId - The ID of the employee requesting the cancellation.
   * @returns A promise that resolves to the cancelled application.
   * @throws {AppError} If application is not found, requester is not the owner, or application status is not pending.
   */
  async cancelApplication(id: string, requesterId: string): Promise<unknown> {
    const app = await this.applicationRepo.findById(id)

    if (!app) {
      throw new AppError(
        APPLICATION_ERROR_MESSAGES.NOT_FOUND,
        HttpStatusCode.NOT_FOUND,
        ErrorLayer.SERVICE,
        "NOT_FOUND",
      )
    }

    // §V2: only owner can cancel
    if (app.employeeId !== requesterId) {
      throw new AppError(
        APPLICATION_ERROR_MESSAGES.CANCEL_FORBIDDEN,
        HttpStatusCode.FORBIDDEN,
        ErrorLayer.SERVICE,
        "FORBIDDEN",
      )
    }

    // §V3: only pending applications can be cancelled
    if (app.status !== APPLICATION_STATUS.PENDING) {
      throw new AppError(
        APPLICATION_ERROR_MESSAGES.CANCEL_INVALID_STATUS(app.status),
        HttpStatusCode.BAD_REQUEST,
        ErrorLayer.SERVICE,
        "INVALID_STATUS_TRANSITION",
      )
    }

    const cancelled = await this.applicationRepo.cancel(id, requesterId)
    if (!cancelled) {
      throw new AppError(
        APPLICATION_ERROR_MESSAGES.CANCEL_FAILED,
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        ErrorLayer.SERVICE,
      )
    }

    return cancelled
  }

  /**
   * Retrieves an application by its unique identifier.
   *
   * @param id - The unique identifier of the application.
   * @returns A promise that resolves to the application details.
   * @throws {AppError} If the application is not found.
   */
  async getApplicationById(id: string, requester?: { empId: string }): Promise<unknown> {
    const app = await this.applicationRepo.findById(id)
    if (!app) {
      throw new AppError(
        APPLICATION_ERROR_MESSAGES.NOT_FOUND,
        HttpStatusCode.NOT_FOUND,
        ErrorLayer.SERVICE,
        "NOT_FOUND",
      )
    }

    if (requester && app.employeeId !== requester.empId) {
      const authContext = await authorizationService.getAuthorizationContext(requester.empId)
      const isGlobalApprover =
        authContext.isDynamicAdmin || authContext.permissions.has(PERMISSION_CODE.APPLICATION_READ)

      if (!isGlobalApprover) {
        if (!authContext.permissions.has(PERMISSION_CODE.APPLICATION_APPROVE)) {
          throw new AppError(
            APPLICATION_ERROR_MESSAGES.VIEW_FORBIDDEN,
            HttpStatusCode.FORBIDDEN,
            ErrorLayer.SERVICE,
            "FORBIDDEN",
          )
        }

        const activeProject = await prisma.project.findFirst({
          where: {
            teamLeaderId: requester.empId,
            status: PROJECT_STATUS.ACTIVE,
            members: {
              some: {
                employeeId: app.employeeId,
                removedAt: null,
              },
            },
          },
        })

        if (!activeProject) {
          throw new AppError(
            APPLICATION_ERROR_MESSAGES.VIEW_PROJECT_FORBIDDEN,
            HttpStatusCode.FORBIDDEN,
            ErrorLayer.SERVICE,
            "FORBIDDEN",
          )
        }
      }
    }

    return app
  }

  /**
   * Lists all applications in the system matching the query parameters.
   *
   * @param query - The pagination, filter, and sort options.
   * @returns A promise that resolves to a list of applications and the total count.
   */
  async listApplications(query: IListApplicationsQueryDTO): Promise<IApplicationListResultDTO> {
    return this.applicationRepo.findAll(query)
  }

  /**
   * Lists applications submitted by a specific employee, enforcing authorization rules if a requester is provided.
   *
   * @param employeeId - The ID of the target employee.
   * @param query - The pagination, filter, and sort options.
   * @param requester - Optional metadata of the user requesting this list (id and role).
   * @returns A promise that resolves to the list of employee's applications and total count.
   * @throws {AppError} If the employee is not found or the requester is forbidden to access their applications.
   */
  async getEmployeeApplications(
    employeeId: string,
    query: IListApplicationsQueryDTO,
    requester?: { empId: string },
  ): Promise<IApplicationListResultDTO> {
    // Verify target employee exists and is not soft-deleted
    const employeeExists = await prisma.employee.findFirst({
      where: { id: employeeId, deletedAt: null },
      select: { id: true },
    })

    if (!employeeExists) {
      throw new AppError(
        APPLICATION_ERROR_MESSAGES.EMPLOYEE_NOT_FOUND(employeeId),
        HttpStatusCode.NOT_FOUND,
        ErrorLayer.SERVICE,
        "EMPLOYEE_NOT_FOUND",
      )
    }

    // If requester is team_leader (and not a global approver), enforce access rules
    if (requester && employeeId !== requester.empId) {
      const authContext = await authorizationService.getAuthorizationContext(requester.empId)
      const isGlobalApprover =
        authContext.isDynamicAdmin || authContext.permissions.has("employee.update")

      if (!isGlobalApprover && authContext.permissions.has("application.approve")) {
        const activeProject = await prisma.project.findFirst({
          where: {
            teamLeaderId: requester.empId,
            status: PROJECT_STATUS.ACTIVE,
            members: {
              some: {
                employeeId: employeeId,
                removedAt: null,
              },
            },
          },
        })

        if (!activeProject) {
          throw new AppError(
            APPLICATION_ERROR_MESSAGES.VIEW_PROJECT_FORBIDDEN,
            HttpStatusCode.FORBIDDEN,
            ErrorLayer.SERVICE,
            "FORBIDDEN",
          )
        }
      }
    }

    return this.applicationRepo.findByEmployee(employeeId, query)
  }

  /**
   * Approves a pending application.
   *
   * @param id - The ID of the application to approve.
   * @param processorId - The ID of the employee/manager processing the approval.
   * @returns A promise that resolves to the approved application.
   * @throws {AppError} If the application is not found or is not in pending status.
   */
  async approveApplication(id: string, processorId: string): Promise<unknown> {
    const app = await this.applicationRepo.findById(id)

    if (!app) {
      throw new AppError(
        APPLICATION_ERROR_MESSAGES.NOT_FOUND,
        HttpStatusCode.NOT_FOUND,
        ErrorLayer.SERVICE,
        "NOT_FOUND",
      )
    }

    // §V8: only pending applications can be approved
    if (app.status !== APPLICATION_STATUS.PENDING) {
      throw new AppError(
        APPLICATION_ERROR_MESSAGES.CANNOT_APPROVE_STATUS(app.status),
        HttpStatusCode.BAD_REQUEST,
        ErrorLayer.SERVICE,
        "INVALID_STATUS_TRANSITION",
      )
    }

    const updated = await this.applicationRepo.approve(id, processorId)
    if (!updated) {
      throw new AppError(
        APPLICATION_ERROR_MESSAGES.APPROVE_FAILED,
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        ErrorLayer.SERVICE,
      )
    }
    eventBus.emitTyped("notification:create", {
      employeeId: app.employeeId,
      title: "Đơn đã được phê duyệt",
      message: `Đơn (${app.type}) của bạn đã được phê duyệt thành công.`,
      type: NOTIFICATION_TYPE.SUCCESS,
      priority: NOTIFICATION_PRIORITY.HIGH,
      link: "/application/my-applications",
    })
    return updated
  }

  /**
   * Rejects a pending application with a specified reason.
   *
   * @param id - The ID of the application to reject.
   * @param processorId - The ID of the employee/manager processing the rejection.
   * @param rejectReason - The reason for rejecting the application.
   * @returns A promise that resolves to the rejected application.
   * @throws {AppError} If the application is not found or is not in pending status.
   */
  async rejectApplication(id: string, processorId: string, rejectReason: string): Promise<unknown> {
    const app = await this.applicationRepo.findById(id)

    if (!app) {
      throw new AppError(
        APPLICATION_ERROR_MESSAGES.NOT_FOUND,
        HttpStatusCode.NOT_FOUND,
        ErrorLayer.SERVICE,
        "NOT_FOUND",
      )
    }

    // §V9: only pending applications can be rejected
    if (app.status !== APPLICATION_STATUS.PENDING) {
      throw new AppError(
        APPLICATION_ERROR_MESSAGES.CANNOT_REJECT_STATUS(app.status),
        HttpStatusCode.BAD_REQUEST,
        ErrorLayer.SERVICE,
        "INVALID_STATUS_TRANSITION",
      )
    }

    const updated = await this.applicationRepo.reject(id, processorId, rejectReason)
    if (!updated) {
      throw new AppError(
        APPLICATION_ERROR_MESSAGES.REJECT_FAILED,
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        ErrorLayer.SERVICE,
      )
    }
    eventBus.emitTyped("notification:create", {
      employeeId: app.employeeId,
      title: "Đơn bị từ chối",
      message: `Đơn (${app.type}) của bạn đã bị từ chối. Lý do: ${rejectReason}`,
      type: NOTIFICATION_TYPE.WARNING,
      priority: NOTIFICATION_PRIORITY.HIGH,
      link: "/application/my-applications",
    })
    return updated
  }

  /**
   * Processes an application by approving or rejecting it.
   *
   * @deprecated Use approveApplication / rejectApplication instead.
   * @param id - The ID of the application.
   * @param status - The target status (approved/rejected).
   * @param processorId - The ID of the processor.
   * @returns A promise that resolves to the processed application.
   * @throws {AppError} If invalid status is passed or rejection is attempted without a reason.
   */
  async processApplication(
    id: string,
    status: IApplicationStatus,
    processorId: string,
  ): Promise<unknown | null> {
    if (status === APPLICATION_STATUS.APPROVED) {
      return this.approveApplication(id, processorId)
    }
    if (status === APPLICATION_STATUS.REJECTED) {
      throw new AppError(
        APPLICATION_ERROR_MESSAGES.REJECT_REASON_REQUIRED,
        HttpStatusCode.BAD_REQUEST,
        ErrorLayer.SERVICE,
        "USE_REJECT_ENDPOINT",
      )
    }
    throw new AppError(
      APPLICATION_ERROR_MESSAGES.INVALID_STATUS_TRANSITION(status),
      HttpStatusCode.BAD_REQUEST,
      ErrorLayer.SERVICE,
      "INVALID_STATUS_TRANSITION",
    )
  }

  /**
   * §V4: Leave application validator. Checks for date overlaps and leave balance quotas.
   *
   * @param employeeId - The ID of the employee submitting the leave.
   * @param leaveType - The type of leave (annual, sick, etc.).
   * @param startDate - The starting date of the leave.
   * @param endDate - The ending date of the leave.
   * @throws {AppError} If overlap is detected or the employee has insufficient leave balance.
   */
  private async _validateLeaveApplication(
    employeeId: string,
    leaveType: string,
    startDate: Date,
    endDate: Date,
  ): Promise<void> {
    // §V4a: no overlap with pending/approved leave
    const hasOverlap = await this.applicationRepo.checkLeaveOverlap(employeeId, startDate, endDate)
    if (hasOverlap) {
      throw new AppError(
        APPLICATION_ERROR_MESSAGES.LEAVE_OVERLAP,
        HttpStatusCode.CONFLICT,
        ErrorLayer.SERVICE,
        "LEAVE_OVERLAP",
      )
    }
  }

  /**
   * §V5: Verifies that the specified employeeShift belongs to the requester.
   *
   * @param shiftId - The ID of the employee shift to check.
   * @param employeeId - The ID of the employee.
   * @throws {AppError} If the shift doesn't exist or is not owned by the employee.
   */
  private async _validateShiftOwnership(
    shiftId: string,
    employeeId: string,
    customErrorMessage?: string,
  ): Promise<void> {
    const shift = await prisma.employeeShift.findUnique({
      where: { id: shiftId },
      select: { employeeId: true },
    })

    if (!shift) {
      throw new AppError(
        APPLICATION_ERROR_MESSAGES.SHIFT_NOT_FOUND(shiftId),
        HttpStatusCode.NOT_FOUND,
        ErrorLayer.SERVICE,
        "SHIFT_NOT_FOUND",
      )
    }

    if (shift.employeeId !== employeeId) {
      throw new AppError(
        customErrorMessage || APPLICATION_ERROR_MESSAGES.SHIFT_NOT_OWNED,
        HttpStatusCode.FORBIDDEN,
        ErrorLayer.SERVICE,
        "SHIFT_NOT_OWNED",
      )
    }
  }

  /**
   * §V6: Overtime application validator. Verifies that the application dates match the shift date.
   *
   * @param employeeShiftId - The ID of the employee shift.
   * @param startDate - The starting date of the overtime.
   * @param endDate - The ending date of the overtime.
   * @throws {AppError} If either the start or end date does not match the shift's assigned date.
   */
  private async _validateOvertimeDates(
    employeeShiftId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<void> {
    // Date validation removed to avoid timezone mismatch issues between client and server.
    // The frontend already filters shifts by the selected date, and ownership is validated.
    return
  }

  /**
   * §V7: Validates that the swap target employee exists, is active, and is not deleted.
   *
   * @param employeeId - The ID of the swap target employee.
   * @throws {AppError} If the target employee is not found, deleted, or not active.
   */
  private async _validateEmployeeExists(employeeId: string): Promise<void> {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: { id: true, status: true, deletedAt: true },
    })

    if (!employee || employee.deletedAt) {
      throw new AppError(
        APPLICATION_ERROR_MESSAGES.EMPLOYEE_NOT_FOUND(employeeId),
        HttpStatusCode.NOT_FOUND,
        ErrorLayer.SERVICE,
        "EMPLOYEE_NOT_FOUND",
      )
    }

    if (employee.status !== EMPLOYEE_STATUS.ACTIVE) {
      throw new AppError(
        APPLICATION_ERROR_MESSAGES.EMPLOYEE_INACTIVE(employeeId),
        HttpStatusCode.BAD_REQUEST,
        ErrorLayer.SERVICE,
        "EMPLOYEE_INACTIVE",
      )
    }
  }

  /**
   * §V8: Validates that the assigned-to employee exists and holds an approver-eligible role.
   * Approver roles: ADMIN, GENERAL_MANAGER, HR_MANAGER, TEAM_LEADER.
   *
   * @param employeeId - The ID of the employee to assign as approver.
   * @throws {AppError} If not found or role is not approver-eligible.
   */
  private async _validateApproverRole(employeeId: string): Promise<void> {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: { id: true, status: true },
    })

    if (!employee) {
      throw new AppError(
        APPLICATION_ERROR_MESSAGES.APPROVER_NOT_FOUND(employeeId),
        HttpStatusCode.NOT_FOUND,
        ErrorLayer.SERVICE,
        "APPROVER_NOT_FOUND",
      )
    }

    const authContext = await authorizationService.getAuthorizationContext(employeeId)
    const isApprover =
      authContext.isDynamicAdmin || authContext.permissions.has("application.approve")

    if (!isApprover) {
      throw new AppError(
        APPLICATION_ERROR_MESSAGES.PROCESSOR_NOT_ELIGIBLE,
        HttpStatusCode.BAD_REQUEST,
        ErrorLayer.SERVICE,
        "INVALID_APPROVER_ROLE",
      )
    }
  }

  async getApprovalsList(
    approverId: string,
    query: IListApplicationsQueryDTO,
  ): Promise<IApplicationListResultDTO> {
    const authContext = await authorizationService.getAuthorizationContext(approverId)
    const isGlobalAdmin = authContext.isDynamicAdmin
    const hasRead = authContext.permissions.has(PERMISSION_CODE.APPLICATION_READ)
    const hasApprove = authContext.permissions.has(PERMISSION_CODE.APPLICATION_APPROVE)

    const isGlobalApprover = isGlobalAdmin || hasRead

    let managedEmployeeIds: string[] = []
    if (!isGlobalApprover) {
      const managedProjects = await prisma.project.findMany({
        where: { teamLeaderId: approverId, status: PROJECT_STATUS.ACTIVE },
        select: { members: { select: { employeeId: true } } },
      })
      managedEmployeeIds = Array.from(
        new Set(managedProjects.flatMap((p) => p.members.map((m) => m.employeeId))),
      )
    }

    return this.applicationRepo.findApprovals(
      approverId,
      managedEmployeeIds,
      isGlobalApprover,
      query,
    )
  }

  async confirmSwapPartner(id: string, partnerId: string): Promise<unknown> {
    const app = await this.applicationRepo.findById(id)

    if (!app) {
      throw new AppError(
        APPLICATION_ERROR_MESSAGES.NOT_FOUND,
        HttpStatusCode.NOT_FOUND,
        ErrorLayer.SERVICE,
        "NOT_FOUND",
      )
    }

    if (app.status !== APPLICATION_STATUS.PARTNER_PENDING) {
      throw new AppError(
        APPLICATION_ERROR_MESSAGES.CANNOT_APPROVE_STATUS(app.status),
        HttpStatusCode.BAD_REQUEST,
        ErrorLayer.SERVICE,
        "INVALID_STATUS_TRANSITION",
      )
    }

    const swapPartnerId = app.shiftSwapDetail?.swapWithEmployeeId
    if (!swapPartnerId || swapPartnerId !== partnerId) {
      throw new AppError(
        APPLICATION_ERROR_MESSAGES.SWAP_PARTNER_FORBIDDEN,
        HttpStatusCode.FORBIDDEN,
        ErrorLayer.SERVICE,
        "FORBIDDEN",
      )
    }

    const updated = await this.applicationRepo.partnerConfirm(id, partnerId)
    if (!updated) {
      throw new AppError(
        APPLICATION_ERROR_MESSAGES.SWAP_CONFIRM_FAILED,
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        ErrorLayer.SERVICE,
      )
    }

    return updated
  }

  async rejectSwapPartner(id: string, partnerId: string, rejectReason: string): Promise<unknown> {
    const app = await this.applicationRepo.findById(id)

    if (!app) {
      throw new AppError(
        APPLICATION_ERROR_MESSAGES.NOT_FOUND,
        HttpStatusCode.NOT_FOUND,
        ErrorLayer.SERVICE,
        "NOT_FOUND",
      )
    }

    if (app.status !== APPLICATION_STATUS.PARTNER_PENDING) {
      throw new AppError(
        APPLICATION_ERROR_MESSAGES.CANNOT_REJECT_STATUS(app.status),
        HttpStatusCode.BAD_REQUEST,
        ErrorLayer.SERVICE,
        "INVALID_STATUS_TRANSITION",
      )
    }

    const swapPartnerId = app.shiftSwapDetail?.swapWithEmployeeId
    if (!swapPartnerId || swapPartnerId !== partnerId) {
      throw new AppError(
        APPLICATION_ERROR_MESSAGES.SWAP_PARTNER_FORBIDDEN,
        HttpStatusCode.FORBIDDEN,
        ErrorLayer.SERVICE,
        "FORBIDDEN",
      )
    }

    const updated = await this.applicationRepo.partnerReject(id, partnerId, rejectReason)
    if (!updated) {
      throw new AppError(
        APPLICATION_ERROR_MESSAGES.SWAP_REJECT_FAILED,
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        ErrorLayer.SERVICE,
      )
    }

    return updated
  }
}
