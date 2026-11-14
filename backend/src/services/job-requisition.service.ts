import { REQUISITION_STATUS } from "@/configs/entities/recruitment.config"
import { HttpStatusCode } from "@/configs/system/http.config"
import { jobPostingRepository } from "@/repositories/job-posting.repository"
import { jobRequisitionRepository } from "@/repositories/job-requisition.repository"
import { recruitmentApplicationRepository } from "@/repositories/recruitment-application.repository"
import { recruitmentPostingActivityService } from "@/services/recruitment-posting-activity.service"
import type {
  ApproveRequisitionInput,
  CreateJobRequisitionInput,
  ListRequisitionsQuery,
  UpdateJobRequisitionInput,
} from "@/types/recruitment.types"
import { AppError } from "@/utils/error.util"

export class JobRequisitionService {
  async create(input: CreateJobRequisitionInput, requestedById: string) {
    // Validate salary range
    if (input.salaryMin && input.salaryMax && input.salaryMin > input.salaryMax) {
      throw new AppError(
        "Lương tối thiểu không được lớn hơn lương tối đa",
        HttpStatusCode.BAD_REQUEST,
        "JobRequisitionService",
      )
    }

    await this.assertEligibleApprover(input.approverId)

    return jobRequisitionRepository.create(input, requestedById)
  }

  async findById(id: string) {
    const requisition = await jobRequisitionRepository.findById(id)
    if (!requisition) {
      throw new AppError(
        "Không tìm thấy yêu cầu tuyển dụng",
        HttpStatusCode.NOT_FOUND,
        "JobRequisitionService",
      )
    }
    return requisition
  }

  async getWorkspace(id: string) {
    const requisition = await this.findById(id)
    const ownStages = await jobRequisitionRepository.listPipelineStages(id)
    const legacyPosting = requisition.postings[0]
    const stages =
      ownStages.length > 0
        ? ownStages
        : legacyPosting
          ? await jobPostingRepository.listPipelineStages(legacyPosting.id)
          : []
    const applications = await recruitmentApplicationRepository.listKanban({
      requisitionId: id,
      page: 1,
      pageSize: 100,
    })
    return { requisition, stages, applications }
  }

  async listActivities(id: string, page = 1, pageSize = 50) {
    const requisition = await this.findById(id)
    const batches = await Promise.all(
      requisition.postings.map((posting) =>
        recruitmentPostingActivityService.list(posting.id, 1, 1000),
      ),
    )
    const items = batches
      .flatMap((batch) => batch.items)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    const start = (page - 1) * pageSize
    return { items: items.slice(start, start + pageSize), total: items.length, page, pageSize }
  }

  async listPipelineStages(id: string) {
    const requisition = await this.findById(id)
    const ownStages = await jobRequisitionRepository.listPipelineStages(id)
    if (ownStages.length > 0) return ownStages
    const legacyPosting = requisition.postings[0]
    return legacyPosting ? jobPostingRepository.listPipelineStages(legacyPosting.id) : []
  }

  async createPipelineStage(
    id: string,
    data: { name: string; color?: string; isDefault?: boolean; isCompleted?: boolean },
    actorId: string,
  ) {
    await this.findById(id)
    const stage = await jobRequisitionRepository.createPipelineStage(id, data)
    await this.recordWorkspaceActivity(id, "stage_created", actorId, {
      stageId: stage.id,
      name: stage.name,
    })
    return stage
  }

  async updatePipelineStage(
    id: string,
    stageId: string,
    data: { name?: string; color?: string; isDefault?: boolean; isCompleted?: boolean },
    actorId: string,
  ) {
    const stages = await this.listPipelineStages(id)
    const stage = stages.find((item) => item.id === stageId)
    if (!stage)
      throw new AppError(
        "Không tìm thấy giai đoạn trong yêu cầu tuyển dụng",
        HttpStatusCode.NOT_FOUND,
        "JobRequisitionService",
      )
    if (stage.isDefault && data.isDefault === false)
      throw new AppError(
        "Cần chọn một giai đoạn mặc định khác trước",
        HttpStatusCode.CONFLICT,
        "JobRequisitionService",
      )
    const updated = await jobRequisitionRepository.updatePipelineStage(id, stageId, data)
    await this.recordWorkspaceActivity(id, "stage_updated", actorId, {
      stageId,
      fields: Object.keys(data),
    })
    return updated
  }

