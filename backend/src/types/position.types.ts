import { IApplicationType } from "./attendance.types.ts"
import { TaskTracker } from "./task.types.ts"

/**
 * Position domain entity.
 */
export interface Position {
  id: string
  name: string
  code: string
  description: string | null
  allowedTaskTrackers: TaskTracker[]
  allowedApplicationTypes: IApplicationType[]
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

/**
 * Project-scoped allowed task trackers rule for a position.
 */
export interface ProjectPositionRule {
  id: string
  projectId: string
  positionId: string
  allowedTaskTrackers: TaskTracker[]
  allowedApplicationTypes: IApplicationType[]
  createdAt: Date
  updatedAt: Date
}

/**
 * DTO for creating a new position.
 */
export interface CreatePositionDto {
  name: string
  code: string
  description?: string
  allowedTaskTrackers?: TaskTracker[]
  allowedApplicationTypes?: IApplicationType[]
}

/**
 * DTO for updating an existing position.
 */
export interface UpdatePositionDto {
  name?: string
  code?: string
  description?: string | null
  allowedTaskTrackers?: TaskTracker[]
  allowedApplicationTypes?: IApplicationType[]
}

/**
 * DTO for setting allowed task trackers for a position in a project.
 */
export interface ProjectPositionRuleDto {
  positionId: string
  allowedTaskTrackers: TaskTracker[]
  allowedApplicationTypes: IApplicationType[]
}

/**
 * Repository interface for position data operations.
 */
export interface IPositionRepository {
  findAll(): Promise<Position[]>
  findById(id: string): Promise<Position | null>
  findByCode(code: string): Promise<Position | null>
  create(data: CreatePositionDto): Promise<Position>
  update(id: string, data: UpdatePositionDto): Promise<Position>
  delete(id: string): Promise<Position>

  // Project Position Rules
  findActiveProjectMemberships(
    employeeId: string,
  ): Promise<{ projectId: string; projectName: string }[]>
}

/**
 * Service interface for position business logic.
 */
export interface IPositionService {
  getAllPositions(): Promise<Position[]>
  getPositionById(id: string): Promise<Position>
  createPosition(data: CreatePositionDto): Promise<Position>
  updatePosition(id: string, data: UpdatePositionDto): Promise<Position>
  deletePosition(id: string): Promise<Position>

  // Project Position Rules
  getProjectRules(projectId: string): Promise<ProjectPositionRule[]>
  saveProjectRules(
    projectId: string,
    rules: ProjectPositionRuleDto[],
  ): Promise<ProjectPositionRule[]>
  validateTaskCreation(projectId: string, employeeId: string, tracker: TaskTracker): Promise<void>
  validateApplicationSubmission(employeeId: string, type: IApplicationType): Promise<void>
}
