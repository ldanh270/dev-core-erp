import { RECRUITMENT_APPLICATION_STATUS } from "@/configs/entities/recruitment.config"
import { prisma } from "@/libs/database"
import type {
  CreateApplicationInput,
  ListApplicationsQuery,
  UpdateApplicationStatusInput,
} from "@/types/recruitment.types"

import { Prisma, type PrismaClient, type RecruitmentApplicationStatus } from "@prisma/client"

export class RecruitmentApplicationRepository {
  constructor(private readonly db: PrismaClient = prisma) {}

  async create(data: CreateApplicationInput): Promise<{ id: string }> {
    return this.db.$transaction(async (tx) => {
      const defaultStage = await tx.recruitmentPipelineStage.findFirst({
        where: { requisitionId: data.requisitionId, isDefault: true },
        orderBy: { position: "asc" },
        select: { id: true },
      })
      if (!defaultStage) throw new Error("Bài đăng chưa có giai đoạn mặc định")
      return tx.recruitmentApplication.create({
        data: {
          requisitionId: data.requisitionId,
          postingId: data.postingId,
          pipelineStageId: defaultStage.id,
          candidateId: data.candidateId,
          source: data.source,
          sourceRef: data.sourceRef,
        },
        select: { id: true },
      })
    })
  }

  findActive(
    requisitionId: string,
    candidateId: string,
    terminalStatuses: RecruitmentApplicationStatus[],
  ) {
    return this.db.recruitmentApplication.findFirst({
      where: { requisitionId, candidateId, status: { notIn: terminalStatuses } },
      select: { id: true },
    })
  }