  async deletePipelineStage(id: string, stageId: string, fallbackStageId: string, actorId: string) {
    const stages = await this.listPipelineStages(id)
    const stage = stages.find((item) => item.id === stageId)
    const fallback = stages.find((item) => item.id === fallbackStageId)
    if (!stage || !fallback || stage.id === fallback.id)
      throw new AppError(
        "Giai đoạn thay thế không hợp lệ",
        HttpStatusCode.BAD_REQUEST,
        "JobRequisitionService",
      )
    if (stage.isDefault)
      throw new AppError(
        "Không thể xóa giai đoạn mặc định",
        HttpStatusCode.CONFLICT,
        "JobRequisitionService",
      )
    if (stages.length < 2)
      throw new AppError(
        "Yêu cầu phải có ít nhất một giai đoạn",
        HttpStatusCode.CONFLICT,
        "JobRequisitionService",
      )
    await jobRequisitionRepository.deletePipelineStage(id, stageId, fallbackStageId)
    await this.recordWorkspaceActivity(id, "stage_deleted", actorId, {
      stageId,
      fallbackStageId,
      name: stage.name,
    })
  }

  async reorderPipelineStages(id: string, stageIds: string[], actorId: string) {
    await this.listPipelineStages(id)
    const stages = await jobRequisitionRepository.reorderPipelineStages(id, stageIds)
    await this.recordWorkspaceActivity(id, "stages_reordered", actorId, { stageIds })
    return stages
  }

  async moveApplicationToPipelineStage(
    id: string,
    applicationId: string,
    pipelineStageId: string,
    actorId: string,
  ) {
    await this.listPipelineStages(id)
    const updated = await jobRequisitionRepository.moveApplicationToPipelineStage(
      id,
      applicationId,
      pipelineStageId,
    )
    await this.recordWorkspaceActivity(
      id,
      "application_stage_changed",
      actorId,
      { pipelineStageId },
      applicationId,
    )
    return updated
  }

  private async recordWorkspaceActivity(
    requisitionId: string,
    type: string,
    actorId: string,
    metadata: Record<string, unknown>,
    applicationId?: string,
  ) {
    const posting = (await this.findById(requisitionId)).postings[0]
    if (posting)
      await recruitmentPostingActivityService.record(
        posting.id,
        type as never,
        actorId,
        { requisitionId, ...metadata },
        applicationId,
      )
  }

  async findByCode(code: string) {
    const requisition = await jobRequisitionRepository.findByCode(code)
    if (!requisition) {
      throw new AppError(
        "Không tìm thấy yêu cầu tuyển dụng",
        HttpStatusCode.NOT_FOUND,
        "JobRequisitionService",
      )
    }
    return requisition
  }

  async list(query: ListRequisitionsQuery) {
    return jobRequisitionRepository.list(query)
  }

  async update(id: string, input: UpdateJobRequisitionInput) {
    const existing = await this.findById(id)

    // Prevent updates to closed requisitions
    if (
      existing.status === REQUISITION_STATUS.CLOSED ||
      existing.status === REQUISITION_STATUS.FILLED
    ) {
      throw new AppError(
        "Không thể chỉnh sửa yêu cầu tuyển dụng đã đóng hoặc đã tuyển đủ",
        HttpStatusCode.BAD_REQUEST,
        "JobRequisitionService",
      )
    }

    // Validate salary range
    if (input.salaryMin && input.salaryMax && input.salaryMin > input.salaryMax) {
      throw new AppError(
        "Lương tối thiểu không được lớn hơn lương tối đa",
        HttpStatusCode.BAD_REQUEST,
        "JobRequisitionService",
      )
    }

    if (input.approverId) await this.assertEligibleApprover(input.approverId)

    // Only draft and pending approval requisitions can update most fields
    const updatesCandidateSchemaOnly = Object.keys(input).every(
      (field) => field === "candidateSchema",
    )
    if (
      existing.status !== REQUISITION_STATUS.DRAFT &&
      existing.status !== REQUISITION_STATUS.PENDING_APPROVAL &&
      !updatesCandidateSchemaOnly
    ) {
      throw new AppError(
        "Chỉ yêu cầu tuyển dụng nháp hoặc chờ duyệt mới được chỉnh sửa",
        HttpStatusCode.BAD_REQUEST,
        "JobRequisitionService",
      )
    }

    return jobRequisitionRepository.update(id, input)
  }

