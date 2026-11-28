import { Button } from "@/components/ui/button"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import {
  type ExtendedFormData,
  usePayslipTemplateForm,
} from "@/hooks/payroll/use-payslip-template-form"
import type { IPayslipTemplate } from "@/types/payroll.types"
import { ChevronLeft, Minus, Plus } from "lucide-react"
import type { FieldArrayWithId, UseFormReturn } from "react-hook-form"
import { SalaryComponentSelectModal } from "./SalaryComponentSelectModal"

/**
 * Form presenter component for creating or editing payslip templates with component rules.
 */
export interface CreatePayslipTemplateFormProps {
  initialData?: IPayslipTemplate | null
  isReadOnly?: boolean
  onSuccess?: () => void
  onCancel?: () => void
  onEdit?: () => void
}

/** Presenter card for template code, name, and description inputs. */
function TemplateBasicInfoCard({
  form,
  isReadOnly,
}: {
  form: UseFormReturn<ExtendedFormData>
  isReadOnly?: boolean
}) {
  return (
    <div className="bg-background border border-border rounded-xl overflow-hidden shadow-none">
      <div className="px-6 py-4 border-b border-border bg-muted/50">
        <h2 className="font-semibold text-foreground">Thông tin mẫu phiếu lương</h2>
      </div>
      <div className="p-6 space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">
                Tên mẫu phiếu lương <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Nhập tên mẫu phiếu lương"
                  {...field}
                  className="rounded-full border-border shadow-none"
                  disabled={isReadOnly}
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
              <FormLabel className="text-foreground">Mô tả</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Nhập mô tả"
                  {...field}
                  className="rounded-xl border-border shadow-none min-h-25 resize-y"
                  disabled={isReadOnly}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  )
}

