import { IContractStatus, IContractType } from "@/configs/entities/employee-contract.config.ts"
import { SORT_ORDER } from "@/configs/system/db.config.ts"
import { Prisma, PrismaClient } from "@prisma/client"

import {
  ContractListQuery,
  ContractStatus,
  ContractType,
  CreateContractDto,
  EmployeeContract,
  PaginatedContracts,
  TerminateContractDto,
  UpdateContractDto,
} from "@/types/employee-contract.types.ts"

/**
 * Repository interface for Employee Contract data access.
 */
export interface IEmployeeContractRepository {
  findById(id: string): Promise<EmployeeContract | null>
  findByEmployeeId(employeeId: string, includeInactive?: boolean): Promise<EmployeeContract[]>
  findActiveByEmployeeId(employeeId: string): Promise<EmployeeContract | null>
  findExpiring(days: number): Promise<EmployeeContract[]>
  list(query: ContractListQuery): Promise<PaginatedContracts>
  create(data: CreateContractDto, createdById: string): Promise<EmployeeContract>
  update(id: string, data: UpdateContractDto, updatedById: string): Promise<EmployeeContract | null>
  terminate(id: string, data: TerminateContractDto): Promise<EmployeeContract | null>
  renew(id: string, newData: CreateContractDto, createdById: string): Promise<EmployeeContract>
  softDelete(id: string): Promise<boolean>
}

/**
 * Prisma implementation of IEmployeeContractRepository.
 */
