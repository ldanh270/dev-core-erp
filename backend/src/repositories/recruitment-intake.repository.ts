import { prisma } from "@/libs/database"
import type { ImportRecruitmentIntakeInput } from "@/schemas/recruitment.schema"
import type { ConnectorImportInput, ConnectorIntakeRow } from "@/types/recruitment-connector.types"

import type { Prisma } from "@prisma/client"
import { createHash } from "node:crypto"

export interface IntakeRowError {
  row: number
  email: string
  code: string
  message: string
}

type IntakeInput = ImportRecruitmentIntakeInput | ConnectorImportInput

const normalizedEmail = (email: string) => email.trim().toLowerCase()

function sourceRef(input: IntakeInput, row: IntakeInput["rows"][number]): string {
  const externalId = "externalResponseId" in row ? row.externalResponseId : undefined
  const stableValue =
    externalId ??
    row.sourceRef ??
    createHash("sha256")
      .update(`${input.postingId}:${normalizedEmail(row.email)}`)
      .digest("base64url")
  return `${input.postingId}:${input.source}:${stableValue}`
}

export class RecruitmentIntakeRepository {
  async importCandidateBatch(input: IntakeInput, postingSourceRef?: string | null) {
    return prisma.$transaction(async (tx) => {
      let created = 0
      let matched = 0
      let candidatesCreated = 0
      let skipped = 0
      const errors: IntakeRowError[] = []
      const isConnectorImport = "connectorErrors" in input
      const defaultStage = await tx.recruitmentPipelineStage.findFirst({
        where: { requisitionId: input.requisitionId, isDefault: true },
        orderBy: { position: "asc" },
        select: { id: true },
      })
      if (!defaultStage) throw new Error("Bài đăng chưa có giai đoạn mặc định")

      if (isConnectorImport) {
        for (const connectorError of input.connectorErrors) {
          const recordRef = `${input.postingId}:${input.source}:${connectorError.sourceRef}`
          await tx.recruitmentIntakeRecord.upsert({
            where: { sourceRef: recordRef },
            create: {
              postingId: input.postingId,
              source: input.source,
              sourceRef: recordRef,
              rawPayload: connectorError.responseData,
              processedStatus: "failed",
              errorMessage: connectorError.message,
            },
            update: {
              rawPayload: connectorError.responseData,
              processedStatus: "failed",
              errorMessage: connectorError.message,
            },
          })
          errors.push(connectorError)
        }
      }

      for (const row of input.rows) {
        const email = normalizedEmail(row.email)
        const recordRef = sourceRef(input, row)
        const priorRecord = await tx.recruitmentIntakeRecord.findUnique({
          where: { sourceRef: recordRef },
          select: { processedStatus: true, applicationId: true },
        })
        if (priorRecord?.applicationId || priorRecord?.processedStatus === "processed") {
          skipped += 1
          continue
        }

        const intakeRecord = await tx.recruitmentIntakeRecord.upsert({
          where: { sourceRef: recordRef },
          create: {
            postingId: input.postingId,
            source: input.source,
            sourceRef: recordRef,
            rawPayload: row as unknown as Prisma.InputJsonValue,
          },
          update: {
            rawPayload: row as unknown as Prisma.InputJsonValue,
            processedStatus: "received",
            errorMessage: null,
          },
          select: { id: true },
        })

        try {
          let candidate = await tx.candidate.findFirst({
            where: { email },
            select: { id: true },
          })
          if (candidate) {
            matched += 1
          } else {
            candidate = await tx.candidate.create({
              data: {
                fullName: row.fullName.trim(),
                email,
                phone: row.phone,
                cvUrl: row.cvUrl,
                notes: row.notes,
                source: input.source,
              },
              select: { id: true },
            })
            candidatesCreated += 1
          }

          const existingApplication = await tx.recruitmentApplication.findFirst({
            where: { requisitionId: input.requisitionId, candidateId: candidate.id },
            select: { id: true },
          })
          if (existingApplication) {
            await tx.recruitmentIntakeRecord.update({
              where: { id: intakeRecord.id },
              data: {
                processedStatus: "processed",
                candidateId: candidate.id,
                applicationId: existingApplication.id,
              },
            })
            skipped += 1
            continue
          }

          const application = await tx.recruitmentApplication.create({
            data: {
              requisitionId: input.requisitionId,
              candidateId: candidate.id,
              postingId: input.postingId,
              source: input.source,
              sourceRef: postingSourceRef ?? row.sourceRef,
              pipelineStageId: defaultStage.id,
            },
            select: { id: true },
          })
          if ("responseData" in row) {
            await Promise.all(
              Object.entries((row as ConnectorIntakeRow).responseData as Record<string, string>)
                .filter(([key, value]) => Boolean(key) && value.trim().length > 0)
                .map(([metaKey, value]) =>
                  tx.candidateMeta.upsert({
                    where: { candidateId_metaKey: { candidateId: candidate.id, metaKey } },
                    create: {
                      candidateId: candidate.id,
                      metaKey,
                      value: value as Prisma.InputJsonValue,
                    },
                    update: { value: value as Prisma.InputJsonValue },
                  }),
                ),
            )
          }
          if ("externalResponseId" in row && row.externalResponseId) {
            await tx.recruitmentConnectorResponse.upsert({
              where: {
                postingId_externalResponseId: {
                  postingId: input.postingId,
                  externalResponseId: row.externalResponseId,
                },
              },
              create: {
                postingId: input.postingId,
                externalResponseId: row.externalResponseId,
                applicationId: application.id,
                responseData: row.responseData,
              },
              update: {
                applicationId: application.id,
                errorCode: null,
                errorMessage: null,
                responseData: row.responseData,
              },
            })
          }
          await tx.recruitmentIntakeRecord.update({
            where: { id: intakeRecord.id },
            data: {
              processedStatus: "processed",
              candidateId: candidate.id,
              applicationId: application.id,
            },
          })
          created += 1
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown intake error"
          await tx.recruitmentIntakeRecord.update({
            where: { id: intakeRecord.id },
            data: { processedStatus: "failed", errorMessage: message },
          })
          errors.push({ row: errors.length + 1, email, code: "INTAKE_PROCESSING_FAILED", message })
        }
      }

      return {
        total: input.rows.length + (isConnectorImport ? input.connectorErrors.length : 0),
        created,
        matched,
        applicationsCreated: created,
        candidatesCreated,
        candidatesMatched: matched,
        skipped,
        failed: errors.length,
        errors,
      }
    })
  }
}

export const recruitmentIntakeRepository = new RecruitmentIntakeRepository()
