import { useState } from "react"
import { DatePicker } from "@/components/common"
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

import { cn } from "@/lib/utils"
import { getBioFieldError } from "@/lib/employee-form-validation"
import type {
  IEducationItem,
  IEmployeeWizardFormData,
  IExperienceItem,
} from "@/types/employee-wizard.types"
import {
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  PlusCircle,
  Trash2,
  User,
} from "lucide-react"

interface BioTabProps {
  formData: IEmployeeWizardFormData
  updateField: <K extends keyof IEmployeeWizardFormData>(
    field: K,
    value: IEmployeeWizardFormData[K]
  ) => void
  addEducation: () => void
  updateEducation: (id: string, field: keyof IEducationItem, value: string) => void
  removeEducation: (id: string) => void
  addExperience: () => void
  updateExperience: (id: string, field: keyof IExperienceItem, value: string) => void
  removeExperience: (id: string) => void
  hasAttemptedSubmit?: boolean
}

export function BioTab({
  formData,
  updateField,
  addEducation,
  updateEducation,
  removeEducation,
  addExperience,
  updateExperience,
  removeExperience,
  hasAttemptedSubmit,
}: BioTabProps) {
  // Collapsible section states
  const [openPersonal, setOpenPersonal] = useState(true)
  const [openIdPhotos, setOpenIdPhotos] = useState(true)
  const [openContact, setOpenContact] = useState(true)

  // OnBlur touch tracking
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({})
  const handleBlur = (field: string) => {
    setTouchedFields((prev) => ({ ...prev, [field]: true }))
  }
  const fullNameError = getBioFieldError("fullName", formData.fullName)
  const phoneError = getBioFieldError("phone", formData.phone)
  const emailError = getBioFieldError("email", formData.email)

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ── 1. Thông tin cá nhân ────────────────────────────────────────── */}
      <div className="bg-background border border-border rounded-xl overflow-hidden shadow-none">
        <button
          type="button"
          onClick={() => { setOpenPersonal(!openPersonal); }}
          className="w-full px-6 py-4 flex items-center justify-between bg-muted/50 border-b border-border text-left font-semibold text-sm text-foreground"
        >
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">
              {openPersonal ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </span>
            <h2 className="font-semibold text-foreground">Thông tin cá nhân</h2>
          </div>
        </button>

        {openPersonal && (
          <div className="p-6 space-y-6">
            {/* Avatar & Core Fields */}
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="flex flex-col items-center gap-2">
                <div className="w-24 h-24 rounded-full border border-dashed border-border bg-muted/30 flex items-center justify-center relative overflow-hidden">
                  <User size={36} className="text-muted-foreground" />
                </div>
              </div>

              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">
                    Họ và tên <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    placeholder="Nhập họ và tên"
                    value={formData.fullName}
                    onChange={(e) => { updateField("fullName", e.target.value); }}
                    onBlur={() => { handleBlur("fullName"); }}
                    className={cn(
                      "rounded-full",
                      (touchedFields.fullName || hasAttemptedSubmit) && fullNameError && "border-destructive ring-1 ring-destructive"
                    )}
                    required
                  />
                  {(touchedFields.fullName || hasAttemptedSubmit) && fullNameError && (
                    <p className="text-xs text-destructive font-medium mt-1">{fullNameError}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Giới tính</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(val) => { updateField("gender", val); }}
                  >
                    <SelectTrigger className="rounded-full">
                      <SelectValue placeholder="Chọn giới tính" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Nam</SelectItem>
                      <SelectItem value="female">Nữ</SelectItem>
                      <SelectItem value="other">Khác</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Ngày sinh</Label>
                  <DatePicker
                    value={formData.dateOfBirth || null}
                    onChange={(val) => { updateField("dateOfBirth", val || ""); }}
                    placeholder="Chọn ngày sinh..."
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Nơi sinh</Label>
                  <Input
                    placeholder="Chọn nơi sinh"
                    value={formData.placeOfBirth}
                    onChange={(e) => { updateField("placeOfBirth", e.target.value); }}
                    className="rounded-full"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Quốc tịch</Label>
                  <Input
                    placeholder="Việt Nam"
                    value={formData.nationality}
                    onChange={(e) => { updateField("nationality", e.target.value); }}
                    className="rounded-full"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Dân tộc</Label>
                  <Input
                    placeholder="Kinh"
                    value={formData.ethnicity}
                    onChange={(e) => { updateField("ethnicity", e.target.value); }}
                    className="rounded-full"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Tôn giáo</Label>
                  <Input
                    placeholder="Nhập tôn giáo"
                    value={formData.religion}
                    onChange={(e) => { updateField("religion", e.target.value); }}
                    className="rounded-full"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">CMND/CCCD/Hộ chiếu</Label>
                  <Input
                    placeholder="Nhập CMND/CCCD/Hộ chiếu"
                    value={formData.nationalId}
                    onChange={(e) => { updateField("nationalId", e.target.value); }}
                    className="rounded-full"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Ngày cấp</Label>
                  <DatePicker
                    value={formData.idIssueDate || null}
                    onChange={(val) => { updateField("idIssueDate", val || ""); }}
                    placeholder="Chọn ngày cấp..."
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Nơi cấp</Label>
                  <Input
                    placeholder="Chọn nơi cấp"
                    value={formData.idIssuePlace}
                    onChange={(e) => { updateField("idIssuePlace", e.target.value); }}
                    className="rounded-full"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Thường trú</Label>
                  <Input
                    placeholder="Địa chỉ thường trú"
                    value={formData.permanentAddress}
                    onChange={(e) => { updateField("permanentAddress", e.target.value); }}
                    className="rounded-full"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Tỉnh/Thành phố</Label>
                  <Input
                    placeholder="Chọn Tỉnh/Thành phố"
                    value={formData.province}
                    onChange={(e) => { updateField("province", e.target.value); }}
                    className="rounded-full"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Phường/Xã</Label>
                  <Input
                    placeholder="Chọn Xã/Phường"
                    value={formData.district}
                    onChange={(e) => { updateField("district", e.target.value); }}
                    className="rounded-full"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Tình trạng hôn nhân</Label>
                  <Select
                    value={formData.maritalStatus}
                    onValueChange={(val) => { updateField("maritalStatus", val); }}
                  >
                    <SelectTrigger className="rounded-full">
                      <SelectValue placeholder="Chọn tình trạng" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Độc thân</SelectItem>
                      <SelectItem value="married">Đã kết hôn</SelectItem>
                      <SelectItem value="divorced">Đã ly hôn</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── 2. Ảnh CMND/CCCD ────────────────────────────────────────────── */}
      <div className="bg-background border border-border rounded-xl overflow-hidden shadow-none">
        <button
          type="button"
          onClick={() => { setOpenIdPhotos(!openIdPhotos); }}
          className="w-full px-6 py-4 flex items-center justify-between bg-muted/50 border-b border-border text-left font-semibold text-sm text-foreground"
        >
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">
              {openIdPhotos ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </span>
            <h2 className="font-semibold text-foreground">Ảnh CMND/CCCD</h2>
          </div>
        </button>

        {openIdPhotos && (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">Ảnh mặt trước</Label>
              <div className="h-36 border-2 border-dashed border-border rounded-xl bg-muted/10 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/20 transition-colors">
                <ImageIcon className="w-8 h-8 text-muted-foreground mb-1" />
                <span className="text-xs text-muted-foreground">Tải ảnh mặt trước</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">Ảnh mặt sau</Label>
              <div className="h-36 border-2 border-dashed border-border rounded-xl bg-muted/10 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/20 transition-colors">
                <ImageIcon className="w-8 h-8 text-muted-foreground mb-1" />
                <span className="text-xs text-muted-foreground">Tải ảnh mặt sau</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── 3. Thông tin liên hệ ─────────────────────────────────────────── */}
      <div className="bg-background border border-border rounded-xl overflow-hidden shadow-none">
        <button
          type="button"
          onClick={() => { setOpenContact(!openContact); }}
          className="w-full px-6 py-4 flex items-center justify-between bg-muted/50 border-b border-border text-left font-semibold text-sm text-foreground"
        >
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">
              {openContact ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </span>
            <h2 className="font-semibold text-foreground">Thông tin liên hệ</h2>
          </div>
        </button>

        {openContact && (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                Số điện thoại <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="Nhập số điện thoại"
                value={formData.phone}
                onChange={(e) => { updateField("phone", e.target.value); }}
                onBlur={() => { handleBlur("phone"); }}
                className={cn(
                  "rounded-full",
                  (touchedFields.phone || hasAttemptedSubmit) && phoneError && "border-destructive ring-1 ring-destructive"
                )}
                required
              />
              {(touchedFields.phone || hasAttemptedSubmit) && phoneError && (
                <p className="text-xs text-destructive font-medium mt-1">{phoneError}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Email</Label>
              <Input
                type="email"
                placeholder="Nhập địa chỉ email"
                value={formData.email}
                onChange={(e) => { updateField("email", e.target.value); }}
                onBlur={() => { handleBlur("email"); }}
                className={cn(
                  "rounded-full",
                  touchedFields.email && emailError && "border-destructive ring-1 ring-destructive"
                )}
              />
              {touchedFields.email && emailError && (
                <p className="text-xs text-destructive font-medium mt-1">{emailError}</p>
              )}
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs font-medium">Chỗ ở hiện nay</Label>
              <Input
                placeholder="Nhập địa chỉ chỗ ở hiện nay"
                value={formData.currentAddress}
                onChange={(e) => { updateField("currentAddress", e.target.value); }}
                className="rounded-full"
              />
            </div>
          </div>
        )}
      </div>

      {/* ── 4. Trình độ học vấn ───────────────────────────────────────────── */}
      <div className="bg-background border border-border rounded-xl overflow-hidden shadow-none">
        <div className="px-6 py-4 border-b border-border bg-muted/50 flex items-center justify-between">
          <h2 className="font-semibold text-foreground text-sm">Trình độ học vấn</h2>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => { addEducation(); }}
            className="text-primary hover:text-primary/90 text-xs font-semibold gap-1 rounded-full"
          >
            <PlusCircle size={15} /> Thêm trình độ
          </Button>
        </div>
        <div className="p-6">
          {formData.educations.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">Chưa có thông tin trình độ học vấn</p>
          ) : (
            <div className="space-y-4">
              {formData.educations.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-4 border border-border/70 rounded-xl bg-card/40 space-y-3 relative"
                >
                  <div className="flex items-center justify-between border-b border-border/50 pb-2">
                    <span className="text-xs font-mono font-semibold text-muted-foreground">
                      #{idx + 1}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => { removeEducation(item.id); }}
                      className="h-7 px-2 text-destructive hover:bg-destructive/10 gap-1 text-xs rounded-full"
                    >
                      <Trash2 size={13} /> Xóa
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-medium text-muted-foreground">Từ tháng/năm</Label>
                      <Input
                        placeholder="Từ mm/yyyy"
                        value={item.fromMonthYear}
                        onChange={(e) => { updateEducation(item.id, "fromMonthYear", e.target.value); }}
                        className="rounded-full text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-medium text-muted-foreground">Đến tháng/năm</Label>
                      <Input
                        placeholder="Đến mm/yyyy"
                        value={item.toMonthYear}
                        onChange={(e) => { updateEducation(item.id, "toMonthYear", e.target.value); }}
                        className="rounded-full text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-medium text-muted-foreground">Bằng cấp / Trình độ</Label>
                      <Input
                        placeholder="Nhập bằng cấp / trình độ"
                        value={item.degree}
                        onChange={(e) => { updateEducation(item.id, "degree", e.target.value); }}
                        className="rounded-full text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-medium text-muted-foreground">Chuyên ngành</Label>
                      <Input
                        placeholder="Nhập chuyên ngành"
                        value={item.major}
                        onChange={(e) => { updateEducation(item.id, "major", e.target.value); }}
                        className="rounded-full text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-medium text-muted-foreground">Hình thức đào tạo</Label>
                      <Input
                        placeholder="Chính quy, tại chức..."
                        value={item.trainingType}
                        onChange={(e) => { updateEducation(item.id, "trainingType", e.target.value); }}
                        className="rounded-full text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-medium text-muted-foreground">Nơi đào tạo / Trường</Label>
                      <Input
                        placeholder="Nhập tên trường đào tạo"
                        value={item.school}
                        onChange={(e) => { updateEducation(item.id, "school", e.target.value); }}
                        className="rounded-full text-xs"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── 5. Kinh nghiệm làm việc ──────────────────────────────────────── */}
      <div className="bg-background border border-border rounded-xl overflow-hidden shadow-none">
        <div className="px-6 py-4 border-b border-border bg-muted/50 flex items-center justify-between">
          <h2 className="font-semibold text-foreground text-sm">Kinh nghiệm làm việc</h2>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => { addExperience(); }}
            className="text-primary hover:text-primary/90 text-xs font-semibold gap-1 rounded-full"
          >
            <PlusCircle size={15} /> Thêm kinh nghiệm
          </Button>
        </div>
        <div className="p-6">
          {formData.experiences.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">Chưa có thông tin kinh nghiệm làm việc</p>
          ) : (
            <div className="space-y-4">
              {formData.experiences.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-4 border border-border/70 rounded-xl bg-card/40 space-y-3 relative"
                >
                  <div className="flex items-center justify-between border-b border-border/50 pb-2">
                    <span className="text-xs font-mono font-semibold text-muted-foreground">
                      #{idx + 1}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => { removeExperience(item.id); }}
                      className="h-7 px-2 text-destructive hover:bg-destructive/10 gap-1 text-xs rounded-full"
                    >
                      <Trash2 size={13} /> Xóa
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-medium text-muted-foreground">Từ tháng/năm</Label>
                      <Input
                        placeholder="Từ mm/yyyy"
                        value={item.fromMonthYear}
                        onChange={(e) => { updateExperience(item.id, "fromMonthYear", e.target.value); }}
                        className="rounded-full text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-medium text-muted-foreground">Đến tháng/năm</Label>
                      <Input
                        placeholder="Đến mm/yyyy"
                        value={item.toMonthYear}
                        onChange={(e) => { updateExperience(item.id, "toMonthYear", e.target.value); }}
                        className="rounded-full text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-medium text-muted-foreground">Nơi làm việc / Công ty</Label>
                      <Input
                        placeholder="Nhập tên nơi làm việc"
                        value={item.company}
                        onChange={(e) => { updateExperience(item.id, "company", e.target.value); }}
                        className="rounded-full text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-medium text-muted-foreground">Vị trí đảm nhận</Label>
                      <Input
                        placeholder="Nhập chức danh / vị trí"
                        value={item.position}
                        onChange={(e) => { updateExperience(item.id, "position", e.target.value); }}
                        className="rounded-full text-xs"
                      />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <Label className="text-[11px] font-medium text-muted-foreground">Mô tả công việc</Label>
                      <Input
                        placeholder="Nhập tóm tắt công việc"
                        value={item.description}
                        onChange={(e) => { updateExperience(item.id, "description", e.target.value); }}
                        className="rounded-full text-xs"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
