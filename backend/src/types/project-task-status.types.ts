export interface ProjectTaskStatus {
  id: string
  projectId: string
  name: string
  color: string
  order: number
  isDefault: boolean
  isCompleted: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CreateProjectTaskStatusDto {
  projectId: string
  name: string
  color?: string
  order?: number
  isDefault?: boolean
  isCompleted?: boolean
}

export interface UpdateProjectTaskStatusDto {
  name?: string
  color?: string
  order?: number
  isDefault?: boolean
  isCompleted?: boolean
}

export interface IProjectTaskStatusRepository {
  findById(id: string): Promise<ProjectTaskStatus | null>
  findByProjectAndName(projectId: string, name: string): Promise<ProjectTaskStatus | null>
  listByProjectId(projectId: string): Promise<ProjectTaskStatus[]>
  create(data: CreateProjectTaskStatusDto): Promise<ProjectTaskStatus>
  update(id: string, data: UpdateProjectTaskStatusDto): Promise<ProjectTaskStatus | null>
  delete(id: string): Promise<boolean>
  findDefaultStatus(projectId: string): Promise<ProjectTaskStatus | null>
  clearDefaultStatus(projectId: string): Promise<void>
  getMaxOrder(projectId: string): Promise<number>
}

export interface IProjectTaskStatusService {
  getStatus(id: string, userId: string): Promise<ProjectTaskStatus | null>
  listStatuses(projectId: string, userId: string): Promise<ProjectTaskStatus[]>
  createStatus(data: CreateProjectTaskStatusDto, userId: string): Promise<ProjectTaskStatus>
  updateStatus(
    id: string,
    data: UpdateProjectTaskStatusDto,
    userId: string,
  ): Promise<ProjectTaskStatus | null>
  deleteStatus(id: string, fallbackStatusId: string | undefined, userId: string): Promise<boolean>
  createDefaultStatuses(projectId: string): Promise<ProjectTaskStatus[]>
}
