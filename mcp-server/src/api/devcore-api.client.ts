import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios'

import {
  errorResponse,
  normalizeApiError,
  successResponse,
  type ApiResponse,
} from '../contracts/api.contract.js'
import { DevcoreApiError } from '../errors/devcore-api.error.js'
import { createAuthedClient, devcoreClient } from '../utils/devcore-client.js'

export type DevcoreApiSession = {
  jwt: string
  cookies?: string[]
}

export type HrpApiSession = DevcoreApiSession

export class DevcoreApiClient {
  constructor(private readonly client: AxiosInstance) {}

  public async request<T>(config: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.request<T>(config)
      const body = response.data

      if (body && typeof body === 'object' && 'data' in body && 'error' in body) {
        return body as unknown as ApiResponse<T>
      }

      return successResponse(body)
    } catch (error: unknown) {
      if (!axios.isAxiosError(error)) {
        throw error
      }

      const apiError = normalizeApiError(
        error.response?.data,
        error.message || 'DevCore ERP API request failed',
        `HTTP_${error.response?.status ?? 'ERROR'}`,
      )
      return errorResponse(apiError, { status: error.response?.status ?? null })
    }
  }

  public async requestOrThrow<T>(config: AxiosRequestConfig): Promise<T> {
    const response = await this.request<T>(config)
    if (response.error) {
      throw new DevcoreApiError(response.error, this.statusFromMeta(response.meta))
    }
    return response.data as T
  }

  private statusFromMeta(meta: unknown): number | undefined {
    if (!meta || typeof meta !== 'object') return undefined
    const status = (meta as Record<string, unknown>).status
    return typeof status === 'number' ? status : undefined
  }
}

export const publicDevcoreApi = new DevcoreApiClient(devcoreClient)
export const publicHrpApi = publicDevcoreApi

export const createDevcoreApiClient = (session: DevcoreApiSession): DevcoreApiClient =>
  new DevcoreApiClient(createAuthedClient(session))

export const createHrpApiClient = createDevcoreApiClient
export const HrpApiClient = DevcoreApiClient
