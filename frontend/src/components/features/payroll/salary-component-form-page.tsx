import { EntityFormPage } from "@/components/common"
import {
  Form,
  FormControl,
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
import { Textarea } from "@/components/ui/textarea"
import {
  COMPONENT_TYPE_LABELS,
  COMPONENT_VALUE_TYPE_LABELS,
  FORMULA_VALIDATION_STATUS,
} from "@/config/entities/payroll.config"
import { useSalaryComponentForm } from "@/hooks/payroll/use-salary-component-form"
import { useSalaryVariables } from "@/hooks/payroll/use-salary-variable"
import type { ISalaryComponent } from "@/types/payroll.types"

import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react"

interface SalaryComponentFormPageProps {
  initialData?: ISalaryComponent | null
  isReadOnly?: boolean
  onSuccess: () => void
  onCancel: () => void
  onEdit?: () => void
}

const SYSTEM_VARS = [
  { code: "baseSalary", name: "Lương cơ bản" },
  { code: "workingDays", name: "Ngày công chuẩn" },
  { code: "actualWorkingDays", name: "Ngày làm thực tế" },
  { code: "overtimeMinutes", name: "Phút tăng ca" },
  { code: "paidLeaveDays", name: "Nghỉ phép có lương" },
  { code: "unpaidLeaveDays", name: "Nghỉ không lương" },
]

export function SalaryComponentFormPage({
  initialData,
  isReadOnly = false,
  onSuccess,
  onCancel,
  onEdit,
}: SalaryComponentFormPageProps) {
  const { form, isPending, formulaStatus, onSubmit, handleAutoGenerateCode, appendToFormula } =
    useSalaryComponentForm({ initialData, onSuccess })

  const { data: userVariables } = useSalaryVariables({ isActive: true })

  const isFormDirty = form.formState.isDirty

  return (
    <EntityFormPage
      title={
        isReadOnly
          ? "Chi tiết thành phần lương"
          : initialData
            ? "Cập nhật thành phần lương"
            : "Thêm thành phần lương mới"
      }
      isReadOnly={isReadOnly}
      isPending={isPending}
      isDirty={isFormDirty}
      formId="salary-component-form"
      onBack={onCancel}
      onEdit={onEdit}
      onSubmit={onSubmit}
    >
      <Form {...form}>
        <form id="salary-component-form" onSubmit={onSubmit} className="space-y-6">
          {/* Section 1: Thông tin cơ bản */}
          <div className="bg-background border border-border rounded-xl overflow-hidden shadow-none">
            <div className="px-6 py-4 border-b border-border bg-muted/50">
              <h2 className="font-semibold text-foreground">Thông tin cơ bản</h2>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="col-span-2 sm:col-span-1">
                      <FormLabel className="text-foreground">
                        Tên thành phần <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="VD: Phụ cấp đi lại"
                          className="rounded-full border-border shadow-none"
                          disabled={isReadOnly}
                          {...field}
                          onBlur={() => {
                            field.onBlur()
                            handleAutoGenerateCode()
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem className="col-span-2 sm:col-span-1">
                      <FormLabel className="text-foreground">Mã thành phần</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Tự động sinh hoặc nhập mã..."
                          className="rounded-full border-border shadow-none"
                          disabled={isReadOnly}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Mô tả chi tiết</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Mô tả điều kiện áp dụng thành phần này..."
                        className="rounded-xl border-border shadow-none min-h-20 resize-y"
                        disabled={isReadOnly}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Section 2: Phân loại & Giá trị */}
          <div className="bg-background border border-border rounded-xl overflow-hidden shadow-none">
            <div className="px-6 py-4 border-b border-border bg-muted/50">
              <h2 className="font-semibold text-foreground">Phân loại & Giá trị</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">
                        Loại thành phần <span className="text-destructive">*</span>
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isReadOnly}
                      >
                        <FormControl>
                          <SelectTrigger className="rounded-full border-border shadow-none h-10">
                            <SelectValue placeholder="Chọn loại thành phần" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl">
                          {Object.entries(COMPONENT_TYPE_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="valueType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">
                        Kiểu giá trị <span className="text-destructive">*</span>
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isReadOnly}
                      >
                        <FormControl>
                          <SelectTrigger className="rounded-full border-border shadow-none h-10">
                            <SelectValue placeholder="Chọn kiểu giá trị" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl">
                          {Object.entries(COMPONENT_VALUE_TYPE_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
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
          </div>

          {/* Section 3: Công thức tính toán */}
          <div className="bg-background border border-border rounded-xl overflow-hidden shadow-none">
            <div className="px-6 py-4 border-b border-border bg-muted/50">
              <h2 className="font-semibold text-foreground">Công thức tính toán</h2>
            </div>
            <div className="p-6 space-y-6">
              <FormField
                control={form.control}
                name="formula"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">
                      Công thức / Giá trị <span className="text-destructive">*</span>
                    </FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          placeholder="VD: baseSalary * 0.1 hoặc 500000"
                          className="rounded-full border-border shadow-none font-mono text-sm pr-10"
                          disabled={isReadOnly}
                          {...field}
                        />
                      </FormControl>
                      <div className="absolute right-3 top-2.5 flex items-center">
                        {formulaStatus === FORMULA_VALIDATION_STATUS.VALIDATING && (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        )}
                        {formulaStatus === FORMULA_VALIDATION_STATUS.VALID && (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        )}
                        {formulaStatus === FORMULA_VALIDATION_STATUS.INVALID && (
                          <AlertCircle className="h-4 w-4 text-destructive" />
                        )}
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Variable Chips */}
              {!isReadOnly && (
                <div className="space-y-3 pt-2">
                  <div className="text-sm font-medium text-muted-foreground">
                    Nhấp vào biến số để chèn vào công thức:
                  </div>

                  <div className="space-y-4">
                    {/* System variables */}
                    <div>
                      <div className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                        Biến hệ thống
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {SYSTEM_VARS.map((v) => (
                          <div
                            key={v.code}
                            onClick={() => {
                              appendToFormula(v.code)
                            }}
                            className="inline-flex items-center px-2.5 py-1 rounded-full border border-border bg-muted/50 hover:bg-accent hover:border-primary/30 text-xs font-mono cursor-pointer transition-colors"
                            title={v.name}
                          >
                            {v.code}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* User defined variables */}
                    {userVariables && userVariables.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                          Biến tùy chỉnh
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {userVariables.map((v) => (
                            <div
                              key={v.id}
                              onClick={() => {
                                appendToFormula(v.code)
                              }}
                              className="inline-flex items-center px-2.5 py-1 rounded-full border border-border bg-primary/5 hover:bg-primary/10 hover:border-primary/30 text-primary text-xs font-mono cursor-pointer transition-colors"
                              title={v.name}
                            >
                              {v.code}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </form>
      </Form>
    </EntityFormPage>
  )
}
