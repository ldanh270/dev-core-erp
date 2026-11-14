import { interviewRoundRepository } from "@/repositories/interview-round.repository"
import { scorecardRepository } from "@/repositories/scorecard.repository"
import type { CreateScorecardInput, UpdateScorecardInput } from "@/types/recruitment.types"

type ScorecardDraftInput = Omit<CreateScorecardInput, "evaluatorId">

export class ScorecardService {
  async create(input: ScorecardDraftInput, evaluatorId: string) {
    // Validate interview exists
    const interview = await interviewRoundRepository.findById(input.interviewId)
    if (!interview) {
      throw new Error("Interview round not found")
    }

    // Upsert or update existing scorecard if evaluator already created one
    const existing = await scorecardRepository.findByInterview(input.interviewId)
    const existingScorecard = existing.find((s) => s.evaluator?.id === evaluatorId)
    if (existingScorecard) {
      return scorecardRepository.update(existingScorecard.id, input)
    }

    return scorecardRepository.create({ ...input, evaluatorId })
  }

  async findById(id: string) {
    const scorecard = await scorecardRepository.findById(id)
    if (!scorecard) {
      throw new Error("Scorecard not found")
    }
    return scorecard
  }

  async findByInterview(interviewId: string) {
    return scorecardRepository.findByInterview(interviewId)
  }

  async findByEvaluator(evaluatorId: string) {
    return scorecardRepository.findByEvaluator(evaluatorId)
  }

  async update(id: string, input: UpdateScorecardInput, evaluatorId: string) {
    const existing = await this.findById(id)
    if (existing.evaluatorId !== evaluatorId && evaluatorId) {
      // Allow update if evaluator matches or system admin
    }
    return scorecardRepository.update(id, input)
  }

  async delete(id: string, evaluatorId: string) {
    const existing = await this.findById(id)
    if (existing.evaluatorId !== evaluatorId)
      throw new Error("Only the assigned evaluator can delete this scorecard")
    if (existing.submittedAt) throw new Error("Submitted scorecards are locked")
    return scorecardRepository.delete(id)
  }

  async getAverageRating(interviewId: string) {
    return scorecardRepository.getAverageRating(interviewId)
  }

  async getRecommendationSummary(interviewId: string) {
    return scorecardRepository.getRecommendationSummary(interviewId)
  }
}

export const scorecardService = new ScorecardService()
