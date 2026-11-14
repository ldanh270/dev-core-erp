import { CONTRACT_STATUS } from "@/configs/entities/employee-contract.config.ts"
import { ErrorLayer } from "@/configs/system/error-code.config.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { IEmployeeContractRepository } from "@/repositories/employee-contract.repository.ts"
import {
  ContractListQuery,
  CreateContractDto,
  EmployeeContract,
  PaginatedContracts,
  RenewContractDto,
  TerminateContractDto,
  UpdateContractDto,
} from "@/types/employee-contract.types.ts"
import { handleDbUniqueError } from "@/utils/db-error.util.ts"
import { AppError } from "@/utils/error.util.ts"

const CONTRACT_UNIQUE_FIELD_MAP: Record<string, string> = {
  contractNumber: "Contract number",
  employeeId: "Active contract for employee",
}

/**
 * Contract service interface defining employee employment contract business operations.
 */
export interface IEmployeeContractService {
  /**
   * Retrieves a contract by primary key ID.
   *
   * @param id - Contract unique identifier
   * @returns Contract record
   */
  getById(id: string): Promise<EmployeeContract>

  /**
   * Retrieves all contracts for an employee.
   *
   * @param employeeId - Employee identifier
   * @param includeInactive - Whether to include terminated or renewed contracts
   * @returns List of contracts
   */
  getByEmployeeId(employeeId: string, includeInactive?: boolean): Promise<EmployeeContract[]>

  /**
   * Retrieves the currently active contract for an employee.
   *
   * @param employeeId - Employee identifier
   * @returns Active contract or null
   */
  getActiveContract(employeeId: string): Promise<EmployeeContract | null>

  /**
   * Retrieves contracts expiring within the specified number of days.
   *
   * @param days - Number of lookahead days
   * @returns List of expiring contracts
   */
  getExpiringContracts(days: number): Promise<EmployeeContract[]>

  /**
   * Lists contracts with pagination, filtering, and sorting.
   *
   * @param query - Filter criteria and pagination options
   * @returns Paginated contracts response
   */
  listContracts(query: ContractListQuery): Promise<PaginatedContracts>

  /**
   * Creates a new employee contract.
   *
   * @param data - Contract creation payload
   * @param actorId - ID of user creating the contract
   * @returns Newly created contract
   */
  createContract(data: CreateContractDto, actorId: string): Promise<EmployeeContract>

  /**
   * Updates an existing active contract.
   *
   * @param id - Contract ID to update
   * @param data - Updated fields
   * @param actorId - ID of user performing the update
   * @returns Updated contract
   */
  updateContract(id: string, data: UpdateContractDto, actorId: string): Promise<EmployeeContract>

  /**
   * Terminates an active contract.
   *
   * @param id - Contract ID to terminate
   * @param data - Termination metadata (date, reason, note)
   * @returns Terminated contract record
   */
  terminateContract(id: string, data: TerminateContractDto): Promise<EmployeeContract>

  /**
   * Renews an existing contract by creating a new contract version and archiving old.
   *
   * @param id - Previous contract ID being renewed
   * @param data - Renewal payload containing new contract specs
   * @param actorId - ID of user executing the renewal
   * @returns Newly created replacement contract
   */
  renewContract(id: string, data: RenewContractDto, actorId: string): Promise<EmployeeContract>

  /**
   * Soft-deletes a non-active contract record.
   *
   * @param id - Contract ID to delete
   * @returns True if deleted successfully
   */
  deleteContract(id: string): Promise<boolean>
}

/**
 * Service implementation for managing employee contracts lifecycle, renewals, and terminations.
 */
export class EmployeeContractService implements IEmployeeContractService {
  /**
   * Initializes service with contract repository.
   *
   * @param repository - Employee contract data access repository
   */
  constructor(private readonly repository: IEmployeeContractRepository) {}

  /**
   * Retrieves a contract by primary key ID.
   *
   * @param id - Contract unique identifier
   * @returns Contract record
   * @throws {AppError} If contract not found (404)
   */
  async getById(id: string): Promise<EmployeeContract> {
    const contract = await this.repository.findById(id)
    if (!contract) {
      throw new AppError("Contract not found", HttpStatusCode.NOT_FOUND, ErrorLayer.SERVICE)
    }
    return contract
  }

  /**
   * Retrieves all contracts associated with an employee.
   *
   * @param employeeId - Employee identifier
   * @param includeInactive - Whether to include inactive/terminated contracts (default: false)
   * @returns List of contracts
   */
  async getByEmployeeId(employeeId: string, includeInactive = false): Promise<EmployeeContract[]> {
    return this.repository.findByEmployeeId(employeeId, includeInactive)
  }

