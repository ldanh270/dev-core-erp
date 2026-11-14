import { prisma } from "@/libs/database"

import type { Prisma, PrismaClient } from "@prisma/client"

export class RecruitmentPostingActivityRepository {
  constructor(private readonly db: PrismaClient = prisma) {}

  create(data: Prisma.RecruitmentPostingActivityUncheckedCreateInput) {
    return this.db.recruitmentPostingActivity.create({ data, include: this.relations })
  }

  async list(postingId: string, page: number, pageSize: number) {
    const where = { postingId }
    const [items, total] = await this.db.$transaction([
      this.db.recruitmentPostingActivity.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: this.relations,
      }),
      this.db.recruitmentPostingActivity.count({ where }),
    ])
    return { items, total, page, pageSize }
  }

  private readonly relations = {
    actor: { select: { id: true, fullName: true, avatarUrl: true } },
    application: { select: { id: true, candidate: { select: { id: true, fullName: true } } } },
  }
}

export const recruitmentPostingActivityRepository = new RecruitmentPostingActivityRepository()
