import type { IShiftScheduleWithTemplate } from "@/types/shift-schedule.types.ts"

import type { Prisma } from "@prisma/client"

export interface IWeeklyScheduleTemplateDayDTO {
  dayOfWeek: number
  shiftId?: string | null
}

export interface IWeeklyScheduleTemplateWeekDTO {
  weekIndex: number
  days: IWeeklyScheduleTemplateDayDTO[]
}

export interface ICreateWeeklyScheduleTemplateDTO {
  name: string
  description?: string | null
  cycleWeeks: number
  isActive?: boolean
  weeks: IWeeklyScheduleTemplateWeekDTO[]
  createdById: string
}

export interface IUpdateWeeklyScheduleTemplateDTO {
  name?: string
  description?: string | null
  cycleWeeks?: number
  isActive?: boolean
  weeks?: IWeeklyScheduleTemplateWeekDTO[]
}

export interface IApplyWeeklyScheduleTemplateDTO {
  templateId: string
  employeeIds: string[]
  validFrom: string | Date
  validTo?: string | Date | null
  generateShifts?: boolean
  createdById: string
}

export const weeklyScheduleTemplateInclude = {
  weeks: {
    orderBy: { weekIndex: "asc" as const },
    include: {
      days: {
        orderBy: { dayOfWeek: "asc" as const },
        include: { shift: true },
      },
    },
  },
} as const satisfies Prisma.WeeklyScheduleTemplateInclude

export type IWeeklyScheduleTemplateWithWeeks = Prisma.WeeklyScheduleTemplateGetPayload<{
  include: typeof weeklyScheduleTemplateInclude
}>

export interface IWeeklyScheduleTemplateRepository {
  create(data: ICreateWeeklyScheduleTemplateDTO): Promise<IWeeklyScheduleTemplateWithWeeks>
  update(
    id: string,
    data: IUpdateWeeklyScheduleTemplateDTO,
  ): Promise<IWeeklyScheduleTemplateWithWeeks>
  delete(id: string): Promise<void>
  findById(id: string): Promise<IWeeklyScheduleTemplateWithWeeks | null>
  listAll(): Promise<IWeeklyScheduleTemplateWithWeeks[]>
}

export interface IWeeklyScheduleTemplateService {
  createTemplate(data: ICreateWeeklyScheduleTemplateDTO): Promise<IWeeklyScheduleTemplateWithWeeks>
  updateTemplate(
    id: string,
    data: IUpdateWeeklyScheduleTemplateDTO,
  ): Promise<IWeeklyScheduleTemplateWithWeeks>
  deleteTemplate(id: string): Promise<void>
  getTemplate(id: string): Promise<IWeeklyScheduleTemplateWithWeeks>
  listTemplates(): Promise<IWeeklyScheduleTemplateWithWeeks[]>
  applyTemplate(data: IApplyWeeklyScheduleTemplateDTO): Promise<IShiftScheduleWithTemplate[]>
}
