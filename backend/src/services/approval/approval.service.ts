import { PASSWORD_RESET_STATUS } from "@/configs/auth/auth.config.ts"
import { APPLICATION_STATUS } from "@/configs/entities/attendance.config.ts"
import { NOTIFICATION_PRIORITY, NOTIFICATION_TYPE } from "@/configs/entities/notification.config.ts"
import { PROJECT_STATUS } from "@/configs/entities/project.config.ts"
import { APPROVAL_CATEGORY } from "@/configs/rules/approval.config.ts"
import { ErrorLayer } from "@/configs/system/error-code.config.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { prisma } from "@/libs/database.ts"
import { eventBus } from "@/libs/event-bus.ts"
import { PrismaApplicationRepository } from "@/repositories/application.repository.ts"
import { ApprovalStrategyFactory } from "@/services/approval/approval.strategy.ts"
import { authorizationService } from "@/services/authorization.service.ts"
import { IApprovalItem, IApprovalService, IProcessApprovalDTO } from "@/types/approval.types.ts"
import { AppError } from "@/utils/error.util.ts"
import { HashUtil } from "@/utils/hash.util.ts"

/**
 * Service for managing approval workflows across different categories (applications, password resets, etc.).
 */
export class ApprovalService implements IApprovalService {
  constructor(private appRepo: PrismaApplicationRepository) {}

