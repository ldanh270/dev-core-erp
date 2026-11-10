import type {
  IProfileRepository,
  ProfileEmployeeDocument,
  ProfileEmployeeDocumentWithPassword,
  UpdateProfileDto,
} from "@/types/profile.types.ts"

import { Prisma, PrismaClient } from "@prisma/client"

import { BaseRepository } from "./base.repository.ts"

const PROFILE_PERSONAL_EMPLOYEE_SELECT = {
  id: true,
  fullName: true,
  email: true,
  status: true,
  deletedAt: true,
} as const

const PROFILE_BASE_SELECT = {
  id: true,
  fullName: true,
  username: true,
  email: true,
  phone: true,
  dateOfBirth: true,
  nationalId: true,
  address: true,
  position: true,
  positionId: true,
  employeeType: true,
  workScheduleType: true,
  status: true,
  startDate: true,
  avatarUrl: true,
  avatarId: true,
  createdAt: true,
  updatedAt: true,
  personalEmployeeId: true,
} as const

const PROFILE_WITH_PERSONAL_SELECT = {
  ...PROFILE_BASE_SELECT,
  personalEmployee: {
    select: PROFILE_PERSONAL_EMPLOYEE_SELECT,
  },
} as const

type ProfileBaseRow = Prisma.EmployeeGetPayload<{
  select: typeof PROFILE_BASE_SELECT
}>

type ProfilePersonalRow = Prisma.EmployeeGetPayload<{
  select: typeof PROFILE_PERSONAL_EMPLOYEE_SELECT
}>

/**
 * Prisma implementation of the Profile Repository
 * Follows the Repository Pattern to isolate all DB operations
 */
export class PrismaProfileRepository extends BaseRepository implements IProfileRepository {
  constructor(prisma: PrismaClient) {
    super(prisma)
  }

  private mapToProfile(
    employee: ProfileBaseRow & {
      personalEmployee?: ProfilePersonalRow | null
    },
  ): ProfileEmployeeDocument {
    return {
      id: employee.id,
      fullName: employee.fullName,
      username: employee.username,
      email: employee.email,
      phone: employee.phone,
      dateOfBirth: employee.dateOfBirth,
      nationalId: employee.nationalId,
      address: employee.address,
      position: employee.position,
      positionId: employee.positionId,
      employeeType: employee.employeeType,
      workScheduleType: employee.workScheduleType, // PT vs full-time scheduling model
      status: employee.status,
      startDate: employee.startDate,
      avatarUrl: employee.avatarUrl,
      avatarId: employee.avatarId,
      createdAt: employee.createdAt,
      updatedAt: employee.updatedAt,
      personalEmployeeId: employee.personalEmployeeId,
      personalEmployee: employee.personalEmployee
        ? {
            id: employee.personalEmployee.id,
            fullName: employee.personalEmployee.fullName,
            email: employee.personalEmployee.email,
            status: employee.personalEmployee.status,
            deletedAt: employee.personalEmployee.deletedAt,
          }
        : null,
    }
  }

  async findById(empId: string): Promise<ProfileEmployeeDocument | null> {
    const employee = await this.prisma.employee.findFirst({
      where: { id: empId, deletedAt: null },
      select: PROFILE_WITH_PERSONAL_SELECT,
    })

    if (!employee) return null

    return this.mapToProfile(employee)
  }

  async findAuthById(empId: string): Promise<ProfileEmployeeDocumentWithPassword | null> {
    const employee = await this.prisma.employee.findFirst({
      where: { id: empId, deletedAt: null },
      select: {
        ...PROFILE_BASE_SELECT,
        passwordHash: true,
      },
    })

    if (!employee) return null

    return {
      ...this.mapToProfile(employee),
      passwordHash: employee.passwordHash,
    }
  }

  /**
   * Updates only the user-editable profile fields and returns the updated document
   */
  async updateProfile(
    empId: string,
    data: UpdateProfileDto,
  ): Promise<ProfileEmployeeDocument | null> {
    const updateFields: Prisma.EmployeeUpdateInput = {}

    if (data.fullName !== undefined) updateFields.fullName = data.fullName
    if (data.phone !== undefined) updateFields.phone = data.phone
    if (data.dateOfBirth !== undefined) updateFields.dateOfBirth = new Date(data.dateOfBirth)
    if (data.nationalId !== undefined) updateFields.nationalId = data.nationalId
    if (data.address !== undefined) updateFields.address = data.address

    try {
      const employee = await this.prisma.employee.update({
        where: { id: empId },
        data: updateFields,
        select: PROFILE_BASE_SELECT,
      })

      return this.mapToProfile(employee)
    } catch (error) {
      return null
    }
  }

  /**
   * Updates only the avatar for a given employee
   */
  async updateAvatar(
    empId: string,
    avatar: { url: string; id: string },
  ): Promise<ProfileEmployeeDocument | null> {
    try {
      const employee = await this.prisma.employee.update({
        where: { id: empId },
        data: {
          avatarUrl: avatar.url,
          avatarId: avatar.id,
        },
        select: PROFILE_BASE_SELECT,
      })

      return this.mapToProfile(employee)
    } catch (error) {
      return null
    }
  }

  /**
   * Updates the password hash for an employee
   */
  async updatePassword(empId: string, newPasswordHash: string): Promise<void> {
    await this.prisma.employee.update({
      where: { id: empId },
      data: { passwordHash: newPasswordHash },
    })
  }

  async updatePersonalEmployeeLink(
    empId: string,
    personalEmployeeId: string | null,
  ): Promise<ProfileEmployeeDocument | null> {
    try {
      const employee = await this.prisma.employee.update({
        where: { id: empId },
        data: { personalEmployeeId },
        select: PROFILE_WITH_PERSONAL_SELECT,
      })

      return this.mapToProfile(employee)
    } catch {
      return null
    }
  }
}
