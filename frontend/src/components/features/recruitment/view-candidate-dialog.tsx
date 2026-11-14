import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { RECRUITMENT_SOURCE_LABELS } from "@/config/entities/recruitment.config"
import type { Candidate } from "@/types/recruitment.types"

import { ExternalLink, Mail, MapPin, Phone, User } from "lucide-react"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  candidate: Candidate | null
}

export function ViewCandidateDialog({ open, onOpenChange, candidate }: Props) {
  if (!candidate) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl rounded-xl border-border bg-background">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="rounded-full border-primary text-primary">
              {RECRUITMENT_SOURCE_LABELS[candidate.source] || candidate.source}
            </Badge>
            {candidate.yearsOfExperience !== undefined && (
              <Badge
                variant="secondary"
                className="rounded-full bg-secondary text-secondary-foreground"
              >
                {candidate.yearsOfExperience} năm kinh nghiệm
              </Badge>
            )}
          </div>
          <DialogTitle className="mt-2 text-2xl font-bold text-foreground flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div>{candidate.fullName}</div>
              {candidate.currentPosition && (
                <p className="text-xs font-normal text-muted-foreground mt-0.5">
                  {candidate.currentPosition}
                </p>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-5 py-3">
          {/* Contact Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-lg bg-muted/30 p-4 border border-border">
            <div>
              <span className="text-xs text-muted-foreground block font-medium">Email</span>
              <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground mt-0.5">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{candidate.email}</span>
              </div>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block font-medium">Số điện thoại</span>
              <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground mt-0.5">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{candidate.phone || "Chưa cập nhật"}</span>
              </div>
            </div>
            {candidate.address && (
              <div className="sm:col-span-2">
                <span className="text-xs text-muted-foreground block font-medium">Địa chỉ</span>
                <div className="flex items-center gap-1.5 text-sm text-foreground mt-0.5">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{candidate.address}</span>
                </div>
              </div>
            )}
          </div>

          {/* Skills */}
          {(candidate.skills || []).length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground">Kỹ năng</h4>
              <div className="flex flex-wrap gap-1.5">
                {candidate.skills.map((skill, index) => (
                  <Badge key={index} variant="secondary" className="rounded-full text-xs px-3 py-1">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {(candidate.skills || []).length > 0 && <Separator className="bg-border" />}

          {/* CV Attachment */}
          {candidate.cvUrl && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground">Hồ sơ ứng tuyển (CV)</h4>
              <a
                href={candidate.cvUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline bg-primary/5 px-4 py-2.5 rounded-lg border border-primary/20"
              >
                <ExternalLink className="h-4 w-4" />
                Xem file CV đã đính kèm
              </a>
            </div>
          )}

          {/* Additional details */}
          <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground pt-2 border-t border-border">
            <div>
              <span>Ngày tạo: </span>
              <span className="font-medium text-foreground">
                {candidate.createdAt
                  ? new Date(candidate.createdAt).toLocaleDateString("vi-VN")
                  : "—"}
              </span>
            </div>
            <div>
              <span>Căn cước / ID: </span>
              <span className="font-mono text-foreground">{candidate.nationalId || "—"}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            className="rounded-full border-border text-foreground hover:bg-muted"
            onClick={() => {
              onOpenChange(false)
            }}
          >
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