  /**
   * Finds the currently active contract for an employee.
   *
   * @param employeeId - Employee identifier
   * @returns Active contract record or null if none
   */
  async getActiveContract(employeeId: string): Promise<EmployeeContract | null> {
    return this.repository.findActiveByEmployeeId(employeeId)
  }

  /**
   * Finds all contracts whose end dates fall within the next `days` days.
   *
   * @param days - Threshold days from today
   * @returns List of expiring contracts
   */
  async getExpiringContracts(days: number): Promise<EmployeeContract[]> {
    return this.repository.findExpiring(days)
  }

  /**
   * Queries paginated contracts based on filter options.
   *
   * @param query - Filter parameters and page settings
   * @returns Paginated contracts list
   */
  async listContracts(query: ContractListQuery): Promise<PaginatedContracts> {
    return this.repository.list(query)
  }

  /**
   * Creates a new contract validating active overlap and contract type rules.
   *
   * @param data - Contract creation parameters
   * @param actorId - ID of user creating the contract
   * @returns Created contract record
   * @throws {AppError} If employee already has active contract (409) or invalid date bounds (400)
   */
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

  /**
   * Updates an existing contract while ensuring it is not already expired, terminated, or renewed.
   *
   * @param id - Contract unique identifier
   * @param data - Updated contract fields
   * @param actorId - ID of user updating the contract
   * @returns Updated contract
   * @throws {AppError} If contract not found (404) or contract is inactive (400)
   */
  async updateContract(
    id: string,
    data: UpdateContractDto,
    actorId: string,
  ): Promise<EmployeeContract> {
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
        throw new AppError(
          "Failed to update contract",
          HttpStatusCode.INTERNAL_SERVER_ERROR,
          ErrorLayer.SERVICE,
        )
      }
      return updated
    } catch (error) {
      handleDbUniqueError(error, "EmployeeContractService", CONTRACT_UNIQUE_FIELD_MAP)
    }
  }

  /**
   * Terminates an active contract record with explicit termination reason and date.
   *
   * @param id - Contract unique identifier
   * @param data - Termination reason, termination date, and optional note
   * @returns Terminated contract record
   * @throws {AppError} If contract not found (404), already terminated (409), or already renewed (400)
   */
  async terminateContract(id: string, data: TerminateContractDto): Promise<EmployeeContract> {
    const existing = await this.repository.findById(id)
    if (!existing) {
      throw new AppError("Contract not found", HttpStatusCode.NOT_FOUND, ErrorLayer.SERVICE)
    }

    if (existing.status === "terminated") {
      throw new AppError("Contract already terminated", HttpStatusCode.CONFLICT, ErrorLayer.SERVICE)
    }

    if (existing.status === "renewed") {
      throw new AppError(
        "Cannot terminate renewed contract",
        HttpStatusCode.BAD_REQUEST,
        ErrorLayer.SERVICE,
      )
    }

    const terminated = await this.repository.terminate(id, data)
    if (!terminated) {
      throw new AppError(
        "Failed to terminate contract",
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        ErrorLayer.SERVICE,
      )
    }
    return terminated
  }

  /**
   * Renews an active or expired contract by transitioning it to 'renewed' and inserting the successor contract.
   *
   * @param id - Original contract identifier
   * @param data - Successor contract data payload
   * @param actorId - ID of user executing renewal
   * @returns Newly created contract record
   * @throws {AppError} If contract not found (404) or contract status cannot be renewed (400)
   */
  async renewContract(
    id: string,
    data: RenewContractDto,
    actorId: string,
  ): Promise<EmployeeContract> {
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

  /**
   * Performs soft deletion on an inactive contract record. Active contracts cannot be deleted.
   *
   * @param id - Contract unique identifier
   * @returns True if contract deleted
   * @throws {AppError} If contract not found (404) or contract is currently active (400)
   */
  async deleteContract(id: string): Promise<boolean> {
    const existing = await this.repository.findById(id)
    if (!existing) {
      throw new AppError("Contract not found", HttpStatusCode.NOT_FOUND, ErrorLayer.SERVICE)
    }

    if (existing.status === "active") {
      throw new AppError(
        "Cannot delete active contract. Terminate it first.",
        HttpStatusCode.BAD_REQUEST,
        ErrorLayer.SERVICE,
      )
    }

    return this.repository.softDelete(id)
  }
}
