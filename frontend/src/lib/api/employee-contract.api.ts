import apiClient from "@/lib/api-client.ts"
import type {
  IContract,
  ICreateContractPayload,
  IPaginatedContracts,
  IRenewContractPayload,
  ITerminateContractPayload,
  IUpdateContractPayload,
} from "@/types/employee-contract.types.ts"

export const getContracts = async (params?: {
  employeeId?: string
  status?: string
  type?: string
  page?: number
  limit?: number
}) => {
  const response = await apiClient.get<{ data: IPaginatedContracts }>("/employee-contracts", {
    params,
  })
  return response.data.data
}

export const getContractById = async (id: string) => {
  const response = await apiClient.get<{ data: IContract }>(`/employee-contracts/${id}`)
  return response.data.data
}

export const getContractsByEmployee = async (employeeId: string, includeInactive = false) => {
  const response = await apiClient.get<{ data: IContract[] }>(
    `/employee-contracts/employee/${employeeId}`,
    { params: { includeInactive } },
  )
  return response.data.data
}

export const getExpiringContracts = async (days = 30) => {
  const response = await apiClient.get<{ data: IContract[] }>("/employee-contracts/expiring", {
    params: { days },
  })
  return response.data.data
}

export const createContract = async (data: ICreateContractPayload) => {
  const response = await apiClient.post<{ data: IContract }>("/employee-contracts", data)
  return response.data.data
}

export const updateContract = async (id: string, data: IUpdateContractPayload) => {
  const response = await apiClient.patch<{ data: IContract }>(`/employee-contracts/${id}`, data)
  return response.data.data
}

export const terminateContract = async (id: string, data: ITerminateContractPayload) => {
  const response = await apiClient.post<{ data: IContract }>(
    `/employee-contracts/${id}/terminate`,
    data,
  )
  return response.data.data
}

export const renewContract = async (id: string, data: IRenewContractPayload) => {
  const response = await apiClient.post<{ data: IContract }>(
    `/employee-contracts/${id}/renew`,
    data,
  )
  return response.data.data
}

export const deleteContract = async (id: string) => {
  const response = await apiClient.delete(`/employee-contracts/${id}`)
  return response.data
}
