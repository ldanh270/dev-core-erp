"use client"

import { CreateApplicationInfoSection } from "@/components/features/application/CreateApplicationInfoSection"
import { CreateApplicationTimeSection } from "@/components/features/application/CreateApplicationTimeSection"
import { CreateApplicationRecruitmentSection } from "@/components/features/application/create-application-recruitment-section"
import { APPLICATION_TYPES, APPLICATION_TYPE_LABELS } from "@/config/entities/attendance.config"
import { ROUTES } from "@/config/routes.config"
import { useCreateApplicationForm } from "@/hooks/application/useCreateApplicationForm"
import { useAuthStore } from "@/store/auth-store"

import { ArrowLeft, Plus } from "lucide-react"
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
    <div className="min-h-full w-full bg-background animate-in fade-in duration-300">
      <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col gap-6 p-6 md:p-8">
        <button
          onClick={handleBack}
          aria-label="Quay lại danh sách đơn thư"
          className="flex h-10 w-10 shrink-0 items-center justify-center self-start rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <ArrowLeft size={20} />
        </button>

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
              <button
                onClick={addForm}
                className="flex h-10 items-center gap-2 rounded-full border border-dashed border-primary px-6 text-xs font-semibold text-primary transition-colors hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                <Plus size={15} /> Thêm {typeLabel.toLowerCase()}
              </button>
            </div>
          </div>
        )}

        <div className="mt-auto flex justify-end gap-3 pb-2 pt-6">
          <button
            onClick={handleBack}
            className="h-10 rounded-full border border-input px-6 text-xs font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Hủy
          </button>
          <button
            onClick={(e) => {
              e.preventDefault()
              void handleSubmit()
            }}
            disabled={isSubmitting}
            className="h-10 rounded-full bg-primary px-6 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50"
          >
            {isSubmitting ? "Đang gửi..." : `Gửi ${forms.length} đơn`}
          </button>
        </div>
      </div>
    </div>
  )
}
