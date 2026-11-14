import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { RECRUITMENT_FORM_FIELD_TYPES } from "@/config/entities/recruitment.config"
import type { RecruitmentFormField, RecruitmentFormFieldType } from "@/types/recruitment.types"

import { LockKeyhole, Plus, Trash2 } from "lucide-react"

const SYSTEM_FIELD_KEYS = new Set(["full_name", "email", "phone", "cv_url", "notes"])

interface Props {
  fields: RecruitmentFormField[]
  onChange: (fields: RecruitmentFormField[]) => void
}

export function RecruitmentFormFieldEditor({ fields, onChange }: Props) {
  const updateField = (index: number, patch: Partial<RecruitmentFormField>) => {
    onChange(
      fields.map((field, fieldIndex) => (fieldIndex === index ? { ...field, ...patch } : field)),
    )
  }

  const addField = () => {
    let suffix = fields.length + 1
    while (fields.some((field) => field.key === `custom_field_${suffix}`)) suffix += 1
    onChange([
      ...fields,
      { key: `custom_field_${suffix}`, label: "", type: "short_text", required: false },
    ])
  }

  const removeField = (index: number) => {
    onChange(fields.filter((_, fieldIndex) => fieldIndex !== index))
  }

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Label>Các trường ứng viên cần điền</Label>
          <p className="mt-1 text-xs text-muted-foreground">
            Mã field dùng để nối đúng dữ liệu khi đồng bộ từ Google Forms.
          </p>
        </div>
        <Button type="button" size="sm" variant="outline" onClick={addField}>
          <Plus className="mr-2 h-4 w-4" />
          Thêm field
        </Button>
      </div>

      <div className="grid gap-3">
        {fields.map((field, index) => {
          const isSystemField = SYSTEM_FIELD_KEYS.has(field.key)
          const isLocked = field.key === "full_name" || field.key === "email"
          return (
            <div
              key={`${field.key}-${index}`}
              className="grid gap-3 rounded-lg border border-border p-4 sm:grid-cols-[1.4fr_1fr_auto]"
            >
              <div className="grid gap-2">
                <Label htmlFor={`field-label-${index}`}>
                  Nhãn hiển thị{" "}
                  <span className="text-destructive" aria-hidden="true">
                    *
                  </span>
                </Label>
                <Input
                  id={`field-label-${index}`}
                  value={field.label}
                  disabled={isSystemField}
                  onChange={(event) => {
                    updateField(index, { label: event.target.value })
                  }}
                  placeholder="Ví dụ: Kinh nghiệm nổi bật"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`field-key-${index}`}>
                  Mã field{" "}
                  <span className="text-destructive" aria-hidden="true">
                    *
                  </span>
                </Label>
                <Input
                  id={`field-key-${index}`}
                  value={field.label ? field.key : ""}
                  disabled={isSystemField}
                  onChange={(event) => {
                    updateField(index, { key: event.target.value.toLowerCase() })
                  }}
                  placeholder="kinh_nghiem_noi_bat"
                  className="font-mono"
                />
              </div>
              <div className="flex items-end justify-between gap-3 sm:justify-end">
                {isLocked ? (
                  <span className="flex h-12 items-center gap-2 text-xs font-medium text-muted-foreground">
                    <LockKeyhole className="h-4 w-4" />
                    Bắt buộc
                  </span>
                ) : (
                  <div className="flex h-12 items-center gap-2">
                    <Switch
                      id={`field-required-${index}`}
                      checked={field.required}
                      onCheckedChange={(required) => {
                        updateField(index, { required })
                      }}
                    />
                    <Label htmlFor={`field-required-${index}`} className="text-xs">
                      Bắt buộc
                    </Label>
                  </div>
                )}
                {!isSystemField && (
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      removeField(index)
                    }}
                    aria-label={`Xóa field ${field.label || field.key}`}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
              {!isSystemField && (
                <div className="grid gap-2 sm:col-span-2">
                  <Label>Kiểu câu trả lời</Label>
                  <Select
                    value={field.type}
                    onValueChange={(type) => {
                      updateField(index, { type: type as RecruitmentFormFieldType })
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RECRUITMENT_FORM_FIELD_TYPES.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
