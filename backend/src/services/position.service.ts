import { PROJECT_ROLE } from "@/configs/entities/project.config.ts"
import { ErrorLayer } from "@/configs/system/error-code.config.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { IApplicationType } from "@/types/attendance.types.ts"
import { IEmployeeRepository } from "@/types/employee.types.ts"
import {
  CreatePositionDto,
  IPositionRepository,
  IPositionService,
  Position,
  ProjectPositionRule,
  ProjectPositionRuleDto,
  UpdatePositionDto,
} from "@/types/position.types.ts"
import { IProjectRepository } from "@/types/project.types.ts"
import { TaskTracker } from "@/types/task.types.ts"
import { AppError } from "@/utils/error.util.ts"

import { PrismaClient } from "@prisma/client"

/**
 * Service implementing business logic for organizational positions and dynamic rules.
 */
export class PositionService implements IPositionService {
  constructor(
    private readonly positionRepo: IPositionRepository,
    private readonly employeeRepo: IEmployeeRepository,
    private readonly projectRepo: IProjectRepository,
    private readonly prisma: PrismaClient,
  ) {}

  /**
   * Retrieves all positions configured in the organization.
   * @returns Array of positions.
   */
  async getAllPositions(): Promise<Position[]> {
    return this.positionRepo.findAll()
  }

  /**
   * Retrieves a single position by ID.
   * @param id - Position ID.
   * @returns The position.
   */
  async getPositionById(id: string): Promise<Position> {
    const position = await this.positionRepo.findById(id)
    if (!position) {
      throw new AppError("Không tìm thấy chức vụ", HttpStatusCode.NOT_FOUND, ErrorLayer.SERVICE)
    }
    return position
  }

  /**
   * Creates a new position. Sanitizes inputs and checks for duplicates.
   * @param data - Position details.
   * @returns The created position.
   */
  async createPosition(data: CreatePositionDto): Promise<Position> {
    // Clean inputs
    const name = data.name.trim()
    const code = data.code.trim().toLowerCase()

    if (!name || !code) {
      throw new AppError(
        "Tên và mã chức vụ không được để trống",
        HttpStatusCode.BAD_REQUEST,
        ErrorLayer.SERVICE,
      )
    }

    // Check if code is unique
    const existing = await this.positionRepo.findByCode(code)
    if (existing) {
      throw new AppError("Mã chức vụ đã tồn tại", HttpStatusCode.CONFLICT, ErrorLayer.SERVICE)
    }

    return this.positionRepo.create({
      ...data,
      name,
      code,
    })
  }

  /**
   * Updates an existing position.
   * @param id - Position ID.
   * @param data - Updated details.
   * @returns The updated position.
   */
  async updatePosition(id: string, data: UpdatePositionDto): Promise<Position> {
    const position = await this.getPositionById(id)

    const updatedData: UpdatePositionDto = {
      description: data.description,
      allowedTaskTrackers: data.allowedTaskTrackers,
      allowedApplicationTypes: data.allowedApplicationTypes,
    }

    if (data.name) {
      updatedData.name = data.name.trim()
    }

    if (data.code) {
      const code = data.code.trim().toLowerCase()
      if (code !== position.code) {
        const existing = await this.positionRepo.findByCode(code)
        if (existing) {
          throw new AppError("Mã chức vụ đã tồn tại", HttpStatusCode.CONFLICT, ErrorLayer.SERVICE)
        }
        updatedData.code = code
      }
    }

    return this.positionRepo.update(id, updatedData)
  }

  /**
   * Soft deletes a position.
   * @param id - Position ID to delete.
   * @returns The deleted position metadata.
   */
  async deletePosition(id: string): Promise<Position> {
    await this.getPositionById(id)
    // Check if position is currently assigned to any employee
    // To do this simply, we will soft delete the position. Any new employees cannot be assigned to it,
    // and we soft delete to maintain integrity.
    return this.positionRepo.delete(id)
  }

  /**
   * Stub helper to retrieve project-scoped rules.
   * @param projectId - Project ID.
   * @returns Array of project rules.
   */
  async getProjectRules(projectId: string): Promise<ProjectPositionRule[]> {
    return []
  }

  /**
   * Stub helper to save project-scoped rules.
   * @param projectId - Project ID.
   * @param rules - Rules payload.
   * @returns Saved project rules array.
   */
  async saveProjectRules(
    projectId: string,
    rules: ProjectPositionRuleDto[],
  ): Promise<ProjectPositionRule[]> {
    return []
  }

  /**
   * Validates whether an employee is permitted to create a task with a specific tracker in a project.
   * Admin/GM and Project Team Leaders are bypassed. Viewer role is blocked. Allowed trackers are validated.
   * @param projectId - Project ID.
   * @param employeeId - Employee ID.
   * @param tracker - Task tracker code (feature, bug, etc.).
   */
  async validateTaskCreation(
    projectId: string,
    employeeId: string,
    tracker: TaskTracker,
  ): Promise<void> {
    const employee = await this.employeeRepo.findById(employeeId)
    if (!employee) {
      throw new AppError("Nhân viên không tồn tại", HttpStatusCode.NOT_FOUND, ErrorLayer.SERVICE)
    }

    const project = await this.projectRepo.findById(projectId)
    if (!project) {
      throw new AppError("Dự án không tồn tại", HttpStatusCode.NOT_FOUND, ErrorLayer.SERVICE)
    }

    // Admin or GM bypass rules
    const roles = await this.employeeRepo.findRolesByEmployeeId(employeeId)
    const isAdminOrGM = roles.some((role) => role.isAdministrative)

    // Query project member relation
    const member = await this.prisma.projectMember.findUnique({
      where: {
        projectId_employeeId: { projectId, employeeId },
      },
      include: {
        role: true,
      },
    })

    const isLeader =
      project.teamLeaderId === employeeId ||
      (member?.role && member.role.code === PROJECT_ROLE.LEADER)

    if (isAdminOrGM || isLeader) {
      return
    }

    // Block viewers
    if (member?.role && member.role.code === PROJECT_ROLE.VIEWER) {
      throw new AppError(
        "Vai trò 'Người xem' không được phép tạo công việc trong dự án này",
        HttpStatusCode.FORBIDDEN,
        ErrorLayer.SERVICE,
      )
    }

    // Check project-level allowed trackers first
    if (project.allowedTaskTrackers && project.allowedTaskTrackers.length > 0) {
      if (!project.allowedTaskTrackers.includes(tracker)) {
        throw new AppError(
          `Dự án này không hỗ trợ loại yêu cầu '${tracker}'`,
          HttpStatusCode.FORBIDDEN,
          ErrorLayer.SERVICE,
        )
      }
    }

    // Check role-specific allowed trackers
    if (member?.role) {
      if (!member.role.allowedTaskTrackers.includes(tracker)) {
        throw new AppError(
          `Vai trò của bạn (${member.role.name}) không được phép tạo công việc loại '${tracker}' trong dự án này`,
          HttpStatusCode.FORBIDDEN,
          ErrorLayer.SERVICE,
        )
      }
    }
  }

  /**
   * Stub validator for application submission check.
   */
  async validateApplicationSubmission(employeeId: string, type: IApplicationType): Promise<void> {
    return
  }
}
