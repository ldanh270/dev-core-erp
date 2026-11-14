import { prisma } from "@/libs/database"
import type { CreateScorecardInput, UpdateScorecardInput } from "@/types/recruitment.types"

import { Prisma, type PrismaClient } from "@prisma/client"

export class ScorecardRepository {
  constructor(private readonly db: PrismaClient = prisma) {}

  async create(data: CreateScorecardInput): Promise<{ id: string }> {
    return this.db.scorecard.create({
      data: {
        interviewId: data.interviewId,
        evaluatorId: data.evaluatorId,
        overallRating: data.overallRating,
        strengths: data.strengths,
        weaknesses: data.weaknesses,
        recommendation: data.recommendation,
        scores: data.scores ?? {},
        answers: data.answers ?? {},
      },
      select: { id: true },
    })
  }

  async findById(id: string) {
    return this.db.scorecard.findUnique({
      where: { id },
      include: {
        interview: {
          include: {
            application: {
              include: {
                candidate: { select: { id: true, fullName: true } },
              },
            },
          },
        },
        evaluator: { select: { id: true, fullName: true } },
      },
    })
  }

  async findByInterview(interviewId: string) {
    return this.db.scorecard.findMany({
      where: { interviewId },
      include: {
        evaluator: { select: { id: true, fullName: true } },
      },
      orderBy: { createdAt: "asc" },
    })
  }

  async findByEvaluator(evaluatorId: string) {
    return this.db.scorecard.findMany({
      where: { evaluatorId },
      include: {
        interview: {
          include: {
            application: {
              include: {
                candidate: { select: { id: true, fullName: true } },
                requisition: { select: { id: true, title: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })
  }

  async update(id: string, data: UpdateScorecardInput) {
    const updateData: Prisma.ScorecardUpdateInput = {}

    if (data.overallRating !== undefined) updateData.overallRating = data.overallRating
    if (data.strengths !== undefined) updateData.strengths = data.strengths
    if (data.weaknesses !== undefined) updateData.weaknesses = data.weaknesses
    if (data.recommendation !== undefined) updateData.recommendation = data.recommendation
    if (data.scores !== undefined) updateData.scores = data.scores
    if (data.answers !== undefined) updateData.answers = data.answers

    return this.db.scorecard.update({
      where: { id },
      data: updateData,
      include: {
        evaluator: { select: { id: true, fullName: true } },
      },
    })
  }

  async delete(id: string) {
    return this.db.scorecard.delete({ where: { id } })
  }

  async getAverageRating(interviewId: string): Promise<number | null> {
    const result = await this.db.scorecard.aggregate({
      where: { interviewId },
      _avg: { overallRating: true },
    })
    return result._avg.overallRating
  }

  async getRecommendationSummary(interviewId: string) {
    const scorecards = await this.db.scorecard.findMany({
      where: { interviewId },
      select: { recommendation: true },
    })

    const summary = { strong_hire: 0, hire: 0, no_hire: 0, strong_no_hire: 0 }
    for (const sc of scorecards) {
      if (sc.recommendation && sc.recommendation in summary) {
        summary[sc.recommendation as keyof typeof summary]++
      }
    }

    return summary
  }
}

export const scorecardRepository = new ScorecardRepository()
