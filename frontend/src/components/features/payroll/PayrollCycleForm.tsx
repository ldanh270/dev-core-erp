import { SettingsPageLayout } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Form,
} from "@/components/ui/form-ui"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ROUTES } from "@/config/routes.config"
import { type SettingsFormValues, usePayrollCycleForm } from "@/hooks/payroll/use-payroll-cycle-form"
import { routerNavigate } from "@/lib/router-navigator"
import type { IPayrollSettings } from "@/types/payroll.types"
import { CalendarCheck, CalendarClock, Info, Settings2 } from "lucide-react"
import { type Control, useWatch } from "react-hook-form"

const DAYS_OF_MONTH = Array.from({ length: 28 }, (_, i) => i + 1)
const HOURS_OF_DAY = Array.from({ length: 24 }, (_, i) => i)
const MINUTES_INTERVAL = [0, 15, 30, 45]

/** Presenter sidebar providing contextual explanation of payroll period boundaries. */
function CycleContextPanel() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="size-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Settings2 className="size-4 text-primary" strokeWidth={2} />
          </div>
          <h3 className="text-lg font-medium tracking-tight">Cấu hình hệ thống</h3>
        </div>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Thiết lập ngày tự động tạo bảng lương và ngày tự động duyệt bảng lương hằng tháng.
        </p>
      </div>

      <Separator className="bg-border/50" />

      <div className="flex items-start gap-3">
        <CalendarClock className="size-4 text-muted-foreground mt-0.5" strokeWidth={2} />
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <h4 className="text-sm font-medium text-foreground">Tự động hóa</h4>
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="size-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs text-xs">
                  Quy trình này chạy background job để tạo payroll trước, sau đó tự duyệt theo lịch
                  phát lương đã cấu hình.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Payroll được tạo trước để nhân viên xem payslip và gửi feedback, rồi hệ thống duyệt tự
            động vào ngày phát lương.
          </p>
        </div>
      </div>
    </div>
  )
}

