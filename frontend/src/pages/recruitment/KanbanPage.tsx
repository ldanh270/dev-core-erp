import { ApplicationDetailPanel } from "@/components/features/recruitment/application-detail-panel"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { usePermission } from "@/hooks/use-permission"
import { routerNavigate } from "@/lib/router-navigator"
import type { KanbanApplication, RecruitmentPipelineStage } from "@/types/recruitment.types"

import { useState } from "react"
import type { DragEventHandler, FormEventHandler } from "react"

import { format } from "date-fns"
import {
  AlertCircle,
  Calendar,
  Check,
  FolderKanban,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Sparkles,
} from "lucide-react"
import { useSearchParams } from "react-router-dom"

import { POSTING_STAGE_COLORS, usePostingKanban } from "./hooks/use-posting-kanban"
import { useRequisitionKanban } from "./hooks/use-requisition-kanban"

interface KanbanPageProps {
  postingId?: string
  requisitionId?: string
  embedded?: boolean
}

export default function KanbanPage({
  postingId: givenPostingId,
  requisitionId = "",
  embedded = false,
}: KanbanPageProps) {
  const [searchParams] = useSearchParams()
  const postingId = givenPostingId ?? searchParams.get("postingId") ?? ""
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null)
  const { hasPermission } = usePermission()
  const postingBoard = usePostingKanban(postingId, hasPermission("recruitment.posting.manage"))
  const requisitionBoard = useRequisitionKanban(
    requisitionId,
    hasPermission("recruitment.posting.manage"),
  )
  const board = requisitionId ? requisitionBoard : postingBoard
  const {
    canManageStages,
    statuses,
    tasks,
    isLoadingStatuses,
    isLoadingTasks,
    isError,
    refetch,
    isAddColumnOpen,
    setIsAddColumnOpen,
    isEditColumnOpen,
    setIsEditColumnOpen,
    isDeleteConfirmOpen,
    setIsDeleteConfirmOpen,
    columnName,
    setColumnName,
    columnColor,
    setColumnColor,
    columnIsCompleted,
    setColumnIsCompleted,
    columnIsDefault,
    setColumnIsDefault,
    selectedColumn,
    setSelectedColumn,
    fallbackColumnId,
    setFallbackColumnId,
    dragOverInfo,
    setDragOverInfo,
    draggingTaskId,
    draggingColumnId,
    dragOverColumnId,
    setDragOverColumnId,
    createStatusMutation,
    updateStatusMutation,
    deleteStatusMutation,
    moveTaskMutation,
    resetForm,
    handleDragStart,
    handleDragEnd,
    handleCardDragOver,
    handleCardDrop,
    handleDrop,
    handleColumnDragStart,
    handleColumnDragEnd,
    handleColumnDragOver,
    handleColumnDrop,
  } = board

  if (!postingId && !requisitionId)
    return (
      <p className="p-6 text-sm text-muted-foreground">
        Chọn một yêu cầu tuyển dụng để xem Kanban.
      </p>
    )
  if (isLoadingStatuses || isLoadingTasks) return <LoadingBoard />
  if (isError)
    return (
      <div className="container space-y-3 p-8" role="alert">
        <p className="font-semibold text-destructive">Không tải được bảng Kanban.</p>
        <p className="text-sm text-muted-foreground">Kiểm tra kết nối rồi thử lại.</p>
        <Button variant="outline" className="rounded-full" onClick={refetch}>
          Thử lại
        </Button>
      </div>
    )

  const applicationsByStageMap = new Map<string, KanbanApplication[]>()
  statuses.forEach((stage) => applicationsByStageMap.set(stage.id, []))
  const defaultStage = statuses.find((stage) => stage.isDefault) ?? statuses[0]
  tasks.forEach((application) => {
    const stageId = application.pipelineStage?.id
    if (stageId && applicationsByStageMap.has(stageId)) {
      applicationsByStageMap.get(stageId)?.push(application)
    } else if (defaultStage && applicationsByStageMap.has(defaultStage.id)) {
      applicationsByStageMap.get(defaultStage.id)?.push(application)
    }
  })

  return (
    <div className={embedded ? "space-y-6" : "container space-y-6 px-3 py-4 sm:px-6 sm:py-6"}>
      <div className="flex flex-col gap-4 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-primary/10 p-2 text-primary">
            <FolderKanban className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Kanban Board</h3>
            <p className="text-xs text-muted-foreground">Kéo thả để cập nhật tiến độ ứng viên</p>
          </div>
        </div>
        {canManageStages && (
          <Button
            onClick={() => {
              resetForm()
              setIsAddColumnOpen(true)
            }}
            className="self-start rounded-full px-4 text-xs font-bold shadow-sm sm:self-auto"
          >
            <Plus className="mr-1 size-3.5" />
            Thêm cột trạng thái
          </Button>
        )}
      </div>

      <div className="flex min-h-[500px] select-none items-start gap-5 overflow-x-auto pb-6">
        {statuses.map((stage) => {
          const applications = applicationsByStageMap.get(stage.id) ?? []
          return (
            <div
              key={stage.id}
              onDragOver={(event) => {
                if (draggingColumnId) handleColumnDragOver(event, stage.id)
                else event.preventDefault()
              }}
              onDragLeave={() => {
                if (draggingColumnId) setDragOverColumnId(null)
                else setDragOverInfo(null)
              }}
              onDrop={(event) => {
                if (canManageStages) {
                  if (draggingColumnId) handleColumnDrop(event, stage.id)
                  else handleDrop(event, stage.id)
                }
              }}
              className={`flex max-h-[700px] w-[290px] shrink-0 flex-col rounded-xl border border-border/60 bg-secondary/30 transition-all duration-200 hover:bg-secondary/40 ${draggingColumnId === stage.id ? "scale-[0.98] border-dashed border-muted-foreground/50 opacity-45" : ""} ${dragOverColumnId === stage.id ? "border-primary bg-primary/5 ring-2 ring-primary/20" : ""}`}
            >
              <div
                draggable={canManageStages}
                onDragStart={(event) => {
                  handleColumnDragStart(event, stage.id)
                }}
                onDragEnd={handleColumnDragEnd}
                className={`flex items-center justify-between border-b border-border/50 p-3.5 ${canManageStages ? "cursor-grab rounded-t-xl transition-colors hover:bg-secondary/20 active:cursor-grabbing" : ""}`}
              >
                <div className="flex max-w-[200px] items-center gap-2">
                  <span
                    className="size-3 shrink-0 rounded-full shadow-sm"
                    style={{ backgroundColor: stage.color }}
                  />
                  <span className="truncate text-sm font-bold text-foreground">{stage.name}</span>
                  <Badge
                    variant="outline"
                    className="rounded-full border-border/80 bg-background/50 px-1.5 py-0 text-[10px] font-bold"
                  >
                    {applications.length}
                  </Badge>
                </div>
                {canManageStages && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="cursor-pointer rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground">
                        <MoreHorizontal className="size-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="rounded-xl border-border bg-popover"
                    >
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedColumn(stage)
                          setColumnName(stage.name)
                          setColumnColor(stage.color)
                          setColumnIsCompleted(stage.isCompleted)
                          setColumnIsDefault(stage.isDefault)
                          setIsEditColumnOpen(true)
                        }}
                        className="cursor-pointer rounded-lg text-xs font-semibold"
                      >
                        Cấu hình cột
                      </DropdownMenuItem>
                      {!stage.isDefault && statuses.length > 1 && (
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedColumn(stage)
                            setFallbackColumnId(
                              statuses.find((item) => item.id !== stage.id)?.id ?? "",
                            )
                            setIsDeleteConfirmOpen(true)
                          }}
                          className="cursor-pointer rounded-lg text-xs font-semibold text-destructive"
                        >
                          Xóa cột
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              <div
                className="min-h-[150px] flex-1 space-y-3 overflow-y-auto p-2.5 scrollbar-thin"
                onDragOver={(event) => {
                  if (canManageStages && !draggingColumnId) event.preventDefault()
                }}
                onDrop={(event) => {
                  if (canManageStages && !draggingColumnId) handleDrop(event, stage.id)
                }}
              >
                {applications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border/40 py-10 text-center">
                    <Sparkles className="mb-1 size-5 text-muted-foreground/30" />
                    <p className="text-[10px] font-medium text-muted-foreground/60">
                      Không có ứng viên
                    </p>
                  </div>
                ) : (
                  applications.map((application) => (
                    <div className="relative" key={application.id}>
                      {dragOverInfo?.taskId === application.id &&
                        dragOverInfo.position === "top" && <DropIndicator className="mb-1" />}
                      <CandidateCard
                        application={application}
                        stages={statuses}
                        canManageStages={canManageStages}
                        isMoving={moveTaskMutation.isPending}
                        onMove={(statusId) => {
                          moveTaskMutation.mutate({ taskId: application.id, statusId })
                        }}
                        isDragging={draggingTaskId === application.id}
                        draggable={canManageStages}
                        onDragStart={(event) => {
                          handleDragStart(event, application)
                        }}
                        onDragEnd={handleDragEnd}
                        onDragOver={(event) => {
                          handleCardDragOver(event, application.id)
                        }}
                        onDragLeave={() => {
                          setDragOverInfo(null)
                        }}
                        onDrop={(event) => {
                          handleCardDrop(event, application)
                        }}
                        onClick={() => {
                          routerNavigate(`/recruitment/applications/${application.id}`)
                        }}
                      />
                      {dragOverInfo?.taskId === application.id &&
                        dragOverInfo.position === "bottom" && <DropIndicator className="mt-1" />}
                    </div>
                  ))
                )}
              </div>
            </div>
          )
        })}
        {canManageStages && (
          <div
            onClick={() => {
              resetForm()
              setIsAddColumnOpen(true)
            }}
            className="group flex h-[150px] w-[290px] shrink-0 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/80 text-muted-foreground transition-all hover:border-primary/60 hover:bg-secondary/10 hover:text-primary"
          >
            <Plus className="mb-2 size-6 text-muted-foreground/60 transition-colors group-hover:text-primary" />
            <span className="text-xs font-bold">Thêm cột trạng thái</span>
          </div>
        )}
      </div>

      <StageDialog
        open={isAddColumnOpen}
        onOpenChange={setIsAddColumnOpen}
        title="Tạo cột trạng thái"
        submitLabel="Tạo cột"
        onSubmit={(event) => {
          event.preventDefault()
          if (columnName.trim()) createStatusMutation.mutate()
        }}
        name={columnName}
        setName={setColumnName}
        color={columnColor}
        setColor={setColumnColor}
        completed={columnIsCompleted}
        setCompleted={setColumnIsCompleted}
        isDefault={columnIsDefault}
        setDefault={setColumnIsDefault}
        pending={createStatusMutation.isPending}
      />
      <StageDialog
        open={isEditColumnOpen}
        onOpenChange={setIsEditColumnOpen}
        title="Cấu hình cột trạng thái"
        submitLabel="Lưu cấu hình"
        onSubmit={(event) => {
          event.preventDefault()
          if (selectedColumn && columnName.trim()) updateStatusMutation.mutate()
        }}
        name={columnName}
        setName={setColumnName}
        color={columnColor}
        setColor={setColumnColor}
        completed={columnIsCompleted}
        setCompleted={setColumnIsCompleted}
        isDefault={columnIsDefault}
        setDefault={setColumnIsDefault}
        defaultDisabled={selectedColumn?.isDefault}
        pending={updateStatusMutation.isPending}
      />
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="max-w-sm rounded-2xl border-border bg-popover">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-destructive">
              <AlertCircle className="size-4" />
              Xóa cột trạng thái?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2 text-xs">
            <p className="leading-relaxed text-muted-foreground">
              Bạn đang yêu cầu xóa trạng thái{" "}
              <span className="font-bold text-foreground">“{selectedColumn?.name}”</span>. Các ứng
              viên thuộc cột này sẽ được chuyển sang cột thay thế.
            </p>
            <div className="space-y-2 rounded-xl border border-border/50 bg-secondary/35 p-3.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <RefreshCw className="mr-1 inline size-3" />
                Chuyển ứng viên hiện tại sang cột:
              </Label>
              <Select value={fallbackColumnId} onValueChange={setFallbackColumnId}>
                <SelectTrigger className="h-9 rounded-full border-border bg-background text-xs">
                  <SelectValue placeholder="Chọn cột thay thế..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border bg-popover">
                  {statuses
                    .filter((stage) => stage.id !== selectedColumn?.id)
                    .map((stage) => (
                      <SelectItem
                        key={stage.id}
                        value={stage.id}
                        className="rounded-lg text-xs font-semibold"
                      >
                        {stage.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsDeleteConfirmOpen(false)
              }}
              className="h-9 rounded-full text-xs"
            >
              Hủy
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                deleteStatusMutation.mutate()
              }}
              disabled={deleteStatusMutation.isPending || !fallbackColumnId}
              className="h-9 rounded-full px-4 text-xs font-bold"
            >
              Xác nhận xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ApplicationDetailPanel
        open={Boolean(selectedApplicationId)}
        onOpenChange={(open) => {
          if (!open) setSelectedApplicationId(null)
        }}
        applicationId={selectedApplicationId}
      />
    </div>
  )
}

