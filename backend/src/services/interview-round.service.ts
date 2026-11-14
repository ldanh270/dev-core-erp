import { interviewRoundRepository } from "@/repositories/interview-round.repository"
import { scorecardRepository } from "@/repositories/scorecard.repository"
import type {
  CreateInterviewRoundInput,
  UpdateInterviewRoundInput,
} from "@/types/recruitment.types"
import { AppError } from "@/utils/error.util"

import { recruitmentApplicationService } from "./recruitment-application.service"

export class InterviewRoundService {
  async create(input: CreateInterviewRoundInput) {
    // Validate application exists and is not closed/terminal
    const application = await recruitmentApplicationService.findById(input.applicationId)
    if (["rejected", "hired", "withdrawn"].includes(application.status)) {
      throw new AppError(
        "Không thể lên lịch phỏng vấn cho hồ sơ đã từ chối hoặc đã tuyển dụng",
        400,
        "Service",
      )
    }

    // Validate scheduled date validity
    const scheduledAt = new Date(input.scheduledAt)
    if (isNaN(scheduledAt.getTime())) {
      throw new AppError("Thời gian phỏng vấn không hợp lệ", 400, "Service")
    }

    return interviewRoundRepository.createAndStart(input)
  }

  async findById(id: string) {
    const interview = await interviewRoundRepository.findById(id)
    if (!interview) {
      throw new Error("Interview round not found")
    }
    return interview
  }

  async listByApplication(applicationId: string) {
    return interviewRoundRepository.listByApplication(applicationId)
  }

  async update(id: string, input: UpdateInterviewRoundInput) {
    const existing = await this.findById(id)

    // Validate scheduled time if being updated
    if (input.scheduledAt) {
      const scheduledAt = new Date(input.scheduledAt)
      if (isNaN(scheduledAt.getTime())) {
        throw new AppError("Thời gian phỏng vấn không hợp lệ", 400, "Service")
      }
    }

    return interviewRoundRepository.update(id, input)
  }

  async markCompleted(id: string, result?: string, feedback?: string) {
    const existing = await this.findById(id)

    if (existing.status === "cancelled") {
      throw new Error("Cannot complete a cancelled interview")
    }

    const interview = await interviewRoundRepository.markCompletedAndTransition(
      id,
      result,
      feedback,
    )

    // Calculate average rating from scorecards
    const avgRating = await scorecardRepository.getAverageRating(id)

    return { ...interview, averageRating: avgRating }
  }

  async cancel(id: string) {
    const existing = await this.findById(id)

    if (existing.status === "completed") {
      throw new Error("Cannot cancel a completed interview")
    }

    return interviewRoundRepository.cancel(id)
  }

  async markNoShow(id: string) {
    const existing = await this.findById(id)

    if (existing.status === "completed" || existing.status === "cancelled") {
      throw new Error("Cannot mark as no-show for completed or cancelled interviews")
    }

    const interview = await interviewRoundRepository.markNoShow(id)

    // Auto-reject on no-show
    await recruitmentApplicationService.updateStatus(existing.applicationId, {
      status: "rejected",
      rejectReason: "Candidate no-show for interview",
    })

    return interview
  }

  async delete(id: string) {
    const existing = await this.findById(id)

    if (existing.status === "completed") {
      throw new Error("Cannot delete completed interviews")
    }

    return interviewRoundRepository.delete(id)
  }

  async getUpcoming(interviewerId?: string, days?: number) {
    return interviewRoundRepository.getUpcoming(interviewerId, days)
  }
}

export const interviewRoundService = new InterviewRoundService()
