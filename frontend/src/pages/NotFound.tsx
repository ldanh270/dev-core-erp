import { ErrorPageLayout } from "@/components/common"
import { ROUTES } from "@/config/routes.config"
import { useAuthStore } from "@/store/auth-store"

import {
  ArrowLeft,
  Calendar,
  CreditCard,
  FileText,
  FolderKanban,
  Home,
  ShieldAlert,
  Users,
} from "lucide-react"
import { useNavigate } from "react-router-dom"

/**
 * Standardized 404 Not Found Page.
 * Decoupled thin composition shell powered by ErrorPageLayout shared component.
 */
export default function NotFound() {
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  const handleGoHome = () => {
    navigate(isAuthenticated ? ROUTES.HRM.EMPLOYEES : ROUTES.AUTH.LOGIN)
  }

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      handleGoHome()
    }
  }

  const quickLinks = isAuthenticated
    ? [
        {
          label: "Nhân sự",
          icon: Users,
          onClick: () => navigate(ROUTES.HRM.EMPLOYEES),
        },
        {
          label: "Chấm công",
          icon: Calendar,
          onClick: () => navigate(ROUTES.ATTENDANCE.SUMMARY),
        },
        {
          label: "Bảng lương",
          icon: CreditCard,
          onClick: () => navigate(ROUTES.PAYROLL.LIST),
        },
        {
          label: "Dự án",
          icon: FolderKanban,
          onClick: () => navigate(ROUTES.PROJECT.LIST),
        },
        {
          label: "Đơn từ",
          icon: FileText,
          onClick: () => navigate(ROUTES.APPLICATION.MANAGE),
        },
      ]
    : [
        {
          label: "Đăng nhập hệ thống",
          icon: Home,
          onClick: () => navigate(ROUTES.AUTH.LOGIN),
        },
      ]

  return (
    <ErrorPageLayout
      code="404"
      badgeLabel="ERROR 404 • PAGE NOT FOUND"
      badgeIcon={ShieldAlert}
      title="Trang Không Tồn Tại"
      description="Đường dẫn liên kết không chính xác, trang đã bị xóa hoặc tài khoản của bạn chưa được cấp quyền truy cập."
      primaryAction={{
        label: isAuthenticated ? "Về Bảng Điều Khiển" : "Đến Trang Đăng Nhập",
        icon: Home,
        onClick: handleGoHome,
      }}
      secondaryAction={{
        label: "Quay Lại Trang Trước",
        icon: ArrowLeft,
        onClick: handleGoBack,
      }}
      quickLinks={quickLinks}
    />
  )
}