export class PrismaEmployeeContractRepository implements IEmployeeContractRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private mapToDomain(contract: Prisma.EmployeeContractGetPayload<object>): EmployeeContract {
    return {
      id: contract.id,
      employeeId: contract.employeeId,
      contractType: contract.contractType as ContractType,
      contractNumber: contract.contractNumber,
      title: contract.title,
      signedDate: contract.signedDate?.toISOString() ?? null,
      startDate: contract.startDate.toISOString(),
      endDate: contract.endDate?.toISOString() ?? null,
      trialEndDate: contract.trialEndDate?.toISOString() ?? null,
      salary: Number(contract.salary),
      currency: contract.currency,
      allowances: (contract.allowances ?? []) as unknown as EmployeeContract["allowances"],
      attachments: contract.attachments ?? [],
      status: contract.status as ContractStatus,
      terminationReason: contract.terminationReason,
      terminationDate: contract.terminationDate?.toISOString() ?? null,
      probationSalary: contract.probationSalary ? Number(contract.probationSalary) : null,
      probationSalaryRate: contract.probationSalaryRate ? Number(contract.probationSalaryRate) : null,
      createdById: contract.createdById,
      updatedById: contract.updatedById,
      note: contract.note,
      renewedFromId: contract.renewedFromId,
      createdAt: contract.createdAt.toISOString(),
      updatedAt: contract.updatedAt.toISOString(),
    }
  }

  async findById(id: string): Promise<EmployeeContract | null> {
    const contract = await this.prisma.employeeContract.findFirst({
      where: { id, deletedAt: null },
    })
    return contract ? this.mapToDomain(contract) : null
  }

  async findByEmployeeId(employeeId: string, includeInactive = false): Promise<EmployeeContract[]> {
    const contracts = await this.prisma.employeeContract.findMany({
      where: {
        employeeId,
        deletedAt: null,
        ...(includeInactive ? {} : { status: { notIn: ["expired", "terminated"] } }),
      },
      orderBy: { startDate: SORT_ORDER.DESC },
    })
    return contracts.map((c) => this.mapToDomain(c))
  }

  async findActiveByEmployeeId(employeeId: string): Promise<EmployeeContract | null> {
    const contract = await this.prisma.employeeContract.findFirst({
      where: {
        employeeId,
        deletedAt: null,
        status: { in: ["active", "pending_signature"] },
      },
      orderBy: { startDate: SORT_ORDER.DESC },
    })
    return contract ? this.mapToDomain(contract) : null
  }

  async findExpiring(days: number): Promise<EmployeeContract[]> {
    const now = new Date()
    const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)

    const contracts = await this.prisma.employeeContract.findMany({
      where: {
        deletedAt: null,
        status: "active",
        endDate: {
          not: null,
          gte: now,
          lte: future,
        },
      },
      orderBy: { endDate: SORT_ORDER.ASC },
    })
    return contracts.map((c) => this.mapToDomain(c))
  }

  async list(query: ContractListQuery): Promise<PaginatedContracts> {
    const { employeeId, status, type, page = 1, limit = 50 } = query
    const skip = (page - 1) * limit

    const where: Prisma.EmployeeContractWhereInput = { deletedAt: null }
    if (employeeId) where.employeeId = employeeId
    if (status) where.status = status
    if (type) where.contractType = type

    const [data, total] = await this.prisma.$transaction([
      this.prisma.employeeContract.findMany({
        where,
        orderBy: { createdAt: SORT_ORDER.DESC },
        skip,
        take: limit,
      }),
      this.prisma.employeeContract.count({ where }),
    ])

    return {
      data: data.map((c) => this.mapToDomain(c)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  async create(data: CreateContractDto, createdById: string): Promise<EmployeeContract> {
    const contract = await this.prisma.employeeContract.create({
      data: {
        employeeId: data.employeeId,
        contractType: data.contractType as IContractType,
        contractNumber: data.contractNumber,
        title: data.title,
        signedDate: data.signedDate ? new Date(data.signedDate) : null,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        trialEndDate: data.trialEndDate ? new Date(data.trialEndDate) : null,
        salary: data.salary,
        currency: data.currency || "VND",
        allowances: ((data.allowances || []) as unknown) as Prisma.InputJsonValue,
        attachments: data.attachments || [],
        probationSalary: data.probationSalary,
        probationSalaryRate: data.probationSalaryRate,
        note: data.note,
        createdById,
      },
    })
    return this.mapToDomain(contract)
  }

  async update(id: string, data: UpdateContractDto, updatedById: string): Promise<EmployeeContract | null> {
    const existing = await this.prisma.employeeContract.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    })
    if (!existing) return null

    const updateData: Prisma.EmployeeContractUpdateInput = {
      updatedBy: { connect: { id: updatedById } },
      note: data.note,
    }

    if (data.contractType) updateData.contractType = data.contractType as IContractType
    if (data.contractNumber) updateData.contractNumber = data.contractNumber
    if (data.title !== undefined) updateData.title = data.title
    if (data.signedDate !== undefined)
      updateData.signedDate = data.signedDate ? new Date(data.signedDate) : null
    if (data.startDate) updateData.startDate = new Date(data.startDate)
    if (data.endDate !== undefined)
      updateData.endDate = data.endDate ? new Date(data.endDate) : null
    if (data.trialEndDate !== undefined)
      updateData.trialEndDate = data.trialEndDate ? new Date(data.trialEndDate) : null
    if (data.salary !== undefined) updateData.salary = data.salary
    if (data.currency) updateData.currency = data.currency
    if (data.allowances !== undefined) updateData.allowances = (data.allowances as unknown) as Prisma.InputJsonValue
    if (data.attachments !== undefined) updateData.attachments = data.attachments
    if (data.probationSalary !== undefined) updateData.probationSalary = data.probationSalary
    if (data.probationSalaryRate !== undefined)
      updateData.probationSalaryRate = data.probationSalaryRate
    if (data.status) updateData.status = data.status

    const contract = await this.prisma.employeeContract.update({
      where: { id },
      data: updateData,
    })
    return this.mapToDomain(contract)
  }

  async terminate(id: string, data: TerminateContractDto): Promise<EmployeeContract | null> {
    const existing = await this.prisma.employeeContract.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    })
    if (!existing) return null

    const contract = await this.prisma.employeeContract.update({
      where: { id },
      data: {
        status: "terminated",
        terminationReason: data.terminationReason,
        terminationDate: data.terminationDate ? new Date(data.terminationDate) : new Date(),
      },
    })
    return this.mapToDomain(contract)
  }

  async renew(
    _id: string,
    newData: CreateContractDto,
    createdById: string,
  ): Promise<EmployeeContract> {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.employeeContract.findFirst({
        where: { id: _id, deletedAt: null },
        select: { id: true },
      })
      if (!existing) {
        throw new Error("Contract not found")
      }

      // Mark old as renewed
      await tx.employeeContract.update({
        where: { id: _id },
        data: { status: "renewed" },
      })

      // Create new contract
      const newContract = await tx.employeeContract.create({
        data: {
          employeeId: newData.employeeId,
          contractType: newData.contractType as IContractType,
          contractNumber: newData.contractNumber,
          title: newData.title,
          signedDate: newData.signedDate ? new Date(newData.signedDate) : null,
          startDate: new Date(newData.startDate),
          endDate: newData.endDate ? new Date(newData.endDate) : null,
          trialEndDate: newData.trialEndDate ? new Date(newData.trialEndDate) : null,
          salary: newData.salary,
          currency: newData.currency || "VND",
          allowances: ((newData.allowances || []) as unknown) as Prisma.InputJsonValue,
          attachments: newData.attachments || [],
          probationSalary: newData.probationSalary,
          probationSalaryRate: newData.probationSalaryRate,
          note: newData.note,
          renewedFromId: _id,
          createdById,
        },
      })

      return this.mapToDomain(newContract)
    })
  }

  async softDelete(id: string): Promise<boolean> {
    const existing = await this.prisma.employeeContract.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    })
    if (!existing) return false

    await this.prisma.employeeContract.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    })
    return true
  }
}
