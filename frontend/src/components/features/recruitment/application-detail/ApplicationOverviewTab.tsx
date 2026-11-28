import { PageCard } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { RecruitmentApplication } from "@/types/recruitment.types"

import { Building, ExternalLink, FileText, Link as LinkIcon, Mail, Phone } from "lucide-react"

interface ApplicationOverviewTabProps {
  application: RecruitmentApplication
}

/**
 * Pure UI presentational tab presenting candidate contact details,
 * attached CV document, resume summary, and custom application form values.
 */
export function ApplicationOverviewTab({ application }: ApplicationOverviewTabProps) {
  const candidatePortfolioUrl = (application.candidate as { portfolioUrl?: string | null })
    .portfolioUrl

  return (
    <div className="space-y-6">
      {/* Profile Details Card */}
      <PageCard className="border border-border/60 p-6 transition-all duration-200 hover:border-primary/30 hover:shadow-md">
        <h3 className="mb-4 border-b border-border pb-2 text-base font-bold text-foreground">
          Thông tin cơ bản ứng viên
        </h3>
        <div className="grid gap-4 text-xs sm:grid-cols-2">
          <div className="flex justify-between rounded-lg border-b border-border/40 px-2 pb-2.5 pt-1 transition-colors hover:bg-muted/30">
            <span className="font-medium text-muted-foreground">Họ và tên:</span>
            <span className="font-bold text-foreground">{application.candidate.fullName}</span>
          </div>

          <div className="flex justify-between rounded-lg border-b border-border/40 px-2 pb-2.5 pt-1 transition-colors hover:bg-muted/30">
            <span className="font-medium text-muted-foreground">Email liên hệ:</span>
            <span className="flex items-center gap-1.5 font-semibold text-foreground">
              <Mail className="size-3.5 text-muted-foreground" />
              {application.candidate.email}
            </span>
          </div>

          <div className="flex justify-between rounded-lg border-b border-border/40 px-2 pb-2.5 pt-1 transition-colors hover:bg-muted/30">
            <span className="font-medium text-muted-foreground">Số điện thoại:</span>
            <span className="flex items-center gap-1.5 font-semibold text-foreground">
              <Phone className="size-3.5 text-muted-foreground" />
              {application.candidate.phone ?? "Chưa cung cấp"}
            </span>
          </div>

          <div className="flex justify-between rounded-lg border-b border-border/40 px-2 pb-2.5 pt-1 transition-colors hover:bg-muted/30">
            <span className="font-medium text-muted-foreground">Yêu cầu tuyển dụng:</span>
            <span className="font-semibold text-foreground">
              {application.requisition?.title ?? "—"}
            </span>
          </div>

          <div className="flex justify-between rounded-lg border-b border-border/40 px-2 pb-2.5 pt-1 transition-colors hover:bg-muted/30">
            <span className="font-medium text-muted-foreground">Phòng ban:</span>
            <span className="flex items-center gap-1.5 font-semibold text-foreground">
              <Building className="size-3.5 text-muted-foreground" />
              {application.requisition?.department ?? "Chưa rõ"}
            </span>
          </div>

          <div className="flex justify-between rounded-lg border-b border-border/40 px-2 pb-2.5 pt-1 transition-colors hover:bg-muted/30">
            <span className="font-medium text-muted-foreground">Nguồn ứng tuyển:</span>
            <Badge
              variant="outline"
              className="rounded-full bg-secondary/60 text-[10px] font-semibold transition-colors hover:bg-secondary"
            >
              {application.source}
            </Badge>
          </div>
        </div>
      </PageCard>

      {/* CV & Links Card */}
      <PageCard className="border border-border/60 p-6 transition-all duration-200 hover:border-primary/30 hover:shadow-md">
        <h3 className="mb-4 border-b border-border pb-2 text-base font-bold text-foreground">
          Hồ sơ & Tài liệu
        </h3>
        <div className="flex flex-wrap items-center gap-4">
          {application.candidate.cvUrl ? (
            <Button
              variant="outline"
              className="rounded-xl border-border transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:bg-primary/5 hover:shadow-md"
              asChild
            >
              <a href={application.candidate.cvUrl} target="_blank" rel="noreferrer">
                <FileText className="mr-2 size-4 text-primary" />
                Xem / Tải CV ứng viên
                <ExternalLink className="ml-2 size-3 text-muted-foreground" />
              </a>
            </Button>
          ) : (
            <span className="text-xs italic text-muted-foreground">Chưa đính kèm tệp CV</span>
          )}

          {candidatePortfolioUrl && (
            <Button
              variant="outline"
              className="rounded-xl border-border transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-500/50 hover:bg-blue-50/50 hover:shadow-md dark:hover:bg-blue-950/20"
              asChild
            >
              <a href={candidatePortfolioUrl} target="_blank" rel="noreferrer">
                <LinkIcon className="mr-2 size-4 text-blue-500" />
                Portfolio / Dự án
                <ExternalLink className="ml-2 size-3 text-muted-foreground" />
              </a>
            </Button>
          )}
        </div>
      </PageCard>
    </div>
  )
}
