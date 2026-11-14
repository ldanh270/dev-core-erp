import { PROJECT_STATUS, TASK_CREATION_POLICY } from "@/config/entities/project.config"

import type { Task } from "./task.types"

export type ProjectStatus = (typeof PROJECT_STATUS)[keyof typeof PROJECT_STATUS]
export type TaskCreationPolicy = (typeof TASK_CREATION_POLICY)[keyof typeof TASK_CREATION_POLICY]

export interface Project {
  id: string
  name: string
  description: string | null
  techStack: string[]
  status: ProjectStatus
  taskCreationPolicy: TaskCreationPolicy
  startDate: string | null
  expectedEndDate: string | null
  actualEndDate: string | null
  dealTargetPercent: number | null
  teamLeaderId: string | null
  createdById: string
  createdAt: string
  updatedAt: string
  teamLeader?: {
    id: string
    fullName: string
    email: string
  } | null
  createdBy?: {
    id: string
    fullName: string
    email: string
  }
  allowedTaskTrackers: string[]
}

export interface CreateProjectDto {
  name: string
  description?: string | null
  techStack?: string[]
  status?: ProjectStatus
  taskCreationPolicy?: TaskCreationPolicy
  startDate?: string | null
  expectedEndDate?: string | null
  dealTargetPercent?: number | null
  teamLeaderId?: string | null
  allowedTaskTrackers?: string[]
}

export interface UpdateProjectDto {
  name?: string
  description?: string | null
  techStack?: string[]
  status?: ProjectStatus
  taskCreationPolicy?: TaskCreationPolicy
  startDate?: string | null
  expectedEndDate?: string | null
  actualEndDate?: string | null
  dealTargetPercent?: number | null
  teamLeaderId?: string | null
  allowedTaskTrackers?: string[]
}

export interface ProjectListQuery {
  page?: number
  limit?: number
  search?: string
  status?: ProjectStatus
  sortBy?: string
  sortOrder?: "asc" | "desc"
}

export interface PaginatedProjectsDto {
  data: Project[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface ProjectMember {
  id: string
  projectId: string
  employeeId: string
  /** PT contract rate for this project — used when approved Spent Time hits payroll. */
  hourlyRate: number | null
  /** remote = log only | onsite = one GPS check-in/day before logging hours. */
  workMode: string
  roleId: string | null
  role: { id: string; name: string; code: string; allowedTaskTrackers: string[] } | null
  createdAt: string
  employee: {
    id: string
    fullName: string
    email: string
    phoneNumber: string | null
    status: string
  }
}

export interface GanttMember {
  id: string
  fullName: string
  email: string
  position: string | null
}

export interface GanttLeaveDay {
  id: string
  employeeId: string
  startDate: string | Date
  endDate: string | Date
  reason: string | null
}

export interface GanttData {
  tasks: Task[]
  members: GanttMember[]
  leaveDays: GanttLeaveDay[]
}
