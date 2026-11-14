import { PERMISSION_CODE } from "@/configs/entities/permission.config"
import { RECRUITMENT_PIPELINE_STAGE_TEMPLATE } from "@/configs/entities/recruitment.config"
import { GOOGLE_FORM_DEFAULT_FIELDS } from "@/configs/rules/google-form.config"
import { prisma } from "@/libs/database"
import type {
  CreateJobRequisitionInput,
  ListRequisitionsQuery,
  UpdateJobRequisitionInput,
} from "@/types/recruitment.types"
import { generateRequisitionCode } from "@/types/recruitment.types"

import { type EmployeeType, Prisma, type PrismaClient } from "@prisma/client"

export class JobRequisitionRepository {
  constructor(private readonly db: PrismaClient = prisma) {}

  async create(data: CreateJobRequisitionInput, requestedById: string): Promise<{ id: string }> {
    const year = new Date().getFullYear()
    const candidateSchema = data.candidateSchema ?? GOOGLE_FORM_DEFAULT_FIELDS
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        return await this.db.$transaction(async (tx) => {
          const count = await tx.jobRequisition.count({
            where: { code: { startsWith: `REQ-${year}` } },
          })
          return tx.jobRequisition.create({
            data: {
              code: generateRequisitionCode(year, count + 1),
              title: data.title,
              department: data.department,
              positionLevel: data.positionLevel,
              currency: data.currency,
              priority: data.priority,
              reason: data.reason,
              requestedById,
              approverId: data.approverId,
              positionId: data.positionId,
              salaryMin: data.salaryMin,
              salaryMax: data.salaryMax,
              headcount: data.headcount ?? 1,
              employmentType: data.employmentType as EmployeeType,
              targetHireDate: data.targetHireDate ? new Date(data.targetHireDate) : undefined,
              targetCloseDate: data.targetCloseDate ? new Date(data.targetCloseDate) : undefined,
              candidateFields: {
                create: candidateSchema.map((field, position) => ({ ...field, position })),
              },
            },
            select: { id: true },
          })
        })
      } catch (error) {
        if (
          !(error instanceof Prisma.PrismaClientKnownRequestError) ||
          error.code !== "P2002" ||
          attempt === 2
        )
          throw error
      }
    }
    throw new Error("Không thể tạo mã yêu cầu tuyển dụng")
  }

  async findById(id: string) {
    return this.db.jobRequisition.findUnique({
      where: { id },
      include: {
        requestedBy: { select: { id: true, fullName: true } },
        approver: { select: { id: true, fullName: true, position: true } },
        approvedBy: { select: { id: true, fullName: true } },
        position: { select: { id: true, name: true } },
        postings: true,
        candidateFields: { orderBy: { position: "asc" } },
        _count: { select: { applications: true } },
      },
    })
  }

  async ensurePipeline(id: string) {
    return this.db.$transaction(async (tx) => {
      const existing = await tx.recruitmentPipelineStage.findMany({
        where: { requisitionId: id },
        orderBy: { position: "asc" },
      })
      if (existing.length > 0) return existing

      const postings = await tx.jobPosting.findMany({
        where: { requisitionId: id },
        orderBy: { createdAt: "asc" },
        include: { pipelineStages: { orderBy: { position: "asc" } } },
      })
      const canonical = postings[0]?.pipelineStages ?? []
      if (canonical.length > 0) {
        const canonicalByName = new Map(
          canonical.map((stage) => [stage.name.trim().toLocaleLowerCase(), stage]),
        )
        await tx.recruitmentPipelineStage.updateMany({
          where: { id: { in: canonical.map((stage) => stage.id) } },
          data: { requisitionId: id },
        })
        for (const posting of postings.slice(1)) {
          for (const stage of posting.pipelineStages) {
            const target =
              canonicalByName.get(stage.name.trim().toLocaleLowerCase()) ??
              canonical.find((item) => item.isDefault) ??
              canonical[0]
            if (target) {
              await tx.recruitmentApplication.updateMany({
                where: { pipelineStageId: stage.id },
                data: { pipelineStageId: target.id },
              })
            }
          }
        }
        return tx.recruitmentPipelineStage.findMany({
          where: { requisitionId: id },
          orderBy: { position: "asc" },
        })
      }

      return Promise.all(
        RECRUITMENT_PIPELINE_STAGE_TEMPLATE.map((stage) =>
          tx.recruitmentPipelineStage.create({
            data: { ...stage, requisitionId: id, postingId: postings[0]?.id ?? null },
          }),
        ),
      )
    })
  }

  listPipelineStages(requisitionId: string) {
    return this.db.recruitmentPipelineStage.findMany({
      where: { requisitionId },
      orderBy: { position: "asc" },
    })
  }

  createPipelineStage(
    requisitionId: string,
    data: { name: string; color?: string; isDefault?: boolean; isCompleted?: boolean },
  ) {
    return this.db.$transaction(async (tx) => {
      if (data.isDefault)
        await tx.recruitmentPipelineStage.updateMany({
          where: { requisitionId },
          data: { isDefault: false },
        })
      const max = await tx.recruitmentPipelineStage.aggregate({
        where: { requisitionId },
        _max: { position: true },
      })
      const posting = await tx.jobPosting.findFirst({
        where: { requisitionId },
        orderBy: { createdAt: "asc" },
        select: { id: true },
      })
      return tx.recruitmentPipelineStage.create({
        data: {
          requisitionId,
          postingId: posting?.id ?? null,
          name: data.name,
          color: data.color ?? "#6366F1",
          position: (max._max.position ?? -1) + 1,
          isDefault: data.isDefault ?? false,
          isCompleted: data.isCompleted ?? false,
        },
      })
    })
  }

  updatePipelineStage(
    requisitionId: string,
    stageId: string,
    data: { name?: string; color?: string; isDefault?: boolean; isCompleted?: boolean },
  ) {
    return this.db.$transaction(async (tx) => {
      const stage = await tx.recruitmentPipelineStage.findFirstOrThrow({
        where: { id: stageId, requisitionId },
      })
      if (data.isDefault)
        await tx.recruitmentPipelineStage.updateMany({
          where: { requisitionId },
          data: { isDefault: false },
        })
      return tx.recruitmentPipelineStage.update({ where: { id: stage.id }, data })
    })
  }

  async deletePipelineStage(requisitionId: string, stageId: string, fallbackStageId: string) {
    return this.db.$transaction(async (tx) => {
      const [stage, fallback] = await Promise.all([
        tx.recruitmentPipelineStage.findFirstOrThrow({ where: { id: stageId, requisitionId } }),
        tx.recruitmentPipelineStage.findFirstOrThrow({
          where: { id: fallbackStageId, requisitionId },
        }),
      ])
      if (stage.id === fallback.id) throw new Error("Giai đoạn thay thế không hợp lệ")
      await tx.recruitmentApplication.updateMany({
        where: { pipelineStageId: stage.id, requisitionId },
        data: { pipelineStageId: fallback.id },
      })
      await tx.recruitmentPipelineStage.delete({ where: { id: stage.id } })
      const remaining = await tx.recruitmentPipelineStage.findMany({
        where: { requisitionId },
        orderBy: { position: "asc" },
        select: { id: true },
      })
      await Promise.all(
        remaining.map((item, position) =>
          tx.recruitmentPipelineStage.update({
            where: { id: item.id },
            data: { position: position + 1000 },
          }),
        ),
      )
      await Promise.all(
        remaining.map((item, position) =>
          tx.recruitmentPipelineStage.update({ where: { id: item.id }, data: { position } }),
        ),
      )
    })
  }

  async reorderPipelineStages(requisitionId: string, stageIds: string[]) {
    return this.db.$transaction(async (tx) => {
      const stages = await tx.recruitmentPipelineStage.findMany({
        where: { requisitionId },
        select: { id: true },
      })
      if (
        stages.length !== stageIds.length ||
        new Set(stageIds).size !== stageIds.length ||
        stages.some((stage) => !stageIds.includes(stage.id))
      )
        throw new Error("Danh sách thứ tự giai đoạn không hợp lệ")
      await Promise.all(
        stages.map((stage, index) =>
          tx.recruitmentPipelineStage.update({
            where: { id: stage.id },
            data: { position: index + 1000 },
          }),
        ),
      )
      await Promise.all(
        stageIds.map((stageId, position) =>
          tx.recruitmentPipelineStage.update({ where: { id: stageId }, data: { position } }),
        ),
      )
      return tx.recruitmentPipelineStage.findMany({
        where: { requisitionId },
        orderBy: { position: "asc" },
      })
    })
  }

  moveApplicationToPipelineStage(
    requisitionId: string,
    applicationId: string,
    pipelineStageId: string,
  ) {
    return this.db.$transaction(async (tx) => {
      const [application, stage] = await Promise.all([
        tx.recruitmentApplication.findFirstOrThrow({ where: { id: applicationId, requisitionId } }),
        tx.recruitmentPipelineStage.findFirstOrThrow({
          where: { id: pipelineStageId, requisitionId },
        }),
      ])
      return tx.recruitmentApplication.update({
        where: { id: application.id },
        data: { pipelineStageId: stage.id },
      })
    })
  }

  async findByCode(code: string) {
    return this.db.jobRequisition.findUnique({
      where: { code },
      include: {
        requestedBy: { select: { id: true, fullName: true } },
        approver: { select: { id: true, fullName: true, position: true } },
        approvedBy: { select: { id: true, fullName: true } },
      },
    })
  }

  async list(query: ListRequisitionsQuery) {
    const { status, department, priority, page = 1, pageSize = 20 } = query
    const skip = (page - 1) * pageSize

    const where: Prisma.JobRequisitionWhereInput = {}
    if (status) where.status = status
    if (department) where.department = { contains: department }
    if (priority) where.priority = priority

    const [items, total] = await Promise.all([
      this.db.jobRequisition.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
        include: {
          requestedBy: { select: { id: true, fullName: true } },
          approver: { select: { id: true, fullName: true, position: true } },
          approvedBy: { select: { id: true, fullName: true } },
          _count: { select: { applications: true } },
          candidateFields: { orderBy: { position: "asc" } },
        },
      }),
      this.db.jobRequisition.count({ where }),
    ])

    return { items, total, page, pageSize }
  }

  async update(id: string, data: UpdateJobRequisitionInput) {
    const updateData: Prisma.JobRequisitionUpdateInput = {}
    if (data.status !== undefined) updateData.status = data.status
    if (data.title !== undefined) updateData.title = data.title
    if (data.department !== undefined) updateData.department = data.department
    if (data.positionLevel !== undefined) updateData.positionLevel = data.positionLevel
    if (data.employmentType !== undefined)
      updateData.employmentType = data.employmentType as EmployeeType
    if (data.salaryMin !== undefined) updateData.salaryMin = data.salaryMin
    if (data.salaryMax !== undefined) updateData.salaryMax = data.salaryMax
    if (data.headcount !== undefined) updateData.headcount = data.headcount
    if (data.priority !== undefined) updateData.priority = data.priority
    if (data.reason !== undefined) updateData.reason = data.reason
    if (data.targetHireDate !== undefined) {
      updateData.targetHireDate = data.targetHireDate ? new Date(data.targetHireDate) : null
    }
    if (data.targetCloseDate !== undefined) {
      updateData.targetCloseDate = data.targetCloseDate ? new Date(data.targetCloseDate) : null
    }
    if (data.approverId !== undefined) {
      updateData.approver =
        data.approverId && data.approverId.trim() !== ""
          ? { connect: { id: data.approverId } }
          : { disconnect: true }
    }
    if (data.positionId !== undefined) {
      updateData.position =
        data.positionId && data.positionId.trim() !== ""
          ? { connect: { id: data.positionId } }
          : { disconnect: true }
    }

    const candidateSchema = data.candidateSchema
    return this.db.$transaction(async (tx) => {
      if (candidateSchema) {
        await tx.candidateFieldDefinition.deleteMany({ where: { requisitionId: id } })
        await tx.candidateFieldDefinition.createMany({
          data: candidateSchema.map((field, position) => ({
            requisitionId: id,
            ...field,
            position,
          })),
        })
      }
      return tx.jobRequisition.update({
        where: { id },
        data: updateData,
        include: {
          requestedBy: { select: { id: true, fullName: true } },
          approver: { select: { id: true, fullName: true, position: true } },
          approvedBy: { select: { id: true, fullName: true } },
          candidateFields: { orderBy: { position: "asc" } },
        },
      })
    })
  }

  async approve(id: string, approvedById: string, comment?: string) {
    return this.db.jobRequisition.update({
      where: { id },
      data: {
        status: "approved",
        approvedById,
        approvalComment: comment,
        approvedAt: new Date(),
      },
      include: {
        requestedBy: { select: { id: true, fullName: true } },
        approvedBy: { select: { id: true, fullName: true } },
      },
    })
  }

  async reject(id: string, rejectedById: string, reason?: string) {
    return this.db.jobRequisition.update({
      where: { id },
      data: {
        status: "rejected",
        approvedById: rejectedById,
        approvalComment: reason,
        approvedAt: new Date(),
      },
    })
  }

  async close(id: string) {
    return this.db.jobRequisition.update({
      where: { id },
      data: { status: "closed" },
    })
  }

  async incrementFilledCount(id: string) {
    return this.db.jobRequisition.update({
      where: { id },
      data: { filledCount: { increment: 1 } },
    })
  }

  async delete(id: string) {
    return this.db.jobRequisition.delete({ where: { id } })
  }

  async listApprovers() {
    return this.db.employee.findMany({
      where: {
        status: "active",
        deletedAt: null,
        employeeRoles: {
          some: {
            role: {
              isActive: true,
              deletedAt: null,
              permissions: {
                some: {
                  permission: {
                    code: PERMISSION_CODE.RECRUITMENT_REQUISITION_APPROVE,
                    isActive: true,
                    deletedAt: null,
                  },
                },
              },
            },
          },
        },
      },
      select: { id: true, fullName: true, position: true },
      orderBy: { fullName: "asc" },
    })
  }

  async canApprove(employeeId: string) {
    const employee = await this.db.employee.findFirst({
      where: {
        id: employeeId,
        status: "active",
        deletedAt: null,
        employeeRoles: {
          some: {
            role: {
              isActive: true,
              deletedAt: null,
              permissions: {
                some: {
                  permission: {
                    code: PERMISSION_CODE.RECRUITMENT_REQUISITION_APPROVE,
                    isActive: true,
                    deletedAt: null,
                  },
                },
              },
            },
          },
        },
      },
      select: { id: true },
    })
    return Boolean(employee)
  }

  async getStats() {
    const [total, open, pending, approved] = await Promise.all([
      this.db.jobRequisition.count(),
      this.db.jobRequisition.count({ where: { status: "approved" } }),
      this.db.jobRequisition.count({ where: { status: "pending_approval" } }),
      this.db.jobRequisition.count({ where: { status: "approved" } }),
    ])
    return { total, open, pending, approved }
  }
}

export const jobRequisitionRepository = new JobRequisitionRepository()
