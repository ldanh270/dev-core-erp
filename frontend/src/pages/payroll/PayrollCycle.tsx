import { PageContainer, PageHeader } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form-ui"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ROUTES } from "@/config/routes.config"
import {
  type SettingsFormValues,
  usePayrollCycleForm,
} from "@/hooks/payroll/use-payroll-cycle-form"
import { usePayrollSettings } from "@/hooks/payroll/use-payroll-settings"
import { routerNavigate } from "@/lib/router-navigator"
import type { IPayrollSettings } from "@/types/payroll.types"

import { CalendarCheck, CalendarClock, Info, Settings2 } from "lucide-react"
import { type Control, useWatch } from "react-hook-form"

// --- Sub-components ---

function CycleContextPanel() {
  return (
    <div className="w-full lg:w-96 shrink-0 border-b lg:border-b-0 lg:border-r border-border bg-muted/20 p-6 md:p-8 flex flex-col gap-6">
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
                  Quy trình này chạy background job để tạo payroll trước, sau đó tự duyệt theo
                  lịch phát lương đã cấu hình.
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

function SchedulePreviewBadge({ control }: { control: Control<SettingsFormValues> }) {
  const triggerDay = useWatch({ control, name: "triggerDay" })
  const triggerHour = useWatch({ control, name: "triggerHour" })
  const triggerMinute = useWatch({ control, name: "triggerMinute" })
  const approvalDay = useWatch({ control, name: "approvalDay" })
  const approvalHour = useWatch({ control, name: "approvalHour" })
  const approvalMinute = useWatch({ control, name: "approvalMinute" })

  return (
    <div className="flex flex-wrap gap-2">
      <Badge
        variant="secondary"
        className="font-normal text-xs px-3 py-1 bg-primary/5 text-primary border-primary/10 rounded-full"
      >
        Tạo: ngày {triggerDay || "..."} lúc {triggerHour?.toString().padStart(2, "0") || "00"}:
        {triggerMinute?.toString().padStart(2, "0") || "00"}
      </Badge>
      <Badge
        variant="secondary"
        className="font-normal text-xs px-3 py-1 bg-success/10 text-success border-success/20 rounded-full"
      >
        Duyệt: ngày {approvalDay || "..."} lúc{" "}
        {approvalHour?.toString().padStart(2, "0") || "00"}:
        {approvalMinute?.toString().padStart(2, "0") || "00"}
      </Badge>
    </div>
  )
}

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
    <div className="space-y-3">
      <FormLabel className="text-sm font-medium text-foreground block">
        {label}
      </FormLabel>
      <div className="flex items-center gap-3 w-full max-w-sm">
        <FormField
          control={control}
          name={hourName}
          render={({ field }) => (
            <FormItem className="flex-1">
              <Select
                onValueChange={(val) => {
                  field.onChange(Number(val))
                }}
                value={field.value?.toString()}
              >
                <FormControl>
                  <SelectTrigger className="w-full rounded-full border-border h-10 px-4 shadow-xs">
                    <SelectValue placeholder="Giờ" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent position="popper" className="max-h-64 rounded-xl min-w-[130px]">
                  {Array.from({ length: 24 }).map((_, i) => (
                    <SelectItem key={i} value={i.toString()} className="rounded-lg whitespace-nowrap">
                      {i.toString().padStart(2, "0")} Giờ
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <span className="text-muted-foreground font-semibold text-base shrink-0 pb-1">:</span>
        <FormField
          control={control}
          name={minuteName}
          render={({ field }) => (
            <FormItem className="flex-1">
              <Select
                onValueChange={(val) => {
                  field.onChange(Number(val))
                }}
                value={field.value?.toString()}
              >
                <FormControl>
                  <SelectTrigger className="w-full rounded-full border-border h-10 px-4 shadow-xs">
                    <SelectValue placeholder="Phút" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent position="popper" className="max-h-64 rounded-xl min-w-[130px]">
                  {Array.from({ length: 60 }).map((_, i) => (
                    <SelectItem key={i} value={i.toString()} className="rounded-lg whitespace-nowrap">
                      {i.toString().padStart(2, "0")} Phút
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <FormDescription className="text-xs text-muted-foreground leading-relaxed pt-1">
        Nên chọn thời điểm ngoài giờ hành chính để hạn chế ảnh hưởng thao tác của HR và nhân viên.
      </FormDescription>
    </div>
  )
}

function ScheduleDayField({
  control,
  name,
  label,
  description,
}: {
  control: Control<SettingsFormValues>
  name: "triggerDay" | "approvalDay"
  label: string
  description: string
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="space-y-3">
          <div className="space-y-1">
            <FormLabel className="text-sm font-medium text-foreground">{label}</FormLabel>
            <FormDescription className="text-xs text-muted-foreground leading-relaxed min-h-[36px] flex items-start">
              {description}
            </FormDescription>
          </div>
          <Select
            onValueChange={(val) => {
              field.onChange(Number(val))
            }}
            value={field.value?.toString()}
          >
            <FormControl>
              <SelectTrigger className="w-full max-w-sm rounded-full border-border h-10 px-4 shadow-xs">
                <SelectValue placeholder="Chọn ngày (1-28)" />
              </SelectTrigger>
            </FormControl>
            <SelectContent position="popper" className="max-h-64 rounded-xl min-w-[200px]">
              {Array.from({ length: 28 }).map((_, i) => (
                <SelectItem key={i + 1} value={(i + 1).toString()} className="rounded-lg whitespace-nowrap">
                  Ngày {i + 1} hàng tháng
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

function PayrollCycleSkeleton() {
  return (
    <PageContainer variant="default" className="space-y-6">
      <PageHeader
        title="Thiết lập Chu kỳ lương"
        description="Quản lý lịch trình tự động tổng hợp và xử lý lương của tổ chức."
        backHref={ROUTES.PAYROLL.LIST}
        backLabel="Kỳ lương"
      />
      <Card className="w-full rounded-xl border-border overflow-hidden p-0 shadow-xs">
        <div className="flex flex-col lg:flex-row">
          <div className="p-6 md:p-8 lg:w-96 border-b lg:border-b-0 lg:border-r border-border bg-muted/20">
            <Skeleton className="h-6 w-3/4 mb-4 rounded-lg" />
            <Skeleton className="h-4 w-full mb-2 rounded-lg" />
            <Skeleton className="h-4 w-5/6 rounded-lg" />
          </div>
          <div className="p-6 md:p-8 lg:p-10 flex-1">
            <Skeleton className="h-8 w-1/3 mb-8 rounded-lg" />
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <Skeleton className="h-64 rounded-xl" />
              <Skeleton className="h-64 rounded-xl" />
            </div>
          </div>
        </div>
      </Card>
    </PageContainer>
  )
}

// --- Main Components ---

function PayrollCycleForm({ settings }: { settings: IPayrollSettings }) {
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
    <PageContainer variant="default" className="space-y-6">
      <PageHeader
        title="Thiết lập Chu kỳ lương"
        description="Quản lý lịch trình tự động tổng hợp và xử lý lương của tổ chức."
        backHref={ROUTES.PAYROLL.LIST}
        backLabel="Kỳ lương"
      />

      <Form {...form}>
        <form id="payroll-cycle-form" onSubmit={onSubmit} className="w-full">
          <Card className="w-full rounded-xl shadow-xs border-border overflow-hidden p-0">
            <div className="flex flex-col lg:flex-row">
              <CycleContextPanel />

              <div className="p-6 md:p-8 lg:p-10 flex-1 bg-background min-w-0">
                <div className="space-y-6">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <h3 className="text-lg font-medium tracking-tight">Chi tiết lịch trình</h3>
                    <SchedulePreviewBadge control={form.control} />
                  </div>

                  <Separator className="bg-border/50" />

                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <div className="rounded-xl border border-border bg-card/40 p-6 flex flex-col justify-between space-y-6">
                      <div className="flex items-center gap-3 pb-3 border-b border-border/50">
                        <div className="size-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                          <CalendarClock className="size-4 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm text-foreground">Tự động tạo payroll</h4>
                          <p className="text-xs text-muted-foreground">Tạo bảng lương nháp định kỳ</p>
                        </div>
                      </div>
                      <div className="space-y-6">
                        <ScheduleDayField
                          control={form.control}
                          name="triggerDay"
                          label="Ngày tạo payroll"
                          description="Ngày hệ thống tự tạo bảng lương nháp để nhân viên xem payslip và gửi feedback."
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
                </div>
              </div>
            </div>

            {/* Attached Card Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-border bg-muted/10 px-6 md:px-8 py-4">
              <Button
                type="button"
                variant="outline"
                className="rounded-full px-6 font-semibold shadow-xs"
                onClick={handleCancel}
              >
                Huỷ bỏ
              </Button>
              <Button
                type="submit"
                className="rounded-full px-8 font-semibold shadow-xs"
                disabled={isPending || !isDirty}
              >
                {isPending ? "Đang xử lý..." : "Lưu thay đổi"}
              </Button>
            </div>
          </Card>
        </form>
      </Form>
    </PageContainer>
  )
}

export default function PayrollCycle() {
  const { data: settings, isLoading: isSettingsLoading } = usePayrollSettings()

  if (isSettingsLoading || !settings) {
    return <PayrollCycleSkeleton />
  }

  return <PayrollCycleForm settings={settings} />
}
