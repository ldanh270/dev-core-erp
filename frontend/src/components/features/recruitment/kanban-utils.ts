import type { KanbanApplication, RecruitmentPipelineStage } from "@/types/recruitment.types"

/**
 * Pure utility partitioning applications into stage buckets,
 * with fallback handling to the designated default stage.
 */
export function groupApplicationsByStage(
  statuses: RecruitmentPipelineStage[],
  tasks: KanbanApplication[],
): Map<string, KanbanApplication[]> {
  const applicationsByStageMap = new Map<string, KanbanApplication[]>()
  statuses.forEach((stage) => {
    applicationsByStageMap.set(stage.id, [])
  })
  const defaultStage = statuses.find((stage) => stage.isDefault) ?? statuses[0]

  tasks.forEach((application) => {
    const stageId = application.pipelineStage?.id
    if (stageId && applicationsByStageMap.has(stageId)) {
      applicationsByStageMap.get(stageId)?.push(application)
    } else if (defaultStage && applicationsByStageMap.has(defaultStage.id)) {
      applicationsByStageMap.get(defaultStage.id)?.push(application)
    }
  })

  return applicationsByStageMap
}
