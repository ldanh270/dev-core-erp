import { CUSTOM_QUERY_TYPE } from "@/configs/entities/project.config.ts"

export type CustomQueryType = (typeof CUSTOM_QUERY_TYPE)[keyof typeof CUSTOM_QUERY_TYPE]

export interface CustomQuery {
  id: string
  name: string
  type: string
  projectId: string | null
  employeeId: string
  queryData: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateCustomQueryDto {
  name: string
  type?: string
  projectId?: string | null
  queryData: string
}

export interface ICustomQueryRepository {
  findByEmployee(
    employeeId: string,
    projectId?: string | null,
    type?: CustomQueryType,
  ): Promise<CustomQuery[]>
  findById(id: string): Promise<CustomQuery | null>
  create(data: CreateCustomQueryDto & { employeeId: string }): Promise<CustomQuery>
  delete(id: string): Promise<boolean>
}

export interface ICustomQueryService {
  getQueries(
    employeeId: string,
    projectId?: string | null,
    type?: CustomQueryType,
  ): Promise<CustomQuery[]>
  saveQuery(data: CreateCustomQueryDto, employeeId: string): Promise<CustomQuery>
  deleteQuery(id: string, employeeId: string): Promise<boolean>
}
