import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ROUTES } from "@/config/routes.config"
import { useAuthStore } from "@/store/auth-store"

import {
  ArrowLeft,
  Calendar,
  Compass,
  CreditCard,
  FileText,
  FolderKanban,
  Home,
  ShieldAlert,
  Users,
} from "lucide-react"
import { useNavigate } from "react-router-dom"

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
          path: ROUTES.HRM.EMPLOYEES,
        },
        {
          label: "Chấm công",
          icon: Calendar,
          path: ROUTES.ATTENDANCE.SUMMARY,
        },
        {
          label: "Bảng lương",
          icon: CreditCard,
          path: ROUTES.PAYROLL.LIST,
        },
        {
          label: "Dự án",
          icon: FolderKanban,
          path: ROUTES.PROJECT.LIST,
        },
        {
          label: "Đơn từ",
          icon: FileText,
          path: ROUTES.APPLICATION.MANAGE,
        },
      ]
    : [
        {
          label: "Đăng nhập hệ thống",
          icon: Home,
          path: ROUTES.AUTH.LOGIN,
        },
      ]

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-background p-4 text-foreground md:p-8">
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-[30rem] w-[30rem] rounded-full bg-primary/10 blur-[128px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-[30rem] w-[30rem] rounded-full bg-primary/15 blur-[128px]" />

      {/* Decorative Grid overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

      <div className="relative z-10 flex w-full max-w-2xl flex-col items-center">
        {/* Main Card (Shadcn UI Architecture) */}
        <Card className="w-full border-border/80 bg-card/85 shadow-2xl backdrop-blur-xl rounded-xl overflow-hidden">
          {/* Top Decorative Primary Accent Bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-primary/30 via-primary to-primary/30" />

          <CardHeader className="flex flex-col items-center text-center pt-8 pb-4 space-y-4">
            {/* Status Badge */}
            <Badge
              variant="outline"
              className="rounded-full px-3.5 py-1 bg-primary/10 border-primary/20 text-primary font-medium text-xs gap-1.5 shadow-xs"
            >
              <ShieldAlert className="size-3.5" />
              <span>ERROR 404 • PAGE NOT FOUND</span>
            </Badge>

            {/* Giant 404 Display with Subtle Aura */}
            <div className="relative flex items-center justify-center my-2">
              <div className="pointer-events-none absolute h-32 w-32 rounded-full bg-primary/25 blur-2xl" />
              <h1 className="select-none bg-gradient-to-r from-primary via-primary/80 to-muted-foreground/60 bg-clip-text text-8xl md:text-9xl font-black tracking-tighter text-transparent">
                404
              </h1>
              <div className="absolute -top-2 -right-4 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background shadow-md">
                <Compass className="size-5 text-primary animate-pulse" />
              </div>
            </div>

            <div className="space-y-2 max-w-md">
              <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
                Trang Không Tồn Tại
              </CardTitle>
              <CardDescription className="text-sm leading-relaxed text-muted-foreground">
                Đường dẫn liên kết không chính xác, trang đã bị xóa hoặc tài khoản của bạn chưa được cấp quyền truy cập.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="flex flex-col items-center space-y-6 px-6 pb-6">
            {/* Action Buttons Group */}
            <div className="flex flex-wrap items-center justify-center gap-3 w-full sm:w-auto">
              <Button
                onClick={handleGoHome}
                size="lg"
                className="rounded-full px-6 font-medium shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all duration-200"
              >
                <Home className="size-4" />
                {isAuthenticated ? "Về Bảng Điều Khiển" : "Đến Trang Đăng Nhập"}
              </Button>

              <Button
                onClick={handleGoBack}
                variant="outline"
                size="lg"
                className="rounded-full px-6 font-medium transition-all duration-200"
              >
                <ArrowLeft className="size-4" />
                Quay Lại Trang Trước
              </Button>
            </div>

            <Separator className="w-full opacity-60" />

            {/* Quick Access Section (Wider single-row layout) */}
            <div className="w-full rounded-lg border border-border bg-muted/30 p-3.5 space-y-2.5 text-left">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
                Gợi ý truy cập nhanh
              </span>

              <div className="flex flex-wrap items-center justify-between gap-2">
                {quickLinks.map((link) => {
                  const Icon = link.icon
                  return (
                    <button
                      key={link.path}
                      type="button"
                      onClick={() => { navigate(link.path); }}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground whitespace-nowrap transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <Icon className="h-3.5 w-3.5 text-primary" />
                      {link.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-center border-t border-border/40 bg-muted/20 py-3 px-6 text-center text-xs text-muted-foreground">
            Hệ thống DevCore ERP • Enterprise Resource Planning
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
