import {
  CONTRACT_STATUS_VALUES,
  CONTRACT_TYPES,
  type IContractStatus,
  type IContractType,
} from "@/configs/entities/employee-contract.config.ts"
import { ErrorCode } from "@/configs/system/error-code.config.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { AuthRequest } from "@/middlewares/auth.middleware.ts"
import { IEmployeeContractService } from "@/services/employee-contract.service.ts"
import { ApiResponse } from "@/types"
import {
  CreateContractDto,
  EmployeeContract,
  PaginatedContracts,
  RenewContractDto,
  TerminateContractDto,
  UpdateContractDto,
} from "@/types/employee-contract.types.ts"

import { Response } from "express"

export class EmployeeContractController {
  constructor(private readonly service: IEmployeeContractService) {}

  list = async (req: AuthRequest, res: Response<ApiResponse<PaginatedContracts>>) => {
    const { employeeId, status, type, page, limit } = req.query as Record<string, unknown>
    const result = await this.service.listContracts({
      employeeId: employeeId as string,
      status:
        status && (CONTRACT_STATUS_VALUES as readonly string[]).includes(status as string)
          ? (status as IContractStatus)
          : undefined,
      type:
        type && (CONTRACT_TYPES as readonly string[]).includes(type as string)
          ? (type as IContractType)
          : undefined,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 50,
    })
    res.status(HttpStatusCode.OK).json({ data: result, error: null })
  }

  getById = async (req: AuthRequest, res: Response<ApiResponse<EmployeeContract>>) => {
    const contract = await this.service.getById(String(req.params.id))
    res.status(HttpStatusCode.OK).json({ data: contract, error: null })
  }

  getByEmployeeId = async (req: AuthRequest, res: Response<ApiResponse<EmployeeContract[]>>) => {
    const includeInactive = req.query.includeInactive === "true"
    const contracts = await this.service.getByEmployeeId(
      String(req.params.employeeId),
      includeInactive,
    )
    res.status(HttpStatusCode.OK).json({ data: contracts, error: null })
  }

  getExpiring = async (req: AuthRequest, res: Response<ApiResponse<EmployeeContract[]>>) => {
    const days = Number(req.query.days) || 30
    const contracts = await this.service.getExpiringContracts(days)
    res.status(HttpStatusCode.OK).json({ data: contracts, error: null })
  }

  create = async (req: AuthRequest, res: Response<ApiResponse<EmployeeContract>>) => {
    const data = req.body as CreateContractDto
    const actorId = req.user?.empId as string
    const contract = await this.service.createContract(data, actorId)
    res.status(HttpStatusCode.CREATED).json({ data: contract, error: null })
  }

  update = async (req: AuthRequest, res: Response<ApiResponse<EmployeeContract>>) => {
    const data = req.body as UpdateContractDto
    const actorId = req.user?.empId as string
    const contract = await this.service.updateContract(String(req.params.id), data, actorId)
    res.status(HttpStatusCode.OK).json({ data: contract, error: null })
  }

  terminate = async (req: AuthRequest, res: Response<ApiResponse<EmployeeContract>>) => {
    const data = req.body as TerminateContractDto
    const contract = await this.service.terminateContract(String(req.params.id), data)
    res.status(HttpStatusCode.OK).json({ data: contract, error: null })
  }

  renew = async (req: AuthRequest, res: Response<ApiResponse<EmployeeContract>>) => {
    const data = req.body as RenewContractDto
    const actorId = req.user?.empId as string
    const contract = await this.service.renewContract(String(req.params.id), data, actorId)
    res.status(HttpStatusCode.OK).json({ data: contract, error: null })
  }

  delete = async (req: AuthRequest, res: Response<ApiResponse<boolean>>) => {
    await this.service.deleteContract(String(req.params.id))
    res.status(HttpStatusCode.OK).json({ data: true, error: null })
  }
}
