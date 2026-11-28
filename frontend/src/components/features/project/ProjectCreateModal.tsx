import { DatePicker } from "@/components/common"
import { ProjectTrackerSelector } from "@/components/features/project/ProjectTrackerSelector"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { TASK_CREATION_POLICIES } from "@/config/entities/project.config"
import { CAPACITY_COPILOT_RULES } from "@/config/rules/capacity-copilot.config"
import { TYPOGRAPHY } from "@/config/typography.config"
import { useProjectCreateForm } from "@/hooks/project/use-project-create-form"

export interface ProjectCreateModalProps {
  isOpen: boolean
  onClose: () => void
  trackersList: { key: string; label: string }[]
  employees: { id: string; fullName: string }[]
}

function CreateProjectFields({
  newProjectName,
  setNewProjectName,
  newProjectDesc,
  setNewProjectDesc,
  newProjectStart,
  setNewProjectStart,
  newProjectEnd,
  setNewProjectEnd,
  newProjectDealTarget,
  setNewProjectDealTarget,
  newProjectTrackers,
  trackersList,
  isCreateDropdownOpen,
  setIsCreateDropdownOpen,
  toggleTracker,
  selectAllTrackers,
  clearAllTrackers,
  newProjectLeader,
  setNewProjectLeader,
  employees,
  newProjectPolicy,
  setNewProjectPolicy,
  newProjectTech,
  setNewProjectTech,
}: {
  newProjectName: string
  setNewProjectName: (v: string) => void
  newProjectDesc: string
  setNewProjectDesc: (v: string) => void
  newProjectStart: string
  setNewProjectStart: (v: string) => void
  newProjectEnd: string
  setNewProjectEnd: (v: string) => void
  newProjectDealTarget: string
  setNewProjectDealTarget: (v: string) => void
  newProjectTrackers: string[]
  trackersList: { key: string; label: string }[]
  isCreateDropdownOpen: boolean
  setIsCreateDropdownOpen: (v: boolean) => void
  toggleTracker: (key: string) => void
  selectAllTrackers: (keys: string[]) => void
  clearAllTrackers: () => void
  newProjectLeader: string
  setNewProjectLeader: (v: string) => void
  employees: { id: string; fullName: string }[]
  newProjectPolicy: string
  setNewProjectPolicy: (v: string) => void
  newProjectTech: string
  setNewProjectTech: (v: string) => void
}) {
  return (
    <>
      <div className="space-y-1.5">
        <Label htmlFor="projName" className={TYPOGRAPHY.FORM_LABEL}>
          Tên dự án <span className="text-destructive">*</span>
        </Label>
        <Input
          id="projName"
          placeholder="Nhập tên dự án..."
          value={newProjectName}
          onChange={(e) => {
            setNewProjectName(e.target.value)
          }}
          className="rounded-full bg-background border-border"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="projDesc" className={TYPOGRAPHY.FORM_LABEL}>
          Mô tả dự án
        </Label>
        <Textarea
          id="projDesc"
          placeholder="Nhập mô tả tóm tắt dự án..."
          value={newProjectDesc}
          onChange={(e) => {
            setNewProjectDesc(e.target.value)
          }}
          className="min-h-[80px] rounded-xl border-border p-3 text-sm focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="projStart" className={TYPOGRAPHY.FORM_LABEL}>
            Ngày bắt đầu
          </Label>
          <DatePicker
            id="projStart"
            value={newProjectStart || null}
            onChange={(val) => {
              setNewProjectStart(val || "")
            }}
            placeholder="Chọn ngày bắt đầu..."
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="projEnd" className={TYPOGRAPHY.FORM_LABEL}>
            Ngày dự kiến kết thúc
          </Label>
          <DatePicker
            id="projEnd"
            value={newProjectEnd || null}
            minDate={newProjectStart}
            onChange={(val) => {
              setNewProjectEnd(val || "")
            }}
            placeholder="Chọn ngày kết thúc..."
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="projDealTarget" className={TYPOGRAPHY.FORM_LABEL}>
          Cam kết tuần/milestone (Deal target %)
        </Label>
        <Input
          id="projDealTarget"
          type="number"
          min={CAPACITY_COPILOT_RULES.DEAL_TARGET_PERCENT_MIN}
          max={CAPACITY_COPILOT_RULES.DEAL_TARGET_PERCENT_MAX}
          placeholder={CAPACITY_COPILOT_RULES.DEAL_TARGET_PERCENT_PLACEHOLDER}
          value={newProjectDealTarget}
          onChange={(e) => {
            setNewProjectDealTarget(e.target.value)
          }}
          className="rounded-full bg-background border-border"
        />
        <p className={TYPOGRAPHY.FORM_HELPER}>
          Dùng cho Capacity Copilot để so sánh dự đoán tuần tới với cam kết khách hàng.
        </p>
      </div>

      <ProjectTrackerSelector
        trackersList={trackersList}
        selectedTrackers={newProjectTrackers}
        isOpen={isCreateDropdownOpen}
        onOpenChange={setIsCreateDropdownOpen}
        onToggleTracker={toggleTracker}
        onSelectAll={selectAllTrackers}
        onClearAll={clearAllTrackers}
      />

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="projLeader" className={TYPOGRAPHY.FORM_LABEL}>
            Trưởng nhóm (Team Leader)
          </Label>
          <Select value={newProjectLeader} onValueChange={setNewProjectLeader}>
            <SelectTrigger
              id="projLeader"
              className="w-full border-border rounded-full bg-background"
            >
              <SelectValue placeholder="Chọn Trưởng nhóm" />
            </SelectTrigger>
            <SelectContent position="popper" className="rounded-xl border-border bg-popover">
              <SelectItem value="none" className="rounded-lg">
                Không phân công
              </SelectItem>
              {employees.map((emp) => (
                <SelectItem key={emp.id} value={emp.id} className="rounded-lg">
                  {emp.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="projPolicy" className={TYPOGRAPHY.FORM_LABEL}>
            Quyền tạo công việc
          </Label>
          <Select value={newProjectPolicy} onValueChange={setNewProjectPolicy}>
            <SelectTrigger
              id="projPolicy"
              className="w-full border-border rounded-full bg-background"
            >
              <SelectValue placeholder="Chọn quyền" />
            </SelectTrigger>
            <SelectContent position="popper" className="rounded-xl border-border bg-popover">
              {TASK_CREATION_POLICIES.map((pol) => (
                <SelectItem key={pol} value={pol} className="rounded-lg">
                  {pol === "leader_only" ? "Chỉ trưởng nhóm (Leader)" : "Tất cả thành viên"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="projTech" className={TYPOGRAPHY.FORM_LABEL}>
          Công nghệ sử dụng (Tech Stack)
        </Label>
        <Input
          id="projTech"
          placeholder="Ví dụ: React, Node.js, TypeScript (Ngăn cách bằng dấu phẩy)"
          value={newProjectTech}
          onChange={(e) => {
            setNewProjectTech(e.target.value)
          }}
          className="rounded-full bg-background border-border"
        />
      </div>
    </>
  )
}

/** Modal dialog for provisioning new project entities. */
export function ProjectCreateModal({
  isOpen,
  onClose,
  trackersList,
  employees,
}: ProjectCreateModalProps) {
  const {
    newProjectName,
    setNewProjectName,
    newProjectDesc,
    setNewProjectDesc,
    newProjectTech,
    setNewProjectTech,
    newProjectLeader,
    setNewProjectLeader,
    newProjectPolicy,
    setNewProjectPolicy,
    newProjectStart,
    setNewProjectStart,
    newProjectEnd,
    setNewProjectEnd,
    newProjectDealTarget,
    setNewProjectDealTarget,
    newProjectTrackers,
    createError,
    isCreateDropdownOpen,
    setIsCreateDropdownOpen,
    isPending,
    handleSubmit,
    handleModalClose,
    toggleTracker,
    selectAllTrackers,
    clearAllTrackers,
  } = useProjectCreateForm({ onClose })

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleModalClose()
      }}
    >
      <DialogContent className="sm:max-w-[600px] rounded-xl bg-background border-border p-6 shadow-lg">
        <DialogHeader>
          <DialogTitle className={TYPOGRAPHY.MODAL_TITLE}>Tạo dự án mới</DialogTitle>
          <DialogDescription className={TYPOGRAPHY.MODAL_DESCRIPTION}>
            Nhập các thông tin chi tiết để thiết lập dự án mới trong phân hệ quản lý.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-3">
          {createError && (
            <div className="rounded-full bg-destructive/10 px-4 py-2 text-xs text-destructive font-medium border border-destructive/20">
              {createError}
            </div>
          )}

          <CreateProjectFields
            newProjectName={newProjectName}
            setNewProjectName={setNewProjectName}
            newProjectDesc={newProjectDesc}
            setNewProjectDesc={setNewProjectDesc}
            newProjectStart={newProjectStart}
            setNewProjectStart={setNewProjectStart}
            newProjectEnd={newProjectEnd}
            setNewProjectEnd={setNewProjectEnd}
            newProjectDealTarget={newProjectDealTarget}
            setNewProjectDealTarget={setNewProjectDealTarget}
            newProjectTrackers={newProjectTrackers}
            trackersList={trackersList}
            isCreateDropdownOpen={isCreateDropdownOpen}
            setIsCreateDropdownOpen={setIsCreateDropdownOpen}
            toggleTracker={toggleTracker}
            selectAllTrackers={selectAllTrackers}
            clearAllTrackers={clearAllTrackers}
            newProjectLeader={newProjectLeader}
            setNewProjectLeader={setNewProjectLeader}
            employees={employees}
            newProjectPolicy={newProjectPolicy}
            setNewProjectPolicy={setNewProjectPolicy}
            newProjectTech={newProjectTech}
            setNewProjectTech={setNewProjectTech}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleModalClose}
              className="rounded-full"
              disabled={isPending}
            >
              Hủy
            </Button>
            <Button type="submit" className="rounded-full font-semibold" disabled={isPending}>
              {isPending ? "Đang tạo..." : "Tạo dự án"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
