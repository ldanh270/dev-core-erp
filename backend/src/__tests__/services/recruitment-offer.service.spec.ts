import { recruitmentApplicationRepository } from "@/repositories/recruitment-application.repository"
import { recruitmentOfferRepository } from "@/repositories/recruitment-offer.repository"
import { recruitmentApplicationService } from "@/services/recruitment-application.service"
import { RecruitmentOfferService } from "@/services/recruitment-offer.service"

jest.mock("@/repositories/recruitment-offer.repository", () => ({
  recruitmentOfferRepository: {
    findByApplication: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    sendAndTransition: jest.fn(),
    acceptAndCreateBackgroundCheck: jest.fn(),
  },
}))

jest.mock("@/repositories/recruitment-application.repository", () => ({
  recruitmentApplicationRepository: {
    findById: jest.fn(),
  },
}))

jest.mock("@/services/recruitment-application.service", () => ({
  recruitmentApplicationService: {
    findById: jest.fn(),
    updateStatus: jest.fn(),
  },
}))

describe("RecruitmentOfferService draft workflow", () => {
  beforeEach(() => jest.clearAllMocks())

  it("keeps the application in final review while creating a draft offer", async () => {
    jest
      .mocked(recruitmentApplicationService.findById)
      .mockResolvedValue({ status: "final_review" } as never)
    jest.mocked(recruitmentOfferRepository.findByApplication).mockResolvedValue([])
    jest.mocked(recruitmentOfferRepository.create).mockResolvedValue({ id: "offer-1" })

    const service = new RecruitmentOfferService()
    const result = await service.create(
      {
        applicationId: "application-1",
        offeredSalary: 30_000_000,
        currency: "VND",
        startDate: new Date(Date.now() + 86_400_000).toISOString(),
        employmentType: "full_time",
      },
      "employee-1",
    )

    expect(result).toEqual({ id: "offer-1" })
    expect(recruitmentOfferRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ applicationId: "application-1" }),
      "employee-1",
    )
    expect(recruitmentApplicationService.updateStatus).not.toHaveBeenCalled()
  })

  it("sends the offer and advances the application through one command", async () => {
    jest.mocked(recruitmentOfferRepository.findById).mockResolvedValue({ status: "draft" } as never)
    jest
      .mocked(recruitmentOfferRepository.sendAndTransition)
      .mockResolvedValue({ id: "offer-1", status: "sent" } as never)

    const service = new RecruitmentOfferService()
    const result = await service.send("offer-1")

    expect(result).toEqual({ id: "offer-1", status: "sent" })
    expect(recruitmentOfferRepository.sendAndTransition).toHaveBeenCalledWith("offer-1")
    expect(recruitmentApplicationService.updateStatus).not.toHaveBeenCalled()
  })

  it("accepts an offer and creates its background check through one command", async () => {
    jest.mocked(recruitmentOfferRepository.findById).mockResolvedValue({
      status: "sent",
      applicationId: "application-1",
    } as never)
    jest.mocked(recruitmentApplicationRepository.findById).mockResolvedValue({
      requisition: { positionLevel: "junior" },
    } as never)
    jest.mocked(recruitmentOfferRepository.acceptAndCreateBackgroundCheck).mockResolvedValue({
      id: "offer-1",
      status: "accepted",
    } as never)

    const service = new RecruitmentOfferService()
    const result = await service.respond("offer-1", "accept", "I accept")

    expect(result).toEqual({ id: "offer-1", status: "accepted" })
    expect(recruitmentOfferRepository.acceptAndCreateBackgroundCheck).toHaveBeenCalledWith(
      "offer-1",
      "I accept",
      "a",
    )
    expect(recruitmentApplicationService.updateStatus).not.toHaveBeenCalled()
  })
})
