"use client"

import { BackButton, PageContainer } from "@/components/common"
import { Button } from "@/components/ui/button"
import { CreateApplicationInfoSection } from "@/components/features/application/CreateApplicationInfoSection"
import { CreateApplicationTimeSection } from "@/components/features/application/CreateApplicationTimeSection"
import { CreateApplicationRecruitmentSection } from "@/components/features/application/create-application-recruitment-section"
import { APPLICATION_TYPES, APPLICATION_TYPE_LABELS } from "@/config/entities/attendance.config"
import { ROUTES } from "@/config/routes.config"
import { useCreateApplicationForm } from "@/hooks/application/useCreateApplicationForm"
import { useAuthStore } from "@/store/auth-store"

import { Plus } from "lucide-react"
import { useNavigate, useParams } from "react-router-dom"

/** Renders the route-level application creation workflow. */
export default function CreateApplicationPage() {
  const navigate = useNavigate()
  const { type = "leave" } = useParams<{ type?: string }>()

  const { user } = useAuthStore()

  const {
    forms,
    addForm,
    removeForm,
    updateForm,
    assignedToId,
    setAssignedToId,
    approvers,
    employees,
    isSubmitting,
    handleSubmit,
  } = useCreateApplicationForm(type)

  const typeLabel =
    Object.entries(APPLICATION_TYPE_LABELS).find(([k]) => k === type)?.[1] || "đơn từ"

  const handleBack = () => {
    navigate(ROUTES.APPLICATION.BASE, { replace: true })
  }

  return (
    <PageContainer variant="centered" className="space-y-6">
      <div className="flex items-center">
        <BackButton onBack={handleBack} backHref={ROUTES.APPLICATION.BASE} />
      </div>

        {/* Section 1: Thông tin đơn */}
        <CreateApplicationInfoSection
          type={type}
          form={forms[0]}
          set={(k, v) => updateForm(0, k, v)}
          assignedToId={assignedToId}
          setAssignedToId={setAssignedToId}
          user={user}
          approvers={approvers}
        />

        {/* Section 2: Danh sách các đơn chi tiết */}
        {type !== APPLICATION_TYPES.RESIGNATION.LABEL && (
          <div className="space-y-6">
            {forms.map((form, index) =>
              type === APPLICATION_TYPES.RECRUITMENT.LABEL ? (
                <CreateApplicationRecruitmentSection
                  key={index}
                  formIndex={index}
                  onRemove={forms.length > 1 ? () => removeForm(index) : undefined}
                  form={form}
                  set={(k, v) => updateForm(index, k, v)}
                />
              ) : (
                <CreateApplicationTimeSection
                  key={index}
                  formIndex={index}
                  onRemove={forms.length > 1 ? () => removeForm(index) : undefined}
                  type={type}
                  form={form}
                  set={(k, v) => updateForm(index, k, v)}
                  employees={employees}
                />
              ),
            )}

            <div className="flex justify-center mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={addForm}
                className="rounded-full border-dashed border-primary px-6 text-xs font-semibold text-primary hover:bg-primary/5 shadow-none gap-2"
              >
                <Plus size={15} /> Thêm {typeLabel.toLowerCase()}
              </Button>
            </div>
          </div>
        )}

        <div className="mt-auto flex justify-end gap-3 pb-2 pt-6 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            className="rounded-full px-6 font-semibold shadow-xs"
          >
            Hủy
          </Button>
          <Button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              void handleSubmit()
            }}
            disabled={isSubmitting}
            className="rounded-full bg-primary px-8 font-semibold text-primary-foreground shadow-xs hover:bg-primary/90"
          >
            {isSubmitting ? "Đang gửi..." : `Gửi ${forms.length} đơn`}
          </Button>
        </div>
    </PageContainer>
  )
}
