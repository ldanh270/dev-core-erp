import { ErrorCode } from "@/configs/system/error-code.config.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { AuthRequest } from "@/middlewares/auth.middleware.ts"
import {
  addProjectMemberSchema,
  createProjectSchema,
  listProjectsQuerySchema,
  updateProjectMemberSchema,
  updateProjectSchema,
} from "@/schemas/project.schema.ts"
import { ApiResponse, GanttDataDto, IProjectService, PaginatedProjectsDto, Project } from "@/types"

import { Response } from "express"
import { z } from "zod"

export class ProjectController {
  constructor(private service: IProjectService) {}

  /**
   * Retrieves a paginated list of projects based on filters
   * Filters include search, status, and pagination parameters
   * Access control: Admins/GMs see all projects, others see only their own
   */
  list = async (req: AuthRequest, res: Response<ApiResponse<PaginatedProjectsDto>>) => {
    try {
      if (!req.user) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          data: null,
          error: { message: "Unauthorized", code: ErrorCode.UNAUTHORIZED },
        })
      }

      const query = listProjectsQuerySchema.parse(req.query)
      const result = await this.service.listProjects(query, req.user.empId)
      res.status(HttpStatusCode.OK).json({ data: result, error: null })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          data: null,
          error: {
            message: "Validation error",
            code: ErrorCode.VALIDATION_ERROR,
            meta: error.issues,
          },
        })
      }
      throw error
    }
  }

  /**
   * Retrieves a single project by ID
   * Validates user permissions before returning project details
   */
  getOne = async (req: AuthRequest, res: Response<ApiResponse<Project>>) => {
    if (!req.user) {
      return res.status(HttpStatusCode.UNAUTHORIZED).json({
        data: null,
        error: { message: "Unauthorized", code: ErrorCode.UNAUTHORIZED },
      })
    }

    const project = await this.service.getProject(String(req.params.id), req.user.empId)
    if (!project) {
      return res.status(HttpStatusCode.NOT_FOUND).json({
        data: null,
        error: { message: "Project not found", code: ErrorCode.NOT_FOUND },
      })
    }
    res.status(HttpStatusCode.OK).json({ data: project, error: null })
  }

  /**
   * Creates a new project
   * Only Admins and General Managers can create projects
   * Validates input schema and user permissions
   */
  create = async (req: AuthRequest, res: Response<ApiResponse<Project>>) => {
    try {
      if (!req.user) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          data: null,
          error: { message: "Unauthorized", code: ErrorCode.UNAUTHORIZED },
        })
      }

      const data = createProjectSchema.parse(req.body)
      const project = await this.service.createProject(data as any, req.user.empId)
      res.status(HttpStatusCode.CREATED).json({ data: project, error: null })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          data: null,
          error: {
            message: "Validation error",
            code: ErrorCode.VALIDATION_ERROR,
            meta: error.issues,
          },
        })
      }
      throw error
    }
  }

  /**
   * Updates an existing project
   * Only Admins, GMs, and the project's Team Leader can update
   * Validates input schema and user permissions
   */
  update = async (req: AuthRequest, res: Response<ApiResponse<Project>>) => {
    try {
      if (!req.user) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          data: null,
          error: { message: "Unauthorized", code: ErrorCode.UNAUTHORIZED },
        })
      }

      const data = updateProjectSchema.parse(req.body)
      const project = await this.service.updateProject(
        String(req.params.id),
        data as any,
        req.user.empId,
      )
      if (!project) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          data: null,
          error: { message: "Project not found", code: ErrorCode.NOT_FOUND },
        })
      }
      res.status(HttpStatusCode.OK).json({ data: project, error: null })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          data: null,
          error: {
            message: "Validation error",
            code: ErrorCode.VALIDATION_ERROR,
            meta: error.issues,
          },
        })
      }
      throw error
    }
  }

  /**
   * Deletes a project by ID
   * Only Admins and General Managers can delete projects
   */
  delete = async (req: AuthRequest, res: Response<ApiResponse<null>>) => {
    if (!req.user) {
      return res.status(HttpStatusCode.UNAUTHORIZED).json({
        data: null,
        error: { message: "Unauthorized", code: ErrorCode.UNAUTHORIZED },
      })
    }

    await this.service.deleteProject(String(req.params.id), req.user.empId)
    res.status(HttpStatusCode.OK).json({ data: null, error: null })
  }

  /**
   * Adds a member to a project.
   * PT-specific: hourlyRate (payroll input) and workMode (remote = Spent Time only,
   * onsite = GPS check-in once/day then Spent Time). Service enforces rate for PT.
   */
  addMember = async (req: AuthRequest, res: Response<ApiResponse<null>>) => {
    try {
      if (!req.user) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          data: null,
          error: { message: "Unauthorized", code: ErrorCode.UNAUTHORIZED },
        })
      }

      const { employeeId, hourlyRate, workMode, roleId } = addProjectMemberSchema.parse(req.body)
      await this.service.addMember(String(req.params.id), employeeId, req.user.empId, {
        hourlyRate,
        workMode,
        roleId,
      })
      res.status(HttpStatusCode.OK).json({ data: null, error: null })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          data: null,
          error: {
            message: "Validation error",
            code: ErrorCode.VALIDATION_ERROR,
            meta: error.issues,
          },
        })
      }
      throw error
    }
  }

  /**
   * Removes a member from a project
   * Only Admins, GMs, and the project's Team Leader can remove members
   */
  removeMember = async (req: AuthRequest, res: Response<ApiResponse<null>>) => {
    if (!req.user) {
      return res.status(HttpStatusCode.UNAUTHORIZED).json({
        data: null,
        error: { message: "Unauthorized", code: ErrorCode.UNAUTHORIZED },
      })
    }

    await this.service.removeMember(
      String(req.params.id),
      String(req.params.employeeId),
      req.user.empId,
    )
    res.status(HttpStatusCode.OK).json({ data: null, error: null })
  }

  /**
   * Updates PT member settings on a project (hourlyRate, workMode).
   * workMode change toggles attendance rules without re-adding the member.
   */
  updateMember = async (req: AuthRequest, res: Response<ApiResponse<null>>) => {
    try {
      if (!req.user) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          data: null,
          error: { message: "Unauthorized", code: ErrorCode.UNAUTHORIZED },
        })
      }

      const body = updateProjectMemberSchema.parse(req.body)
      await this.service.updateMember(
        String(req.params.id),
        String(req.params.employeeId),
        req.user.empId,
        body,
      )
      res.status(HttpStatusCode.OK).json({ data: null, error: null })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          data: null,
          error: {
            message: "Validation error",
            code: ErrorCode.VALIDATION_ERROR,
            meta: error.issues,
          },
        })
      }
      throw error
    }
  }

  /**
   * Retrieves all members of a project (includes hourlyRate/workMode for PT payroll setup).
   */
  getMembers = async (req: AuthRequest, res: Response<ApiResponse<any[]>>) => {
    if (!req.user) {
      return res.status(HttpStatusCode.UNAUTHORIZED).json({
        data: null,
        error: { message: "Unauthorized", code: ErrorCode.UNAUTHORIZED },
      })
    }

    const members = await this.service.getMembers(String(req.params.id), req.user.empId)
    res.status(HttpStatusCode.OK).json({ data: members, error: null })
  }

  /**
   * Retrieves Gantt chart data for a project (tasks, members, leave records)
   * User must have access to the project to view Gantt data
   */
  getGanttData = async (req: AuthRequest, res: Response<ApiResponse<GanttDataDto>>) => {
    if (!req.user) {
      return res.status(HttpStatusCode.UNAUTHORIZED).json({
        data: null,
        error: { message: "Unauthorized", code: ErrorCode.UNAUTHORIZED },
      })
    }

    const ganttData = await this.service.getGanttData(String(req.params.id), req.user.empId)
    res.status(HttpStatusCode.OK).json({ data: ganttData, error: null })
  }
}
