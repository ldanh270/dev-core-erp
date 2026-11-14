import { prisma } from "@/libs/database"
import type {
  CreateInterviewRoundInput,
  UpdateInterviewRoundInput,
} from "@/types/recruitment.types"

import { $Enums, Prisma, type PrismaClient } from "@prisma/client"

export class InterviewRoundRepository {
  constructor(private readonly db: PrismaClient = prisma) {}

  async create(data: CreateInterviewRoundInput): Promise<{ id: string }> {
    return this.db.interviewRound.create({
      data: {
        applicationId: data.applicationId,
        roundNumber: data.roundNumber,
        title: data.title,
        format: data.format ?? "video_call",
        scheduledAt: new Date(data.scheduledAt),
        durationMinutes: data.durationMinutes ?? 60,
        location: data.location,
        meetingLink: data.meetingLink,
        interviewerIds: data.interviewerIds,
        status: "scheduled",
      },
      select: { id: true },
    })
  }

  async createAndStart(data: CreateInterviewRoundInput) {
    return this.db.$transaction(async (tx) => {
      const application = await tx.recruitmentApplication.findUnique({
        where: { id: data.applicationId },
        select: { id: true, status: true },
      })
      if (!application) throw new Error("Application not found")

      const interview = await tx.interviewRound.create({
        data: {
          applicationId: data.applicationId,
          roundNumber: data.roundNumber,
          title: data.title,
          format: data.format ?? "video_call",
          scheduledAt: new Date(data.scheduledAt),
          durationMinutes: data.durationMinutes ?? 60,
          location: data.location,
          meetingLink: data.meetingLink,
          interviewerIds: data.interviewerIds,
          status: "scheduled",
        },
        select: { id: true },
      })

      await tx.recruitmentApplication.update({
        where: { id: application.id },
        data: { status: "interviewing" },
      })

      return interview
    })
  }

  async findById(id: string) {
    return this.db.interviewRound.findUnique({
      where: { id },
      include: {
        application: {
          include: {
            candidate: { select: { id: true, fullName: true, email: true, phone: true } },
            requisition: { select: { id: true, title: true } },
          },
        },
        scorecards: {
          include: {
            evaluator: { select: { id: true, fullName: true } },
          },
        },
      },
    })
  }

  async listByApplication(applicationId: string) {
    return this.db.interviewRound.findMany({
      where: { applicationId },
      orderBy: { roundNumber: "asc" },
      include: {
        scorecards: {
          include: {
            evaluator: { select: { id: true, fullName: true } },
          },
        },
      },
    })
  }

  async update(id: string, data: UpdateInterviewRoundInput) {
    const updateData: Prisma.InterviewRoundUpdateInput = {}

    if (data.title !== undefined) updateData.title = data.title
    if (data.format !== undefined) updateData.format = data.format
    if (data.scheduledAt !== undefined) updateData.scheduledAt = new Date(data.scheduledAt)
    if (data.durationMinutes !== undefined) updateData.durationMinutes = data.durationMinutes
    if (data.location !== undefined) updateData.location = data.location
    if (data.meetingLink !== undefined) updateData.meetingLink = data.meetingLink
    if (data.interviewerIds !== undefined) updateData.interviewerIds = data.interviewerIds
    if (data.status !== undefined) updateData.status = data.status
    if (data.result !== undefined) updateData.result = data.result as $Enums.InterviewResult
    if (data.feedback !== undefined) updateData.feedback = data.feedback

    return this.db.interviewRound.update({
      where: { id },
      data: updateData,
    })
  }

  async markCompleted(id: string, result?: string, feedback?: string) {
    return this.db.interviewRound.update({
      where: { id },
      data: {
        status: "completed",
        result: (result ?? "pending") as $Enums.InterviewResult,
        feedback,
      },
      include: {
        application: {
          include: {
            candidate: { select: { id: true, fullName: true, email: true } },
          },
        },
        scorecards: {
          include: {
            evaluator: { select: { id: true, fullName: true } },
          },
        },
      },
    })
  }

  async markCompletedAndTransition(id: string, result?: string, feedback?: string) {
    return this.db.$transaction(async (tx) => {
      const existing = await tx.interviewRound.findUnique({
        where: { id },
        select: { id: true, applicationId: true, roundNumber: true, status: true },
      })
      if (!existing) throw new Error("Interview round not found")

      const nextStatus =
        result === "fail"
          ? "rejected"
          : result === "pass"
            ? (await tx.interviewRound.count({
                where: {
                  applicationId: existing.applicationId,
                  roundNumber: { gt: existing.roundNumber },
                },
              })) > 0
              ? "interviewing"
              : "final_review"
            : undefined

      const interview = await tx.interviewRound.update({
        where: { id },
        data: {
          status: "completed",
          result: (result ?? "pending") as $Enums.InterviewResult,
          feedback,
        },
        include: {
          application: {
            include: {
              candidate: { select: { id: true, fullName: true, email: true } },
            },
          },
          scorecards: {
            include: {
              evaluator: { select: { id: true, fullName: true } },
            },
          },
        },
      })

      if (nextStatus) {
        await tx.recruitmentApplication.update({
          where: { id: existing.applicationId },
          data: {
            status: nextStatus,
            ...(nextStatus === "rejected" ? { rejectReason: "Failed interview" } : {}),
          },
        })
      }

      return interview
    })
  }

  async cancel(id: string) {
    return this.db.interviewRound.update({
      where: { id },
      data: { status: "cancelled" },
    })
  }

  async markNoShow(id: string) {
    return this.db.interviewRound.update({
      where: { id },
      data: { status: "no_show", result: "no_show" },
    })
  }

  async delete(id: string) {
    return this.db.interviewRound.delete({ where: { id } })
  }

  async getUpcoming(interviewerId?: string, _days?: number) {
    const rounds = await this.db.interviewRound.findMany({
      include: {
        application: {
          include: {
            candidate: {
              select: { id: true, fullName: true, email: true, phone: true, avatarUrl: true },
            },
            requisition: { select: { id: true, title: true } },
          },
        },
        scorecards: {
          include: {
            evaluator: { select: { id: true, fullName: true } },
          },
        },
      },
      orderBy: { scheduledAt: "asc" },
    })

    const allInterviewerIds = rounds.flatMap((r) => r.interviewerIds || [])
    if (allInterviewerIds.length > 0) {
      const employees = await this.db.employee.findMany({
        where: { id: { in: allInterviewerIds } },
        select: { id: true, fullName: true, email: true },
      })
      const empMap = new Map(employees.map((e) => [e.id, e]))
      return rounds.map((r) => ({
        ...r,
        interviewers: (r.interviewerIds || [])
          .map((empId) => empMap.get(empId))
          .filter(Boolean) as Array<{ id: string; fullName: string; email: string }>,
      }))
    }

    return rounds
  }
}

export const interviewRoundRepository = new InterviewRoundRepository()
