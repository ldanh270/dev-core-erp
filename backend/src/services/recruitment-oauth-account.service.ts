import { HttpStatusCode } from "@/configs/system/http.config"
import { recruitmentOAuthAccountRepository } from "@/repositories/recruitment-oauth-account.repository"
import { AppError } from "@/utils/error.util"

import { RecruitmentOAuthAccount } from "@prisma/client"

const LAYER = "RecruitmentOAuthAccountService"

export type RecruitmentOAuthAccountPublic = Pick<
  RecruitmentOAuthAccount,
  "id" | "userId" | "channel" | "name" | "clientId" | "createdAt" | "updatedAt"
> & {
  hasRefreshToken: boolean
}

export const toPublicOAuthAccount = (
  account: RecruitmentOAuthAccount,
): RecruitmentOAuthAccountPublic => ({
  id: account.id,
  userId: account.userId,
  channel: account.channel,
  name: account.name,
  clientId: account.clientId,
  createdAt: account.createdAt,
  updatedAt: account.updatedAt,
  hasRefreshToken: account.refreshToken.length > 0,
})

export class RecruitmentOAuthAccountService {
  async upsert(
    userId: string,
    input: {
      channel: string
      name: string
      clientId: string
      clientSecret: string
      refreshToken: string
    },
    accountId?: string,
  ) {
    const account = await recruitmentOAuthAccountRepository.upsert(userId, input, accountId)
    return toPublicOAuthAccount(account)
  }

  async list(userId?: string) {
    if (userId) {
      const accounts = await recruitmentOAuthAccountRepository.listByUser(userId)
      return accounts.map(toPublicOAuthAccount)
    }
    const accounts = await recruitmentOAuthAccountRepository.list()
    return accounts.map(toPublicOAuthAccount)
  }

  async getByChannel(userId: string, channel: string) {
    const account = await recruitmentOAuthAccountRepository.findByUserAndChannel(userId, channel)
    if (!account) {
      throw new AppError(
        `Tài khoản OAuth cho kênh ${channel} chưa được cấu hình`,
        HttpStatusCode.NOT_FOUND,
        LAYER,
      )
    }
    return toPublicOAuthAccount(account)
  }

  async delete(userId: string, id: string) {
    const result = await recruitmentOAuthAccountRepository.delete(userId, id)
    if (result.count === 0) {
      throw new AppError("Không tìm thấy tài khoản OAuth để xóa", HttpStatusCode.NOT_FOUND, LAYER)
    }
    return result
  }

  async getByIdWithCredentials(id: string) {
    const account = await recruitmentOAuthAccountRepository.findById(id)
    if (!account) return null
    return recruitmentOAuthAccountRepository.decryptCredentials(account)
  }

  async getCredentials(userId: string, channel: string) {
    const account = await recruitmentOAuthAccountRepository.findByUserAndChannel(userId, channel)
    if (!account) return null
    const credentials = recruitmentOAuthAccountRepository.decryptCredentials(account)
    return {
      clientId: credentials.clientId,
      clientSecret: credentials.clientSecret,
      refreshToken: credentials.refreshToken,
    }
  }

  async saveFromOAuthFlow(
    userId: string,
    channel: string,
    name: string,
    tokens: {
      clientId: string
      clientSecret: string
      refreshToken: string
    },
    accountId?: string,
  ) {
    const account = await recruitmentOAuthAccountRepository.upsert(
      userId,
      {
        channel,
        name,
        ...tokens,
      },
      accountId,
    )
    return toPublicOAuthAccount(account)
  }
}

export const recruitmentOAuthAccountService = new RecruitmentOAuthAccountService()