/** Presenter input control for choosing monthly cutoff and payment days. */
function ScheduleDayField({
  control,
  name,
  label,
  description,
}: {
  control: Control<SettingsFormValues>
  name: "triggerDay" | "approvalDay"
  label: string
  description?: string
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="space-y-2">
          <FormLabel className="text-sm font-medium">{label}</FormLabel>
          {description && (
            <FormDescription className="text-xs text-muted-foreground leading-relaxed">
              {description}
            </FormDescription>
          )}
          <Select
            value={field.value !== undefined ? String(field.value) : ""}
            onValueChange={(val) => {
              field.onChange(Number(val))
            }}
          >
            <FormControl>
              <SelectTrigger className="w-full h-10 rounded-lg">
                <SelectValue placeholder="Chọn ngày" />
              </SelectTrigger>
            </FormControl>
            <SelectContent className="max-h-56">
              {DAYS_OF_MONTH.map((d) => (
                <SelectItem key={d} value={String(d)}>
                  Ngày {d} hàng tháng
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

/** Presenter input control for configuring cutoff and processing times. */
function ScheduleTimeField({
  control,
  hourName,
  minuteName,
  label,
}: {
  control: Control<SettingsFormValues>
  hourName: "triggerHour" | "approvalHour"
  minuteName: "triggerMinute" | "approvalMinute"
  label: string
}) {
  return (
    <div className="space-y-2">
      <FormLabel className="text-sm font-medium">{label}</FormLabel>
      <div className="grid grid-cols-2 gap-3">
        <FormField
          control={control}
          name={hourName}
          render={({ field }) => (
            <FormItem>
              <Select
                value={field.value !== undefined ? String(field.value) : ""}
                onValueChange={(val) => {
                  field.onChange(Number(val))
                }}
              >
                <FormControl>
                  <SelectTrigger className="w-full h-10 rounded-lg">
                    <SelectValue placeholder="Giờ" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="max-h-56">
                  {HOURS_OF_DAY.map((h) => (
                    <SelectItem key={h} value={String(h)}>
                      {String(h).padStart(2, "0")}:00
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={minuteName}
          render={({ field }) => (
            <FormItem>
              <Select
                value={field.value !== undefined ? String(field.value) : ""}
                onValueChange={(val) => {
                  field.onChange(Number(val))
                }}
              >
                <FormControl>
                  <SelectTrigger className="w-full h-10 rounded-lg">
                    <SelectValue placeholder="Phút" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {MINUTES_INTERVAL.map((m) => (
                    <SelectItem key={m} value={String(m)}>
                      {String(m).padStart(2, "0")} phút
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  )
}

/** Visual timeline step diagram depicting monthly cycle calculation sequence. */
function CycleTimelineIndicator({ control }: { control: Control<SettingsFormValues> }) {
  const triggerDay = useWatch({ control, name: "triggerDay" })
  const approvalDay = useWatch({ control, name: "approvalDay" })

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs">
      <div className="flex items-center gap-2 font-medium text-primary">
        <span className="size-2 rounded-full bg-primary animate-pulse" />
        Dòng thời gian chu kỳ
      </div>
      <p className="text-muted-foreground leading-relaxed">
        Hệ thống tạo payroll vào ngày <strong className="text-foreground">{triggerDay}</strong> hàng
        tháng để nhân viên kiểm tra. Đến ngày{" "}
        <strong className="text-foreground">{approvalDay}</strong>, hệ thống tự động chốt duyệt và
        phát hành bảng lương chính thức.
      </p>
    </div>
  )
}

/**
 * Form presenter configuring recurring monthly payroll schedule, cutoff dates, and payday.
 */
export function PayrollCycleForm({ settings }: { settings: IPayrollSettings }) {
  const { form, isPending, onSubmit } = usePayrollCycleForm({
    initialData: settings,
  })

  const isDirty = form.formState.isDirty

  const handleCancel = () => {
    form.reset({
      triggerDay: settings.triggerDay,
      triggerHour: settings.triggerHour,
      triggerMinute: settings.triggerMinute,
      approvalDay: settings.approvalDay,
      approvalHour: settings.approvalHour,
      approvalMinute: settings.approvalMinute,
    })
    routerNavigate(ROUTES.PAYROLL.LIST)
  }

  return (
    <SettingsPageLayout
      title="Thiết lập Chu kỳ lương"
      description="Quản lý lịch trình tự động tổng hợp và xử lý lương của tổ chức."
      backHref={ROUTES.PAYROLL.LIST}
      contextPanel={<CycleContextPanel />}
    >
      <Form {...form}>
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-border/60">
            <div>
              <h3 className="text-base font-semibold text-foreground">Thời gian kích hoạt</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Cấu hình mốc thời gian hệ thống tự động xử lý chu kỳ lương hàng tháng
              </p>
            </div>
            <Badge variant="outline" className="rounded-full text-xs font-normal">
              Định kỳ hằng tháng
            </Badge>
          </div>

          <CycleTimelineIndicator control={form.control} />

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="rounded-xl border border-border bg-card/40 p-6 flex flex-col justify-between space-y-6">
              <div className="flex items-center gap-3 pb-3 border-b border-border/50">
                <div className="size-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <CalendarClock className="size-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-foreground">Tự động tạo payroll</h4>
                  <p className="text-xs text-muted-foreground">Tạo trước để nhân viên kiểm tra</p>
                </div>
              </div>
              <div className="space-y-6">
                <ScheduleDayField
                  control={form.control}
                  name="triggerDay"
                  label="Ngày tạo payroll"
                  description="Ngày hệ thống tự tạo bảng lương nháp từ dữ liệu chấm công."
                />
                <ScheduleTimeField
                  control={form.control}
                  hourName="triggerHour"
                  minuteName="triggerMinute"
                  label="Giờ tạo payroll"
                />
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card/40 p-6 flex flex-col justify-between space-y-6">
              <div className="flex items-center gap-3 pb-3 border-b border-border/50">
                <div className="size-9 rounded-lg bg-success/10 border border-success/20 flex items-center justify-center shrink-0">
                  <CalendarCheck className="size-4 text-success" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-foreground">Tự động duyệt payroll</h4>
                  <p className="text-xs text-muted-foreground">Tự động duyệt vào ngày phát lương</p>
                </div>
              </div>
              <div className="space-y-6">
                <ScheduleDayField
                  control={form.control}
                  name="approvalDay"
                  label="Ngày duyệt payroll"
                  description="Ngày hệ thống tự duyệt payroll đã tạo, thường là ngày phát lương."
                />
                <ScheduleTimeField
                  control={form.control}
                  hourName="approvalHour"
                  minuteName="approvalMinute"
                  label="Giờ duyệt payroll"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-6 border-t border-border">
            <Button
              type="button"
              variant="outline"
              className="rounded-full px-6 font-semibold shadow-xs cursor-pointer"
              onClick={handleCancel}
            >
              Huỷ bỏ
            </Button>
            <Button
              type="submit"
              className="rounded-full px-8 font-semibold shadow-xs cursor-pointer"
              disabled={isPending || !isDirty}
            >
              {isPending ? "Đang xử lý..." : "Lưu thay đổi"}
            </Button>
          </div>
        </form>
      </Form>
    </SettingsPageLayout>
  )
}
