import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import type { useEmployeeWeeklyScheduleSection } from "@/hooks/employees/use-employee-weekly-schedule-section"

import { CalendarRange } from "lucide-react"
import { Controller } from "react-hook-form"

type WeeklyScheduleSectionState = ReturnType<typeof useEmployeeWeeklyScheduleSection>

interface EmployeeWeeklyScheduleSectionProps {
  section: WeeklyScheduleSectionState
  /** Hidden for PART_TIME — they use project Spent Time, not company weekly templates. */
  hidden?: boolean
}

/**
 * Weekly shift template picker in employee edit drawer.
 * PART_TIME employees skip this block — hours are tracked via project Spent Time instead.
 */
export function EmployeeWeeklyScheduleSection({
  section,
  hidden,
}: EmployeeWeeklyScheduleSectionProps) {
  if (hidden) return null

  const { form, activeTemplates, selectedTemplate, activeSchedule, isScheduleLoading } = section

  const {
    control,
    formState: { errors },
  } = form

  return (
    <section>
      <h3 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        Lịch làm việc hàng tuần
      </h3>
      <div className="border border-border rounded-xl p-4 bg-card space-y-4">
        <div className="flex items-start gap-3 rounded-lg bg-muted/30 p-3">
          <CalendarRange className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Chọn template ca xoay tuần cho nhân viên. Ca làm việc sẽ được sinh tự động theo cấu hình
            lịch tuần hệ thống.
          </p>
        </div>

        {isScheduleLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-9 w-full rounded-md" />
          </div>
        ) : (
          <>
            {activeSchedule?.templateId && selectedTemplate ? (
              <p className="text-xs text-muted-foreground">
                Đang áp dụng:{" "}
                <span className="font-medium text-foreground">{selectedTemplate.name}</span>
                {activeSchedule.cycleWeeks ? ` · ${activeSchedule.cycleWeeks} tuần/chu kỳ` : ""}
              </p>
            ) : activeSchedule && !activeSchedule.templateId ? (
              <p className="text-xs text-muted-foreground">
                Nhân viên có lịch thủ công, chưa gắn template.
              </p>
            ) : null}

            <div className="space-y-1.5">
              <Label htmlFor="weekly-template" className="text-[12px] text-muted-foreground">
                Template lịch tuần
              </Label>
              <Controller
                control={control}
                name="templateId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger
                      id="weekly-template"
                      className={`rounded-full bg-background ${errors.templateId ? "border-destructive" : ""}`}
                    >
                      <SelectValue placeholder="Chọn template" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeTemplates.length === 0 ? (
                        <SelectItem value="__none__" disabled>
                          Chưa có template đang hoạt động
                        </SelectItem>
                      ) : (
                        activeTemplates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name} ({template.cycleWeeks} tuần)
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.templateId ? (
                <p className="text-xs text-destructive">{errors.templateId.message}</p>
              ) : null}
            </div>

            {selectedTemplate ? (
              <p className="text-xs text-muted-foreground">
                Chu kỳ {selectedTemplate.cycleWeeks} tuần — ca được sinh tự động theo lịch hệ thống.
              </p>
            ) : null}
          </>
        )}
      </div>
    </section>
  )
}
