import { useState } from "react"
import { DatePicker, EntityFormPage } from "@/components/common"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  CONTRACT_TYPE_LABELS,
  CONTRACT_TYPES,
  type ContractType,
} from "@/config/entities/employee-contract.config"
import { useCreateContract } from "@/hooks/employee-contract/use-contracts"
import { useEmployees } from "@/hooks/employees/queries/useEmployeeQuery"
import { routerNavigate } from "@/lib/router-navigator"
import { cn } from "@/lib/utils"
import type { Employee } from "@/types/employee.types"
import {
  ChevronDown,
  ChevronUp,
  PlusCircle,
  Trash2,
  Upload,
} from "lucide-react"
import { toast } from "sonner"

interface IAllowanceRow {
  id: string
  type: string
  value: number
}

const DEFAULT_ALLOWANCE_OPTIONS = [
  "Phụ cấp xăng xe",
  "Phụ cấp ăn nhậu",
  "Phụ cấp gửi xe",
  "Phụ cấp ăn trưa",
  "Phụ cấp điện thoại",
  "Phụ cấp trang phục",
]

export default function EmployeeContractCreate() {
  const { data: employeesData } = useEmployees({ limit: 200 })
  const employees: Employee[] = employeesData?.data || []

  const createContractMutation = useCreateContract()

  // Validation State
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false)
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({})

  const handleBlur = (field: string) => {
    setTouchedFields((prev) => ({ ...prev, [field]: true }))
  }

  // Collapsible sections
  const [openEmployeeInfo, setOpenEmployeeInfo] = useState(true)
  const [openContractInfo, setOpenContractInfo] = useState(true)
  const [openSalaryInfo, setOpenSalaryInfo] = useState(true)
  const [openAllowanceInfo, setOpenAllowanceInfo] = useState(true)

  // 1. Thông tin nhân sự
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("")
  const selectedEmployee = employees.find((e) => e.id === selectedEmployeeId)

  // 2. Thông tin hợp đồng
  const [contractNumber, setContractNumber] = useState(
    () => `HDLD.${100000 + (window.crypto.getRandomValues(new Uint32Array(1))[0] % 900000)}`,
  )
  const [referenceContract, setReferenceContract] = useState("")
  const [contractType, setContractType] = useState<ContractType>("definite")
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10))
  const [endDate, setEndDate] = useState("")
  const [signerId, setSignerId] = useState("")
  const [signedDate, setSignedDate] = useState(new Date().toISOString().slice(0, 10))
  const [attachmentName, setAttachmentName] = useState("")

  // 3. Thông tin lương
  const [salary, setSalary] = useState<number | "">(0)
  const [probationSalaryRate, setProbationSalaryRate] = useState<number | "">(100)
  const [insuranceSalary, setInsuranceSalary] = useState<number | "">(0)

  // 4. Phụ cấp
  const [allowanceOptions, setAllowanceOptions] = useState<string[]>(DEFAULT_ALLOWANCE_OPTIONS)
  const [allowanceRows, setAllowanceRows] = useState<IAllowanceRow[]>([
    { id: "1", type: "", value: 0 },
    { id: "2", type: "", value: 0 },
  ])

  // Custom allowance modal
  const [isCustomAllowanceModalOpen, setIsCustomAllowanceModalOpen] = useState(false)
  const [newAllowanceName, setNewAllowanceName] = useState("")

  const handleAddAllowanceRow = () => {
    setAllowanceRows((prev) => [
      ...prev,
      { id: String(Date.now()), type: "", value: 0 },
    ])
  }

  const handleUpdateAllowanceRow = (id: string, field: "type" | "value", val: string | number) => {
    setAllowanceRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: val } : row))
    )
  }

  const handleRemoveAllowanceRow = (id: string) => {
    setAllowanceRows((prev) => prev.filter((row) => row.id !== id))
  }

  const handleCreateCustomAllowance = () => {
    if (!newAllowanceName.trim()) return
    const name = newAllowanceName.trim()
    if (!allowanceOptions.includes(name)) {
      setAllowanceOptions((prev) => [...prev, name])
    }
    setNewAllowanceName("")
    setIsCustomAllowanceModalOpen(false)
    toast.success(`Đã thêm khoản phụ cấp mới: ${name}`)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setHasAttemptedSubmit(true)

    let hasError = false

    if (!selectedEmployeeId) {
      toast.error("Vui lòng chọn Họ và tên người lao động")
      hasError = true
    }

    if (!contractNumber) {
      toast.error("Vui lòng nhập Mã hợp đồng")
      hasError = true
    }

    if (hasError) return

    try {
      await createContractMutation.mutateAsync({
        employeeId: selectedEmployeeId,
        contractType,
        contractNumber,
        title: `Hợp đồng lao động - ${selectedEmployee?.fullName || ""}`,
        startDate,
        endDate: endDate || undefined,
        signedDate: signedDate || undefined,
        salary: Number(salary) || 0,
        probationSalaryRate: Number(probationSalaryRate) || 100,
        allowances: allowanceRows
          .filter((r) => r.type)
          .map((r) => ({ type: r.type, value: Number(r.value) || 0, isTaxable: true })),
        attachments: attachmentName ? [attachmentName] : [],
      })

      toast.success("Tạo mới hợp đồng lao động thành công")
      routerNavigate("/hrm/contracts")
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      toast.error(error.response?.data?.message || "Không thể tạo hợp đồng")
    }
  }

  return (
    <EntityFormPage
      title="Tạo mới hợp đồng lao động"
      onBack={() => routerNavigate("/hrm/contracts")}
      formId="contract-create-form"
      isPending={createContractMutation.isPending}
      submitLabel="Lưu"
      cancelLabel="Huỷ bỏ"
    >
      <form id="contract-create-form" onSubmit={(e) => { void handleSubmit(e); }} className="space-y-6" noValidate>
        {/* ── 1. Thông tin nhân sự ────────────────────────────────────────── */}
        <div className="bg-background border border-border rounded-xl overflow-hidden shadow-none">
          <button
            type="button"
            onClick={() => { setOpenEmployeeInfo(!openEmployeeInfo); }}
            className="w-full px-6 py-4 flex items-center justify-between bg-muted/50 border-b border-border text-left font-semibold text-sm text-foreground"
          >
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">
                {openEmployeeInfo ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </span>
              <h2 className="font-semibold text-foreground">Thông tin nhân sự</h2>
            </div>
          </button>

          {openEmployeeInfo && (
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">
                  Họ và tên NLĐ <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={selectedEmployeeId}
                  onValueChange={(val) => {
                    setSelectedEmployeeId(val)
                    handleBlur("selectedEmployeeId")
                  }}
                >
                  <SelectTrigger
                    className={cn(
                      "rounded-full",
                      (touchedFields.selectedEmployeeId || hasAttemptedSubmit) && !selectedEmployeeId && "border-destructive ring-1 ring-destructive"
                    )}
                  >
                    <SelectValue placeholder="Chọn nhân sự" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.fullName} ({emp.username})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {(touchedFields.selectedEmployeeId || hasAttemptedSubmit) && !selectedEmployeeId && (
                  <p className="text-xs text-destructive font-medium mt-1">Vui lòng chọn người lao động</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Mã nhân sự</Label>
                <Input
                  value={selectedEmployee?.id ? selectedEmployee.id.slice(-6).toUpperCase() : ""}
                  placeholder="Mã nhân sự"
                  disabled
                  className="rounded-full bg-muted/40 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Bộ phận</Label>
                <Input
                  value={selectedEmployee ? "Phòng Công nghệ Thông tin" : ""}
                  placeholder="Chọn phòng ban"
                  disabled
                  className="rounded-full bg-muted/40"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Vị trí</Label>
                <Input
                  value={selectedEmployee?.position || ""}
                  placeholder="Vị trí"
                  disabled
                  className="rounded-full bg-muted/40"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Nơi làm việc</Label>
                <Input
                  value={selectedEmployee ? "Hà Nội - Trụ sở chính" : ""}
                  placeholder="Nơi làm việc"
                  disabled
                  className="rounded-full bg-muted/40"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Hình thức làm việc</Label>
                <Input
                  value={
                    selectedEmployee
                      ? selectedEmployee.workScheduleType === "full_time"
                        ? "Chính thức (Full-time)"
                        : "Bán thời gian (Part-time)"
                      : ""
                  }
                  placeholder="Hình thức làm việc"
                  disabled
                  className="rounded-full bg-muted/40"
                />
              </div>
            </div>
          )}
        </div>

        {/* ── 2. Thông tin hợp đồng ────────────────────────────────────────── */}
        <div className="bg-background border border-border rounded-xl overflow-hidden shadow-none">
          <button
            type="button"
            onClick={() => { setOpenContractInfo(!openContractInfo); }}
            className="w-full px-6 py-4 flex items-center justify-between bg-muted/50 border-b border-border text-left font-semibold text-sm text-foreground"
          >
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">
                {openContractInfo ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </span>
              <h2 className="font-semibold text-foreground">Thông tin hợp đồng</h2>
            </div>
          </button>

          {openContractInfo && (
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">
                  Mã hợp đồng <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={contractNumber}
                  onChange={(e) => { setContractNumber(e.target.value); }}
                  onBlur={() => { handleBlur("contractNumber"); }}
                  placeholder="HDLD.000018"
                  className={cn(
                    "rounded-full font-mono",
                    (touchedFields.contractNumber || hasAttemptedSubmit) && !contractNumber.trim() && "border-destructive ring-1 ring-destructive"
                  )}
                  required
                />
                {(touchedFields.contractNumber || hasAttemptedSubmit) && !contractNumber.trim() && (
                  <p className="text-xs text-destructive font-medium mt-1">Vui lòng nhập mã hợp đồng</p>
                )}
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-xs font-medium">Hợp đồng tham chiếu</Label>
                <Input
                  value={referenceContract}
                  onChange={(e) => { setReferenceContract(e.target.value); }}
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
                  onValueChange={(val) => { setContractType(val as ContractType); }}
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
                  onChange={(val) => { setStartDate(val || ""); }}
                  placeholder="Chọn ngày bắt đầu..."
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Hiệu lực đến</Label>
                <DatePicker
                  value={endDate || null}
                  minDate={startDate}
                  onChange={(val) => { setEndDate(val || ""); }}
                  placeholder="Chọn ngày kết thúc..."
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">
                  Người đại diện ký <span className="text-destructive">*</span>
                </Label>
                <Select value={signerId} onValueChange={setSignerId}>
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
                  onChange={(val) => { setSignedDate(val || ""); }}
                  placeholder="Chọn ngày ký..."
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Đính kèm</Label>
                <div className="relative">
                  <Input
                    value={attachmentName}
                    onChange={(e) => { setAttachmentName(e.target.value); }}
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

        {/* ── 3. Thông tin lương ─────────────────────────────────────────── */}
        <div className="bg-background border border-border rounded-xl overflow-hidden shadow-none">
          <button
            type="button"
            onClick={() => { setOpenSalaryInfo(!openSalaryInfo); }}
            className="w-full px-6 py-4 flex items-center justify-between bg-muted/50 border-b border-border text-left font-semibold text-sm text-foreground"
          >
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">
                {openSalaryInfo ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </span>
              <h2 className="font-semibold text-foreground">Thông tin lương</h2>
            </div>
          </button>

          {openSalaryInfo && (
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">
                  Lương cơ bản <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={salary}
                    onChange={(e) => {
                      setSalary(e.target.value === "" ? "" : Number(e.target.value));
                    }}
                    placeholder="0"
                    className="rounded-full pr-8 text-right font-mono"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">
                  Tỉ lệ hưởng lương (%) <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="number"
                  value={probationSalaryRate}
                  onChange={(e) => {
                    setProbationSalaryRate(
                      e.target.value === "" ? "" : Number(e.target.value)
                    );
                  }}
                  placeholder="100"
                  className="rounded-full text-right font-mono"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">
                  Lương đóng bảo hiểm <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="number"
                  value={insuranceSalary}
                  onChange={(e) => {
                    setInsuranceSalary(e.target.value === "" ? "" : Number(e.target.value));
                  }}
                  placeholder="0"
                  className="rounded-full text-right font-mono"
                  required
                />
              </div>
            </div>
          )}
        </div>

        {/* ── 4. Phụ cấp ──────────────────────────────────────────────────── */}
        <div className="bg-background border border-border rounded-xl overflow-hidden shadow-none">
          <div className="px-6 py-4 flex items-center justify-between bg-muted/50 border-b border-border">
            <button
              type="button"
              onClick={() => { setOpenAllowanceInfo(!openAllowanceInfo); }}
              className="flex items-center gap-2 font-semibold text-sm text-foreground"
            >
              <span className="text-muted-foreground">
                {openAllowanceInfo ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </span>
              <h2 className="font-semibold text-foreground">Phụ cấp</h2>
            </button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleAddAllowanceRow}
              className="text-primary hover:text-primary/90 text-xs font-medium gap-1"
            >
              <PlusCircle size={15} /> Thêm khoản phụ cấp
            </Button>
          </div>

          {openAllowanceInfo && (
            <div className="p-6 overflow-x-auto">
              <Table className="min-w-[600px]">
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="w-12 text-xs text-center">#</TableHead>
                    <TableHead className="text-xs">Khoản phụ cấp</TableHead>
                    <TableHead className="text-xs w-48 text-right">Mức phụ cấp</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allowanceRows.map((row, index) => (
                    <TableRow key={row.id}>
                      <TableCell className="text-center text-xs font-mono font-medium text-muted-foreground">
                        {index + 1}
                      </TableCell>
                      <TableCell className="p-2">
                        <Select
                          value={row.type}
                          onValueChange={(val) => {
                            if (val === "__ADD_NEW__") {
                              setIsCustomAllowanceModalOpen(true)
                            } else {
                              handleUpdateAllowanceRow(row.id, "type", val)
                            }
                          }}
                        >
                          <SelectTrigger className="rounded-full">
                            <SelectValue placeholder="Khoản phụ cấp" />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            {allowanceOptions.map((opt) => (
                              <SelectItem key={opt} value={opt}>
                                {opt}
                              </SelectItem>
                            ))}
                            <div className="p-1 border-t border-border mt-1">
                              <button
                                type="button"
                                onClick={() => { setIsCustomAllowanceModalOpen(true); }}
                                className="w-full py-2 px-3 text-xs font-medium text-emerald-700 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 rounded-lg flex items-center justify-center gap-1 transition-colors"
                              >
                                + Tạo mới khoản phụ cấp
                              </button>
                            </div>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="p-2">
                        <Input
                          type="number"
                          value={row.value}
                          onChange={(e) => {
                            handleUpdateAllowanceRow(row.id, "value", Number(e.target.value) || 0);
                          }}
                          className="rounded-full text-right font-mono"
                          placeholder="0"
                        />
                      </TableCell>
                      <TableCell className="p-2 text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => { handleRemoveAllowanceRow(row.id); }}
                          className="h-8 w-8 text-destructive"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

      </form>

      {/* Modal Tạo mới khoản phụ cấp */}
      <Dialog open={isCustomAllowanceModalOpen} onOpenChange={setIsCustomAllowanceModalOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Tạo mới khoản phụ cấp</DialogTitle>
          </DialogHeader>
          <div className="py-3 space-y-2">
            <Label className="text-xs font-medium">Tên khoản phụ cấp</Label>
            <Input
              placeholder="VD: Phụ cấp độc hại, Phụ cấp chuyên cần..."
              value={newAllowanceName}
              onChange={(e) => { setNewAllowanceName(e.target.value); }}
              className="rounded-full"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => { setIsCustomAllowanceModalOpen(false); }}
              className="rounded-full"
            >
              Hủy
            </Button>
            <Button
              type="button"
              onClick={handleCreateCustomAllowance}
              className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Tạo mới
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </EntityFormPage>
  )
}
