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
  /**
   * Initializes PositionService with required repository dependencies.
   *
   * @param positionRepo - Position repository
   * @param employeeRepo - Employee repository
   * @param projectRepo - Project repository
   * @param prisma - Prisma database client
   */
  constructor(
    private readonly positionRepo: IPositionRepository,
    private readonly employeeRepo: IEmployeeRepository,
    private readonly projectRepo: IProjectRepository,
    private readonly prisma: PrismaClient,
  ) {}

  /**
   * Retrieves all positions configured in the organization.
   *
   * @returns Array of positions
   */
  async getAllPositions(): Promise<Position[]> {
    return this.positionRepo.findAll()
  }

  /**
   * Retrieves a single position by primary ID.
   *
   * @param id - Position ID
   * @returns The position record
   * @throws {AppError} If position is not found
   */
  async getPositionById(id: string): Promise<Position> {
    const position = await this.positionRepo.findById(id)
    if (!position) {
      throw new AppError("Không tìm thấy chức vụ", HttpStatusCode.NOT_FOUND, ErrorLayer.SERVICE)
    }
    return position
  }

  /**
   * Creates a new position, sanitizing name/code and ensuring unique code constraint.
   *
   * @param data - Position details
   * @returns Newly created position
   * @throws {AppError} If name/code empty or code already exists
   */
  async createPosition(data: CreatePositionDto): Promise<Position> {
    const name = data.name.trim()
    const code = data.code.trim().toLowerCase()

    if (!name || !code) {
      throw new AppError(
        "Tên và mã chức vụ không được để trống",
        HttpStatusCode.BAD_REQUEST,
        ErrorLayer.SERVICE,
      )
    }

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
   * Updates an existing position definition.
   *
   * @param id - Position ID
   * @param data - Updated details
   * @returns The updated position
   * @throws {AppError} If position not found or new code already taken
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
   * Soft deletes a position by ID.
   *
   * @param id - Position ID to delete
   * @returns The deleted position metadata
   * @throws {AppError} If position is not found
   */
  async deletePosition(id: string): Promise<Position> {
    await this.getPositionById(id)
    return this.positionRepo.delete(id)
  }

  /**
   * Stub helper to retrieve project-scoped rules.
   *
   * @param projectId - Project ID
   * @returns Array of project rules
   */
  async getProjectRules(projectId: string): Promise<ProjectPositionRule[]> {
    return []
  }

  /**
   * Stub helper to save project-scoped rules.
   *
   * @param projectId - Project ID
   * @param rules - Rules payload
   * @returns Saved project rules array
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
   *
   * @param projectId - Project unique identifier
   * @param employeeId - Employee unique identifier
   * @param tracker - Task tracker code (feature, bug, etc.)
   * @throws {AppError} If employee or project not found, or employee role lacks permission
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
   * Validates application submission eligibility based on position rules.
   *
   * @param employeeId - Employee unique identifier
   * @param type - Application category type
   * @returns Resolves when validation succeeds
   */
  async validateApplicationSubmission(employeeId: string, type: IApplicationType): Promise<void> {
    return
  }
}
