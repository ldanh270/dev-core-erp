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
import type { IFamilyMemberItem, IEmployeeWizardFormData } from "@/types/employee-wizard.types"
import { ChevronDown, ChevronUp, PlusCircle, Trash2 } from "lucide-react"

interface FamilyTabProps {
  formData: IEmployeeWizardFormData
  updateField: <K extends keyof IEmployeeWizardFormData>(
    field: K,
    value: IEmployeeWizardFormData[K]
  ) => void
  addFamilyMember: () => void
  updateFamilyMember: (id: string, field: keyof IFamilyMemberItem, value: string | boolean) => void
  removeFamilyMember: (id: string) => void
}

export function FamilyTab({
  formData,
  updateField,
  addFamilyMember,
  updateFamilyMember,
  removeFamilyMember,
}: FamilyTabProps) {
  const [openFamilyInfo, setOpenFamilyInfo] = useState(true)
  const [openMembers, setOpenMembers] = useState(true)

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ── 1. Thông tin gia đình ────────────────────────────────────────── */}
      <div className="bg-background border border-border rounded-xl overflow-hidden shadow-none">
        <button
          type="button"
          onClick={() => { setOpenFamilyInfo(!openFamilyInfo); }}
          className="w-full px-6 py-4 flex items-center justify-between bg-muted/50 border-b border-border text-left font-semibold text-sm text-foreground"
        >
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">
              {openFamilyInfo ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </span>
            <h2 className="font-semibold text-foreground">Thông tin gia đình</h2>
          </div>
        </button>

        {openFamilyInfo && (
          <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Mã hộ gia đình</Label>
              <Input
                placeholder="Nhập mã"
                value={formData.familyCode}
                onChange={(e) => { updateField("familyCode", e.target.value); }}
                className="rounded-full"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Họ và tên chủ hộ</Label>
              <Input
                placeholder="Nhập tên"
                value={formData.headFullName}
                onChange={(e) => { updateField("headFullName", e.target.value); }}
                className="rounded-full"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Số điện thoại</Label>
              <Input
                placeholder="Nhập số điện thoại"
                value={formData.headPhone}
                onChange={(e) => { updateField("headPhone", e.target.value); }}
                className="rounded-full"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Số CCCD/ĐDCN</Label>
              <Input
                placeholder="Nhập số CCCD/CMND"
                value={formData.headNationalId}
                onChange={(e) => { updateField("headNationalId", e.target.value); }}
                className="rounded-full"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs font-medium">Địa chỉ hộ khẩu</Label>
              <Input
                placeholder="Nhập địa chỉ hộ khẩu"
                value={formData.householdAddress}
                onChange={(e) => { updateField("householdAddress", e.target.value); }}
                className="rounded-full"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Tỉnh/Thành phố</Label>
              <Input
                placeholder="Chọn Tỉnh/Thành phố"
                value={formData.householdProvince}
                onChange={(e) => { updateField("householdProvince", e.target.value); }}
                className="rounded-full"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Phường/Xã</Label>
              <Input
                placeholder="Chọn Xã/Phường"
                value={formData.householdDistrict}
                onChange={(e) => { updateField("householdDistrict", e.target.value); }}
                className="rounded-full"
              />
            </div>
          </div>
        )}
      </div>

      {/* ── 2. Thành viên gia đình ────────────────────────────────────────── */}
      <div className="bg-background border border-border rounded-xl overflow-hidden shadow-none">
        <div className="px-6 py-4 flex items-center justify-between bg-muted/50 border-b border-border">
          <button
            type="button"
            onClick={() => { setOpenMembers(!openMembers); }}
            className="flex items-center gap-2 font-semibold text-sm text-foreground"
          >
            <span className="text-muted-foreground">
              {openMembers ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </span>
            <h2 className="font-semibold text-foreground">Thành viên gia đình</h2>
          </button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => { addFamilyMember(); }}
            className="text-primary hover:text-primary/90 text-xs font-medium gap-1"
          >
            <PlusCircle size={15} /> Thêm thành viên
          </Button>
        </div>

        {openMembers && (
          <div className="p-6">
            {formData.familyMembers.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-xs text-muted-foreground italic mb-2">Chưa có thành viên gia đình nào được thêm</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => { addFamilyMember(); }}
                  className="rounded-full text-xs"
                >
                  + Thêm dòng thành viên
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.familyMembers.map((member, idx) => (
                  <div
                    key={member.id}
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
                        onClick={() => { removeFamilyMember(member.id); }}
                        className="h-7 px-2 text-destructive hover:bg-destructive/10 gap-1 text-xs"
                      >
                        <Trash2 size={13} /> Xóa
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[11px] font-medium text-muted-foreground">Mối quan hệ</Label>
                        <Input
                          placeholder="Vd: Bố, Mẹ, Vợ..."
                          value={member.relationship}
                          onChange={(e) => { updateFamilyMember(member.id, "relationship", e.target.value); }}
                          className="rounded-full text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] font-medium text-muted-foreground">Số CCCD/CMND</Label>
                        <Input
                          placeholder="Nhập số CCCD"
                          value={member.nationalId}
                          onChange={(e) => { updateFamilyMember(member.id, "nationalId", e.target.value); }}
                          className="rounded-full text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] font-medium text-muted-foreground">Giới tính</Label>
                        <Select
                          value={member.gender}
                          onValueChange={(val) => { updateFamilyMember(member.id, "gender", val); }}
                        >
                          <SelectTrigger className="rounded-full text-xs">
                            <SelectValue placeholder="Chọn giới tính" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Nam</SelectItem>
                            <SelectItem value="female">Nữ</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] font-medium text-muted-foreground">Ngày sinh</Label>
                        <DatePicker
                          value={member.dateOfBirth || null}
                          onChange={(val) => { updateFamilyMember(member.id, "dateOfBirth", val || ""); }}
                          size="sm"
                          placeholder="Chọn ngày sinh..."
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] font-medium text-muted-foreground">Quốc tịch</Label>
                        <Input
                          placeholder="Việt Nam"
                          value={member.nationality}
                          onChange={(e) => { updateFamilyMember(member.id, "nationality", e.target.value); }}
                          className="rounded-full text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] font-medium text-muted-foreground">Dân tộc</Label>
                        <Input
                          placeholder="Kinh"
                          value={member.ethnicity}
                          onChange={(e) => { updateFamilyMember(member.id, "ethnicity", e.target.value); }}
                          className="rounded-full text-xs"
                        />
                      </div>
                      <div className="space-y-1 sm:col-span-2">
                        <Label className="text-[11px] font-medium text-muted-foreground">Địa chỉ khai sinh</Label>
                        <Input
                          placeholder="Nhập địa chỉ khai sinh"
                          value={member.birthAddress}
                          onChange={(e) => { updateFamilyMember(member.id, "birthAddress", e.target.value); }}
                          className="rounded-full text-xs"
                        />
                      </div>
                      <div className="sm:col-span-4 flex items-center gap-2 pt-1">
                        <input
                          type="checkbox"
                          id={`dependent-${member.id}`}
                          checked={member.isDependent}
                          onChange={(e) => { updateFamilyMember(member.id, "isDependent", e.target.checked); }}
                          className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                        />
                        <Label htmlFor={`dependent-${member.id}`} className="text-xs cursor-pointer font-medium">
                          Là người phụ thuộc
                        </Label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
