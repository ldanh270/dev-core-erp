"use client"

import { EntityFormPage } from "@/components/common"
import { CreateApplicationFormsList } from "@/components/features/application/CreateApplicationFormsList"
import { CreateApplicationInfoSection } from "@/components/features/application/CreateApplicationInfoSection"
import { APPLICATION_TYPE_LABELS } from "@/config/entities/attendance.config"
import { ROUTES } from "@/config/routes.config"
import { useCreateApplicationForm } from "@/hooks/application/useCreateApplicationForm"
import { routerNavigate } from "@/lib/router-navigator"
import { useAuthStore } from "@/store/auth-store"
import { useParams } from "react-router-dom"

/**
 * Standardized CreateApplicationPage workflow.
 * Thin declarative composition shell powered by EntityFormPage layout.
 */
export default function CreateApplicationPage() {
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
    routerNavigate(ROUTES.APPLICATION.BASE, { replace: true })
  }

  return (
    <EntityFormPage
      title={`Tạo mới ${typeLabel.toLowerCase()}`}
      onBack={handleBack}
      onSubmit={() => void handleSubmit()}
      submitLabel={isSubmitting ? "Đang gửi..." : `Gửi ${forms.length} đơn`}
      isPending={isSubmitting}
      className="min-h-[calc(100vh-4rem)] bg-background"
    >
      <div className="space-y-6">
        <CreateApplicationInfoSection
          type={type}
          form={forms[0]}
          set={(k, v) => updateForm(0, k, v)}
          assignedToId={assignedToId}
          setAssignedToId={setAssignedToId}
          user={user}
          approvers={approvers}
        />

        <CreateApplicationFormsList
          type={type}
          typeLabel={typeLabel}
          forms={forms}
          employees={employees}
          onAddForm={addForm}
          onRemoveForm={removeForm}
          onUpdateForm={updateForm}
        />
      </div>
    </EntityFormPage>
  )
}
