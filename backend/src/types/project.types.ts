import { PROJECT_STATUS, TASK_CREATION_POLICY } from "@/configs/entities/project.config.ts"

import { Task, TaskTracker } from "./task.types.ts"

/**
 * Type representing the status of a Project (e.g., active, completed, suspended)
 */
export type ProjectStatus = (typeof PROJECT_STATUS)[keyof typeof PROJECT_STATUS]

/**
 * Type representing the policy for creating tasks in a project
 * e.g., 'leader_only' (only Team Leader/Admin can create) or 'all_members' (any member can create)
 */
export type TaskCreationPolicy = (typeof TASK_CREATION_POLICY)[keyof typeof TASK_CREATION_POLICY]

/**
 * Domain model representing a Project within the system
 */
export interface Project {
  id: string
  name: string
  description: string | null
  techStack: string[]
  status: ProjectStatus
  taskCreationPolicy: TaskCreationPolicy
  startDate: Date | null
  expectedEndDate: Date | null
  actualEndDate: Date | null
  dealTargetPercent: number | null
  teamLeaderId: string | null
  createdById: string
  createdAt: Date
  updatedAt: Date
  allowedTaskTrackers: TaskTracker[]
  /**
   * The team leader assigned to this project
   */
  teamLeader?: {
    id: string
    fullName: string
    email: string
  } | null
  /**
   * The user/employee who created the project record
   */
  createdBy?: {
    id: string
    fullName: string
    email: string
  }
}

/**
 * Data Transfer Object for creating a new Project
 */
export interface CreateProjectDto {
  name: string
  description?: string | null
  techStack?: string[]
  status?: ProjectStatus
  taskCreationPolicy?: TaskCreationPolicy
  startDate?: Date | string | null
  expectedEndDate?: Date | string | null
  dealTargetPercent?: number | null
  teamLeaderId?: string | null
  allowedTaskTrackers?: TaskTracker[]
}

/**
 * Data Transfer Object for updating an existing Project
 */
export interface UpdateProjectDto {
  name?: string
  description?: string | null
  techStack?: string[]
  status?: ProjectStatus
  taskCreationPolicy?: TaskCreationPolicy
  startDate?: Date | string | null
  expectedEndDate?: Date | string | null
  actualEndDate?: Date | string | null
  dealTargetPercent?: number | null
  teamLeaderId?: string | null
  allowedTaskTrackers?: TaskTracker[]
}

/**
 * Query parameters for filtering and paginating a list of projects
 */
export interface ProjectListQuery {
  page?: number
  limit?: number
  search?: string
  status?: ProjectStatus
  sortBy?: string
  sortOrder?: "asc" | "desc"
}

/**
 * Standard Paginated Response envelope for Project list requests
 */
export interface PaginatedProjectsDto {
  data: Project[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

/**
 * Repository interface for managing Project database transactions
 */
export interface IProjectRepository {
  findById(id: string): Promise<Project | null>
  findByName(name: string): Promise<Project | null>
  listProjects(
    query: ProjectListQuery,
    userId: string,
    isAdminOrGM: boolean,
  ): Promise<PaginatedProjectsDto>
  createProject(data: CreateProjectDto & { createdById: string }): Promise<Project>
  updateProject(id: string, data: UpdateProjectDto): Promise<Project | null>
  deleteProject(id: string): Promise<boolean>
  /** PT: hourlyRate + workMode stored per project membership (not on Employee). */
  addMember(
    projectId: string,
    employeeId: string,
    options?: { hourlyRate?: number | null; workMode?: string; roleId?: string | null },
  ): Promise<boolean>
  removeMember(projectId: string, employeeId: string): Promise<boolean>
  isMember(projectId: string, employeeId: string): Promise<boolean>
  getMember(
    projectId: string,
    employeeId: string,
  ): Promise<{ hourlyRate: number | null; workMode: string; roleId: string | null } | null>
  getMembers(projectId: string): Promise<any[]>
  getGanttData(projectId: string): Promise<GanttDataDto>
  /** Onsite PT only — AttendanceService uses this to allow GPS check-in. */
  hasActiveOnsiteMembership(employeeId: string): Promise<boolean>
  updateMember(
    projectId: string,
    employeeId: string,
    data: { hourlyRate?: number | null; workMode?: string; roleId?: string | null },
  ): Promise<boolean>
}

export interface GanttMemberDto {
  id: string
  fullName: string
  email: string
  position: string | null
}

export interface GanttLeaveDayDto {
  id: string
  employeeId: string
  startDate: Date
  endDate: Date
  reason: string | null
}

export interface GanttDataDto {
  tasks: Task[]
  members: GanttMemberDto[]
  leaveDays: GanttLeaveDayDto[]
}

/**
 * Service interface implementing Project management business logic
 */
export interface IProjectService {
  getProject(id: string, userId: string): Promise<Project | null>
  listProjects(query: ProjectListQuery, userId: string): Promise<PaginatedProjectsDto>
  createProject(data: CreateProjectDto, userId: string): Promise<Project>
  updateProject(id: string, data: UpdateProjectDto, userId: string): Promise<Project | null>
  deleteProject(id: string, userId: string): Promise<boolean>
  addMember(
    projectId: string,
    employeeId: string,
    userId: string,
    options?: { hourlyRate?: number | null; workMode?: string; roleId?: string | null },
  ): Promise<boolean>
  removeMember(projectId: string, employeeId: string, userId: string): Promise<boolean>
  getMembers(projectId: string, userId: string): Promise<any[]>
  getGanttData(projectId: string, userId: string): Promise<GanttDataDto>
  updateMember(
    projectId: string,
    employeeId: string,
    userId: string,
    data: { hourlyRate?: number | null; workMode?: string; roleId?: string | null },
  ): Promise<boolean>
}
