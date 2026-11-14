import { RECRUITMENT_PIPELINE_STAGE_TEMPLATE } from "@/configs/entities/recruitment.config"
import type { GoogleFormFieldDefinition } from "@/configs/rules/google-form.config"
import { prisma } from "@/libs/database"
import type { UpdateJobPostingInput } from "@/schemas/recruitment.schema"

import {
  type PostingStatus,
  Prisma,
  type PrismaClient,
  type RecruitmentChannel,
} from "@prisma/client"

export interface ListJobPostingsQuery {
  requisitionId?: string
  channel?: RecruitmentChannel
  status?: PostingStatus
  page: number
  pageSize: number
}

export class JobPostingRepository {
  constructor(private readonly db: PrismaClient = prisma) {}

  create(
    data: Prisma.JobPostingUncheckedCreateInput,
    fields: readonly GoogleFormFieldDefinition[],
  ) {
    return this.db.$transaction(async (tx) => {
      const posting = await tx.jobPosting.create({ data })
      await tx.postingFieldSnapshot.createMany({
        data: fields.map((field, position) => ({
          postingId: posting.id,
          fieldKey: field.key,
          label: field.label,
          type: field.type,
          required: field.required,
          position,
        })),
      })
      return tx.jobPosting.findUniqueOrThrow({ where: { id: posting.id }, include: this.relations })
    })
  }

  createDefaultPipelineStages(postingId: string) {
    return this.db.recruitmentPipelineStage.createMany({
      data: RECRUITMENT_PIPELINE_STAGE_TEMPLATE.map((stage) => ({ postingId, ...stage })),
    })
  }

  listPipelineStages(postingId: string) {
    return this.db.recruitmentPipelineStage.findMany({
      where: { postingId },
      orderBy: { position: "asc" },
    })
  }

