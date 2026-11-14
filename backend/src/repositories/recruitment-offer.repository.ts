import { prisma } from "@/libs/database"
import type { CreateOfferInput, CreateOfferVersionInput } from "@/types/recruitment.types"

import { type BgcGroup, type EmployeeType, Prisma, type PrismaClient } from "@prisma/client"

export class RecruitmentOfferRepository {
  constructor(private readonly db: PrismaClient = prisma) {}

  async create(data: CreateOfferInput, createdById: string): Promise<{ id: string }> {
    return this.db.$transaction(async (tx) => {
      const application = await tx.recruitmentApplication.findUniqueOrThrow({
        where: { id: data.applicationId },
        select: { candidateId: true },
      })
      return tx.recruitmentOffer.create({
        data: {
          applicationId: data.applicationId,
          candidateId: application.candidateId,
          offeredSalary: new Prisma.Decimal(data.offeredSalary),
          currency: data.currency ?? "VND",
          startDate: new Date(data.startDate),
          endDate: data.endDate ? new Date(data.endDate) : undefined,
          trialEndDate: data.trialEndDate ? new Date(data.trialEndDate) : undefined,
          jobTitle: data.jobTitle,
          department: data.department,
          employmentType: data.employmentType as EmployeeType,
          benefits: (data.benefits ?? {}) as Prisma.InputJsonValue,
          notes: data.notes,
          createdById,
          status: "draft",
          currentVersion: 1,
        },
        select: { id: true },
      })
    })
  }

  async findById(id: string) {
    return this.db.recruitmentOffer.findUnique({
      where: { id },
      include: {
        application: {
          include: {
            candidate: { select: { id: true, fullName: true, email: true, phone: true } },
            requisition: { select: { id: true, title: true, code: true, department: true } },
          },
        },
        candidate: { select: { id: true, fullName: true, email: true } },
        versions: {
          orderBy: { version: "desc" },
        },
        backgroundCheck: true,
        createdBy: { select: { id: true, fullName: true } },
      },
    })
  }

  async findByApplication(applicationId: string) {
    return this.db.recruitmentOffer.findMany({
      where: { applicationId },
      orderBy: { createdAt: "desc" },
      include: {
        versions: { orderBy: { version: "desc" } },
        backgroundCheck: true,
      },
    })
  }

  async list(query?: { page?: number; pageSize?: number }) {
    const { page = 1, pageSize = 20 } = query ?? {}
    const skip = (page - 1) * pageSize

    const [items, total] = await Promise.all([
      this.db.recruitmentOffer.findMany({
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          application: {
            include: {
              candidate: { select: { id: true, fullName: true, email: true } },
              requisition: { select: { id: true, title: true } },
            },
          },
          candidate: { select: { id: true, fullName: true, email: true } },
          createdBy: { select: { id: true, fullName: true } },
        },
      }),
      this.db.recruitmentOffer.count(),
    ])

