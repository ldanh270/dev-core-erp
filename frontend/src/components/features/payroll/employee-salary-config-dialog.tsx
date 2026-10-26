import { DatePicker } from "@/components/common"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form-ui"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { PAYROLL_MESSAGES } from "@/config/messages/payroll.message"
import {
  useActiveSalaryConfig,
  useAssignSalaryConfig,
  usePayslipTemplates,
  useSalaryConfigHistory,
} from "@/hooks/payroll/use-employee-salary-config"
import { usePermission } from "@/hooks/use-permission"

import { useEffect, useState } from "react"

import { zodResolver } from "@hookform/resolvers/zod"
import { Calendar, History, Loader2, Save, User } from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

const formSchema = z.object({
  templateId: z.string().min(1, "Vui lòng chọn mẫu phiếu lương"),
  baseSalary: z.number().min(0, "Lương cơ bản không được âm"),
  effectiveFrom: z.string().min(1, "Vui lòng nhập ngày áp dụng"),
  note: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  employee: { id: string; fullName: string; position?: string } | null
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val)
}

const formatDate = (dateString?: string) => {
  if (!dateString) return "-"
  return new Date(dateString).toLocaleDateString("vi-VN")
}

export default function EmployeeSalaryConfigDialog({ open, onOpenChange, employee }: Props) {
  const { hasPermission } = usePermission()
  const canReadConfig = hasPermission("payroll.read")

  const [activeTab, setActiveTab] = useState<string>("config")

  const { data: templates } = usePayslipTemplates()
  const { data: activeConfig, isLoading: isActiveLoading } = useActiveSalaryConfig(
    employee?.id || "",
  )
  const { data: history, isLoading: isHistoryLoading } = useSalaryConfigHistory(employee?.id || "")
  const assignMutation = useAssignSalaryConfig()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      templateId: "",
      baseSalary: 0,
      effectiveFrom: new Date().toISOString().split("T")[0],
      note: "",
    },
  })

  const { reset } = form

  const [prevOpen, setPrevOpen] = useState(false)
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) {
      setActiveTab("config")
    }
  }

  // Set default values when active config is loaded
  useEffect(() => {
    if (open && activeConfig) {
      reset({
        templateId: activeConfig.templateId,
        baseSalary: Number(activeConfig.baseSalary),
        effectiveFrom: new Date(activeConfig.effectiveFrom).toISOString().split("T")[0],
        note: activeConfig.note || "",
      })
    } else if (open) {
      reset({
        templateId: "",
        baseSalary: 0,
        effectiveFrom: new Date().toISOString().split("T")[0],
        note: "",
      })
    }
  }, [open, activeConfig, reset])

  const onSubmit = async (values: FormValues) => {
    if (!employee) return

    try {
      await assignMutation.mutateAsync({
        employeeId: employee.id,
        templateId: values.templateId,
        baseSalary: values.baseSalary,
        effectiveFrom: new Date(values.effectiveFrom).toISOString(),
        note: values.note,
      })
      toast.success(PAYROLL_MESSAGES.SUCCESS.UPDATE_SALARY_CONFIG)
      onOpenChange(false)
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } }
      toast.error(error.response?.data?.message || PAYROLL_MESSAGES.ERRORS.UPDATE_SALARY_CONFIG)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-162.5 max-h-[85vh] flex flex-col rounded-xl overflow-hidden p-0">
        <DialogHeader className="px-6 pt-5 pb-3 border-b bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <User className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">
                Cấu hình lương: {employee?.fullName}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {employee?.position || "Nhân viên"} • ID: {employee?.id ? employee.id.slice(-6).toUpperCase() : "—"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col min-h-0"
        >
          <div className="px-6 py-3 border-b border-border/50">
            <TabsList className="bg-muted/50 rounded-lg p-1">
              {canReadConfig && (
                <>
                  <TabsTrigger value="config" className="rounded-md gap-1.5 py-1.5 px-4 text-xs">
                    <Save className="h-3.5 w-3.5" /> Gán mẫu phiếu lương
                  </TabsTrigger>
                  <TabsTrigger value="history" className="rounded-md gap-1.5 py-1.5 px-4 text-xs">
                    <History className="h-3.5 w-3.5" /> Lịch sử thiết lập
                  </TabsTrigger>
                </>
              )}
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto p-6 min-h-0">
            {canReadConfig && (
              <>
                <TabsContent value="config" className="mt-0 outline-none">
              {isActiveLoading ? (
                <div className="flex h-40 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 text-xs">
                    <div className="grid grid-cols-2 gap-4">
                      {/* Template */}
                      <FormField
                        control={form.control}
                        name="templateId"
                        render={({ field }) => (
                          <FormItem className="col-span-2 bg-muted/20 p-4 rounded-xl border border-border/50">
                            <FormLabel className="text-sm font-semibold text-foreground">
                              Mẫu phiếu lương áp dụng
                            </FormLabel>
                            <FormDescription className="text-xs mb-2">
                              Nhân sự sẽ được tính lương tự động dựa trên các thành phần
                              (components) của mẫu này.
                            </FormDescription>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="rounded-md h-10 bg-background">
                                  <SelectValue placeholder="-- Chọn mẫu phiếu lương --" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {templates?.map((t) => (
                                  <SelectItem key={t.id} value={t.id}>
                                    {t.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Base Salary */}
                      <FormField
                        control={form.control}
                        name="baseSalary"
                        render={({ field }) => (
                          <FormItem className="col-span-2 md:col-span-1">
                            <FormLabel className="font-semibold">Lương cơ bản (VND)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                className="rounded-md h-9"
                                placeholder="Nhập lương cơ bản..."
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Effective Date */}
                      <FormField
                        control={form.control}
                        name="effectiveFrom"
                        render={({ field }) => (
                          <FormItem className="col-span-2 md:col-span-1">
                            <FormLabel className="font-semibold">Ngày áp dụng</FormLabel>
                            <FormControl>
                              <DatePicker
                                value={field.value || null}
                                onChange={(val) => field.onChange(val || "")}
                                placeholder="Chọn ngày áp dụng..."
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Note */}
                      <FormField
                        control={form.control}
                        name="note"
                        render={({ field }) => (
                          <FormItem className="col-span-2 border-t pt-4">
                            <FormLabel className="font-semibold">Ghi chú thay đổi</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Lý do thay đổi lương hoặc ghi chú thêm..."
                                className="rounded-lg resize-none min-h-16"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription className="text-[10px]">
                              Sẽ được ghi lại trong lịch sử để đối chiếu sau này.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <DialogFooter className="pt-4 border-t gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="rounded-full"
                      >
                        Hủy
                      </Button>
                      <Button
                        type="submit"
                        disabled={assignMutation.isPending}
                        className="rounded-full"
                      >
                        {assignMutation.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Lưu cấu hình
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              )}
            </TabsContent>

            <TabsContent value="history" className="mt-0 outline-none">
              {isHistoryLoading ? (
                <div className="flex h-40 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : !history || history.length === 0 ? (
                <div className="flex h-40 items-center justify-center text-muted-foreground text-xs">
                  Chưa có lịch sử thay đổi cấu hình lương nào.
                </div>
              ) : (
                <div className="relative pl-6 border-l border-muted space-y-6 text-xs">
                  {history.map((h) => {
                    return (
                      <div key={h.id} className="relative">
                        {/* Timeline Bullet */}
                        <div className="absolute -left-8.5 top-0.5 h-5 w-5 rounded-full border border-background bg-muted flex items-center justify-center">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                        </div>

                        <div className="bg-muted/30 hover:bg-muted/50 p-3 rounded-lg border border-border/50 transition-colors">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-bold text-foreground">
                              Áp dụng từ: {formatDate(h.effectiveFrom)}
                            </span>
                            {h.effectiveTo ? (
                              <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                Đến: {formatDate(h.effectiveTo)}
                              </span>
                            ) : (
                              <span className="text-[10px] text-success bg-success/10 px-2 py-0.5 rounded-full">
                                Đang hoạt động
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-muted-foreground mb-2">
                            <div>
                              Lương cơ bản:{" "}
                              <span className="font-semibold text-foreground">
                                {formatCurrency(Number(h.baseSalary))}
                              </span>
                            </div>
                          </div>

                          {h.note && (
                            <div className="mt-2 text-[11px] text-muted-foreground italic bg-background p-1.5 rounded border border-border/30">
                              Ghi chú: {h.note}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </TabsContent>
              </>
            )}
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