  createPipelineStage(
    postingId: string,
    data: { name: string; color?: string; isDefault?: boolean; isCompleted?: boolean },
  ) {
    return this.db.$transaction(async (tx) => {
      if (data.isDefault)
        await tx.recruitmentPipelineStage.updateMany({
          where: { postingId },
          data: { isDefault: false },
        })
      const max = await tx.recruitmentPipelineStage.aggregate({
        where: { postingId },
        _max: { position: true },
      })
      return tx.recruitmentPipelineStage.create({
        data: {
          postingId,
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
    id: string,
    data: {
      name?: string
      color?: string
      position?: number
      isDefault?: boolean
      isCompleted?: boolean
    },
  ) {
    return this.db.$transaction(async (tx) => {
      const stage = await tx.recruitmentPipelineStage.findUniqueOrThrow({ where: { id } })
      if (data.isDefault)
        await tx.recruitmentPipelineStage.updateMany({
          where: { postingId: stage.postingId },
          data: { isDefault: false },
        })
      return tx.recruitmentPipelineStage.update({ where: { id }, data })
    })
  }

  async deletePipelineStage(id: string, fallbackStageId: string) {
    return this.db.$transaction(async (tx) => {
      const [stage, fallback] = await Promise.all([
        tx.recruitmentPipelineStage.findUniqueOrThrow({ where: { id } }),
        tx.recruitmentPipelineStage.findUniqueOrThrow({ where: { id: fallbackStageId } }),
      ])
      if (stage.id === fallback.id || stage.postingId !== fallback.postingId) {
        throw new Error("Giai đoạn thay thế phải thuộc cùng bài đăng tuyển dụng")
      }
      await tx.recruitmentApplication.updateMany({
        where: { pipelineStageId: id },
        data: { pipelineStageId: fallbackStageId },
      })
      await tx.recruitmentPipelineStage.delete({ where: { id } })
      const remaining = await tx.recruitmentPipelineStage.findMany({
        where: { postingId: stage.postingId },
        orderBy: { position: "asc" },
        select: { id: true, position: true },
      })
      const maxPosition = remaining.reduce((max, item) => Math.max(max, item.position), -1)
      const temporaryOffset = maxPosition + remaining.length + 1
      await Promise.all(
        remaining.map((item, position) =>
          tx.recruitmentPipelineStage.update({
            where: { id: item.id },
            data: { position: temporaryOffset + position },
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

  async reorderPipelineStages(postingId: string, stageIds: string[]) {
    return this.db.$transaction(async (tx) => {
      const stages = await tx.recruitmentPipelineStage.findMany({
        where: { postingId },
        select: { id: true },
      })
      if (
        stages.length !== stageIds.length ||
        new Set(stageIds).size !== stageIds.length ||
        stages.some((stage) => !stageIds.includes(stage.id))
      ) {
        throw new Error("Danh sách thứ tự giai đoạn không hợp lệ")
      }
      const currentMax = await tx.recruitmentPipelineStage.aggregate({
        where: { postingId },
        _max: { position: true },
      })
      const temporaryOffset = (currentMax._max.position ?? -1) + stages.length + 1
      await Promise.all(
        stages.map((stage, index) =>
          tx.recruitmentPipelineStage.update({
            where: { id: stage.id },
            data: { position: temporaryOffset + index },
          }),
        ),
      )
      await Promise.all(
        stageIds.map((id, position) =>
          tx.recruitmentPipelineStage.update({ where: { id }, data: { position } }),
        ),
      )
      return tx.recruitmentPipelineStage.findMany({
        where: { postingId },
        orderBy: { position: "asc" },
      })
    })
  }

  moveApplicationToPipelineStage(applicationId: string, pipelineStageId: string) {
    return this.db.$transaction(async (tx) => {
      const [application, stage] = await Promise.all([
        tx.recruitmentApplication.findUniqueOrThrow({ where: { id: applicationId } }),
        tx.recruitmentPipelineStage.findUniqueOrThrow({ where: { id: pipelineStageId } }),
      ])
      if (application.postingId !== stage.postingId)
        throw new Error("Ứng viên và giai đoạn không thuộc cùng bài đăng")
      return tx.recruitmentApplication.update({
        where: { id: applicationId },
        data: { pipelineStageId },
      })
    })
  }

  async createCandidateApplication(
    postingId: string,
    candidate: Prisma.CandidateUncheckedCreateInput,
  ) {
    return this.db.$transaction(async (tx) => {
      const posting = await tx.jobPosting.findUniqueOrThrow({ where: { id: postingId } })
      const defaultStage = await tx.recruitmentPipelineStage.findFirst({
        where: { requisitionId: posting.requisitionId, isDefault: true },
        orderBy: { position: "asc" },
      })
      if (!defaultStage) throw new Error("Bài đăng chưa có giai đoạn mặc định")
      const createdCandidate = await tx.candidate.create({ data: candidate })
      return tx.recruitmentApplication.create({
        data: {
          requisitionId: posting.requisitionId,
          postingId,
          pipelineStageId: defaultStage.id,
          candidateId: createdCandidate.id,
          source: candidate.source,
          sourceRef: posting.sourceCode,
        },
        include: {
          candidate: {
            select: { id: true, fullName: true, email: true, phone: true, avatarUrl: true },
          },
          pipelineStage: { select: { id: true, name: true, color: true, position: true } },
        },
      })
    })
  }

  findById(id: string) {
    return this.db.jobPosting.findUnique({
      where: { id },
      include: this.relations,
    })
  }

  findBySourceCode(sourceCode: string) {
    return this.db.jobPosting.findUnique({ where: { sourceCode }, select: { id: true } })
  }

  async list(query: ListJobPostingsQuery) {
    const { page, pageSize, requisitionId, channel, status } = query
    const where: Prisma.JobPostingWhereInput = {
      ...(requisitionId ? { requisitionId } : {}),
      ...(channel ? { channel } : {}),
      ...(status ? { status } : {}),
    }
    const [items, total] = await this.db.$transaction([
      this.db.jobPosting.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: this.relations,
      }),
      this.db.jobPosting.count({ where }),
    ])
    return { items, total, page, pageSize }
  }

  update(id: string, data: UpdateJobPostingInput) {
    return this.db.jobPosting.update({
      where: { id },
      data,
      include: this.relations,
    })
  }

  markConnectorPublished(id: string, externalId: string, postingUrl: string) {
    return this.db.jobPosting.update({
      where: { id },
      data: {
        externalId,
        postingUrl,
        status: "open",
        connectorStatus: "ready",
        publishedAt: new Date(),
      },
      include: this.relations,
    })
  }

  storeConnectorExternalId(id: string, externalId: string) {
    return this.db.jobPosting.update({
      where: { id },
      data: { externalId },
      include: this.relations,
    })
  }

  storeConnectorOAuthAccountId(id: string, oauthAccountId: string) {
    return this.db.jobPosting.update({
      where: { id },
      data: { oauthAccountId },
      include: this.relations,
    })
  }

  updateFieldQuestionIds(
    postingId: string,
    mappings: ReadonlyArray<{ fieldKey: string; externalQuestionId: string }>,
  ) {
    return this.db.$transaction(
      mappings.map((mapping) =>
        this.db.postingFieldSnapshot.update({
          where: { postingId_fieldKey: { postingId, fieldKey: mapping.fieldKey } },
          data: { externalQuestionId: mapping.externalQuestionId },
        }),
      ),
    )
  }

  markConnectorError(id: string) {
    return this.db.jobPosting.update({
      where: { id },
      data: { connectorStatus: "error" },
      include: this.relations,
    })
  }

  markSynced(id: string) {
    return this.db.jobPosting.update({
      where: { id },
      data: { lastSyncedAt: new Date(), connectorStatus: "ready" },
      include: this.relations,
    })
  }

  archive(id: string, archivedById: string) {
    return this.db.jobPosting.update({
      where: { id },
      data: { status: "archived", archivedAt: new Date(), archivedById },
      include: this.relations,
    })
  }

  async getOverview(id: string) {
    const [posting, applicationTotal, statusGroups, stageGroups] = await this.db.$transaction([
      this.db.jobPosting.findUnique({ where: { id }, include: this.relations }),
      this.db.recruitmentApplication.count({ where: { postingId: id } }),
      this.db.recruitmentApplication.groupBy({
        by: ["status"],
        where: { postingId: id },
        _count: { _all: true },
      }),
      this.db.recruitmentApplication.groupBy({
        by: ["pipelineStageId"],
        where: { postingId: id },
        _count: { _all: true },
      }),
    ])
    return { posting, applicationTotal, statusGroups, stageGroups }
  }

  listConnectorResponses(postingId: string) {
    return this.db.recruitmentConnectorResponse.findMany({
      where: { postingId },
      orderBy: { processedAt: "desc" },
      include: {
        application: { select: { id: true } },
      },
    })
  }

  private readonly relations = {
    requisition: {
      select: {
        id: true,
        code: true,
        title: true,
        status: true,
        department: true,
        summary: true,
        responsibilities: true,
        requirements: true,
        benefits: true,
        candidateFields: { orderBy: { position: "asc" as const } },
      },
    },
    oauthAccount: true,
    fieldSnapshots: { orderBy: { position: "asc" as const } },
  }
}

export const jobPostingRepository = new JobPostingRepository()
