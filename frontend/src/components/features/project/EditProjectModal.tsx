import { DatePicker } from "@/components/common"
import { ProjectTrackersDropdown } from "@/components/features/project/ProjectTrackersDropdown"
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
import { PROJECT_STATUSES, TASK_CREATION_POLICIES } from "@/config/entities/project.config"
import { SELECT_NONE_VALUE, useEditProjectForm } from "@/hooks/project/use-edit-project-form"
import { useProjectTrackers } from "@/pages/project/hooks/use-project-tracker"
import type { Employee } from "@/types/employee.types"
import type { Project } from "@/types/project.types"
import type { ProjectTracker } from "@/types/project-tracker.types"
import type { Dispatch, SetStateAction } from "react"

const PROJECT_STATUS_LABELS = new Map<string, string>([
  ["planning", "Lên kế hoạch"],
  ["active", "Đang hoạt động"],
  ["on_hold", "Tạm dừng"],
  ["completed", "Hoàn thành"],
  ["cancelled", "Đã hủy"],
])

function EditProjectMetaSection({
  editProjectStatus,
  setEditProjectStatus,
  editProjectPolicy,
  setEditProjectPolicy,
  editProjectLeader,
  setEditProjectLeader,
  allEmployees,
}: {
  editProjectStatus: string
  setEditProjectStatus: (v: string) => void
  editProjectPolicy: string
  setEditProjectPolicy: (v: string) => void
  editProjectLeader: string
  setEditProjectLeader: (v: string) => void
  allEmployees: Employee[]
}) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="editProjStatus" className="text-xs font-semibold text-muted-foreground">
            Trạng thái
          </Label>
          <Select value={editProjectStatus} onValueChange={setEditProjectStatus}>
            <SelectTrigger
              id="editProjStatus"
              className="w-full h-10 border-border rounded-full px-4 bg-background"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" className="rounded-xl border-border bg-popover">
              {PROJECT_STATUSES.map((st) => (
                <SelectItem key={st} value={st} className="rounded-lg">
                  {PROJECT_STATUS_LABELS.get(st) || st}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="editProjPolicy" className="text-xs font-semibold text-muted-foreground">
            Ai được tạo task?
          </Label>
          <Select value={editProjectPolicy} onValueChange={setEditProjectPolicy}>
            <SelectTrigger
              id="editProjPolicy"
              className="w-full h-10 border-border rounded-full px-4 bg-background"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" className="rounded-xl border-border bg-popover">
              {TASK_CREATION_POLICIES.map((p) => (
                <SelectItem key={p} value={p} className="rounded-lg">
                  {p === "leader_only" ? "Chỉ trưởng nhóm" : "Tất cả thành viên"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="editProjLeader" className="text-xs font-semibold text-muted-foreground">
          Trưởng dự án (Team Leader)
        </Label>
        <Select value={editProjectLeader} onValueChange={setEditProjectLeader}>
          <SelectTrigger
            id="editProjLeader"
            className="w-full h-10 border-border rounded-full px-4 bg-background"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper" className="rounded-xl border-border bg-popover">
            <SelectItem value={SELECT_NONE_VALUE} className="rounded-lg">
              Chưa phân công
            </SelectItem>
            {allEmployees.map((emp) => (
              <SelectItem key={emp.id} value={emp.id} className="rounded-lg">
                {emp.fullName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  )
}

function EditProjectDatesSection({
  editProjectDealTarget,
  editProjectStart,
  setEditProjectStart,
  editProjectEnd,
  setEditProjectEnd,
}: {
  editProjectDealTarget: string
  editProjectStart: string
  setEditProjectStart: (v: string) => void
  editProjectEnd: string
  setEditProjectEnd: (v: string) => void
}) {
  return (
    <>
      <div className="space-y-1.5">
        <Label htmlFor="editProjDealTarget" className="text-xs font-semibold text-muted-foreground">
          Cam kết tuần/milestone (Deal target %)
        </Label>
        <Input
          id="editProjDealTarget"
          type="number"
          value={editProjectDealTarget}
          readOnly
          className="h-10 cursor-not-allowed rounded-full border-border bg-muted/40 px-4 text-sm text-muted-foreground"
        />
        <p className="text-[10px] text-muted-foreground">
          Deal đã chốt với khách hàng nên không chỉnh sửa tại đây.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="editProjStart" className="text-xs font-semibold text-muted-foreground">
            Ngày bắt đầu
          </Label>
          <DatePicker
            id="editProjStart"
            value={editProjectStart || null}
            onChange={(val) => {
              setEditProjectStart(val || "")
            }}
            placeholder="Chọn ngày bắt đầu..."
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="editProjEnd" className="text-xs font-semibold text-muted-foreground">
            Ngày kết thúc dự kiến
          </Label>
          <DatePicker
            id="editProjEnd"
            value={editProjectEnd || null}
            minDate={editProjectStart}
            onChange={(val) => {
              setEditProjectEnd(val || "")
            }}
            placeholder="Chọn ngày kết thúc..."
          />
        </div>
      </div>
    </>
  )
}

function EditProjectFields({
  editProjectName,
  setEditProjectName,
  editProjectDesc,
  setEditProjectDesc,
  editProjectStatus,
  setEditProjectStatus,
  editProjectPolicy,
  setEditProjectPolicy,
  editProjectLeader,
  setEditProjectLeader,
  editProjectStart,
  setEditProjectStart,
  editProjectEnd,
  setEditProjectEnd,
  editProjectDealTarget,
  allEmployees,
  projectId,
  trackers,
  editProjectTrackers,
  setEditProjectTrackers,
  tempTrackers,
  setTempTrackers,
  isDropdownOpen,
  setIsDropdownOpen,
  editProjectError,
}: {
  editProjectName: string
  setEditProjectName: (v: string) => void
  editProjectDesc: string
  setEditProjectDesc: (v: string) => void
  editProjectStatus: string
  setEditProjectStatus: (v: string) => void
  editProjectPolicy: string
  setEditProjectPolicy: (v: string) => void
  editProjectLeader: string
  setEditProjectLeader: (v: string) => void
  editProjectStart: string
  setEditProjectStart: (v: string) => void
  editProjectEnd: string
  setEditProjectEnd: (v: string) => void
  editProjectDealTarget: string
  allEmployees: Employee[]
  projectId: string
  trackers: ProjectTracker[]
  editProjectTrackers: string[]
  setEditProjectTrackers: (v: string[]) => void
  tempTrackers: string[]
  setTempTrackers: Dispatch<SetStateAction<string[]>>
  isDropdownOpen: boolean
  setIsDropdownOpen: (v: boolean) => void
  editProjectError: string | null
}) {
  return (
    <>
      {editProjectError && (
        <div className="rounded-full bg-destructive/10 px-4 py-2 text-xs text-destructive font-medium border border-destructive/20">
          {editProjectError}
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="editProjName" className="text-xs font-semibold text-muted-foreground">
          Tên dự án <span className="text-destructive">*</span>
        </Label>
        <Input
          id="editProjName"
          value={editProjectName}
          onChange={(e) => {
            setEditProjectName(e.target.value)
          }}
          className="h-10 text-sm border-border rounded-full px-4"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="editProjDesc" className="text-xs font-semibold text-muted-foreground">
          Mô tả dự án
        </Label>
        <Textarea
          id="editProjDesc"
          value={editProjectDesc}
          onChange={(e) => {
            setEditProjectDesc(e.target.value)
          }}
          className="min-h-[80px] rounded-xl border-border p-3 text-sm focus-visible:ring-1 focus-visible:ring-ring"
          placeholder="Mô tả ngắn gọn về dự án..."
        />
      </div>

      <EditProjectMetaSection
        editProjectStatus={editProjectStatus}
        setEditProjectStatus={setEditProjectStatus}
        editProjectPolicy={editProjectPolicy}
        setEditProjectPolicy={setEditProjectPolicy}
        editProjectLeader={editProjectLeader}
        setEditProjectLeader={setEditProjectLeader}
        allEmployees={allEmployees}
      />

      <ProjectTrackersDropdown
        projectId={projectId}
        trackers={trackers}
        selectedTrackers={editProjectTrackers}
        onApplyTrackers={setEditProjectTrackers}
        tempTrackers={tempTrackers}
        setTempTrackers={setTempTrackers}
        isOpen={isDropdownOpen}
        onOpenChange={setIsDropdownOpen}
      />

      <EditProjectDatesSection
        editProjectDealTarget={editProjectDealTarget}
        editProjectStart={editProjectStart}
        setEditProjectStart={setEditProjectStart}
        editProjectEnd={editProjectEnd}
        setEditProjectEnd={setEditProjectEnd}
      />
    </>
  )
}

export interface EditProjectModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  project: Project
  allEmployees: Employee[]
}

/** Modal dialog for editing project configuration, team leader, and trackers. */
export function EditProjectModal({
  isOpen,
  onOpenChange,
  projectId,
  project,
  allEmployees,
}: EditProjectModalProps) {
  const { data: trackers = [] } = useProjectTrackers(projectId)

  const {
    editProjectName,
    setEditProjectName,
    editProjectDesc,
    setEditProjectDesc,
    editProjectStatus,
    setEditProjectStatus,
    editProjectPolicy,
    setEditProjectPolicy,
    editProjectLeader,
    setEditProjectLeader,
    editProjectStart,
    setEditProjectStart,
    editProjectEnd,
    setEditProjectEnd,
    editProjectDealTarget,
    editProjectTrackers,
    setEditProjectTrackers,
    tempTrackers,
    setTempTrackers,
    editProjectError,
    isDropdownOpen,
    setIsDropdownOpen,
    isPending,
    handleSubmit,
    handleClose,
  } = useEditProjectForm({
    isOpen,
    onOpenChange,
    projectId,
    project,
    trackers,
  })

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose()
        else onOpenChange(true)
      }}
    >
      <DialogContent className="sm:max-w-[550px] rounded-xl bg-background border-border p-6 shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-foreground">Chỉnh sửa dự án</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Cập nhật thông tin và cấu hình cho dự án này.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-3">
          <EditProjectFields
            editProjectName={editProjectName}
            setEditProjectName={setEditProjectName}
            editProjectDesc={editProjectDesc}
            setEditProjectDesc={setEditProjectDesc}
            editProjectStatus={editProjectStatus}
            setEditProjectStatus={setEditProjectStatus}
            editProjectPolicy={editProjectPolicy}
            setEditProjectPolicy={setEditProjectPolicy}
            editProjectLeader={editProjectLeader}
            setEditProjectLeader={setEditProjectLeader}
            editProjectStart={editProjectStart}
            setEditProjectStart={setEditProjectStart}
            editProjectEnd={editProjectEnd}
            setEditProjectEnd={setEditProjectEnd}
            editProjectDealTarget={editProjectDealTarget}
            allEmployees={allEmployees}
            projectId={projectId}
            trackers={trackers}
            editProjectTrackers={editProjectTrackers}
            setEditProjectTrackers={setEditProjectTrackers}
            tempTrackers={tempTrackers}
            setTempTrackers={setTempTrackers}
            isDropdownOpen={isDropdownOpen}
            setIsDropdownOpen={setIsDropdownOpen}
            editProjectError={editProjectError}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="h-10 rounded-full px-5 text-sm"
              disabled={isPending}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              className="h-10 rounded-full px-5 text-sm bg-primary text-primary-foreground hover:bg-primary/95"
              disabled={isPending}
            >
              {isPending ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
