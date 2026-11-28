import { QuickLink } from "@/components/features/recruitment/recruitment-dashboard-widgets"
import { ROUTES } from "@/config/routes.config"
import { TYPOGRAPHY } from "@/config/typography.config"
import { cn } from "@/lib/utils"

import { CheckCircle, FileText, TrendingUp, Users } from "lucide-react"

/**
 * Props for RecruitmentQuickLinks component.
 */
export interface RecruitmentQuickLinksProps {
  pendingReqCount?: number
}

/**
 * Presenter grid displaying navigation shortcuts and actionable recruitment items.
 */
export function RecruitmentQuickLinks({ pendingReqCount = 0 }: RecruitmentQuickLinksProps) {
  return (
    <div>
      <h3 className={cn(TYPOGRAPHY.TABLE_HEADER, "mb-3")}>Thao tác nhanh</h3>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <QuickLink
          title="Yêu cầu tuyển dụng"
          description="Tạo và quản lý yêu cầu"
          icon={FileText}
          to={ROUTES.RECRUITMENT.REQUISITIONS}
          count={pendingReqCount}
        />
        <QuickLink
          title="Quản lý ứng viên"
          description="Xem danh sách ứng viên"
          icon={Users}
          to={ROUTES.RECRUITMENT.CANDIDATES}
        />
        <QuickLink
          title="Lịch phỏng vấn của tôi"
          description="Đánh giá & chấm điểm"
          icon={TrendingUp}
          to={ROUTES.RECRUITMENT.MY_INTERVIEWS}
        />
        <QuickLink
          title="Tiếp nhận ứng viên"
          description="Nhập ứng viên hàng loạt"
          icon={CheckCircle}
          to={ROUTES.RECRUITMENT.APPLICANT_INTAKE}
        />
      </div>
    </div>
  )
}