    return { items, total, page, pageSize }
  }

  async update(id: string, data: Partial<CreateOfferInput>) {
    const updateData: Prisma.RecruitmentOfferUpdateInput = {}

    if (data.offeredSalary !== undefined)
      updateData.offeredSalary = new Prisma.Decimal(data.offeredSalary)
    if (data.currency !== undefined) updateData.currency = data.currency
    if (data.startDate !== undefined) updateData.startDate = new Date(data.startDate)
    if (data.endDate !== undefined)
      updateData.endDate = data.endDate ? new Date(data.endDate) : undefined
    if (data.trialEndDate !== undefined)
      updateData.trialEndDate = data.trialEndDate ? new Date(data.trialEndDate) : undefined
    if (data.jobTitle !== undefined) updateData.jobTitle = data.jobTitle
    if (data.department !== undefined) updateData.department = data.department
    if (data.employmentType !== undefined)
      updateData.employmentType = data.employmentType as EmployeeType
    if (data.benefits !== undefined) updateData.benefits = data.benefits as Prisma.InputJsonValue
    if (data.notes !== undefined) updateData.notes = data.notes

    return this.db.recruitmentOffer.update({
      where: { id },
      data: updateData,
    })
  }

  async send(id: string) {
    return this.db.recruitmentOffer.update({
      where: { id },
      data: { status: "sent", sentAt: new Date() },
      include: {
        candidate: { select: { id: true, fullName: true, email: true } },
        application: {
          include: {
            candidate: { select: { id: true, fullName: true, email: true } },
          },
        },
      },
    })
  }

  async sendAndTransition(id: string) {
    return this.db.$transaction(async (tx) => {
      const existing = await tx.recruitmentOffer.findUnique({
        where: { id },
        select: { applicationId: true, status: true },
      })
      if (!existing) throw new Error("Offer not found")

      const updated = await tx.recruitmentOffer.updateMany({
        where: { id, status: "draft" },
        data: { status: "sent", sentAt: new Date() },
      })
      if (updated.count !== 1) throw new Error("Only draft offers can be sent")

      await tx.recruitmentApplication.update({
        where: { id: existing.applicationId },
        data: { status: "offer_sent" },
      })

      return tx.recruitmentOffer.findUniqueOrThrow({
        where: { id },
        include: {
          candidate: { select: { id: true, fullName: true, email: true } },
          application: {
            include: {
              candidate: { select: { id: true, fullName: true, email: true } },
            },
          },
        },
      })
    })
  }

  async accept(id: string, responseNote?: string) {
    return this.db.recruitmentOffer.update({
      where: { id },
      data: {
        status: "accepted",
        respondedAt: new Date(),
        responseNote,
      },
    })
  }

  async acceptAndCreateBackgroundCheck(
    id: string,
    responseNote: string | undefined,
    group: BgcGroup,
  ) {
    return this.db.$transaction(async (tx) => {
      const existing = await tx.recruitmentOffer.findUnique({
        where: { id },
        select: {
          applicationId: true,
          candidateId: true,
          status: true,
          application: { select: { candidateId: true } },
        },
      })
      if (!existing) throw new Error("Offer not found")
      if (existing.status !== "sent") throw new Error("Only sent offers can be accepted")
      if (existing.candidateId !== existing.application.candidateId) {
        throw new Error("Offer candidate does not match application candidate")
      }

      const offer = await tx.recruitmentOffer.update({
        where: { id },
        data: {
          status: "accepted",
          respondedAt: new Date(),
          responseNote,
        },
      })
      await tx.recruitmentApplication.update({
        where: { id: existing.applicationId },
        data: { status: "offer_accepted" },
      })
      await tx.backgroundCheck.create({
        data: {
          offerId: id,
          candidateId: existing.application.candidateId,
          group,
          status: "pending",
        },
      })

      return offer
    })
  }

  async decline(id: string, responseNote?: string) {
    return this.db.recruitmentOffer.update({
      where: { id },
      data: {
        status: "declined",
        respondedAt: new Date(),
        responseNote,
      },
    })
  }

  async rescind(id: string, reason?: string) {
    return this.db.recruitmentOffer.update({
      where: { id },
      data: {
        status: "rescinded",
        notes: reason ? `${reason}\n[Rescinded]` : "[Rescinded]",
      },
    })
  }

  async expire(id: string) {
    return this.db.recruitmentOffer.update({
      where: { id },
      data: { status: "expired" },
    })
  }

  async createVersion(data: CreateOfferVersionInput): Promise<{ id: string }> {
    const offer = await this.db.recruitmentOffer.findUnique({
      where: { id: data.offerId },
      select: { currentVersion: true, offeredSalary: true, startDate: true, endDate: true },
    })

    if (!offer) throw new Error("Offer not found")

    const newVersion = (offer.currentVersion || 1) + 1

    // Create version record
    await this.db.offerVersion.create({
      data: {
        offerId: data.offerId,
        version: newVersion,
        salary: new Prisma.Decimal(data.salary),
        currency: data.currency ?? "VND",
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        changeReason: data.changeReason,
        notes: data.notes,
        createdById: "",
      },
    })

    // Update offer with new values and increment version
    return this.db.recruitmentOffer.update({
      where: { id: data.offerId },
      data: {
        offeredSalary: new Prisma.Decimal(data.salary),
        currency: data.currency ?? "VND",
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        currentVersion: newVersion,
      },
      select: { id: true },
    })
  }

  async getVersions(offerId: string) {
    return this.db.offerVersion.findMany({
      where: { offerId },
      orderBy: { version: "desc" },
    })
  }

  async delete(id: string) {
    return this.db.recruitmentOffer.delete({ where: { id } })
  }

  async getStats() {
    const [total, byStatus] = await Promise.all([
      this.db.recruitmentOffer.count(),
      this.db.recruitmentOffer.groupBy({
        by: ["status"],
        _count: { id: true },
      }),
    ])

    return {
      total,
      byStatus: byStatus.reduce(
        (acc, { status, _count }) => ({ ...acc, [status]: _count.id }),
        {} as Record<string, number>,
      ),
    }
  }
}

export const recruitmentOfferRepository = new RecruitmentOfferRepository()
