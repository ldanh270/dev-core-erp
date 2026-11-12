import { ICustomQueryService, ICustomQueryRepository, CustomQuery, CreateCustomQueryDto, CustomQueryType } from "@/types/custom-query.types.ts"
import { AppError } from "@/utils/error.util.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"

/**
 * Service managing user-defined custom queries and filters for project and task boards.
 */
export class CustomQueryService implements ICustomQueryService {
  /**
   * Initializes service with injected repository.
   *
   * @param customQueryRepo - Custom query repository implementation
   */
  constructor(private customQueryRepo: ICustomQueryRepository) {}

  /**
   * Retrieves saved custom queries for an employee, optionally filtered by project and query type.
   *
   * @param employeeId - ID of employee owning the queries
   * @param projectId - Optional project scope filter
   * @param type - Optional query type (e.g. task filter, report filter)
   * @returns List of matching custom queries
   */
  async getQueries(employeeId: string, projectId?: string | null, type?: CustomQueryType): Promise<CustomQuery[]> {
    return this.customQueryRepo.findByEmployee(employeeId, projectId, type)
  }

  /**
   * Creates and saves a new custom query for an employee.
   *
   * @param data - Query definition including name, payload data, and scope
   * @param employeeId - ID of employee creating the query
   * @returns Newly saved CustomQuery record
   * @throws {AppError} If query name or queryData payload is empty (400 Bad Request)
   */
  async saveQuery(data: CreateCustomQueryDto, employeeId: string): Promise<CustomQuery> {
    if (!data.name || !data.name.trim()) {
      throw new AppError("Tên truy vấn không được trống", HttpStatusCode.BAD_REQUEST, "CustomQueryService")
    }
    if (!data.queryData || !data.queryData.trim()) {
      throw new AppError("Dữ liệu truy vấn không được trống", HttpStatusCode.BAD_REQUEST, "CustomQueryService")
    }
    return this.customQueryRepo.create({
      ...data,
      employeeId,
    })
  }

  /**
   * Deletes a custom query ensuring the requesting employee is the owner.
   *
   * @param id - Unique identifier of the query to delete
   * @param employeeId - ID of employee requesting deletion
   * @returns True if successfully deleted
   * @throws {AppError} If query is not found (404) or user is not the owner (403 Forbidden)
   */
  async deleteQuery(id: string, employeeId: string): Promise<boolean> {
    const query = await this.customQueryRepo.findById(id)
    if (!query) {
      throw new AppError("Không tìm thấy truy vấn để xóa", HttpStatusCode.NOT_FOUND, "CustomQueryService")
    }
    if (query.employeeId !== employeeId) {
      throw new AppError("Bạn không có quyền xóa truy vấn này", HttpStatusCode.FORBIDDEN, "CustomQueryService")
    }
    return this.customQueryRepo.delete(id)
  }
}
