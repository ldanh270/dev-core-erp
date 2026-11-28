import { EntityFormPage } from "@/components/common"
import { BioTab } from "@/components/features/employees/wizard/BioTab"
import { EmployeeCreateConfirmDialog } from "@/components/features/employees/wizard/EmployeeCreateConfirmDialog"
import { EmployeeWizardNav } from "@/components/features/employees/wizard/EmployeeWizardNav"
import { FamilyTab } from "@/components/features/employees/wizard/FamilyTab"
import { JobTab } from "@/components/features/employees/wizard/JobTab"
import { ROUTES } from "@/config/routes.config"
import { useEmployeeCreateWizard } from "@/hooks/employees/useEmployeeCreateWizard"
import { routerNavigate } from "@/lib/router-navigator"

/**
 * Full-page multi-step wizard orchestrator for employee profile onboarding.
 * Thin declarative shell connecting useEmployeeCreateWizard with EntityFormPage.
 */
export default function EmployeeCreatePage() {
  const {
    activeTab,
    moveToTab,
    formData,
    updateField,

    addEducation,
    updateEducation,
    removeEducation,

    addExperience,
    updateExperience,
    removeExperience,

    addFamilyMember,
    updateFamilyMember,
    removeFamilyMember,

    isConfirmModalOpen,
    setIsConfirmModalOpen,
    handleNextTab,
    handleFinalSubmit,
    isSubmitting,
    hasAttemptedSubmit,
  } = useEmployeeCreateWizard()

  return (
    <EntityFormPage
      title="Tạo mới hồ sơ nhân sự"
      onBack={() => {
        routerNavigate(ROUTES.HRM.EMPLOYEES)
      }}
      onSubmit={handleNextTab}
      isPending={isSubmitting}
      submitLabel={activeTab === "family" ? "Lưu" : "Tiếp tục"}
      cancelLabel="Huỷ bỏ"
    >
      <div className="space-y-6">
        {/* Top Tab Bar Navigation - Pure prop delegation */}
        <EmployeeWizardNav activeTab={activeTab} onTabChange={moveToTab} />

        {/* Tab Contents */}
        {activeTab === "bio" && (
          <BioTab
            formData={formData}
            updateField={updateField}
            addEducation={addEducation}
            updateEducation={updateEducation}
            removeEducation={removeEducation}
            addExperience={addExperience}
            updateExperience={updateExperience}
            removeExperience={removeExperience}
            hasAttemptedSubmit={hasAttemptedSubmit}
          />
        )}

        {activeTab === "job" && (
          <JobTab
            formData={formData}
            updateField={updateField}
            hasAttemptedSubmit={hasAttemptedSubmit}
          />
        )}

        {activeTab === "family" && (
          <FamilyTab
            formData={formData}
            updateField={updateField}
            addFamilyMember={addFamilyMember}
            updateFamilyMember={updateFamilyMember}
            removeFamilyMember={removeFamilyMember}
          />
        )}
      </div>

      <EmployeeCreateConfirmDialog
        open={isConfirmModalOpen}
        onOpenChange={setIsConfirmModalOpen}
        isSubmitting={isSubmitting}
        onConfirm={handleFinalSubmit}
      />
    </EntityFormPage>
  )
}
