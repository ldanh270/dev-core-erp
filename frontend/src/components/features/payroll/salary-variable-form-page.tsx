import { EntityFormPage } from "@/components/common/entity-form-page"
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
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import type { ISalaryVariable } from "@/hooks/payroll/use-salary-variable"
import { useSalaryVariableForm } from "@/hooks/payroll/use-salary-variable-form"

interface SalaryVariableFormPageProps {
  initialData?: ISalaryVariable | null
  isReadOnly?: boolean
  onCancel: () => void
  onSuccess: () => void
  onEdit?: () => void
}

export function SalaryVariableFormPage({
  initialData,
  isReadOnly = false,
  onCancel,
  onSuccess,
  onEdit,
}: SalaryVariableFormPageProps) {
  const { form, isPending, onSubmit, handleFormatCode } = useSalaryVariableForm({
    initialData,
    onSuccess,
  })

  return (
    <EntityFormPage
      title={
        initialData ? (isReadOnly ? "Chi tiết biến số" : "Cập nhật biến số") : "Thêm mới biến số"
      }
      isReadOnly={isReadOnly}
      isPending={isPending}
      isDirty={form.formState.isDirty}
      formId="salary-variable-form"
      onBack={onCancel}
      onSubmit={onSubmit}
      onEdit={onEdit}
    >
      <Form {...form}>
        <form id="salary-variable-form" onSubmit={onSubmit} className="space-y-6">
          {/* Card Section 1: Thông tin chung */}
          <div className="bg-background border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-border bg-muted/20">
              <h2 className="font-semibold text-foreground">Thông tin chung</h2>
            </div>
            <div className="p-6 space-y-6">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mã biến (Code)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="MUC_LUONG_CO_SO"
                        className="rounded-full font-mono text-sm"
                        disabled={isReadOnly || !!initialData}
                        {...field}
                        onBlur={(e) => {
                          field.onBlur()
                          if (e.target.value) {
                            handleFormatCode(e.target.value)
                          }
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Mã biến phải được định dạng camelCase (ví dụ: mealAllowance) và không thể thay
                      đổi sau khi tạo.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tên biến</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Mức lương cơ sở"
                        className="rounded-full"
                        disabled={isReadOnly}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mô tả chi tiết</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Nhập mô tả cho biến số này..."
                        className="min-h-25 resize-y rounded-xl"
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

          {/* Card Section 2: Cấu hình */}
          <div className="bg-background border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-border bg-muted/20">
              <h2 className="font-semibold text-foreground">Cấu hình</h2>
            </div>
            <div className="p-6 space-y-6">
              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Giá trị mặc định</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        className="rounded-full"
                        disabled={isReadOnly}
                        {...field}
                        onChange={(e) => { field.onChange(e.target.value === "" ? 0 : Number(e.target.value)); }
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {initialData && (
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-xl border p-4 shadow-sm bg-muted/10">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Trạng thái hoạt động</FormLabel>
                        <FormDescription>
                          Biến số bị vô hiệu hóa sẽ không thể sử dụng trong các công thức tính lương
                          mới.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isReadOnly}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}
            </div>
          </div>
        </form>
      </Form>
    </EntityFormPage>
  )
}