  async findById(id: string) {
    const application = await this.db.recruitmentApplication.findUnique({
      where: { id },
      include: {
        requisition: {
          select: {
            id: true,
            title: true,
            code: true,
            department: true,
            positionLevel: true,
            salaryMin: true,
            salaryMax: true,
            position: { select: { id: true, name: true } },
          },
        },
        candidate: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            cvUrl: true,
            avatarUrl: true,
          },
        },
        assignedTo: { select: { id: true, fullName: true } },
        pipelineStage: { select: { id: true, name: true, position: true, isCompleted: true } },
        interviewRounds: {
          orderBy: { roundNumber: "asc" },
          include: {
            scorecards: true,
          },
        },
        offers: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            backgroundCheck: true,
          },
        },
      },
    })

    if (application && application.interviewRounds) {
      const allInterviewerIds = application.interviewRounds.flatMap((r) => r.interviewerIds || [])
      if (allInterviewerIds.length > 0) {
        const employees = await this.db.employee.findMany({
          where: { id: { in: allInterviewerIds } },
          select: { id: true, fullName: true, email: true },
        })
        const empMap = new Map(employees.map((e) => [e.id, e]))
        const interviewRoundsWithInterviewers = application.interviewRounds.map((r) => ({
          ...r,
          interviewers: (r.interviewerIds || [])
            .map((empId) => empMap.get(empId))
            .filter(Boolean) as Array<{ id: string; fullName: string; email: string }>,
        }))
        return { ...application, interviewRounds: interviewRoundsWithInterviewers }
      }
    }

    return application
  }

  async list(query: ListApplicationsQuery) {
    const { requisitionId, postingId, status, assignedToId, page = 1, pageSize = 20 } = query
    const skip = (page - 1) * pageSize

    const where: Prisma.RecruitmentApplicationWhereInput = {}
    if (requisitionId) where.requisitionId = requisitionId
    if (postingId) where.postingId = postingId
    if (status) where.status = status
    if (assignedToId) where.assignedToId = assignedToId

    const [items, total] = await Promise.all([
      this.db.recruitmentApplication.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          requisition: {
            select: {
              id: true,
              title: true,
              code: true,
              department: true,
              position: { select: { id: true, name: true } },
            },
          },
          candidate: {
            select: {
              id: true,
              fullName: true,
              email: true,
              avatarUrl: true,
            },
          },
          assignedTo: { select: { id: true, fullName: true } },
          pipelineStage: { select: { id: true, name: true, color: true, position: true } },
          _count: { select: { interviewRounds: true } },
        },
      }),
      this.db.recruitmentApplication.count({ where }),
    ])

    return { items, total, page, pageSize }
  }

  async listByStatus(statuses: RecruitmentApplicationStatus[]) {
    return this.db.recruitmentApplication.findMany({
      where: { status: { in: statuses } },
      orderBy: { createdAt: "desc" },
      include: {
        requisition: {
          select: {
            id: true,
            title: true,
            department: true,
            position: { select: { id: true, name: true } },
          },
        },
        candidate: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
          },
        },
        assignedTo: { select: { id: true, fullName: true } },
      },
    })
  }

  async listKanban(query: ListApplicationsQuery) {
    const { requisitionId, postingId, assignedToId, page = 1, pageSize = 20 } = query
    const skip = (page - 1) * pageSize

    const where: Prisma.RecruitmentApplicationWhereInput = {}
    if (requisitionId) where.requisitionId = requisitionId
    if (postingId) where.postingId = postingId
    if (assignedToId) where.assignedToId = assignedToId

    const [items, total] = await Promise.all([
      this.db.recruitmentApplication.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { updatedAt: "desc" },
        include: {
          requisition: {
            select: {
              id: true,
              title: true,
              code: true,
              department: true,
              position: { select: { id: true, name: true } },
            },
          },
          candidate: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
              avatarUrl: true,
            },
          },
          assignedTo: { select: { id: true, fullName: true } },
          pipelineStage: {
            select: { id: true, name: true, color: true, position: true, isCompleted: true },
          },
          interviewRounds: {
            select: {
              id: true,
              roundNumber: true,
              title: true,
              format: true,
              scheduledAt: true,
              durationMinutes: true,
              status: true,
              result: true,
            },
            orderBy: { roundNumber: "desc" },
          },
          offers: {
            select: {
              id: true,
              status: true,
              offeredSalary: true,
              currency: true,
              startDate: true,
              jobTitle: true,
              backgroundCheck: {
                select: { id: true, status: true, group: true },
              },
            },
            orderBy: { createdAt: "desc" },
          },
        },
      }),
      this.db.recruitmentApplication.count({ where }),
    ])

    return { items, total, page, pageSize }
  }

  async updateStatus(id: string, data: UpdateApplicationStatusInput, expectedVersion: number) {
    return this.db.$transaction(async (tx) => {
      const application = await tx.recruitmentApplication.findUniqueOrThrow({
        where: { id },
        select: { requisitionId: true },
      })

      if (data.status === RECRUITMENT_APPLICATION_STATUS.HIRED) {
        const reservation = await tx.jobRequisition.updateMany({
          where: {
            id: application.requisitionId,
            filledCount: { lt: tx.jobRequisition.fields.headcount },
          },
          data: { filledCount: { increment: 1 } },
        })
        if (reservation.count !== 1) throw new Error("HEADCOUNT_FILLED")
      }

      const updated = await tx.recruitmentApplication.updateMany({
        where: { id, version: expectedVersion },
        data: {
          status: data.status,
          rejectReason: data.rejectReason,
          withdrawReason: data.withdrawReason,
          hiredAt: data.status === RECRUITMENT_APPLICATION_STATUS.HIRED ? new Date() : undefined,
          version: { increment: 1 },
        },
      })
      if (updated.count !== 1) throw new Error("APPLICATION_VERSION_CONFLICT")

      return tx.recruitmentApplication.findUniqueOrThrow({
        where: { id },
        include: {
          candidate: { select: { id: true, fullName: true, email: true } },
          requisition: { select: { id: true, title: true } },
        },
      })
    })
  }

  async moveToPipelineStage(id: string, pipelineStageId: string, expectedVersion: number) {
    return this.db.$transaction(async (tx) => {
      const application = await tx.recruitmentApplication.findUniqueOrThrow({
        where: { id },
        select: { requisitionId: true },
      })
      const stage = await tx.recruitmentPipelineStage.findFirst({
        where: { id: pipelineStageId, requisitionId: application.requisitionId },
        select: { id: true },
      })
      if (!stage) throw new Error("PIPELINE_STAGE_REQUISITION_MISMATCH")

      const updated = await tx.recruitmentApplication.updateMany({
        where: { id, version: expectedVersion },
        data: { pipelineStageId: stage.id, version: { increment: 1 } },
      })
      if (updated.count !== 1) throw new Error("APPLICATION_VERSION_CONFLICT")
      return tx.recruitmentApplication.findUniqueOrThrow({ where: { id } })
    })
  }

  async assignRecruiter(id: string, assignedToId: string) {
    return this.db.recruitmentApplication.update({
      where: { id },
      data: { assignedToId },
      include: {
        assignedTo: { select: { id: true, fullName: true } },
      },
    })
  }

  async addNote(id: string, note: string, addedById: string) {
    return this.db.applicationNote.create({
      data: {
        applicationId: id,
        note,
        addedById,
      },
    })
  }

  async getNotes(id: string) {
    return this.db.applicationNote.findMany({
      where: { applicationId: id },
      orderBy: { createdAt: "desc" },
      include: {
        addedBy: { select: { id: true, fullName: true } },
      },
    })
  }

  async delete(id: string) {
    return this.db.recruitmentApplication.delete({ where: { id } })
  }

  async getStats() {
    const [total, byStatus, bySource] = await Promise.all([
      this.db.recruitmentApplication.count(),
      this.db.recruitmentApplication.groupBy({
        by: ["status"],
        _count: { id: true },
      }),
      this.db.recruitmentApplication.groupBy({
        by: ["source"],
        _count: { id: true },
      }),
    ])

    return {
      total,
      byStatus: byStatus.reduce(
        (acc, { status, _count }) => ({ ...acc, [status]: _count.id }),
        {} as Record<string, number>,
      ),
      bySource: bySource.reduce(
        (acc, { source, _count }) => ({ ...acc, [source]: _count.id }),
        {} as Record<string, number>,
      ),
    }
  }
}

export const recruitmentApplicationRepository = new RecruitmentApplicationRepository()
