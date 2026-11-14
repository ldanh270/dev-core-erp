import { prisma } from "@/libs/database"
import type {
  CreateCandidateInput,
  ListCandidatesQuery,
  UpdateCandidateInput,
} from "@/types/recruitment.types"

import { Prisma, type PrismaClient } from "@prisma/client"

export class CandidateRepository {
  constructor(private readonly db: PrismaClient = prisma) {}

  async create(data: CreateCandidateInput): Promise<{ id: string }> {
    return this.db.candidate.create({
      data,
      select: { id: true },
    })
  }

  async findById(id: string) {
    return this.db.candidate.findUnique({
      where: { id },
      include: {
        applications: {
          include: {
            requisition: { select: { id: true, title: true, code: true } },
          },
        },
      },
    })
  }

  async findByEmail(email: string) {
    return this.db.candidate.findFirst({
      where: { email },
      orderBy: { createdAt: "desc" },
      include: {
        applications: {
          include: {
            requisition: { select: { id: true, title: true } },
          },
        },
      },
    })
  }

  async list(query: ListCandidatesQuery) {
    const { source, search, page = 1, pageSize = 20 } = query
    const skip = (page - 1) * pageSize

    const where: Prisma.CandidateWhereInput = {}
    if (source) where.source = source
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
      ]
    }

    const [items, total] = await Promise.all([
      this.db.candidate.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { applications: true } },
        },
      }),
      this.db.candidate.count({ where }),
    ])

    return { items, total, page, pageSize }
  }

  async update(id: string, data: UpdateCandidateInput) {
    return this.db.candidate.update({
      where: { id },
      data,
      include: {
        applications: {
          include: {
            requisition: { select: { id: true, title: true } },
          },
        },
      },
    })
  }

  async delete(id: string) {
    return this.db.candidate.delete({ where: { id } })
  }

  async getStats() {
    const total = await this.db.candidate.count()
    const bySource = await this.db.candidate.groupBy({
      by: ["source"],
      _count: { id: true },
    })

    return {
      total,
      bySource: bySource.reduce(
        (acc, { source, _count }) => ({ ...acc, [source]: _count.id }),
        {} as Record<string, number>,
      ),
    }
  }
}

export const candidateRepository = new CandidateRepository()
