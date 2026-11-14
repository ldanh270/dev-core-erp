import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { interviewApi, scorecardApi } from "@/lib/api/recruitment.api"
import type { InterviewRound, Scorecard } from "@/types/recruitment.types"
import { extractErrorMessage } from "@/utils/error-helper"

import { useEffect, useState } from "react"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ExternalLink, Star } from "lucide-react"
import { Link } from "react-router-dom"
import { toast } from "sonner"

interface InterviewFeedbackPanelProps {
  interview: InterviewRound | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InterviewFeedbackPanel({
  interview,
  open,
  onOpenChange,
}: InterviewFeedbackPanelProps) {
  const queryClient = useQueryClient()
  const [existingScorecard, setExistingScorecard] = useState<Scorecard | null>(null)
  const [rating, setRating] = useState<number>(0)
  const [strengths, setStrengths] = useState("")
  const [weaknesses, setWeaknesses] = useState("")
  const [recommendation, setRecommendation] = useState<
    "hire" | "strong_hire" | "no_hire" | "strong_no_hire"
  >("hire")

  // Fetch danh sách scorecards thuộc buổi phỏng vấn này
  const { data: scorecards = [] } = useQuery({
    queryKey: ["recruitment", "interview-scorecards", interview?.id],
    queryFn: () => (interview ? scorecardApi.listByInterview(interview.id) : Promise.resolve([])),
    enabled: Boolean(interview?.id) && open,
  })

  // Điền dữ liệu nếu đã có đánh giá trước đó (hoặc reset nếu chưa)
  useEffect(() => {
    if (open && interview) {
      const myScorecard = scorecards[0] ?? interview.scorecards?.[0] ?? null
      if (myScorecard) {
        setExistingScorecard(myScorecard)
        setRating(myScorecard.overallRating ?? 0)
        setStrengths(myScorecard.strengths ?? "")
        setWeaknesses(myScorecard.weaknesses ?? "")
        setRecommendation(
          myScorecard.recommendation as "hire" | "strong_hire" | "no_hire" | "strong_no_hire",
        )
      } else {
        setExistingScorecard(null)
        setRating(0)
        setStrengths("")
        setWeaknesses("")
        setRecommendation("hire")
      }
    }
  }, [open, interview, scorecards])

  const submitScorecardMutation = useMutation({
    mutationFn: async () => {
      if (!interview) return

      if (existingScorecard) {
        // Cập nhật đánh giá đã tồn tại
        await scorecardApi.update(existingScorecard.id, {
          overallRating: rating,
          strengths,
          weaknesses,
          recommendation,
        })
      } else {
        // Tạo đánh giá mới
        await scorecardApi.create({
          interviewId: interview.id,
          overallRating: rating,
          strengths,
          weaknesses,
          recommendation,
        })
      }

      // Cập nhật trạng thái vòng phỏng vấn thành hoàn thành
      const result = recommendation.includes("no") ? "fail" : "pass"
      await interviewApi.complete(interview.id, {
        result,
        feedback: "Đã cập nhật đánh giá từ Interviewer",
      })
    },
    onSuccess: () => {
      toast.success(existingScorecard ? "Cập nhật đánh giá thành công" : "Gửi đánh giá thành công")
      void queryClient.invalidateQueries({ queryKey: ["recruitment", "upcoming-interviews"] })
      void queryClient.invalidateQueries({
        queryKey: ["recruitment", "interview-scorecards", interview?.id],
      })
      void queryClient.invalidateQueries({
        queryKey: ["recruitment", "application", interview?.applicationId],
      })
      void queryClient.invalidateQueries({
        queryKey: ["recruitment", "application-interviews", interview?.applicationId],
      })
      onOpenChange(false)
    },
    onError: (error: unknown) => {
      toast.error(extractErrorMessage(error))
    },
  })

  if (!interview) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col p-0 sm:max-w-xl">
        <SheetHeader className="border-b border-border/40 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="text-lg font-bold">Đánh giá phỏng vấn</SheetTitle>
              <p className="text-sm text-muted-foreground">
                {interview.title} - Vòng {interview.roundNumber}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-full text-xs font-semibold"
              asChild
            >
              <Link to={`/recruitment/applications/${interview.applicationId}`}>
                <ExternalLink className="mr-1.5 size-3" />
                Chi tiết
              </Link>
            </Button>
          </div>

          <div className="mt-4 flex items-center gap-4 rounded-xl border border-border/50 bg-secondary/20 p-3">
            <div className="flex size-10 items-center justify-center rounded-xl border border-border/50 bg-primary/10 font-bold text-primary overflow-hidden shrink-0">
              {interview.application?.candidate?.avatarUrl ? (
                <img
                  src={interview.application.candidate.avatarUrl}
                  alt={interview.application.candidate.fullName ?? "Ứng viên"}
                  className="size-full object-cover"
                />
              ) : (
                (interview.application?.candidate?.fullName?.charAt(0).toUpperCase() ?? "U")
              )}
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-bold">{interview.application?.candidate?.fullName}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{interview.application?.requisition?.title}</span>
              </div>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            <div className="space-y-3">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Đánh giá tổng quan <span className="text-destructive">*</span>
              </Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setRating(value)
                    }}
                    className="group rounded-full p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      className={`size-8 ${
                        value <= rating
                          ? "fill-primary text-primary"
                          : "text-muted-foreground/30 group-hover:text-primary/50"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Điểm mạnh
              </Label>
              <Textarea
                placeholder="Ghi nhận điểm mạnh của ứng viên..."
                className="min-h-[100px] resize-none rounded-xl"
                value={strengths}
                onChange={(e) => {
                  setStrengths(e.target.value)
                }}
              />
            </div>

            <div className="space-y-3">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Điểm yếu / Cần cải thiện
              </Label>
              <Textarea
                placeholder="Ghi nhận những điểm cần khắc phục..."
                className="min-h-[100px] resize-none rounded-xl"
                value={weaknesses}
                onChange={(e) => {
                  setWeaknesses(e.target.value)
                }}
              />
            </div>

            <div className="space-y-3">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Đề xuất
              </Label>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { value: "strong_hire", label: "Rất nên tuyển", desc: "Xuất sắc, vượt kỳ vọng" },
                  { value: "hire", label: "Nên tuyển", desc: "Đạt yêu cầu chung" },
                  { value: "no_hire", label: "Không nên tuyển", desc: "Chưa phù hợp" },
                  {
                    value: "strong_no_hire",
                    label: "Tuyệt đối không",
                    desc: "Thiếu nhiều kỹ năng cốt lõi",
                  },
                ].map((option) => {
                  const isChecked = recommendation === option.value
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setRecommendation(
                          option.value as "hire" | "strong_hire" | "no_hire" | "strong_no_hire",
                        )
                      }}
                      className={`flex flex-col text-left rounded-xl border p-4 transition-all ${
                        isChecked
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border/50 bg-card hover:bg-secondary/30"
                      }`}
                    >
                      <span className="font-semibold text-sm">{option.label}</span>
                      <span className="mt-1 text-[10px] text-muted-foreground">{option.desc}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </ScrollArea>

        <SheetFooter className="border-t border-border/40 p-4">
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false)
            }}
            className="rounded-full"
          >
            Hủy
          </Button>
          <Button
            onClick={() => {
              submitScorecardMutation.mutate()
            }}
            disabled={rating === 0 || submitScorecardMutation.isPending}
            className="rounded-full"
          >
            {submitScorecardMutation.isPending
              ? "Đang lưu..."
              : existingScorecard
                ? "Cập nhật đánh giá"
                : "Gửi đánh giá"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
