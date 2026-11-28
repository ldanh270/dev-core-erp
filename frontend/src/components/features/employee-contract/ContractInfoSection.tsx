import { DatePicker } from "@/components/common"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  CONTRACT_TYPES,
  CONTRACT_TYPE_LABELS,
  type ContractType,
} from "@/config/entities/employee-contract.config"
import { cn } from "@/lib/utils"
import type { Employee } from "@/types/employee.types"

import { ChevronDown, ChevronUp, Upload } from "lucide-react"

interface ContractInfoSectionProps {
  isOpen: boolean
  onToggle: () => void
  contractNumber: string
  onContractNumberChange: (val: string) => void
  referenceContract: string
  onReferenceContractChange: (val: string) => void
  contractType: ContractType
  onContractTypeChange: (val: ContractType) => void
  startDate: string
  onStartDateChange: (val: string) => void
  endDate: string
  onEndDateChange: (val: string) => void
  signerId: string
  onSignerIdChange: (val: string) => void
  signedDate: string
  onSignedDateChange: (val: string) => void
  attachmentName: string
  onAttachmentNameChange: (val: string) => void
  employees: Employee[]
  onBlur: (field: string) => void
  isContractNumberError: boolean
}

export function ContractInfoSection({
  isOpen,
  onToggle,
  contractNumber,
  onContractNumberChange,
  referenceContract,
  onReferenceContractChange,
  contractType,
  onContractTypeChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  signerId,
  onSignerIdChange,
  signedDate,
  onSignedDateChange,
  attachmentName,
  onAttachmentNameChange,
  employees,
  onBlur,
  isContractNumberError,
}: ContractInfoSectionProps) {
  return (
    <div className="bg-background border border-border rounded-xl overflow-hidden shadow-none">
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between bg-muted/50 border-b border-border text-left font-semibold text-sm text-foreground cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">
            {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </span>
          <h2 className="font-semibold text-foreground">Thông tin hợp đồng</h2>
        </div>
      </button>

      {isOpen && (
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">
              Mã hợp đồng <span className="text-destructive">*</span>
            </Label>
            <Input
              value={contractNumber}
              onChange={(e) => {
                onContractNumberChange(e.target.value)
              }}
              onBlur={() => {
                onBlur("contractNumber")
              }}
              placeholder="HDLD.000018"
              className={cn(
                "rounded-full font-mono",
                isContractNumberError && "border-destructive ring-1 ring-destructive",
              )}
              required
            />
            {isContractNumberError && (
              <p className="text-xs text-destructive font-medium mt-1">Vui lòng nhập mã hợp đồng</p>
            )}
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <Label className="text-xs font-medium">Hợp đồng tham chiếu</Label>
            <Input
              value={referenceContract}
              onChange={(e) => {
                onReferenceContractChange(e.target.value)
              }}
              placeholder="Hợp đồng tham chiếu"
              className="rounded-full bg-muted/20"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">
              Loại hợp đồng <span className="text-destructive">*</span>
            </Label>
            <Select
              value={contractType}
              onValueChange={(val) => {
                onContractTypeChange(val as ContractType)
              }}
            >
              <SelectTrigger className="rounded-full">
                <SelectValue placeholder="Loại hợp đồng" />
              </SelectTrigger>
              <SelectContent>
                {CONTRACT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {new Map(Object.entries(CONTRACT_TYPE_LABELS)).get(type) || type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">
              Hiệu lực từ <span className="text-destructive">*</span>
            </Label>
            <DatePicker
              value={startDate || null}
              onChange={(val) => {
                onStartDateChange(val || "")
              }}
              placeholder="Chọn ngày bắt đầu..."
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Hiệu lực đến</Label>
            <DatePicker
              value={endDate || null}
              minDate={startDate}
              onChange={(val) => {
                onEndDateChange(val || "")
              }}
              placeholder="Chọn ngày kết thúc..."
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">
              Người đại diện ký <span className="text-destructive">*</span>
            </Label>
            <Select value={signerId} onValueChange={onSignerIdChange}>
              <SelectTrigger className="rounded-full">
                <SelectValue placeholder="Chọn nhân sự" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.fullName} ({emp.position || "Đại diện công ty"})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">
              Ngày ký <span className="text-destructive">*</span>
            </Label>
            <DatePicker
              value={signedDate || null}
              onChange={(val) => {
                onSignedDateChange(val || "")
              }}
              placeholder="Chọn ngày ký..."
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Đính kèm</Label>
            <div className="relative">
              <Input
                value={attachmentName}
                onChange={(e) => {
                  onAttachmentNameChange(e.target.value)
                }}
                placeholder="Tải lên tệp hợp đồng..."
                className="rounded-full pr-10"
              />
              <Upload
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