function CandidateCard({
  application,
  stages,
  canManageStages,
  isMoving,
  onMove,
  isDragging,
  draggable,
  onClick,
  ...events
}: {
  application: KanbanApplication
  stages: RecruitmentPipelineStage[]
  canManageStages: boolean
  isMoving: boolean
  onMove: (stageId: string) => void
  isDragging: boolean
  draggable: boolean
  onClick?: () => void
  onDragStart: DragEventHandler
  onDragEnd: DragEventHandler
  onDragOver: DragEventHandler
  onDragLeave: DragEventHandler
  onDrop: DragEventHandler
}) {
  const isInterviewStage =
    application.pipelineStage?.name?.toLowerCase().includes("phỏng vấn") ||
    application.pipelineStage?.name?.toLowerCase().includes("interview")
  const latestRound = application.interviewRounds?.[application.interviewRounds.length - 1]
  const completedRounds =
    application.interviewRounds?.filter((round) => round.status === "completed").length ?? 0

  return (
    <div
      draggable={draggable}
      onClick={onClick}
      {...events}
      className={`group/card space-y-3 rounded-xl border border-border/80 bg-card p-3.5 shadow-sm transition-all hover:border-primary/40 hover:shadow-md ${draggable ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"} ${isDragging ? "scale-[0.98] opacity-40" : ""}`}
    >
      <div className="flex items-center justify-between gap-2">
        <Badge
          variant="outline"
          className="rounded-full px-1.5 py-0 text-[9px] font-bold uppercase"
        >
          {application.source}
        </Badge>

        {/* Link directly to Interview Rounds Tab in Candidate Details */}
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            routerNavigate(`/recruitment/applications/${application.id}?tab=interviews`)
          }}
          className="transition-transform hover:scale-105 focus:outline-none"
          title="Xem chi tiết các vòng phỏng vấn"
        >
          <Badge
            variant="outline"
            className={`rounded-full px-2 py-0 text-[9px] font-bold flex items-center gap-1 cursor-pointer transition-colors ${
              latestRound?.result === "pass"
                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/20"
                : isInterviewStage
                  ? "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
                  : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
            }`}
          >
            <Calendar className="size-2.5" />
            {latestRound
              ? `Vòng ${latestRound.roundNumber}: ${
                  latestRound.result === "pass"
                    ? "Pass"
                    : latestRound.result === "fail"
                      ? "Fail"
                      : latestRound.status === "completed"
                        ? "Đã xong"
                        : "Chờ PV"
                }`
              : `${completedRounds} vòng PV`}
          </Badge>
        </button>
      </div>

      <div>
        <p className="line-clamp-2 text-xs font-bold text-foreground transition-colors group-hover/card:text-primary">
          {application.candidate.fullName}
        </p>
        <p className="mt-1 truncate text-[10px] text-muted-foreground">
          {application.candidate.email}
        </p>
      </div>

      {/* When in an interview stage, render schedule & interviewer preview */}
      {isInterviewStage && latestRound && (
        <div className="rounded-lg bg-secondary/35 p-2 text-[10px] space-y-1 border border-border/40">
          <div className="flex items-center justify-between font-medium text-foreground">
            <span className="truncate font-semibold">{latestRound.title}</span>
            <span className="font-mono text-muted-foreground shrink-0 ml-1">
              {latestRound.scheduledAt
                ? format(new Date(latestRound.scheduledAt), "HH:mm, dd/MM")
                : "Chờ xếp lịch"}
            </span>
          </div>
          {latestRound.interviewers && latestRound.interviewers.length > 0 && (
            <div className="flex items-center gap-1 text-muted-foreground truncate">
              <span>PV:</span>
              <span className="font-semibold text-foreground truncate">
                {latestRound.interviewers.map((i: { fullName: string }) => i.fullName).join(", ")}
              </span>
            </div>
          )}
        </div>
      )}

      {canManageStages && (
        <div
          onPointerDown={(event) => {
            event.stopPropagation()
          }}
          onClick={(event) => {
            event.stopPropagation()
          }}
        >
          <Label className="sr-only" htmlFor={`move-stage-${application.id}`}>
            Chuyển {application.candidate.fullName} sang giai đoạn khác
          </Label>
          <Select
            value={application.pipelineStage?.id ?? ""}
            onValueChange={onMove}
            disabled={isMoving}
          >
            <SelectTrigger id={`move-stage-${application.id}`} className="h-9 rounded-full text-xs">
              <SelectValue placeholder="Chuyển giai đoạn" />
            </SelectTrigger>
            <SelectContent>
              {stages.map((stage) => (
                <SelectItem key={stage.id} value={stage.id}>
                  {stage.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex items-center justify-between gap-2 border-t border-border/40 pt-2 text-[10px]">
        <span className="font-mono font-semibold text-muted-foreground/80">
          #{application.id.substring(0, 5)}
        </span>
        <span className="truncate font-semibold text-foreground">
          {application.assignedTo?.fullName ?? "Chưa phân công"}
        </span>
      </div>
    </div>
  )
}

function StageDialog(props: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  submitLabel: string
  onSubmit: FormEventHandler
  name: string
  setName: (name: string) => void
  color: string
  setColor: (color: string) => void
  completed: boolean
  setCompleted: (value: boolean) => void
  isDefault: boolean
  setDefault: (value: boolean) => void
  defaultDisabled?: boolean
  pending: boolean
}) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="max-w-sm rounded-2xl border-border bg-popover">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold">
            <Sparkles className="size-4 text-primary" />
            {props.title}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={props.onSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">Tên cột trạng thái</Label>
            <Input
              value={props.name}
              onChange={(event) => {
                props.setName(event.target.value)
              }}
              placeholder="Ví dụ: Đang đợi, QC, Hoàn tất..."
              required
              className="h-9 rounded-lg border-border text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">Màu cột sắc đại diện</Label>
            <div className="flex flex-wrap gap-2.5">
              {POSTING_STAGE_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => {
                    props.setColor(color)
                  }}
                  className={`relative size-6 shrink-0 rounded-full border transition-all ${props.color === color ? "scale-110 border-transparent ring-2 ring-primary/45" : "border-border hover:scale-105"}`}
                  style={{ backgroundColor: color }}
                >
                  {props.color === color && (
                    <Check className="absolute inset-0 m-auto size-3 font-black text-white" />
                  )}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2 border-t border-border/40 pt-2">
            <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-foreground">
              <input
                type="checkbox"
                checked={props.completed}
                onChange={(event) => {
                  props.setCompleted(event.target.checked)
                }}
                className="size-4 rounded border-border text-primary"
              />
              Đánh dấu là cột hoàn thành (isCompleted)
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-foreground">
              <input
                type="checkbox"
                checked={props.isDefault}
                onChange={(event) => {
                  props.setDefault(event.target.checked)
                }}
                disabled={props.defaultDisabled}
                className="size-4 rounded border-border text-primary disabled:opacity-40"
              />
              Trạng thái mặc định khi tạo ứng viên (isDefault)
            </label>
          </div>
          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                props.onOpenChange(false)
              }}
              className="h-9 rounded-full text-xs"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={props.pending || !props.name.trim()}
              className="h-9 rounded-full px-4 text-xs font-bold"
            >
              {props.submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DropIndicator({ className }: { className?: string }) {
  return (
    <div
      className={`mx-1 h-0.5 rounded-full bg-primary shadow-[0_0_6px_2px_hsl(var(--primary)/0.4)] ${className ?? ""}`}
    />
  )
}
function LoadingBoard() {
  return (
    <div className="grid grid-cols-1 gap-6 overflow-x-auto pb-4 md:grid-cols-3 xl:grid-cols-4">
      {[1, 2, 3].map((number) => (
        <div key={number} className="min-w-[280px] space-y-3 rounded-xl bg-secondary/40 p-4">
          <Skeleton className="h-6 w-1/2 rounded-full" />
          <Skeleton className="h-28 w-full rounded-lg" />
          <Skeleton className="h-28 w-full rounded-lg" />
        </div>
      ))}
    </div>
  )
}
