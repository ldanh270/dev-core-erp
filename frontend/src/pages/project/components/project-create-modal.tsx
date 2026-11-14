import { DatePicker } from "@/components/common"
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
import { projectApi } from "@/lib/api/project.api"
import { cn } from "@/lib/utils"
import { extractErrorMessage } from "@/utils/error-helper"

import React, { useState } from "react"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { CheckSquare, ChevronDown, Square } from "lucide-react"

export interface ProjectCreateModalProps {
  isOpen: boolean
  onClose: () => void
  trackersList: { key: string; label: string }[]
  employees: { id: string; fullName: string }[]
}

/**
 * ProjectCreateModal — Dialog modal for creating a new company project.
 * Encapsulates form states, tracker multi-selection, validation, and project mutation.
 */
export function ProjectCreateModal({
  isOpen,
  onClose,
  trackersList,
  employees,
}: ProjectCreateModalProps) {
  const queryClient = useQueryClient()

  // Form states
  const [newProjectName, setNewProjectName] = useState("")
  const [newProjectDesc, setNewProjectDesc] = useState("")
  const [newProjectTech, setNewProjectTech] = useState("")
  const [newProjectLeader, setNewProjectLeader] = useState("none")
  const [newProjectPolicy, setNewProjectPolicy] = useState("all_members")
  const [newProjectStart, setNewProjectStart] = useState("")
  const [newProjectEnd, setNewProjectEnd] = useState("")
  const [newProjectDealTarget, setNewProjectDealTarget] = useState("")
  const [newProjectTrackers, setNewProjectTrackers] = useState<string[]>([])
  const [createError, setCreateError] = useState<string | null>(null)
  const [isCreateDropdownOpen, setIsCreateDropdownOpen] = useState(false)

  const resetForm = () => {
    setNewProjectName("")
    setNewProjectDesc("")
    setNewProjectTech("")
    setNewProjectLeader("none")
    setNewProjectPolicy("all_members")
    setNewProjectStart("")
    setNewProjectEnd("")
    setNewProjectDealTarget("")
    setNewProjectTrackers([])
    setCreateError(null)
    setIsCreateDropdownOpen(false)
  }

  const createMutation = useMutation({
    mutationFn: async () => {
      const techStack = newProjectTech
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0)

      if (newProjectStart && newProjectEnd) {
        const start = new Date(newProjectStart)
        const end = new Date(newProjectEnd)
        if (start > end) {
          throw new Error("Ngày bắt đầu không được lớn hơn ngày kết thúc dự kiến")
        }
      }

      return projectApi.create({
        name: newProjectName,
        description: newProjectDesc.trim() || null,
        techStack,
        status: "planning",
        taskCreationPolicy: newProjectPolicy as (typeof TASK_CREATION_POLICIES)[number],
        startDate: newProjectStart || null,
        expectedEndDate: newProjectEnd || null,
        dealTargetPercent: newProjectDealTarget ? Number(newProjectDealTarget) : null,
        teamLeaderId: newProjectLeader === "none" ? null : newProjectLeader,
        allowedTaskTrackers: newProjectTrackers,
      })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["projects"] })
      resetForm()
      onClose()
    },
    onError: (err: unknown) => {
      setCreateError(extractErrorMessage(err))
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError(null)
    if (!newProjectName.trim()) {
      setCreateError("Vui lòng nhập tên dự án")
      return
    }
    createMutation.mutate()
  }

  const handleModalClose = () => {
    resetForm()
    onClose()
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          handleModalClose()
        }
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

          <div className="space-y-1.5 relative">
            <Label className={TYPOGRAPHY.FORM_LABEL}>Các loại yêu cầu được phép hoạt động</Label>
            <p className={cn(TYPOGRAPHY.FORM_HELPER, "mt-0.5 mb-2")}>
              Chỉ chọn các loại yêu cầu được phép tạo trong dự án này (để trống nếu cho phép tất
              cả).
            </p>

            {isCreateDropdownOpen && (
              <div
                className="fixed inset-0 z-40"
                onClick={() => {
                  setIsCreateDropdownOpen(false)
                }}
              />
            )}

            <div className="relative w-full">
              <button
                type="button"
                onClick={() => {
                  setIsCreateDropdownOpen(!isCreateDropdownOpen)
                }}
                className="w-full border border-border rounded-full px-3.5 py-[0.5625rem] bg-background flex items-center justify-between text-xs font-semibold cursor-pointer hover:bg-muted/30 text-foreground"
              >
                <span className="truncate">
                  {newProjectTrackers.length === 0
                    ? "Cho phép tất cả"
                    : newProjectTrackers
                        .map((k) => trackersList.find((t) => t.key === k)?.label || k)
                        .join(", ")}
                </span>
                <ChevronDown className="size-4 shrink-0 text-muted-foreground ml-1" />
              </button>

              {isCreateDropdownOpen && (
                <div className="absolute left-0 mt-1 w-full bg-popover border border-border rounded-xl p-3 shadow-lg z-50 space-y-2">
                  <div className="flex items-center justify-between border-b border-border pb-1.5 mb-1.5">
                    <span className="text-xs font-semibold text-muted-foreground">
                      Chọn loại công việc
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setNewProjectTrackers(trackersList.map((t) => t.key))
                        }}
                        className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                      >
                        Tất cả
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setNewProjectTrackers([])
                        }}
                        className="text-xs font-semibold text-muted-foreground hover:text-destructive hover:underline cursor-pointer"
                      >
                        Xóa tất cả
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 max-h-60 overflow-y-auto">
                    {trackersList.map((tracker) => {
                      const isChecked = newProjectTrackers.includes(tracker.key)
                      return (
                        <button
                          type="button"
                          key={tracker.key}
                          onClick={() => {
                            setNewProjectTrackers((prev) =>
                              prev.includes(tracker.key)
                                ? prev.filter((k) => k !== tracker.key)
                                : [...prev, tracker.key],
                            )
                          }}
                          className={`flex items-center gap-2 p-2 rounded-lg text-left transition-all duration-200 cursor-pointer ${
                            isChecked
                              ? "bg-primary/5 text-primary"
                              : "hover:bg-muted/40 text-foreground"
                          }`}
                        >
                          {isChecked ? (
                            <CheckSquare className="size-3.5 shrink-0 text-primary fill-primary/10" />
                          ) : (
                            <Square className="size-3.5 shrink-0 text-muted-foreground" />
                          )}
                          <span className="text-xs font-semibold leading-tight line-clamp-1">
                            {tracker.label}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="projLeader" className={TYPOGRAPHY.FORM_LABEL}>
                Trưởng nhóm (Team Leader)
              </Label>
              <Select
                value={newProjectLeader}
                onValueChange={(val) => {
                  setNewProjectLeader(val)
                }}
              >
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
              <Select
                value={newProjectPolicy}
                onValueChange={(val) => {
                  setNewProjectPolicy(val)
                }}
              >
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

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                handleModalClose()
              }}
              className="rounded-full"
              disabled={createMutation.isPending}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              className="rounded-full font-semibold"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? "Đang tạo..." : "Tạo dự án"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
