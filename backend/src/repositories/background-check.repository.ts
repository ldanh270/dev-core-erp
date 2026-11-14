import { RECRUITMENT_APPLICATION_STATUS } from "@/configs/entities/recruitment.config"
import { prisma } from "@/libs/database"
import type {
  CreateBackgroundCheckInput,
  UpdateBackgroundCheckInput,
} from "@/types/recruitment.types"

import { $Enums, Prisma, type PrismaClient } from "@prisma/client"

export class BackgroundCheckRepository {
  constructor(private readonly db: PrismaClient = prisma) {}

  async create(data: CreateBackgroundCheckInput): Promise<{ id: string }> {
    return this.createForOffer(data.offerId, data.group)
  }

  async createForOffer(
    offerId: string,
    group: CreateBackgroundCheckInput["group"],
  ): Promise<{ id: string }> {
    const offer = await this.db.recruitmentOffer.findUnique({
      where: { id: offerId },
      select: { candidateId: true },
    })
    if (!offer) throw new Error("Offer not found")
    return this.db.backgroundCheck.create({
      data: { offerId, candidateId: offer.candidateId, group, status: "pending" },
      select: { id: true },
    })
  }

  async findById(id: string) {
    return this.db.backgroundCheck.findUnique({
      where: { id },
      include: {
        offer: {
          include: {
            application: {
              include: {
                candidate: { select: { id: true, fullName: true, email: true } },
              },
            },
          },
        },
        candidate: { select: { id: true, fullName: true, email: true, nationalId: true } },
        checkedBy: { select: { id: true, fullName: true } },
      },
    })
  }

  async findByOffer(offerId: string) {
    return this.db.backgroundCheck.findUnique({
      where: { offerId },
      include: {
        candidate: { select: { id: true, fullName: true, email: true } },
        checkedBy: { select: { id: true, fullName: true } },
      },
    })
  }

  async findByCandidate(candidateId: string) {
    return this.db.backgroundCheck.findMany({
      where: { candidateId },
      orderBy: { createdAt: "desc" },
      include: {
        offer: {
          include: {
            application: {
              include: {
                requisition: { select: { id: true, title: true } },
              },
            },
          },
        },
      },
    })
  }

  async list(query?: { page?: number; pageSize?: number; status?: string }) {
    const { page = 1, pageSize = 20, status } = query ?? {}
    const skip = (page - 1) * pageSize

    const where: Prisma.BackgroundCheckWhereInput = {}
    if (status) where.status = status as $Enums.BgcStatus

    const [items, total] = await Promise.all([
      this.db.backgroundCheck.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          offer: {
            include: {
              application: {
                include: {
                  candidate: { select: { id: true, fullName: true } },
                },
              },
            },
          },
          candidate: { select: { id: true, fullName: true, email: true } },
          checkedBy: { select: { id: true, fullName: true } },
        },
      }),
      this.db.backgroundCheck.count({ where }),
    ])

    return { items, total, page, pageSize }
  }

  async update(id: string, data: UpdateBackgroundCheckInput, checkedById?: string) {
    // Validate status transition
    const existing = await this.db.backgroundCheck.findUnique({ where: { id } })
    if (!existing) throw new Error("Background check not found")

    const updateData: Prisma.BackgroundCheckUpdateInput = {}

    if (data.idVerified !== undefined) updateData.idVerified = data.idVerified
    if (data.addressVerified !== undefined) updateData.addressVerified = data.addressVerified
    if (data.criminalRecordCheck !== undefined)
      updateData.criminalRecordCheck = data.criminalRecordCheck
    if (data.legalStatusCheck !== undefined) updateData.legalStatusCheck = data.legalStatusCheck
    if (data.certificationVerified !== undefined)
      updateData.certificationVerified = data.certificationVerified
    if (data.employmentHistoryVerified !== undefined)
      updateData.employmentHistoryVerified = data.employmentHistoryVerified
    if (data.financialCheckCompleted !== undefined)
      updateData.financialCheckCompleted = data.financialCheckCompleted
    if (data.creditScoreCheck !== undefined) updateData.creditScoreCheck = data.creditScoreCheck
    if (data.failReason !== undefined) updateData.failReason = data.failReason
    if (data.documents !== undefined)
      updateData.documents = data.documents as unknown as Prisma.InputJsonValue
    if (checkedById) updateData.checkedBy = { connect: { id: checkedById } }

    return this.db.backgroundCheck.update({
      where: { id },
      data: updateData,
      include: {
        candidate: { select: { id: true, fullName: true, email: true } },
        checkedBy: { select: { id: true, fullName: true } },
      },
    })
  }

  async updateStatus(id: string, status: $Enums.BgcStatus) {
    return this.db.backgroundCheck.update({
      where: { id },
      data: { status },
      include: {
        candidate: { select: { id: true, fullName: true, email: true } },
        checkedBy: { select: { id: true, fullName: true } },
      },
    })
  }

  async complete(id: string, passed: boolean, completedById: string, failReason?: string) {
    return this.db.$transaction(async (tx) => {
      const bgc = await tx.backgroundCheck.findUnique({
        where: { id },
        include: { offer: { select: { applicationId: true } } },
      })
      if (!bgc || bgc.status !== "in_progress")
        throw new Error("Background check must be in progress to complete")

      const nextApplicationStatus = passed
        ? RECRUITMENT_APPLICATION_STATUS.PENDING_ONBOARDING
        : RECRUITMENT_APPLICATION_STATUS.OFFER_RESCINDED
      const application = await tx.recruitmentApplication.updateMany({
        where: {
          id: bgc.offer.applicationId,
          status: RECRUITMENT_APPLICATION_STATUS.BACKGROUND_CHECK,
        },
        data: {
          status: nextApplicationStatus,
          ...(passed
            ? {}
            : { rejectReason: `Background check failed: ${failReason ?? "Unknown reason"}` }),
        },
      })
      if (application.count !== 1) {
        throw new Error("Application is not in background check state")
      }

      return tx.backgroundCheck.update({
        where: { id },
        data: {
          status: passed ? "passed" : "failed",
          failReason: passed ? undefined : failReason,
          completedAt: new Date(),
          ...(passed ? { passedAt: new Date() } : { failedAt: new Date() }),
          checkedById: completedById,
        },
        include: {
          offer: {
            include: {
              application: {
                include: { candidate: { select: { id: true, fullName: true, email: true } } },
              },
            },
          },
        },
      })
    })
  }

  async delete(id: string) {
    return this.db.backgroundCheck.delete({ where: { id } })
  }

  async getStats() {
    const [total, byStatus, byGroup] = await Promise.all([
      this.db.backgroundCheck.count(),
      this.db.backgroundCheck.groupBy({
        by: ["status"],
        _count: { id: true },
      }),
      this.db.backgroundCheck.groupBy({
        by: ["group"],
        _count: { id: true },
      }),
    ])

    return {
      total,
      byStatus: byStatus.reduce(
        (acc, { status, _count }) => ({ ...acc, [status]: _count.id }),
        {} as Record<string, number>,
      ),
      byGroup: byGroup.reduce(
        (acc, { group, _count }) => ({ ...acc, [group]: _count.id }),
        {} as Record<string, number>,
      ),
    }
  }
}

export const backgroundCheckRepository = new BackgroundCheckRepository()
