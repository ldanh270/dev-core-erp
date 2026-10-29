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
import { PAYROLL_MESSAGES } from "@/config/messages/payroll.message"
import {
  useCreatePayslipTemplate,
  useUpdatePayslipTemplate,
} from "@/hooks/payroll/use-payslip-templates"
import {
  type CreatePayslipTemplateFormData,
  createPayslipTemplateSchema,
} from "@/schemas/payroll.schema"
import type { IPayslipTemplate, ISalaryComponent } from "@/types/payroll.types"

import { useState } from "react"

import { zodResolver } from "@hookform/resolvers/zod"
import { ChevronLeft, Minus, Plus } from "lucide-react"
import { useFieldArray, useForm } from "react-hook-form"
import { toast } from "sonner"

import { SalaryComponentSelectModal } from "./SalaryComponentSelectModal"

// Extend the form data to hold the local UI state for columns shown in the mockup
interface ExtendedFormData extends CreatePayslipTemplateFormData {
  components: Array<{
    componentId: string
    overrideFormula?: string
    // UI Only properties
    _name?: string
    _code?: string
    _displayName?: string
    _isDisplayed?: boolean
  }>
}

interface CreatePayslipTemplateFormProps {
  initialData?: IPayslipTemplate | null
  isReadOnly?: boolean
  onSuccess?: () => void
  onCancel?: () => void
  onEdit?: () => void
}

export function CreatePayslipTemplateForm({
  initialData,
  isReadOnly = false,
  onSuccess,
  onCancel,
  onEdit,
}: CreatePayslipTemplateFormProps) {
  const { mutateAsync: createTemplate, isPending: isCreating } = useCreatePayslipTemplate()
  const { mutateAsync: updateTemplate, isPending: isUpdating } = useUpdatePayslipTemplate()
  const isPending = isCreating || isUpdating

  const [isModalOpen, setIsModalOpen] = useState(false)

  const form = useForm<ExtendedFormData>({
    resolver: zodResolver(createPayslipTemplateSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      components:
        initialData?.components?.map((c) => ({
          componentId: c.componentId,
          overrideFormula: c.overrideFormula || c.component.formula || undefined,
          _name: c.component.name,
          _displayName: c.component.name,
          _isDisplayed: true,
        })) || [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "components",
  })

  const existingComponentIds = fields.map((f) => f.componentId)

  const handleSelectComponents = (selectedComps: ISalaryComponent[]) => {
    selectedComps.forEach((comp) => {
      append({
        componentId: comp.id,
        overrideFormula: comp.formula,
        _name: comp.name,
        _displayName: comp.name,
        _isDisplayed: true,
      })
    })
  }

  const handleCopyTemplate = (templateId: string) => {
    // TODO: implement template copying
    console.log("Copy template", templateId)
  }

  const onSubmit = async (data: ExtendedFormData) => {
    try {
      // Strip UI-only properties before sending to API
      const payload = {
        name: data.name,
        description: data.description,
        components: data.components.map((c) => ({
          componentId: c.componentId,
          overrideFormula: c.overrideFormula?.trim() || undefined,
        })),
      }
      if (initialData?.id) {
        await updateTemplate({ id: initialData.id, ...payload })
        toast.success(PAYROLL_MESSAGES.SUCCESS.UPDATE_PAYSLIP_TEMPLATE)
      } else {
        await createTemplate(payload)
        toast.success(PAYROLL_MESSAGES.SUCCESS.CREATE_PAYSLIP_TEMPLATE)
      }
      form.reset()
      onSuccess?.()
    } catch {
      toast.error(PAYROLL_MESSAGES.ERRORS.SAVE_PAYSLIP_TEMPLATE)
    }
  }

  return (
    <div className="flex flex-col h-full min-h-screen bg-muted/30">
      {/* Header Bar */}
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
            {/* Section 1: Thông tin mẫu phiếu lương */}
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

            {/* Section 2: Thành phần lương */}
            <div className="bg-background border border-border rounded-xl overflow-hidden shadow-none">
              <div className="px-6 py-4 border-b border-border bg-muted/50 flex items-center justify-between">
                <h2 className="font-semibold text-foreground">Thành phần lương</h2>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">Sao chép mẫu lương đã có</span>
                  <Select onValueChange={handleCopyTemplate} disabled={isReadOnly}>
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
                        <TableHead className="font-semibold text-foreground">
                          Tên thành phần
                        </TableHead>
                        <TableHead className="font-semibold text-foreground">
                          Tên cột hiển thị
                        </TableHead>
                        <TableHead className="font-semibold text-foreground">
                          Giá trị tính
                        </TableHead>
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
                              onClick={() => setIsModalOpen(true)}
                              disabled={isReadOnly}
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Thêm thành phần
                            </Button>
                          </TableCell>
                        </TableRow>
                      ) : (
                        fields.map((field, index) => (
                          <TableRow
                            key={field.id}
                            className="border-b border-border hover:bg-muted/50"
                          >
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
                      onClick={() => setIsModalOpen(true)}
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
          </form>
        </Form>
      </div>

      {/* Footer Bar */}
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
              disabled={isPending || !form.formState.isDirty}
            >
              {isPending ? "Đang lưu..." : "Lưu"}
            </Button>
          </>
        )}
      </div>

      <SalaryComponentSelectModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        existingComponentIds={existingComponentIds}
        onSelect={handleSelectComponents}
      />
    </div>
  )
}
