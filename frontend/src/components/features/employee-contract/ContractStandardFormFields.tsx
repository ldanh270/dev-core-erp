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
import { Textarea } from "@/components/ui/textarea"
import {
  CONTRACT_TYPES,
  CONTRACT_TYPE_LABELS,
  type ContractType,
} from "@/config/entities/employee-contract.config"

const CONTRACT_TYPE_MAP = new Map(Object.entries(CONTRACT_TYPE_LABELS))

interface ContractStandardFormFieldsProps {
  contractType: ContractType
  setContractType: (val: ContractType) => void
  contractNumber: string
  setContractNumber: (val: string) => void
  title: string
  setTitle: (val: string) => void
  startDate: string
  setStartDate: (val: string) => void
  endDate: string
  setEndDate: (val: string) => void
  trialEndDate: string
  setTrialEndDate: (val: string) => void
  salary: string
  setSalary: (val: string) => void
  probationSalary: string
  setProbationSalary: (val: string) => void
  note: string
  setNote: (val: string) => void
}

/**
 * Reusable labor contract input fields covering type, duration, compensation, and terms.
 * Used across modal and full-page contract creation workflows.
 */
export function ContractStandardFormFields({
  contractType,
  setContractType,
  contractNumber,
  setContractNumber,
  title,
  setTitle,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  trialEndDate,
  setTrialEndDate,
  salary,
  setSalary,
  probationSalary,
  setProbationSalary,
  note,
  setNote,
}: ContractStandardFormFieldsProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="col-span-2 sm:col-span-1 space-y-2">
        <Label htmlFor="contractType" className="text-xs font-medium">
          Loại hợp đồng <span className="text-destructive">*</span>
        </Label>
        <Select
          value={contractType}
          onValueChange={(val) => {
            setContractType(val as ContractType)
          }}
        >
          <SelectTrigger className="rounded-full">
            <SelectValue placeholder="Chọn loại HĐ" />
          </SelectTrigger>
          <SelectContent>
            {CONTRACT_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {CONTRACT_TYPE_MAP.get(type) || type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="col-span-2 sm:col-span-1 space-y-2">
        <Label htmlFor="contractNumber" className="text-xs font-medium">
          Số hợp đồng <span className="text-destructive">*</span>
        </Label>
        <Input
          id="contractNumber"
          value={contractNumber}
          onChange={(e) => {
            setContractNumber(e.target.value)
          }}
          placeholder="HD-XXXX"
          className="rounded-full"
          required
        />
      </div>

      <div className="col-span-2 space-y-2">
        <Label htmlFor="title" className="text-xs font-medium">
          Tiêu đề hợp đồng
        </Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value)
          }}
          placeholder="VD: Hợp đồng lao động chính thức"
          className="rounded-full"
        />
      </div>

      <div className="col-span-2 sm:col-span-1 space-y-2">
        <Label htmlFor="startDate" className="text-xs font-medium">
          Ngày bắt đầu <span className="text-destructive">*</span>
        </Label>
        <DatePicker
          id="startDate"
          value={startDate || null}
          onChange={(val) => {
            setStartDate(val || "")
          }}
          placeholder="Chọn ngày bắt đầu..."
        />
      </div>

      <div className="col-span-2 sm:col-span-1 space-y-2">
        <Label htmlFor="endDate" className="text-xs font-medium">
          Ngày kết thúc {contractType === "indefinite" ? "" : "(để trống nếu vô hạn)"}
        </Label>
        <DatePicker
          id="endDate"
          value={endDate || null}
          minDate={startDate}
          onChange={(val) => {
            setEndDate(val || "")
          }}
          placeholder="Chọn ngày kết thúc..."
        />
      </div>

      {contractType === "trial" && (
        <div className="col-span-2 sm:col-span-1 space-y-2">
          <Label htmlFor="trialEndDate" className="text-xs font-medium">
            Hết hạn thử việc
          </Label>
          <DatePicker
            id="trialEndDate"
            value={trialEndDate || null}
            onChange={(val) => {
              setTrialEndDate(val || "")
            }}
            placeholder="Chọn ngày kết thúc thử việc..."
          />
        </div>
      )}

      <div className="col-span-2 sm:col-span-1 space-y-2">
        <Label htmlFor="salary" className="text-xs font-medium">
          Mức lương chính (VND) <span className="text-destructive">*</span>
        </Label>
        <Input
          id="salary"
          type="number"
          value={salary}
          onChange={(e) => {
            setSalary(e.target.value)
          }}
          placeholder="0"
          className="rounded-full"
          required
        />
      </div>

      {contractType === "trial" && (
        <div className="col-span-2 sm:col-span-1 space-y-2">
          <Label htmlFor="probationSalary" className="text-xs font-medium">
            Lương thử việc (VND)
          </Label>
          <Input
            id="probationSalary"
            type="number"
            value={probationSalary}
            onChange={(e) => {
              setProbationSalary(e.target.value)
            }}
            placeholder="0"
            className="rounded-full"
          />
        </div>
      )}

      <div className="col-span-2 space-y-2">
        <Label htmlFor="note" className="text-xs font-medium">
          Ghi chú
        </Label>
        <Textarea
          id="note"
          placeholder="Ghi chú thêm về điều khoản..."
          value={note}
          onChange={(e) => {
            setNote(e.target.value)
          }}
          className="rounded-xl border-border resize-none"
          rows={2}
        />
      </div>
    </div>
  )
}
