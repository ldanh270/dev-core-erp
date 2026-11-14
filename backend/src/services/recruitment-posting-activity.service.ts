import {
  RECRUITMENT_POSTING_ACTIVITY_TYPE,
  RECRUITMENT_POSTING_ACTIVITY_TYPES,
} from "@/configs/entities/recruitment.config"
import { recruitmentPostingActivityRepository } from "@/repositories/recruitment-posting-activity.repository"

import type { Prisma } from "@prisma/client"

type ActivityType = (typeof RECRUITMENT_POSTING_ACTIVITY_TYPES)[number]

export class RecruitmentPostingActivityService {
  record(
    postingId: string,
    type: ActivityType,
    actorId?: string,
    metadata?: Record<string, unknown>,
    applicationId?: string,
  ) {
    return recruitmentPostingActivityRepository.create({
      postingId,
      type,
      actorId,
      applicationId,
      metadata: metadata as Prisma.InputJsonValue | undefined,
    })
  }

  list(postingId: string, page: number, pageSize: number) {
    return recruitmentPostingActivityRepository.list(postingId, page, pageSize)
  }
}

export const recruitmentPostingActivityService = new RecruitmentPostingActivityService()
export { RECRUITMENT_POSTING_ACTIVITY_TYPE }
