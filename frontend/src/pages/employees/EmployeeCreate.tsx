import { EntityFormPage } from "@/components/common"
import { BioTab } from "@/components/features/employees/wizard/BioTab"
import { FamilyTab } from "@/components/features/employees/wizard/FamilyTab"
import { JobTab } from "@/components/features/employees/wizard/JobTab"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useEmployeeCreateWizard } from "@/hooks/employees/useEmployeeCreateWizard"
import { routerNavigate } from "@/lib/router-navigator"
import { HelpCircle } from "lucide-react"

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
      onBack={() => routerNavigate("/hrm/employees")}
      onSubmit={handleNextTab}
      isPending={isSubmitting}
      submitLabel={activeTab === "family" ? "Lưu" : "Tiếp tục"}
      cancelLabel="Huỷ bỏ"
    >
      <div className="space-y-6">
        {/* Top Tab Bar Navigation */}
        <div className="border border-border rounded-full bg-card overflow-hidden p-1 flex items-center gap-1 shadow-none">
          <button
            type="button"
            onClick={() => moveToTab("bio")}
            className={`flex-1 py-2 px-5 text-sm font-medium rounded-full transition-all text-center ${
              activeTab === "bio"
                ? "bg-primary text-primary-foreground shadow-none font-semibold"
                : "text-muted-foreground hover:bg-muted/50"
            }`}
          >
            Sơ yếu lý lịch
          </button>
          <button
            type="button"
            onClick={() => moveToTab("job")}
            className={`flex-1 py-2 px-5 text-sm font-medium rounded-full transition-all text-center ${
              activeTab === "job"
                ? "bg-primary text-primary-foreground shadow-none font-semibold"
                : "text-muted-foreground hover:bg-muted/50"
            }`}
          >
            Công việc
          </button>
          <button
            type="button"
            onClick={() => moveToTab("family")}
            className={`flex-1 py-2 px-5 text-sm font-medium rounded-full transition-all text-center ${
              activeTab === "family"
                ? "bg-primary text-primary-foreground shadow-none font-semibold"
                : "text-muted-foreground hover:bg-muted/50"
            }`}
          >
            Thành viên gia đình
          </button>
        </div>

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

      {/* Confirmation Modal */}
      <Dialog open={isConfirmModalOpen} onOpenChange={setIsConfirmModalOpen}>
        <DialogContent className="sm:max-w-[420px] rounded-xl text-center">
          <DialogHeader className="items-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-2">
              <HelpCircle size={28} />
            </div>
            <DialogTitle className="text-center font-bold text-lg">Xác nhận</DialogTitle>
            <DialogDescription className="text-center text-sm text-muted-foreground pt-1">
              Xác nhận tạo mới nhân sự
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex sm:justify-center gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsConfirmModalOpen(false)}
              className="rounded-full min-w-24"
              disabled={isSubmitting}
            >
              Đóng
            </Button>
            <Button
              type="button"
              onClick={handleFinalSubmit}
              className="rounded-full min-w-24 bg-primary text-primary-foreground"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Đang xử lý..." : "Đồng ý"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </EntityFormPage>
  )
}
