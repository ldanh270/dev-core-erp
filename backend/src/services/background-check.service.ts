import { BGC_STATUS } from "@/configs/entities/recruitment.config"
import { BGC_CHECKS } from "@/configs/rules/recruitment.config"
import { backgroundCheckRepository } from "@/repositories/background-check.repository"
import { recruitmentOfferRepository } from "@/repositories/recruitment-offer.repository"
import type {
  CreateBackgroundCheckInput,
  UpdateBackgroundCheckInput,
} from "@/types/recruitment.types"

export class BackgroundCheckService {
  async create(input: CreateBackgroundCheckInput) {
    // Validate offer exists
    const offer = await recruitmentOfferRepository.findById(input.offerId)
    if (!offer) {
      throw new Error("Offer not found")
    }

    // Only accepted offers need background checks
    if (offer.status !== "accepted") {
      throw new Error("Background check can only be created for accepted offers")
    }

    return backgroundCheckRepository.createForOffer(input.offerId, input.group)
  }

  async findById(id: string) {
    const bgc = await backgroundCheckRepository.findById(id)
    if (!bgc) {
      throw new Error("Background check not found")
    }
    return bgc
  }

  async findByOffer(offerId: string) {
    return backgroundCheckRepository.findByOffer(offerId)
  }

  async findByCandidate(candidateId: string) {
    return backgroundCheckRepository.findByCandidate(candidateId)
  }

  async list(query?: { page?: number; pageSize?: number; status?: string }) {
    return backgroundCheckRepository.list(query)
  }

  async update(id: string, input: UpdateBackgroundCheckInput, checkedById?: string) {
    const existing = await this.findById(id)

    // Cannot update completed checks
    if (existing.status !== BGC_STATUS.IN_PROGRESS) {
      throw new Error("Cannot update completed background checks")
    }
    if (input.status !== undefined)
      throw new Error("Background check status is changed only by commands")
    return backgroundCheckRepository.update(id, input, checkedById)
  }

  async start(id: string) {
    const existing = await this.findById(id)

    if (existing.status !== BGC_STATUS.PENDING) {
      throw new Error("Background check has already been started")
    }

    return backgroundCheckRepository.updateStatus(id, BGC_STATUS.IN_PROGRESS)
  }

  async complete(id: string, passed: boolean, completedById: string, failReason?: string) {
    const existing = await this.findById(id)

    if (existing.status !== BGC_STATUS.IN_PROGRESS) {
      throw new Error("Background check must be in progress to complete")
    }

    // Validate that all required checks were performed
    const requiredChecks = BGC_CHECKS[existing.group]

    // Verify all required checks were done
    // field names are controlled by BGC_CHECKS definition (literal keys), not user input.
    // eslint-disable-next-line security/detect-object-injection
    const existingMap = new Map(Object.entries(existing))
    const allChecksDone = requiredChecks.every(({ field }) => existingMap.get(field) === true)

    if (!allChecksDone && passed) {
      throw new Error("Not all required checks have been completed")
    }

    return backgroundCheckRepository.complete(id, passed, completedById, failReason)
  }

  async delete(id: string) {
    const existing = await this.findById(id)

    // Cannot delete completed checks
    if (existing.status !== "pending") {
      throw new Error("Only pending background checks can be deleted")
    }

    return backgroundCheckRepository.delete(id)
  }

  async getStats() {
    return backgroundCheckRepository.getStats()
  }
}

export const backgroundCheckService = new BackgroundCheckService()
