/**
 * ProjectTracker domain entity.
 */
export interface ProjectTracker {
  id: string
  projectId: string
  name: string
  code: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

/**
 * DTO for creating a project tracker.
 */
export interface CreateProjectTrackerDto {
  name: string
  isActive?: boolean
}

/**
 * DTO for updating a project tracker.
 */
export interface UpdateProjectTrackerDto {
  name?: string
  isActive?: boolean
}

/**
 * Repository interface for project tracker operations.
 */
export interface IProjectTrackerRepository {
  list(projectId: string): Promise<ProjectTracker[]>
  findById(id: string): Promise<ProjectTracker | null>
  create(
    projectId: string,
    data: CreateProjectTrackerDto & { code: string },
  ): Promise<ProjectTracker>
  update(
    id: string,
    data: UpdateProjectTrackerDto & { code?: string },
  ): Promise<ProjectTracker | null>
  delete(id: string): Promise<void>
  createMany(
    projectId: string,
    trackers: Array<{ name: string; code: string; isActive: boolean }>,
  ): Promise<void>
}

/**
 * Service interface for project tracker business logic.
 */
export interface IProjectTrackerService {
  list(projectId: string): Promise<ProjectTracker[]>
  create(projectId: string, data: CreateProjectTrackerDto): Promise<ProjectTracker>
  update(
    projectId: string,
    id: string,
    data: UpdateProjectTrackerDto,
  ): Promise<ProjectTracker | null>
  delete(projectId: string, id: string): Promise<void>
}
