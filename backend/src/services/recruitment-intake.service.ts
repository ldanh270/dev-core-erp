import { POSTING_STATUS, REQUISITION_STATUS } from "@/configs/entities/recruitment.config"
import { HttpStatusCode } from "@/configs/system/http.config"
import { jobPostingRepository } from "@/repositories/job-posting.repository"
import { jobRequisitionRepository } from "@/repositories/job-requisition.repository"
import { recruitmentIntakeRepository } from "@/repositories/recruitment-intake.repository"
import type { ImportRecruitmentIntakeInput } from "@/schemas/recruitment.schema"
import type { ConnectorImportInput } from "@/types/recruitment-connector.types"
import { AppError } from "@/utils/error.util"

const LAYER = "RecruitmentIntakeService"

export class RecruitmentIntakeService {
  async import(input: ImportRecruitmentIntakeInput) {
    return this.importInternal(input)
  }

  async importConnector(input: ConnectorImportInput) {
    return this.importInternal(input)
  }

  private async importInternal(input: ImportRecruitmentIntakeInput | ConnectorImportInput) {
    const req = await jobRequisitionRepository.findById(input.requisitionId)
    if (!req)
      throw new AppError("Không tìm thấy yêu cầu tuyển dụng", HttpStatusCode.NOT_FOUND, LAYER)
    if (req.status !== REQUISITION_STATUS.APPROVED) {
      throw new AppError(
        "Chỉ được tiếp nhận ứng viên cho yêu cầu đã duyệt",
        HttpStatusCode.CONFLICT,
        LAYER,
      )
    }

    const posting = await jobPostingRepository.findById(input.postingId)
    if (!posting) {
      throw new AppError("Không tìm thấy bài đăng tuyển", HttpStatusCode.NOT_FOUND, LAYER)
    }
    if (posting.requisitionId !== input.requisitionId) {
      throw new AppError(
        "Bài đăng không thuộc Yêu cầu tuyển dụng đã chọn",
        HttpStatusCode.BAD_REQUEST,
        LAYER,
        "POSTING_REQUISITION_MISMATCH",
      )
    }
    if (posting.source !== input.source) {
      throw new AppError("Nguồn ứng viên không khớp bài đăng", HttpStatusCode.BAD_REQUEST, LAYER)
    }
    if (posting.status !== POSTING_STATUS.OPEN) {
      throw new AppError("Bài đăng tuyển chưa được mở", HttpStatusCode.CONFLICT, LAYER)
    }

    return recruitmentIntakeRepository.importCandidateBatch(input, posting.sourceCode)
  }
}

export const recruitmentIntakeService = new RecruitmentIntakeService()
