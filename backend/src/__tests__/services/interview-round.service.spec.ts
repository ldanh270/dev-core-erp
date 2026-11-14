import { interviewRoundRepository } from "@/repositories/interview-round.repository"
import { scorecardRepository } from "@/repositories/scorecard.repository"
import { InterviewRoundService } from "@/services/interview-round.service"
import { recruitmentApplicationService } from "@/services/recruitment-application.service"

jest.mock("@/repositories/interview-round.repository", () => ({
  interviewRoundRepository: {
    createAndStart: jest.fn(),
    findById: jest.fn(),
    markCompletedAndTransition: jest.fn(),
  },
}))

jest.mock("@/repositories/scorecard.repository", () => ({
  scorecardRepository: {
    getAverageRating: jest.fn(),
  },
}))

jest.mock("@/services/recruitment-application.service", () => ({
  recruitmentApplicationService: {
    findById: jest.fn(),
  },
}))

describe("InterviewRoundService workflow", () => {
  const service = new InterviewRoundService()

  beforeEach(() => jest.clearAllMocks())

  it("starts the application workflow atomically when scheduling", async () => {
    jest
      .mocked(recruitmentApplicationService.findById)
      .mockResolvedValue({ status: "shortlisted" } as never)
    jest.mocked(interviewRoundRepository.createAndStart).mockResolvedValue({ id: "interview-1" })

    const result = await service.create({
      applicationId: "application-1",
      roundNumber: 1,
      title: "Technical interview",
      scheduledAt: new Date(Date.now() + 60_000).toISOString(),
      interviewerIds: ["employee-1"],
    })

    expect(result).toEqual({ id: "interview-1" })
    expect(interviewRoundRepository.createAndStart).toHaveBeenCalledTimes(1)
  })

  it("uses one completion command for interview and application state", async () => {
    jest.mocked(interviewRoundRepository.findById).mockResolvedValue({
      status: "scheduled",
      applicationId: "application-1",
    } as never)
    jest
      .mocked(interviewRoundRepository.markCompletedAndTransition)
      .mockResolvedValue({ id: "interview-1" } as never)
    jest.mocked(scorecardRepository.getAverageRating).mockResolvedValue(4.5)

    const result = await service.markCompleted("interview-1", "pass", "Strong signal")

    expect(result).toEqual({ id: "interview-1", averageRating: 4.5 })
    expect(interviewRoundRepository.markCompletedAndTransition).toHaveBeenCalledWith(
      "interview-1",
      "pass",
      "Strong signal",
    )
    expect(recruitmentApplicationService).not.toHaveProperty("updateStatus")
  })
})
