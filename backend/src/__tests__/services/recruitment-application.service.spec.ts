import { recruitmentApplicationRepository } from "@/repositories/recruitment-application.repository"
import { RecruitmentApplicationService } from "@/services/recruitment-application.service"

jest.mock("@/repositories/recruitment-application.repository", () => ({
  recruitmentApplicationRepository: {
    create: jest.fn(),
    findById: jest.fn(),
    updateStatus: jest.fn(),
    moveToPipelineStage: jest.fn(),
    list: jest.fn(),
    listKanban: jest.fn(),
    assignRecruiter: jest.fn(),
    addNote: jest.fn(),
    getNotes: jest.fn(),
    delete: jest.fn(),
    getStats: jest.fn(),
  },
}))

jest.mock("@/repositories/job-requisition.repository", () => ({
  jobRequisitionRepository: { findById: jest.fn() },
}))

jest.mock("@/repositories/job-posting.repository", () => ({
  jobPostingRepository: { findById: jest.fn() },
}))

describe("RecruitmentApplicationService workflow invariants", () => {
  const service = new RecruitmentApplicationService()

  beforeEach(() => jest.clearAllMocks())

  it("passes the read version into status CAS", async () => {
    jest.mocked(recruitmentApplicationRepository.findById).mockResolvedValue({
      id: "application-1",
      status: "reviewing",
      version: 4,
    } as never)
    jest
      .mocked(recruitmentApplicationRepository.updateStatus)
      .mockResolvedValue({ id: "application-1" } as never)

    await service.updateStatus("application-1", { status: "shortlisted" })

    expect(recruitmentApplicationRepository.updateStatus).toHaveBeenCalledWith(
      "application-1",
      { status: "shortlisted" },
      4,
    )
  })

  it("maps stale workflow writes to HTTP 409", async () => {
    jest.mocked(recruitmentApplicationRepository.findById).mockResolvedValue({
      id: "application-1",
      status: "reviewing",
      version: 4,
    } as never)
    jest
      .mocked(recruitmentApplicationRepository.updateStatus)
      .mockRejectedValue(new Error("APPLICATION_VERSION_CONFLICT"))

    await expect(
      service.updateStatus("application-1", { status: "shortlisted" }),
    ).rejects.toMatchObject({ statusCode: 409, errorCode: "APPLICATION_VERSION_CONFLICT" })
  })

  it("moves only the canonical pipeline stage and uses CAS", async () => {
    jest.mocked(recruitmentApplicationRepository.findById).mockResolvedValue({
      id: "application-1",
      version: 7,
    } as never)
    jest
      .mocked(recruitmentApplicationRepository.moveToPipelineStage)
      .mockResolvedValue({ id: "application-1" } as never)

    await service.moveKanban("application-1", "stage-2")

    expect(recruitmentApplicationRepository.moveToPipelineStage).toHaveBeenCalledWith(
      "application-1",
      "stage-2",
      7,
    )
  })
})
