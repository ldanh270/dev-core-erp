import { DEVCORE_API_CONSTANTS } from "../constants/devcore-api.constants.js"
import type {
  CreateProjectInput,
  CreateTaskInput,
  ListProjectsInput,
  ListSpentTimesInput,
  ListTasksInput,
  LogSpentTimeInput,
  UpdateProjectInput,
  UpdateSpentTimeInput,
  UpdateTaskInput,
} from "../schemas/project.schema.js"
import { SessionData } from "../types/session.types.js"
import { createAuthedClient } from "../utils/devcore-client.js"

export class ProjectService {
  private client(session: SessionData) {
    return createAuthedClient(session)
  }

  private handleError(error: any, fallback: string): never {
    if (error.response) {
      throw new Error(
        error.response.data?.message || error.response.data?.error?.message || fallback,
      )
    }
    throw new Error(`Connection error: ${error.message}`)
  }

  // ─── Projects ────────────────────────────────────────────────────────────────

  async listProjects(session: SessionData, params?: ListProjectsInput) {
    try {
      const res = await this.client(session).get(DEVCORE_API_CONSTANTS.ENDPOINTS.PROJECTS.BASE, {
        params,
      })
      return res.data
    } catch (e: any) {
      this.handleError(e, "Failed to fetch projects")
    }
  }

  async getProject(session: SessionData, id: string) {
    try {
      const res = await this.client(session).get(DEVCORE_API_CONSTANTS.ENDPOINTS.PROJECTS.BY_ID(id))
      return res.data
    } catch (e: any) {
      this.handleError(e, "Failed to fetch project")
    }
  }

  async createProject(session: SessionData, data: CreateProjectInput) {
    try {
      const res = await this.client(session).post(DEVCORE_API_CONSTANTS.ENDPOINTS.PROJECTS.BASE, data)
      return res.data
    } catch (e: any) {
      this.handleError(e, "Failed to create project")
    }
  }

  async updateProject(session: SessionData, id: string, data: UpdateProjectInput) {
    try {
      const res = await this.client(session).patch(
        DEVCORE_API_CONSTANTS.ENDPOINTS.PROJECTS.BY_ID(id),
        data,
      )
      return res.data
    } catch (e: any) {
      this.handleError(e, "Failed to update project")
    }
  }

  async deleteProject(session: SessionData, id: string) {
    try {
      const res = await this.client(session).delete(DEVCORE_API_CONSTANTS.ENDPOINTS.PROJECTS.BY_ID(id))
      return res.data
    } catch (e: any) {
      this.handleError(e, "Failed to delete project")
    }
  }

  async getProjectMembers(session: SessionData, id: string) {
    try {
      const res = await this.client(session).get(DEVCORE_API_CONSTANTS.ENDPOINTS.PROJECTS.MEMBERS(id))
      return res.data
    } catch (e: any) {
      this.handleError(e, "Failed to fetch project members")
    }
  }

  async addProjectMember(session: SessionData, projectId: string, employeeId: string) {
    try {
      const res = await this.client(session).post(
        DEVCORE_API_CONSTANTS.ENDPOINTS.PROJECTS.MEMBERS(projectId),
        { employeeId },
      )
      return res.data
    } catch (e: any) {
      this.handleError(e, "Failed to add project member")
    }
  }

  async removeProjectMember(session: SessionData, projectId: string, employeeId: string) {
    try {
      const res = await this.client(session).delete(
        DEVCORE_API_CONSTANTS.ENDPOINTS.PROJECTS.MEMBER_BY_ID(projectId, employeeId),
      )
      return res.data
    } catch (e: any) {
      this.handleError(e, "Failed to remove project member")
    }
  }

  // ─── Tasks ────────────────────────────────────────────────────────────────────

  async listTasks(session: SessionData, params?: ListTasksInput) {
    try {
      const res = await this.client(session).get(DEVCORE_API_CONSTANTS.ENDPOINTS.PROJECTS.TASKS, {
        params,
      })
      return res.data
    } catch (e: any) {
      this.handleError(e, "Failed to fetch tasks")
    }
  }

  async getTask(session: SessionData, id: string) {
    try {
      const res = await this.client(session).get(
        DEVCORE_API_CONSTANTS.ENDPOINTS.PROJECTS.TASK_BY_ID(id),
      )
      return res.data
    } catch (e: any) {
      this.handleError(e, "Failed to fetch task")
    }
  }

