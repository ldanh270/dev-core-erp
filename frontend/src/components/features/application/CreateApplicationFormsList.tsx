import { Button } from "@/components/ui/button"
import { CreateApplicationRecruitmentSection } from "@/components/features/application/create-application-recruitment-section"
import { CreateApplicationTimeSection } from "@/components/features/application/CreateApplicationTimeSection"
import { APPLICATION_TYPES } from "@/config/entities/attendance.config"
import type { ApplicationFormState } from "@/hooks/application/application-form.types"
import type { Employee } from "@/types/employee.types"
import { Plus } from "lucide-react"

interface CreateApplicationFormsListProps {
  type: string
  typeLabel: string
  forms: ApplicationFormState[]
  employees: Employee[]
  onAddForm: () => void
  onRemoveForm: (index: number) => void
  onUpdateForm: <K extends keyof ApplicationFormState>(
    index: number,
    key: K,
    value: ApplicationFormState[K],
  ) => void
}

/**
 * Presenter rendering dynamic list of multi-application forms and addition button.
 * Encapsulates recruitment vs time-based application sections and pill-styled add button.
 */
export function CreateApplicationFormsList({
  type,
  typeLabel,
  forms,
  employees,
  onAddForm,
  onRemoveForm,
  onUpdateForm,
}: CreateApplicationFormsListProps) {
  if (type === APPLICATION_TYPES.RESIGNATION.LABEL) {
    return null
  }

  return (
    <div className="space-y-6">
      {forms.map((form, index) =>
        type === APPLICATION_TYPES.RECRUITMENT.LABEL ? (
          <CreateApplicationRecruitmentSection
            key={index}
            formIndex={index}
            onRemove={forms.length > 1 ? () => onRemoveForm(index) : undefined}
            form={form}
            set={(k, v) => onUpdateForm(index, k, v)}
          />
        ) : (
          <CreateApplicationTimeSection
            key={index}
            formIndex={index}
            onRemove={forms.length > 1 ? () => onRemoveForm(index) : undefined}
            type={type}
            form={form}
            set={(k, v) => onUpdateForm(index, k, v)}
            employees={employees}
          />
        ),
      )}

      <div className="flex justify-center pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onAddForm}
          className="rounded-full border-dashed border-primary px-6 text-xs font-semibold text-primary hover:bg-primary/5 shadow-none gap-2 cursor-pointer"
        >
          <Plus className="size-4" /> Thêm {typeLabel.toLowerCase()}
        </Button>
      </div>
    </div>
  )
}
