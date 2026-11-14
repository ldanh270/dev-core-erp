import { PROJECT_ROLE } from "@/configs/entities/project.config.ts"
import { ErrorLayer } from "@/configs/system/error-code.config.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import {
  CreateProjectRoleDto,
  IProjectRepository,
  IProjectRoleRepository,
  IProjectRoleService,
  ProjectRole,
  UpdateProjectRoleDto,
} from "@/types"
import { AppError } from "@/utils/error.util.ts"

/**
 * Service implementing business logic for project-scoped member roles.
 */
export class ProjectRoleService implements IProjectRoleService {
  constructor(
    private repository: IProjectRoleRepository,
    private projectRepository: IProjectRepository,
  ) {}

  /**
   * Helper to slugify a string for unique role code identification.
   * @param str - The input string.
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
   * Lists all roles configured in a project. Automatically seeds default roles
   * if the role set is currently empty for that project.
   * @param projectId - Project ID.
   * @returns Array of project roles.
   */
  async list(projectId: string): Promise<ProjectRole[]> {
    const project = await this.projectRepository.findById(projectId)
    if (!project) {
      throw new AppError("Dự án không tồn tại", HttpStatusCode.NOT_FOUND, ErrorLayer.SERVICE)
    }

    const list = await this.repository.list(projectId)

    if (list.length === 0) {
      // Auto-seed default roles for this project
      const defaults = [
        {
          name: "Trưởng nhóm",
          code: PROJECT_ROLE.LEADER,
          allowedTaskTrackers: [
            "feature",
            "bug",
            "support",
            "task",
            "meeting",
            "test",
            "subtask",
            "management",
          ],
        },
        {
          name: "Lập trình viên",
          code: PROJECT_ROLE.DEVELOPER,
          allowedTaskTrackers: [
            "feature",
            "bug",
            "support",
            "task",
            "meeting",
            "test",
            "subtask",
            "management",
          ],
        },
        { name: "Kiểm thử viên", code: PROJECT_ROLE.TESTER, allowedTaskTrackers: ["bug", "test"] },
        { name: "Người xem", code: PROJECT_ROLE.VIEWER, allowedTaskTrackers: [] },
      ]

      await this.repository.createMany(projectId, defaults)
      return this.repository.list(projectId)
    }

    return list
  }

  /**
   * Creates a new custom project role.
   * @param projectId - Project ID.
   * @param data - Role details.
   * @returns The created role.
   */
  async create(projectId: string, data: CreateProjectRoleDto): Promise<ProjectRole> {
    const project = await this.projectRepository.findById(projectId)
    if (!project) {
      throw new AppError("Dự án không tồn tại", HttpStatusCode.NOT_FOUND, ErrorLayer.SERVICE)
    }

    const code = this.generateSlug(data.name)

    const existing = await this.repository.list(projectId)
    const duplicate = existing.find(
      (r) => r.code === code || r.name.toLowerCase() === data.name.toLowerCase(),
    )
    if (duplicate) {
      throw new AppError(
        "Vai trò này đã tồn tại trong dự án",
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
   * Updates an existing custom project role.
   * @param projectId - Project ID.
   * @param id - Role ID.
   * @param data - Updated details.
   * @returns The updated role or null.
   */
  async update(
    projectId: string,
    id: string,
    data: UpdateProjectRoleDto,
  ): Promise<ProjectRole | null> {
    const role = await this.repository.findById(id)
    if (!role || role.projectId !== projectId) {
      throw new AppError(
        "Vai trò không tồn tại hoặc không thuộc dự án này",
        HttpStatusCode.NOT_FOUND,
        ErrorLayer.SERVICE,
      )
    }

    let code: string | undefined = undefined
    if (data.name) {
      code = this.generateSlug(data.name)
      const existing = await this.repository.list(projectId)
      const duplicate = existing.find(
        (r) =>
          r.id !== id && (r.code === code || r.name.toLowerCase() === data.name!.toLowerCase()),
      )
      if (duplicate) {
        throw new AppError(
          "Tên vai trò đã tồn tại trong dự án",
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
   * Deletes a custom project role. Protects the default Leader role from being deleted.
   * @param projectId - Project ID.
   * @param id - Role ID.
   */
  async delete(projectId: string, id: string): Promise<void> {
    const role = await this.repository.findById(id)
    if (!role || role.projectId !== projectId) {
      throw new AppError(
        "Vai trò không tồn tại hoặc không thuộc dự án này",
        HttpStatusCode.NOT_FOUND,
        ErrorLayer.SERVICE,
      )
    }

    // Check if leader role code is trying to be deleted (protect the system from deleting leader)
    if (role.code === PROJECT_ROLE.LEADER) {
      throw new AppError(
        "Không thể xóa vai trò Trưởng nhóm mặc định",
        HttpStatusCode.BAD_REQUEST,
        ErrorLayer.SERVICE,
      )
    }

    await this.repository.delete(id)
  }
}
