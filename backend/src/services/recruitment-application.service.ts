import { TERMINAL_APPLICATION_STATUSES } from "@/configs/entities/recruitment.config"
import { canTransitionApplicationStatus } from "@/configs/rules/recruitment.config"
import { HttpStatusCode } from "@/configs/system/http.config"
import { jobPostingRepository } from "@/repositories/job-posting.repository"
import { jobRequisitionRepository } from "@/repositories/job-requisition.repository"
import { recruitmentApplicationRepository } from "@/repositories/recruitment-application.repository"
import type {
  CreateApplicationInput,
  ListApplicationsQuery,
  UpdateApplicationStatusInput,
} from "@/types/recruitment.types"
import { AppError } from "@/utils/error.util"

const LAYER = "RecruitmentApplicationService"

export class RecruitmentApplicationService {
  async create(input: CreateApplicationInput) {
    let normalizedInput = input
    // Check if requisition exists and is approved
    const requisition = await jobRequisitionRepository.findById(input.requisitionId)
    if (!requisition) {
      throw new Error("Job requisition not found")
    }
    if (requisition.status !== "approved") {
      throw new Error("Cannot apply to unapproved requisitions")
    }

    const posting = await jobPostingRepository.findById(input.postingId)
    if (!posting || posting.requisitionId !== input.requisitionId) {
      throw new AppError(
        "Bài đăng không thuộc Yêu cầu tuyển dụng đã chọn",
        HttpStatusCode.BAD_REQUEST,
        LAYER,
        "POSTING_REQUISITION_MISMATCH",
      )
    }
    if (posting.source !== input.source) {
      throw new AppError(
        "Nguồn ứng viên không khớp bài đăng",
        HttpStatusCode.BAD_REQUEST,
        LAYER,
        "POSTING_SOURCE_MISMATCH",
      )
    }
    normalizedInput = { ...input, sourceRef: posting.sourceCode }

    try {
      return await recruitmentApplicationRepository.create(normalizedInput)
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new AppError(
          "Ứng viên đã có hồ sơ đang xử lý cho yêu cầu tuyển dụng này",
          HttpStatusCode.CONFLICT,
          LAYER,
          "ACTIVE_APPLICATION_EXISTS",
        )
      }
      throw error
    }
  }

  async findById(id: string) {
    const application = await recruitmentApplicationRepository.findById(id)
    if (!application) {
      throw new Error("Application not found")
    }
    return application
  }

  async list(query: ListApplicationsQuery) {
    return recruitmentApplicationRepository.list(query)
  }

  async listKanban(query: ListApplicationsQuery) {
    return recruitmentApplicationRepository.listKanban(query)
  }

  async updateStatus(id: string, input: UpdateApplicationStatusInput) {
    const application = await this.findById(id)

    // Validate status transition
    if (!canTransitionApplicationStatus(application.status, input.status)) {
      throw new Error(`Invalid status transition from '${application.status}' to '${input.status}'`)
    }

    try {
      return await recruitmentApplicationRepository.updateStatus(
        id,
        input,
        input.version ?? application.version,
      )
    } catch (error) {
      if (error instanceof Error && error.message === "APPLICATION_VERSION_CONFLICT") {
        throw new AppError(
          "Hồ sơ đã được cập nhật bởi người khác",
          HttpStatusCode.CONFLICT,
          LAYER,
          "APPLICATION_VERSION_CONFLICT",
        )
      }
      if (error instanceof Error && error.message === "HEADCOUNT_FILLED") {
        throw new AppError(
          "Đã đủ chỉ tiêu tuyển dụng",
          HttpStatusCode.CONFLICT,
          LAYER,
          "HEADCOUNT_FILLED",
        )
      }
      throw error
    }
  }

  async moveKanban(applicationId: string, pipelineStageId: string, version?: number) {
    const application = await this.findById(applicationId)
    try {
      return await recruitmentApplicationRepository.moveToPipelineStage(
        applicationId,
        pipelineStageId,
        version ?? application.version,
      )
    } catch (error) {
      if (error instanceof Error && error.message === "APPLICATION_VERSION_CONFLICT") {
        throw new AppError(
          "Hồ sơ đã được cập nhật bởi người khác",
          HttpStatusCode.CONFLICT,
          LAYER,
          "APPLICATION_VERSION_CONFLICT",
        )
      }
      if (error instanceof Error && error.message === "PIPELINE_STAGE_REQUISITION_MISMATCH") {
        throw new AppError(
          "Giai đoạn không thuộc yêu cầu tuyển dụng của hồ sơ",
          HttpStatusCode.BAD_REQUEST,
          LAYER,
          "PIPELINE_STAGE_REQUISITION_MISMATCH",
        )
      }
      throw error
    }
  }

  private isUniqueConstraintError(error: unknown): boolean {
    return typeof error === "object" && error !== null && "code" in error && error.code === "P2002"
  }

  async assignRecruiter(id: string, assignedToId: string) {
    await this.findById(id) // Validate exists
    return recruitmentApplicationRepository.assignRecruiter(id, assignedToId)
  }

  async addNote(id: string, note: string, addedById: string) {
    await this.findById(id) // Validate exists
    return recruitmentApplicationRepository.addNote(id, note, addedById)
  }

  async getNotes(id: string) {
    await this.findById(id)
    return recruitmentApplicationRepository.getNotes(id)
  }

  async delete(id: string) {
    const application = await this.findById(id)

    // Only allow deletion of terminal applications
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!TERMINAL_APPLICATION_STATUSES.includes(application.status as any)) {
      throw new Error("Only terminal applications can be deleted")
    }

    return recruitmentApplicationRepository.delete(id)
  }

  async getStats() {
    return recruitmentApplicationRepository.getStats()
  }
}

export const recruitmentApplicationService = new RecruitmentApplicationService()