  async createTask(session: SessionData, data: CreateTaskInput) {
    try {
      const res = await this.client(session).post(DEVCORE_API_CONSTANTS.ENDPOINTS.PROJECTS.TASKS, data)
      return res.data
    } catch (e: any) {
      this.handleError(e, "Failed to create task")
    }
  }

  async updateTask(session: SessionData, id: string, data: UpdateTaskInput) {
    try {
      const res = await this.client(session).patch(
        DEVCORE_API_CONSTANTS.ENDPOINTS.PROJECTS.TASK_BY_ID(id),
        data,
      )
      return res.data
    } catch (e: any) {
      this.handleError(e, "Failed to update task")
    }
  }

  async deleteTask(session: SessionData, id: string) {
    try {
      const res = await this.client(session).delete(
        DEVCORE_API_CONSTANTS.ENDPOINTS.PROJECTS.TASK_BY_ID(id),
      )
      return res.data
    } catch (e: any) {
      this.handleError(e, "Failed to delete task")
    }
  }

  // ─── Categories ───────────────────────────────────────────────────────────────

  async listCategories(session: SessionData, projectId: string) {
    try {
      const res = await this.client(session).get(
        DEVCORE_API_CONSTANTS.ENDPOINTS.PROJECTS.CATEGORIES(projectId),
      )
      return res.data
    } catch (e: any) {
      this.handleError(e, "Failed to fetch categories")
    }
  }

  async createCategory(session: SessionData, projectId: string, name: string) {
    try {
      const res = await this.client(session).post(
        DEVCORE_API_CONSTANTS.ENDPOINTS.PROJECTS.CATEGORIES(projectId),
        { name },
      )
      return res.data
    } catch (e: any) {
      this.handleError(e, "Failed to create category")
    }
  }

  async updateCategory(session: SessionData, projectId: string, categoryId: string, name: string) {
    try {
      const res = await this.client(session).patch(
        DEVCORE_API_CONSTANTS.ENDPOINTS.PROJECTS.CATEGORY_BY_ID(projectId, categoryId),
        { name },
      )
      return res.data
    } catch (e: any) {
      this.handleError(e, "Failed to update category")
    }
  }

  async deleteCategory(session: SessionData, projectId: string, categoryId: string) {
    try {
      const res = await this.client(session).delete(
        DEVCORE_API_CONSTANTS.ENDPOINTS.PROJECTS.CATEGORY_BY_ID(projectId, categoryId),
      )
      return res.data
    } catch (e: any) {
      this.handleError(e, "Failed to delete category")
    }
  }

  // ─── Spent Times ──────────────────────────────────────────────────────────────

  async listSpentTimes(session: SessionData, params?: ListSpentTimesInput) {
    try {
      const res = await this.client(session).get(DEVCORE_API_CONSTANTS.ENDPOINTS.PROJECTS.SPENT_TIMES, {
        params,
      })
      return res.data
    } catch (e: any) {
      this.handleError(e, "Failed to fetch spent times")
    }
  }

  async getSpentTime(session: SessionData, id: string) {
    try {
      const res = await this.client(session).get(
        DEVCORE_API_CONSTANTS.ENDPOINTS.PROJECTS.SPENT_TIME_BY_ID(id),
      )
      return res.data
    } catch (e: any) {
      this.handleError(e, "Failed to fetch spent time")
    }
  }

  async logSpentTime(session: SessionData, data: LogSpentTimeInput) {
    try {
      const res = await this.client(session).post(
        DEVCORE_API_CONSTANTS.ENDPOINTS.PROJECTS.SPENT_TIMES,
        data,
      )
      return res.data
    } catch (e: any) {
      this.handleError(e, "Failed to log spent time")
    }
  }

  async updateSpentTime(session: SessionData, id: string, data: UpdateSpentTimeInput) {
    try {
      const res = await this.client(session).patch(
        DEVCORE_API_CONSTANTS.ENDPOINTS.PROJECTS.SPENT_TIME_BY_ID(id),
        data,
      )
      return res.data
    } catch (e: any) {
      this.handleError(e, "Failed to update spent time")
    }
  }

  async deleteSpentTime(session: SessionData, id: string) {
    try {
      const res = await this.client(session).delete(
        DEVCORE_API_CONSTANTS.ENDPOINTS.PROJECTS.SPENT_TIME_BY_ID(id),
      )
      return res.data
    } catch (e: any) {
      this.handleError(e, "Failed to delete spent time")
    }
  }
}

export const projectService = new ProjectService()