  async submitForApproval(id: string) {
    const existing = await this.findById(id)

    if (existing.status !== REQUISITION_STATUS.DRAFT) {
      throw new AppError(
        "Chỉ yêu cầu tuyển dụng nháp mới được gửi duyệt",
        HttpStatusCode.BAD_REQUEST,
        "JobRequisitionService",
      )
    }

    if (!existing.approverId) {
      throw new AppError(
        "Yêu cầu tuyển dụng chưa được chỉ định người duyệt",
        HttpStatusCode.BAD_REQUEST,
        "JobRequisitionService",
        "REQUISITION_APPROVER_REQUIRED",
      )
    }
    await this.assertEligibleApprover(existing.approverId)

    return jobRequisitionRepository.update(id, { status: REQUISITION_STATUS.PENDING_APPROVAL })
  }

  async approve(id: string, input: ApproveRequisitionInput, approverId: string) {
    const existing = await this.findById(id)

    if (existing.status !== REQUISITION_STATUS.PENDING_APPROVAL) {
      throw new AppError(
        "Chỉ yêu cầu tuyển dụng đang chờ duyệt mới được duyệt",
        HttpStatusCode.BAD_REQUEST,
        "JobRequisitionService",
      )
    }

    if (existing.approverId !== approverId) {
      throw new AppError(
        "Bạn không phải người được chỉ định duyệt yêu cầu này",
        HttpStatusCode.FORBIDDEN,
        "SERVICE",
      )
    }

    if (!input.approved) {
      return jobRequisitionRepository.reject(id, approverId, input.comment)
    }

    const approved = await jobRequisitionRepository.approve(id, approverId, input.comment)
    await jobRequisitionRepository.ensurePipeline(id)
    return approved
  }

  async close(id: string) {
    const existing = await this.findById(id)

    if (
      existing.status === REQUISITION_STATUS.CLOSED ||
      existing.status === REQUISITION_STATUS.FILLED
    ) {
      throw new AppError(
        "Yêu cầu tuyển dụng đã đóng",
        HttpStatusCode.BAD_REQUEST,
        "JobRequisitionService",
      )
    }

    return jobRequisitionRepository.close(id)
  }

  async markAsFilled(id: string) {
    const existing = await this.findById(id)

    if (existing.status === REQUISITION_STATUS.FILLED) {
      throw new AppError(
        "Yêu cầu tuyển dụng đã tuyển đủ",
        HttpStatusCode.BAD_REQUEST,
        "JobRequisitionService",
      )
    }

    return jobRequisitionRepository.update(id, { status: REQUISITION_STATUS.FILLED })
  }

  async incrementFilledCount(id: string) {
    return jobRequisitionRepository.incrementFilledCount(id)
  }

  private async assertEligibleApprover(approverId: string) {
    if (!(await jobRequisitionRepository.canApprove(approverId))) {
      throw new AppError(
        "Người được chọn không có quyền duyệt yêu cầu tuyển dụng",
        HttpStatusCode.BAD_REQUEST,
        "JobRequisitionService",
        "INVALID_REQUISITION_APPROVER",
      )
    }
  }

  async delete(id: string) {
    const existing = await this.findById(id)

    if (existing.status !== REQUISITION_STATUS.DRAFT) {
      throw new AppError(
        "Chỉ yêu cầu tuyển dụng nháp mới được xóa",
        HttpStatusCode.BAD_REQUEST,
        "JobRequisitionService",
      )
    }

    return jobRequisitionRepository.delete(id)
  }

  async getStats() {
    return jobRequisitionRepository.getStats()
  }

  async listApprovers() {
    return jobRequisitionRepository.listApprovers()
  }
}

export const jobRequisitionService = new JobRequisitionService()
