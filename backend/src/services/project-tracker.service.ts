import { ErrorLayer } from "@/configs/system/error-code.config.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import {
  CreateProjectTrackerDto,
  IProjectRepository,
  IProjectTrackerRepository,
  IProjectTrackerService,
  ProjectTracker,
  UpdateProjectTrackerDto,
} from "@/types"
import { AppError } from "@/utils/error.util.ts"

/**
 * Service implementing business logic for project-scoped task trackers.
 */
export class ProjectTrackerService implements IProjectTrackerService {
  constructor(
    private repository: IProjectTrackerRepository,
    private projectRepository: IProjectRepository,
  ) {}

  /**
   * Helper to slugify a string for unique tracker code identification.
   * @param str - Input string.
   * @returns Slugified code.
   */
  private generateSlug(str: string): string {
    let slug = str.toLowerCase()
    const from = "àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ"
    const to = "aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuuyyyyyd"

    for (let i = 0, l = from.length; i < l; i++) {
      slug = slug.split(from[i]).join(to[i])
    }

    return slug
      .trim()
      .replace(/[^a-z0-9 -]/g, "") // remove invalid chars
      .replace(/\s+/g, "-") // collapse whitespace and replace by -
      .replace(/-+/g, "-") // collapse dashes
      .replace(/^-+|-+$/g, "") // trim leading/trailing dashes
  }

  /**
   * Lists all task trackers configured in a project. Automatically seeds default trackers
   * if the tracker set is currently empty for that project.
   * @param projectId - Project ID.
   * @returns Array of project task trackers.
   */
  async list(projectId: string): Promise<ProjectTracker[]> {
    const project = await this.projectRepository.findById(projectId)
    if (!project) {
      throw new AppError("Dự án không tồn tại", HttpStatusCode.NOT_FOUND, ErrorLayer.SERVICE)
    }

    const list = await this.repository.list(projectId)

    if (list.length === 0) {
      // Seed default trackers for this project on the fly!
      const defaults = [
        { name: "Tính năng", code: "feature", isActive: true },
        { name: "Lỗi", code: "bug", isActive: true },
        { name: "Hỗ trợ", code: "support", isActive: true },
        { name: "Công việc", code: "task", isActive: true },
        { name: "Cuộc họp", code: "meeting", isActive: true },
        { name: "Kiểm thử", code: "test", isActive: true },
        { name: "Công việc con", code: "subtask", isActive: true },
        { name: "Quản lý", code: "management", isActive: true },
      ]

      await this.repository.createMany(projectId, defaults)
      return this.repository.list(projectId)
    }

    return list
  }

  /**
   * Creates a new custom project task tracker.
   * @param projectId - Project ID.
   * @param data - Tracker details.
   * @returns The created tracker.
   */
  async create(projectId: string, data: CreateProjectTrackerDto): Promise<ProjectTracker> {
    const project = await this.projectRepository.findById(projectId)
    if (!project) {
      throw new AppError("Dự án không tồn tại", HttpStatusCode.NOT_FOUND, ErrorLayer.SERVICE)
    }

    const code = this.generateSlug(data.name)

    // Check uniqueness within the project
    const existing = await this.repository.list(projectId)
    const duplicate = existing.find(
      (t) => t.code === code || t.name.toLowerCase() === data.name.toLowerCase(),
    )
    if (duplicate) {
      throw new AppError(
        "Loại yêu cầu này đã tồn tại trong dự án",
        HttpStatusCode.CONFLICT,
        ErrorLayer.SERVICE,
      )
    }

    return this.repository.create(projectId, {
      ...data,
      code,
    })
  }

  /**
   * Updates an existing project task tracker.
   * @param projectId - Project ID.
   * @param id - Tracker ID.
   * @param data - Updated details.
   * @returns The updated tracker or null.
   */
  async update(
    projectId: string,
    id: string,
    data: UpdateProjectTrackerDto,
  ): Promise<ProjectTracker | null> {
    const tracker = await this.repository.findById(id)
    if (!tracker || tracker.projectId !== projectId) {
      throw new AppError(
        "Loại yêu cầu không tồn tại hoặc không thuộc dự án này",
        HttpStatusCode.NOT_FOUND,
        ErrorLayer.SERVICE,
      )
    }

    let code: string | undefined = undefined
    if (data.name) {
      code = this.generateSlug(data.name)
      // Check duplicate name/code
      const existing = await this.repository.list(projectId)
      const duplicate = existing.find(
        (t) =>
          t.id !== id && (t.code === code || t.name.toLowerCase() === data.name!.toLowerCase()),
      )
      if (duplicate) {
        throw new AppError(
          "Tên loại yêu cầu đã tồn tại trong dự án",
          HttpStatusCode.CONFLICT,
          ErrorLayer.SERVICE,
        )
      }
    }

    return this.repository.update(id, {
      ...data,
      code,
    })
  }

  /**
   * Deletes a project task tracker.
   * @param projectId - Project ID.
   * @param id - Tracker ID.
   */
  async delete(projectId: string, id: string): Promise<void> {
    const tracker = await this.repository.findById(id)
    if (!tracker || tracker.projectId !== projectId) {
      throw new AppError(
        "Loại yêu cầu không tồn tại hoặc không thuộc dự án này",
        HttpStatusCode.NOT_FOUND,
        ErrorLayer.SERVICE,
      )
    }

    await this.repository.delete(id)
  }
}
