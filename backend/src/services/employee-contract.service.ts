import { CONTRACT_STATUS } from "@/configs/entities/employee-contract.config.ts"
import { ErrorLayer } from "@/configs/system/error-code.config.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import {
  ContractListQuery,
  CreateContractDto,
  EmployeeContract,
  PaginatedContracts,
  RenewContractDto,
  TerminateContractDto,
  UpdateContractDto,
} from "@/types/employee-contract.types.ts"
import { AppError } from "@/utils/error.util.ts"
import { handleDbUniqueError } from "@/utils/db-error.util.ts"

import { IEmployeeContractRepository } from "@/repositories/employee-contract.repository.ts"

const CONTRACT_UNIQUE_FIELD_MAP: Record<string, string> = {
  contractNumber: "Contract number",
  employeeId: "Active contract for employee",
}

export interface IEmployeeContractService {
  getById(id: string): Promise<EmployeeContract>
  getByEmployeeId(employeeId: string, includeInactive?: boolean): Promise<EmployeeContract[]>
  getActiveContract(employeeId: string): Promise<EmployeeContract | null>
  getExpiringContracts(days: number): Promise<EmployeeContract[]>
  listContracts(query: ContractListQuery): Promise<PaginatedContracts>
  createContract(data: CreateContractDto, actorId: string): Promise<EmployeeContract>
  updateContract(id: string, data: UpdateContractDto, actorId: string): Promise<EmployeeContract>
  terminateContract(id: string, data: TerminateContractDto): Promise<EmployeeContract>
  renewContract(id: string, data: RenewContractDto, actorId: string): Promise<EmployeeContract>
  deleteContract(id: string): Promise<boolean>
}

export class EmployeeContractService implements IEmployeeContractService {
  constructor(private readonly repository: IEmployeeContractRepository) {}

  async getById(id: string): Promise<EmployeeContract> {
    const contract = await this.repository.findById(id)
    if (!contract) {
      throw new AppError("Contract not found", HttpStatusCode.NOT_FOUND, ErrorLayer.SERVICE)
    }
    return contract
  }

  async getByEmployeeId(employeeId: string, includeInactive = false): Promise<EmployeeContract[]> {
    return this.repository.findByEmployeeId(employeeId, includeInactive)
  }

  async getActiveContract(employeeId: string): Promise<EmployeeContract | null> {
    return this.repository.findActiveByEmployeeId(employeeId)
  }

  async getExpiringContracts(days: number): Promise<EmployeeContract[]> {
    return this.repository.findExpiring(days)
  }

  async listContracts(query: ContractListQuery): Promise<PaginatedContracts> {
    return this.repository.list(query)
  }

  async createContract(data: CreateContractDto, actorId: string): Promise<EmployeeContract> {
    // Check for existing active contract
    const existingActive = await this.repository.findActiveByEmployeeId(data.employeeId)
    if (existingActive) {
      throw new AppError(
        "Employee already has an active contract. Terminate or renew it first.",
        HttpStatusCode.CONFLICT,
        ErrorLayer.SERVICE,
      )
    }

    // Validate trial contract has trialEndDate
    if (data.contractType === "trial" && !data.trialEndDate) {
      throw new AppError(
        "Trial contract must have trial end date",
        HttpStatusCode.BAD_REQUEST,
        ErrorLayer.SERVICE,
      )
    }

    // Validate indefinite contract has no endDate
    if (data.contractType === "indefinite" && data.endDate) {
      throw new AppError(
        "Indefinite contract cannot have end date",
        HttpStatusCode.BAD_REQUEST,
        ErrorLayer.SERVICE,
      )
    }

    try {
      return await this.repository.create(data, actorId)
    } catch (error) {
      handleDbUniqueError(error, "EmployeeContractService", CONTRACT_UNIQUE_FIELD_MAP)
    }
  }

  async updateContract(id: string, data: UpdateContractDto, actorId: string): Promise<EmployeeContract> {
    const existing = await this.repository.findById(id)
    if (!existing) {
      throw new AppError("Contract not found", HttpStatusCode.NOT_FOUND, ErrorLayer.SERVICE)
    }

    // Cannot update expired/terminated contracts
    if (["expired", "terminated", "renewed"].includes(existing.status)) {
      throw new AppError(
        "Cannot update inactive contract",
        HttpStatusCode.BAD_REQUEST,
        ErrorLayer.SERVICE,
      )
    }

    try {
      const updated = await this.repository.update(id, data, actorId)
      if (!updated) {
        throw new AppError("Failed to update contract", HttpStatusCode.INTERNAL_SERVER_ERROR, ErrorLayer.SERVICE)
      }
      return updated
    } catch (error) {
      handleDbUniqueError(error, "EmployeeContractService", CONTRACT_UNIQUE_FIELD_MAP)
    }
  }

  async terminateContract(id: string, data: TerminateContractDto): Promise<EmployeeContract> {
    const existing = await this.repository.findById(id)
    if (!existing) {
      throw new AppError("Contract not found", HttpStatusCode.NOT_FOUND, ErrorLayer.SERVICE)
    }

    if (existing.status === "terminated") {
      throw new AppError("Contract already terminated", HttpStatusCode.CONFLICT, ErrorLayer.SERVICE)
    }

    if (existing.status === "renewed") {
      throw new AppError("Cannot terminate renewed contract", HttpStatusCode.BAD_REQUEST, ErrorLayer.SERVICE)
    }

    const terminated = await this.repository.terminate(id, data)
    if (!terminated) {
      throw new AppError("Failed to terminate contract", HttpStatusCode.INTERNAL_SERVER_ERROR, ErrorLayer.SERVICE)
    }
    return terminated
  }

  async renewContract(id: string, data: RenewContractDto, actorId: string): Promise<EmployeeContract> {
    const existing = await this.repository.findById(id)
    if (!existing) {
      throw new AppError("Contract not found", HttpStatusCode.NOT_FOUND, ErrorLayer.SERVICE)
    }

    if (!["active", "expired"].includes(existing.status)) {
      throw new AppError(
        "Can only renew active or expired contracts",
        HttpStatusCode.BAD_REQUEST,
        ErrorLayer.SERVICE,
      )
    }

    try {
      return await this.repository.renew(id, data.newContract, actorId)
    } catch (error) {
      handleDbUniqueError(error, "EmployeeContractService", CONTRACT_UNIQUE_FIELD_MAP)
    }
  }

  async deleteContract(id: string): Promise<boolean> {
    const existing = await this.repository.findById(id)
    if (!existing) {
      throw new AppError("Contract not found", HttpStatusCode.NOT_FOUND, ErrorLayer.SERVICE)
    }

    if (existing.status === "active") {
      throw new AppError("Cannot delete active contract. Terminate it first.", HttpStatusCode.BAD_REQUEST, ErrorLayer.SERVICE)
    }

    return this.repository.softDelete(id)
  }
}