/** Presenter table listing selected salary components and formula ordering. */
function TemplateSalaryComponentsTable({
  form,
  fields,
  remove,
  isReadOnly,
  onOpenSelectModal,
}: {
  form: UseFormReturn<ExtendedFormData>
  fields: FieldArrayWithId<ExtendedFormData, "components", "id">[]
  remove: (index: number) => void
  isReadOnly?: boolean
  onOpenSelectModal: () => void
}) {
  return (
    <div className="bg-background border border-border rounded-xl overflow-hidden shadow-none">
      <div className="px-6 py-4 border-b border-border bg-muted/50 flex items-center justify-between">
        <h2 className="font-semibold text-foreground">Thành phần lương</h2>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Sao chép mẫu lương đã có</span>
          <Select disabled={isReadOnly}>
            <SelectTrigger className="w-50 rounded-full border-border h-11 bg-card shadow-none focus:ring-1 focus:ring-primary">
              <SelectValue placeholder="Chọn mẫu lương..." />
            </SelectTrigger>
            <SelectContent className="border-border rounded-xl shadow-sm">
              <SelectItem value="none" disabled>
                Chưa có mẫu nào
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="p-6">
        <div className="border border-border rounded-xl overflow-hidden bg-background mb-4">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="border-b border-border hover:bg-transparent">
                <TableHead className="font-semibold text-foreground">Tên thành phần</TableHead>
                <TableHead className="font-semibold text-foreground">Tên cột hiển thị</TableHead>
                <TableHead className="font-semibold text-foreground">Giá trị tính</TableHead>
                <TableHead className="text-center font-semibold text-foreground w-20">
                  Thao tác
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fields.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12">
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-full border-primary text-primary hover:bg-primary/10 shadow-none px-6"
                      onClick={onOpenSelectModal}
                      disabled={isReadOnly}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Thêm thành phần
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                fields.map((field, index) => (
                  <TableRow key={field.id} className="border-b border-border hover:bg-muted/50">
                    <TableCell>
                      <Input
                        disabled
                        value={field._name}
                        className="bg-transparent border-none shadow-none text-foreground px-0 disabled:opacity-100"
                      />
                    </TableCell>
                    <TableCell>
                      <FormField
                        control={form.control}
                        name={`components.${index}._displayName`}
                        render={({ field: inputField }) => (
                          <Input
                            {...inputField}
                            className="rounded-full border-border shadow-none h-8 text-foreground"
                            disabled={isReadOnly}
                          />
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      <FormField
                        control={form.control}
                        name={`components.${index}.overrideFormula`}
                        render={({ field: inputField }) => (
                          <Input
                            {...inputField}
                            className="rounded-full border-border shadow-none h-8 font-mono text-sm text-foreground"
                            disabled={isReadOnly}
                          />
                        )}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => remove(index)}
                        disabled={isReadOnly}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {!isReadOnly && fields.length > 0 && (
          <div className="flex justify-center mt-4">
            <Button
              type="button"
              variant="outline"
              className="rounded-full border-primary text-primary hover:bg-primary/10 shadow-none px-6"
              onClick={onOpenSelectModal}
            >
              <Plus className="w-4 h-4 mr-2" />
              Thêm thành phần
            </Button>
          </div>
        )}
        {form.formState.errors.components?.root && (
          <p className="text-sm font-medium text-destructive mt-2 text-center">
            {form.formState.errors.components.root.message}
          </p>
        )}
      </div>
    </div>
  )
}

/** Presenter footer containing submission and cancel buttons for template form. */
function TemplateFormFooter({
  isReadOnly,
  isPending,
  isDirty,
  onCancel,
  onEdit,
}: {
  isReadOnly?: boolean
  isPending?: boolean
  isDirty?: boolean
  onCancel?: () => void
  onEdit?: () => void
}) {
  return (
    <div className="sticky bottom-0 z-10 flex items-center justify-end gap-3 px-6 py-4 bg-background border-t border-border">
      {isReadOnly ? (
        <>
          <Button
            key="close-btn"
            type="button"
            variant="outline"
            className="rounded-full border-border hover:bg-accent shadow-none px-8"
            onClick={onCancel}
          >
            Đóng
          </Button>
          <Button
            key="edit-btn"
            type="button"
            className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-none px-8"
            onClick={(e) => {
              e.preventDefault()
              onEdit?.()
            }}
          >
            Chỉnh sửa
          </Button>
        </>
      ) : (
        <>
          <Button
            key="cancel-btn"
            type="button"
            variant="outline"
            className="rounded-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground shadow-none px-8"
            onClick={onCancel}
          >
            Huỷ bỏ
          </Button>
          <Button
            key="save-btn"
            type="submit"
            form="create-template-form"
            className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-none px-10"
            disabled={isPending || !isDirty}
          >
            {isPending ? "Đang lưu..." : "Lưu"}
          </Button>
        </>
      )}
    </div>
  )
}

/** Master form component allowing creation and editing of payslip templates. */
export function CreatePayslipTemplateForm({
  initialData,
  isReadOnly = false,
  onSuccess,
  onCancel,
  onEdit,
}: CreatePayslipTemplateFormProps) {
  const {
    form,
    fields,
    remove,
    existingComponentIds,
    handleSelectComponents,
    isModalOpen,
    setIsModalOpen,
    isPending,
    onSubmit,
  } = usePayslipTemplateForm({ initialData, onSuccess })

  return (
    <div className="flex flex-col h-full min-h-screen bg-muted/30">
      <div className="sticky top-0 z-10 flex items-center gap-4 px-6 py-4 bg-background border-b border-border">
        <Button
          variant="ghost"
          size="icon"
          onClick={onCancel}
          className="rounded-full hover:bg-accent"
        >
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </Button>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          {isReadOnly
            ? "Chi tiết mẫu phiếu lương"
            : initialData
              ? "Cập nhật mẫu phiếu lương"
              : "Tạo mới mẫu phiếu lương"}
        </h1>
      </div>

      <div className="flex-1 max-w-5xl w-full mx-auto p-6 space-y-6">
        <Form {...form}>
          <form
            id="create-template-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6"
          >
            <TemplateBasicInfoCard form={form} isReadOnly={isReadOnly} />

            <TemplateSalaryComponentsTable
              form={form}
              fields={fields}
              remove={remove}
              isReadOnly={isReadOnly}
              onOpenSelectModal={() => setIsModalOpen(true)}
            />
          </form>
        </Form>
      </div>

      <TemplateFormFooter
        isReadOnly={isReadOnly}
        isPending={isPending}
        isDirty={form.formState.isDirty}
        onCancel={onCancel}
        onEdit={onEdit}
      />

      <SalaryComponentSelectModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        existingComponentIds={existingComponentIds}
        onSelect={handleSelectComponents}
      />
    </div>
  )
}
