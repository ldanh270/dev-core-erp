import { StatusPill } from "@/components/common/status-pill"
import { CreateOfferDialog } from "@/components/features/recruitment/create-offer-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  INTERVIEW_FORMAT_LABELS,
  INTERVIEW_RESULT_LABELS,
} from "@/config/entities/recruitment.config"
import { usePermission } from "@/hooks/use-permission"
import { applicationApi, interviewApi } from "@/lib/api/recruitment.api"
import type { ApplicationNote, KanbanApplication } from "@/types/recruitment.types"

import { useState } from "react"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { Calendar, ExternalLink, MapPin, Plus, Video } from "lucide-react"
import { Link } from "react-router-dom"

interface ApplicationDetailPanelProps {
  applicationId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ApplicationDetailPanel({
  applicationId,
  open,
  onOpenChange,
}: ApplicationDetailPanelProps) {
  const { hasPermission } = usePermission()
  const canManageInterviews = hasPermission("recruitment.create")

  const { data: application, isLoading } = useQuery({
    queryKey: ["recruitment", "application", applicationId],
    queryFn: () =>
      applicationId
        ? applicationApi.getOne(applicationId)
        : Promise.reject(new Error("No application ID")),
    enabled: Boolean(applicationId) && open,
  })

  const { data: interviews = [], isLoading: isLoadingInterviews } = useQuery({
    queryKey: ["recruitment", "application-interviews", applicationId],
    queryFn: () =>
      applicationId
        ? interviewApi.listByApplication(applicationId)
        : Promise.reject(new Error("No application ID")),
    enabled: Boolean(applicationId) && open,
  })

  const { data: notes = [] } = useQuery({
    queryKey: ["recruitment", "application-notes", applicationId],
    queryFn: () =>
      applicationId
        ? applicationApi.getNotes(applicationId)
        : Promise.reject(new Error("No application ID")),
    enabled: Boolean(applicationId) && open,
  })

  const [isOfferDialogOpen, setIsOfferDialogOpen] = useState(false)
  const queryClient = useQueryClient()

  if (!application && isLoading) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-xl md:max-w-2xl">
          <div className="flex h-full items-center justify-center">
            <span className="text-sm text-muted-foreground">Đang tải...</span>
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  if (!application) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col p-0 sm:max-w-xl md:max-w-2xl">
        <SheetHeader className="border-b border-border/40 px-6 py-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="flex size-12 items-center justify-center rounded-xl border border-border/50 bg-primary/10 text-lg font-bold text-primary overflow-hidden">
                {application.candidate.avatarUrl ? (
                  <img
                    src={application.candidate.avatarUrl}
                    alt={application.candidate.fullName}
                    className="size-full object-cover"
                  />
                ) : (
                  application.candidate.fullName.charAt(0).toUpperCase()
                )}
              </div>
              <div className="space-y-1">
                <SheetTitle className="text-lg font-bold">
                  {application.candidate.fullName}
                </SheetTitle>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>{application.candidate.email}</span>
                  {application.candidate.phone && (
                    <>
                      <span>•</span>
                      <span>{application.candidate.phone}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-full text-xs font-semibold"
                asChild
              >
                <Link to={`/recruitment/applications/${application.id}`}>
                  <ExternalLink className="mr-1.5 size-3" />
                  Xem chi tiết
                </Link>
              </Button>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <StatusPill label={application.pipelineStage?.name ?? "Nộp CV"} variant="info" />
            <Badge variant="outline" className="rounded-full bg-secondary/50 font-medium">
              {application.source}
            </Badge>
          </div>
        </SheetHeader>

        <Tabs defaultValue="overview" className="flex flex-1 flex-col overflow-hidden">
          <div className="border-b border-border/40 px-6">
            <TabsList className="h-auto bg-transparent p-0">
              <TabsTrigger
                value="overview"
                className="rounded-none border-b-2 border-transparent px-4 py-3 text-xs font-semibold data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                Tổng quan
              </TabsTrigger>
              <TabsTrigger
                value="interviews"
                className="rounded-none border-b-2 border-transparent px-4 py-3 text-xs font-semibold data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                Phỏng vấn ({interviews.length})
              </TabsTrigger>
              <TabsTrigger
                value="offers"
                className="rounded-none border-b-2 border-transparent px-4 py-3 text-xs font-semibold data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                Offer ({application.offers?.length ?? 0})
              </TabsTrigger>
              <TabsTrigger
                value="notes"
                className="rounded-none border-b-2 border-transparent px-4 py-3 text-xs font-semibold data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                Ghi chú ({notes.length})
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-6">
              <TabsContent value="overview" className="m-0 space-y-6">
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold">Thông tin ứng tuyển</h3>
                  <div className="grid gap-4 rounded-xl border border-border/50 bg-secondary/20 p-4 sm:grid-cols-2">
                    <div>
                      <span className="text-xs text-muted-foreground">Vị trí</span>
                      <p className="mt-0.5 text-sm font-medium">
                        {application.requisition?.position?.name ??
                          application.requisition?.positionLevel ??
                          "—"}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Yêu cầu tuyển dụng</span>
                      <p className="mt-0.5 text-sm font-medium">
                        {application.requisition?.title ?? "—"}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Người phụ trách</span>
                      <p className="mt-0.5 text-sm font-medium">
                        {application.assignedTo?.fullName ?? "—"}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">CV / Hồ sơ</span>
                      <div className="mt-0.5">
                        {application.candidate.cvUrl ? (
                          <a
                            href={application.candidate.cvUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm font-medium text-primary hover:underline"
                          >
                            Xem CV
                          </a>
                        ) : (
                          <span className="text-sm text-muted-foreground">Không có CV</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="interviews" className="m-0 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Các vòng phỏng vấn</h3>
                  {canManageInterviews && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 rounded-full text-xs font-semibold"
                      asChild
                    >
                      <Link
                        to={`/recruitment/applications/${application.id}?tab=interviews&createInterview=1`}
                      >
                        <Plus className="mr-1.5 size-3" />
                        Thêm vòng
                      </Link>
                    </Button>
                  )}
                </div>

                {isLoadingInterviews ? (
                  <span className="text-sm text-muted-foreground">Đang tải...</span>
                ) : interviews.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border/50 py-8 text-center">
                    <p className="text-sm text-muted-foreground">Chưa có vòng phỏng vấn nào.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {interviews.map((interview) => (
                      <div
                        key={interview.id}
                        className="rounded-xl border border-border/60 bg-card p-4 transition-colors hover:border-primary/40"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="rounded-full bg-secondary/50">
                                Vòng {interview.roundNumber}
                              </Badge>
                              <h4 className="font-semibold">{interview.title}</h4>
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="size-3.5" />
                                <span>
                                  {interview.scheduledAt
                                    ? format(new Date(interview.scheduledAt), "HH:mm, dd/MM/yyyy")
                                    : "Chưa xếp lịch"}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                {interview.format === "video_call" ? (
                                  <Video className="size-3.5" />
                                ) : (
                                  <MapPin className="size-3.5" />
                                )}
                                <span>
                                  {INTERVIEW_FORMAT_LABELS[interview.format] ?? interview.format}
                                </span>
                              </div>
                            </div>
                          </div>
                          <StatusPill
                            label={
                              interview.status === "completed"
                                ? (INTERVIEW_RESULT_LABELS[interview.result as string] ?? "Đã xong")
                                : interview.status === "scheduled"
                                  ? "Đã lên lịch"
                                  : interview.status === "cancelled"
                                    ? "Đã hủy"
                                    : "Chưa đến"
                            }
                            variant={
                              interview.result === "pass"
                                ? "success"
                                : interview.result === "fail" ||
                                    interview.status === "cancelled" ||
                                    interview.status === "no_show"
                                  ? "danger"
                                  : "neutral"
                            }
                          />
                        </div>

                        <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-4">
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                              Người phỏng vấn
                            </span>
                            <div className="flex -space-x-2">
                              {interview.interviewers?.map((interviewer) => (
                                <div
                                  key={interviewer.id}
                                  className="flex size-6 items-center justify-center rounded-full border-2 border-background bg-primary/20 text-[10px] font-bold text-primary"
                                >
                                  {interviewer.fullName.charAt(0)}
                                </div>
                              ))}
                              {(!interview.interviewers || interview.interviewers.length === 0) && (
                                <span className="text-xs text-muted-foreground">Chưa gán</span>
                              )}
                            </div>
                          </div>

                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 rounded-full text-xs font-semibold text-primary"
                            asChild
                          >
                            <Link to={`/recruitment/applications/${application.id}?tab=interviews`}>
                              Chi tiết
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="offers" className="m-0 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Thông tin Offer</h3>
                  {canManageInterviews && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 rounded-full text-xs font-semibold"
                      onClick={() => {
                        setIsOfferDialogOpen(true)
                      }}
                    >
                      <Plus className="mr-1.5 size-3" />
                      Tạo Offer
                    </Button>
                  )}
                </div>

                {application.offers && application.offers.length > 0 ? (
                  <div className="space-y-3">
                    {application.offers.map((offer) => (
                      <div
                        key={offer.id}
                        className="rounded-xl border border-border/60 bg-card p-4 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm">{offer.jobTitle ?? "Offer"}</span>
                          <StatusPill
                            label={offer.status}
                            variant={offer.status === "accepted" ? "success" : "neutral"}
                          />
                        </div>
                        <p className="text-xs font-semibold text-primary">
                          Lương: {Number(offer.offeredSalary).toLocaleString()} {offer.currency}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Ngày bắt đầu:{" "}
                          {offer.startDate ? format(new Date(offer.startDate), "dd/MM/yyyy") : "—"}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-border/50 py-8 text-center space-y-2">
                    <p className="text-sm text-muted-foreground">Chưa có offer nào được tạo.</p>
                    {canManageInterviews && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 rounded-full text-xs font-semibold"
                        onClick={() => {
                          setIsOfferDialogOpen(true)
                        }}
                      >
                        <Plus className="mr-1.5 size-3" />
                        Tạo Offer ngay
                      </Button>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="notes" className="m-0 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Ghi chú</h3>
                </div>
                {notes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Chưa có ghi chú nào.</p>
                ) : (
                  <div className="space-y-3">
                    {notes.map((note: ApplicationNote) => (
                      <div
                        key={note.id}
                        className="rounded-xl border border-border/50 bg-secondary/10 p-3"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold">{note.addedBy.fullName}</p>
                          <span className="text-[10px] text-muted-foreground">
                            {format(new Date(note.createdAt), "HH:mm dd/MM/yyyy")}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-foreground">{note.note}</p>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>
        {application && (
          <CreateOfferDialog
            open={isOfferDialogOpen}
            onOpenChange={setIsOfferDialogOpen}
            applications={[application as unknown as KanbanApplication]}
            onCreated={() => {
              void queryClient.invalidateQueries({
                queryKey: ["recruitment", "application", applicationId],
              })
            }}
          />
        )}
      </SheetContent>
    </Sheet>
  )
}
