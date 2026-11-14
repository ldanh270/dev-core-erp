import { z } from "zod"

const templateDaySchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  shiftId: z.string().min(1).nullable().optional(),
})

const templateWeekSchema = z.object({
  weekIndex: z.number().min(0),
  days: z.array(templateDaySchema).length(7, "Each week must define all 7 days"),
})

const weeklyScheduleTemplateBodySchema = z.object({
  name: z.string().min(2).max(100).trim(),
  description: z.string().max(500).trim().nullable().optional(),
  cycleWeeks: z.number().min(1).max(12),
  isActive: z.boolean().optional(),
  weeks: z.array(templateWeekSchema).min(1),
})

function refineWeeklyTemplateWeeks(
  data: { cycleWeeks: number; weeks: z.infer<typeof templateWeekSchema>[] },
  ctx: z.RefinementCtx,
) {
  if (data.weeks.length !== data.cycleWeeks) {
    ctx.addIssue({
      code: "custom",
      message: "Number of weeks must match cycleWeeks",
      path: ["weeks"],
    })
  }

  const weekIndexes = data.weeks.map((week) => week.weekIndex).sort((a, b) => a - b)
  const expected = Array.from({ length: data.cycleWeeks }, (_, index) => index)
  if (weekIndexes.join(",") !== expected.join(",")) {
    ctx.addIssue({
      code: "custom",
      message: "weekIndex must be sequential from 0 to cycleWeeks - 1",
      path: ["weeks"],
    })
  }
}

export const createWeeklyScheduleTemplateSchema = weeklyScheduleTemplateBodySchema
  .strict()
  .superRefine(refineWeeklyTemplateWeeks)

export type CreateWeeklyScheduleTemplateSchemaType = z.infer<
  typeof createWeeklyScheduleTemplateSchema
>

export const updateWeeklyScheduleTemplateSchema = weeklyScheduleTemplateBodySchema
  .partial()
  .strict()
  .superRefine((data, ctx) => {
    if (data.weeks === undefined || data.cycleWeeks === undefined) return
    refineWeeklyTemplateWeeks({ cycleWeeks: data.cycleWeeks, weeks: data.weeks }, ctx)
  })

export type UpdateWeeklyScheduleTemplateSchemaType = z.infer<
  typeof updateWeeklyScheduleTemplateSchema
>

export const applyWeeklyScheduleTemplateSchema = z
  .object({
    employeeIds: z.array(z.string().min(1)).min(1),
    validFrom: z
      .string()
      .refine((val) => !Number.isNaN(Date.parse(val)), { message: "Invalid date format" }),
    validTo: z
      .string()
      .refine((val) => !Number.isNaN(Date.parse(val)), { message: "Invalid date format" })
      .nullable()
      .optional(),
    generateShifts: z.boolean().optional(),
  })
  .strict()

export type ApplyWeeklyScheduleTemplateSchemaType = z.infer<
  typeof applyWeeklyScheduleTemplateSchema
>