  /**
   * Fetches all pending requests of all types that the current processor is authorized to approve.
   *
   * @param processorId - The ID of the employee processing the approvals.
   * @returns A sorted list of pending approval items.
   */
  async getPendingApprovals(processorId: string): Promise<IApprovalItem[]> {
    const list: IApprovalItem[] = []
    const strategy = await ApprovalStrategyFactory.getStrategyForEmployee(processorId)
    const authContext = await authorizationService.getAuthorizationContext(processorId)

    const isGlobalApprover =
      authContext.isDynamicAdmin || authContext.permissions.has("employee.update")
    const isTeamLeader = !isGlobalApprover && authContext.permissions.has("application.approve")
    const canHandleApplications = authContext.permissions.has("application.approve")
    const canHandlePasswordReset =
      authContext.isDynamicAdmin || authContext.permissions.has("security.update")

    // Fetch Applications (Leaves, OT, etc.)
    if (canHandleApplications) {
      let employeeIdFilter: string[] | undefined = undefined

      if (isTeamLeader && !isGlobalApprover) {
        // Find members of active projects led by this TL
        const ledProjects = await prisma.project.findMany({
          where: { teamLeaderId: processorId, status: PROJECT_STATUS.ACTIVE },
          include: { members: { where: { removedAt: null } } },
        })
        employeeIdFilter = ledProjects.flatMap((p) => p.members.map((m) => m.employeeId))
      }

      const apps = await prisma.application.findMany({
        where: {
          status: APPLICATION_STATUS.PENDING,
          ...(employeeIdFilter ? { employeeId: { in: employeeIdFilter } } : {}),
          ...(isTeamLeader && !isGlobalApprover
            ? {
                OR: [{ assignedToId: processorId }, { assignedToId: null }],
              }
            : {}),
        },
        include: {
          employee: { select: { fullName: true } },
          assignedTo: { select: { id: true, fullName: true } },
          shiftSwapDetail: {
            include: {
              swapWithEmployee: { select: { fullName: true } },
              employeeShift: { include: { shift: { select: { name: true } } } },
              swapWithShift: { include: { shift: { select: { name: true } } } },
              workingShift: { select: { name: true } },
            },
          },
          overtimeDetail: true,
          lateEarlyDetail: true,
          businessTripDetail: true,
          workFromHomeDetail: true,
          regimeDetail: true,
          leaveDetail: true,
        },
        orderBy: { createdAt: "desc" },
      })

      for (const app of apps) {
        // If application has a specific assignedTo, only that person or global approvers can approve
        const isAssignedToSelf = app.assignedToId === processorId || app.assignedToId === null
        if (!isGlobalApprover && !isAssignedToSelf) continue

        const canApprove = await strategy.canApprove(
          APPROVAL_CATEGORY.APPLICATION,
          app.employeeId,
          processorId,
        )
        if (canApprove) {
          list.push({
            id: app.id,
            category: APPROVAL_CATEGORY.APPLICATION,
            employeeId: app.employeeId,
            employeeName: app.employee?.fullName || "N/A",
            createdAt: app.createdAt,
            status: app.status,
            details: {
              type: app.type,
              startDate: app.startDate,
              endDate: app.endDate,
              reason: app.reason,
              note: app.note,
              assignedToId: app.assignedToId,
              assignedTo: (
                app as unknown as { assignedTo: { id: string; fullName: string } | null }
              ).assignedTo,
              shiftSwapDetail: app.shiftSwapDetail,
              overtimeDetail: app.overtimeDetail,
              lateEarlyDetail: app.lateEarlyDetail,
              businessTripDetail: app.businessTripDetail,
              workFromHomeDetail: app.workFromHomeDetail,
              regimeDetail: app.regimeDetail,
              leaveDetail: app.leaveDetail,
            },
          })
        }
      }
    }

    // Fetch Password Reset Requests (admin and general_manager only)
    if (canHandlePasswordReset) {
      const resetRequests = await prisma.passwordResetRequest.findMany({
        where: { status: PASSWORD_RESET_STATUS.PENDING },
        include: { employee: { select: { fullName: true } } },
        orderBy: { createdAt: "desc" },
      })

      for (const req of resetRequests) {
        const canApprove = await strategy.canApprove(
          APPROVAL_CATEGORY.PASSWORD_RESET,
          req.employeeId,
          processorId,
        )
        if (canApprove) {
          list.push({
            id: req.id,
            category: APPROVAL_CATEGORY.PASSWORD_RESET,
            employeeId: req.employeeId,
            employeeName: req.employee?.fullName || "N/A",
            createdAt: req.createdAt,
            status: req.status,
            details: {
              expiresAt: req.expiresAt,
              note: req.note,
            },
          })
        }
      }
    }

    return list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  /**
   * Approves or rejects a specific request based on its category.
   *
   * @param dto - Data containing request ID, category, processor ID, and new status.
   * @returns The updated request record or a transaction result.
   * @throws {AppError} If the request or processor is not found, or if the processor is not authorized.
   */
  async processApproval(dto: IProcessApprovalDTO): Promise<any> {
    const processorExists = await prisma.employee.findUnique({
      where: { id: dto.processorId },
      select: { id: true },
    })
    if (!processorExists) {
      throw new AppError(
        "Processor employee not found",
        HttpStatusCode.NOT_FOUND,
        ErrorLayer.SERVICE,
      )
    }

    const strategy = await ApprovalStrategyFactory.getStrategyForEmployee(dto.processorId)
    let applicantId = ""

    if (dto.category === APPROVAL_CATEGORY.APPLICATION) {
      const app = await prisma.application.findUnique({ where: { id: dto.id } })
      if (!app)
        throw new AppError("Application not found", HttpStatusCode.NOT_FOUND, ErrorLayer.SERVICE)
      applicantId = app.employeeId

      if (app.status !== APPLICATION_STATUS.PENDING) {
        throw new AppError(
          "Request has already been processed",
          HttpStatusCode.BAD_REQUEST,
          ErrorLayer.SERVICE,
        )
      }

      const canApprove = await strategy.canApprove(dto.category, applicantId, dto.processorId)
      if (!canApprove) {
        throw new AppError(
          "Forbidden: You do not have permission to approve this request",
          HttpStatusCode.FORBIDDEN,
          ErrorLayer.SERVICE,
        )
      }

      if (dto.status === APPLICATION_STATUS.APPROVED) {
        const result = await this.appRepo.approve(dto.id, dto.processorId)
        if (!result)
          throw new AppError(
            "Failed to approve application",
            HttpStatusCode.INTERNAL_SERVER_ERROR,
            ErrorLayer.SERVICE,
          )
        eventBus.emitTyped("notification:create", {
          employeeId: applicantId,
          title: "Đơn đã được duyệt",
          message: `Đơn của bạn (${app.type}) đã được phê duyệt thành công.`,
          type: NOTIFICATION_TYPE.SUCCESS,
          priority: NOTIFICATION_PRIORITY.HIGH,
          link: "/application/my-applications",
        })
        return result
      } else {
        const result = await prisma.application.update({
          where: { id: dto.id },
          data: {
            status: APPLICATION_STATUS.REJECTED,
            approvedById: dto.processorId,
            approvedAt: new Date(),
            rejectReason: dto.rejectReason,
          },
        })
        eventBus.emitTyped("notification:create", {
          employeeId: applicantId,
          title: "Đơn bị từ chối",
          message: `Đơn của bạn (${app.type}) đã bị từ chối.${dto.rejectReason ? ` Lý do: ${dto.rejectReason}` : ""}`,
          type: NOTIFICATION_TYPE.WARNING,
          priority: NOTIFICATION_PRIORITY.HIGH,
          link: "/application/my-applications",
        })
        return result
      }
    } else if (dto.category === APPROVAL_CATEGORY.PASSWORD_RESET) {
      const req = await prisma.passwordResetRequest.findUnique({ where: { id: dto.id } })
      if (!req)
        throw new AppError(
          "Password Reset Request not found",
          HttpStatusCode.NOT_FOUND,
          ErrorLayer.SERVICE,
        )
      applicantId = req.employeeId

      if (req.status !== PASSWORD_RESET_STATUS.PENDING) {
        throw new AppError(
          "Request has already been processed",
          HttpStatusCode.BAD_REQUEST,
          ErrorLayer.SERVICE,
        )
      }

      const canApprove = await strategy.canApprove(dto.category, applicantId, dto.processorId)
      if (!canApprove) {
        throw new AppError(
          "Forbidden: You do not have permission to approve this request",
          HttpStatusCode.FORBIDDEN,
          ErrorLayer.SERVICE,
        )
      }

      const isApproved = dto.status === APPLICATION_STATUS.APPROVED
      let tempPassword = ""

      const updatedReq = await prisma.passwordResetRequest.update({
        where: { id: dto.id },
        data: {
          status: isApproved ? PASSWORD_RESET_STATUS.APPROVED : PASSWORD_RESET_STATUS.REJECTED,
          approvedById: dto.processorId,
          ...(dto.rejectReason && !isApproved ? { note: dto.rejectReason } : {}),
        },
      })

      if (isApproved) {
        tempPassword = this.generateSecureTempPassword()
        await prisma.employee.update({
          where: { id: applicantId },
          data: { passwordHash: await HashUtil.hash(tempPassword) },
        })
      }

      return { ...updatedReq, tempPassword: tempPassword || undefined }
    } else {
      throw new AppError("Invalid request category", HttpStatusCode.BAD_REQUEST, ErrorLayer.SERVICE)
    }
  }

  /**
   * Generates a random secure temporary password.
   *
   * @returns A 10-character random password string.
   */
  private generateSecureTempPassword(): string {
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    const lowercase = "abcdefghijklmnopqrstuvwxyz"
    const numbers = "0123456789"
    const symbols = "!@#$%^&*"
    const allChars = uppercase + lowercase + numbers + symbols

    let password =
      uppercase[Math.floor(Math.random() * uppercase.length)] +
      lowercase[Math.floor(Math.random() * lowercase.length)] +
      numbers[Math.floor(Math.random() * numbers.length)] +
      symbols[Math.floor(Math.random() * symbols.length)]

    for (let i = 0; i < 6; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)]
    }

    return password
      .split("")
      .sort(() => 0.5 - Math.random())
      .join("")
  }
}
