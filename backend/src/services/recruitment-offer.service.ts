import { getBgcGroupForLevel } from "@/configs/rules/recruitment.config"
import { recruitmentApplicationRepository } from "@/repositories/recruitment-application.repository"
import { recruitmentOfferRepository } from "@/repositories/recruitment-offer.repository"
import type { CreateOfferInput, CreateOfferVersionInput } from "@/types/recruitment.types"

import { recruitmentApplicationService } from "./recruitment-application.service"

export class RecruitmentOfferService {
  async create(input: CreateOfferInput, createdById: string) {
    // Validate application exists and is in valid state
    const application = await recruitmentApplicationService.findById(input.applicationId)
    if (application.status !== "final_review") {
      throw new Error("Application must be in final review status to create an offer")
    }

    // Check for existing active offer
    const existingOffers = await recruitmentOfferRepository.findByApplication(input.applicationId)
    const hasActive = existingOffers.some(
      (o) => !["declined", "rescinded", "expired"].includes(o.status),
    )
    if (hasActive) {
      throw new Error("An active offer already exists for this application")
    }

    return recruitmentOfferRepository.create(input, createdById)
  }

  async findById(id: string) {
    const offer = await recruitmentOfferRepository.findById(id)
    if (!offer) {
      throw new Error("Offer not found")
    }
    return offer
  }

  async findByApplication(applicationId: string) {
    return recruitmentOfferRepository.findByApplication(applicationId)
  }

  async list(query?: { page?: number; pageSize?: number }) {
    return recruitmentOfferRepository.list(query)
  }

  async update(id: string, input: Partial<CreateOfferInput>) {
    const existing = await this.findById(id)

    // Only draft offers can be updated
    if (existing.status !== "draft") {
      throw new Error("Only draft offers can be updated")
    }

    return recruitmentOfferRepository.update(id, input)
  }

  async send(id: string) {
    const existing = await this.findById(id)

    if (existing.status !== "draft") {
      throw new Error("Only draft offers can be sent")
    }

    return recruitmentOfferRepository.sendAndTransition(id)
  }

  async respond(id: string, response: "accept" | "decline" | "negotiate", responseNote?: string) {
    const existing = await this.findById(id)

    if (existing.status !== "sent") {
      throw new Error("Only sent offers can be responded to")
    }

    if (response === "accept") {
      return this.acceptOffer(id, responseNote)
    } else if (response === "decline") {
      return this.declineOffer(id, responseNote)
    } else {
      return this.negotiateOffer(id, responseNote)
    }
  }

  private async acceptOffer(id: string, responseNote?: string) {
    // Determine BGC group based on position level
    const existing = await this.findById(id)
    const application = await recruitmentApplicationRepository.findById(existing.applicationId)
    if (!application) throw new Error("Application not found")
    const positionLevel = application.requisition?.positionLevel ?? "junior"
    const bgcGroup = getBgcGroupForLevel(positionLevel)

    return recruitmentOfferRepository.acceptAndCreateBackgroundCheck(id, responseNote, bgcGroup)
  }

  private async declineOffer(id: string, responseNote?: string) {
    const existing = await this.findById(id)

    const offer = await recruitmentOfferRepository.decline(id, responseNote)

    // Update application status
    await recruitmentApplicationService.updateStatus(existing.applicationId, {
      status: "offer_declined",
    })

    return offer
  }

  private async negotiateOffer(id: string, responseNote?: string) {
    // For negotiation, we keep the offer in sent status
    // The candidate's negotiation details are stored in responseNote
    const existing = await this.findById(id)

    // Update notes with negotiation request
    await recruitmentOfferRepository.update(id, {
      notes: `${existing.notes ?? ""}\n[Negotiation Request]: ${responseNote ?? ""}`,
    })

    return this.findById(id)
  }

  async createVersion(input: CreateOfferVersionInput) {
    const existing = await this.findById(input.offerId)

    // Only accepted or sent offers can have new versions
    if (!["sent", "accepted"].includes(existing.status)) {
      throw new Error("Can only create new versions for sent or accepted offers")
    }

    // Validate salary change reason
    if (!input.changeReason) {
      throw new Error("Change reason is required when creating a new version")
    }

    return recruitmentOfferRepository.createVersion(input)
  }

  async rescind(id: string, reason?: string) {
    const existing = await this.findById(id)

    // Only sent or accepted offers can be rescinded
    if (!["sent", "accepted"].includes(existing.status)) {
      throw new Error("Only sent or accepted offers can be rescinded")
    }

    const offer = await recruitmentOfferRepository.rescind(id, reason)

    // Update application status
    await recruitmentApplicationService.updateStatus(existing.applicationId, {
      status: "offer_rescinded",
    })

    return offer
  }

  async expire(id: string) {
    const existing = await this.findById(id)

    if (existing.status !== "sent") {
      throw new Error("Only sent offers can be expired")
    }

    const offer = await recruitmentOfferRepository.expire(id)

    // Update application status
    await recruitmentApplicationService.updateStatus(existing.applicationId, {
      status: "offer_declined",
    })

    return offer
  }

  async getVersions(offerId: string) {
    return recruitmentOfferRepository.getVersions(offerId)
  }

  async delete(id: string) {
    const existing = await this.findById(id)

    // Only draft offers can be deleted
    if (existing.status !== "draft") {
      throw new Error("Only draft offers can be deleted")
    }

    return recruitmentOfferRepository.delete(id)
  }

  async getStats() {
    return recruitmentOfferRepository.getStats()
  }
}

export const recruitmentOfferService = new RecruitmentOfferService()
