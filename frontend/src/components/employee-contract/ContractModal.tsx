import { useEffect, useState } from "react"
import {
  CONTRACT_TYPE_LABELS,
  CONTRACT_TYPES,
  type ContractType,
} from "@/config/entities/employee-contract.config"
import {
  useCreateContract,
  useRenewContract,
  useTerminateContract,
  useUpdateContract,
} from "@/hooks/employee-contract/use-contracts"
import type { IContract } from "@/types/employee-contract.types"

import { DatePicker } from "@/components/common"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Textarea } from "@/components/ui/textarea"

export type ContractModalMode = "create" | "edit" | "renew" | "terminate"

interface ContractModalProps {
  isOpen: boolean
  onClose: () => void
  employeeId: string
  mode: ContractModalMode
  contract?: IContract | null
}

export function ContractModal({
  isOpen,
  onClose,
  employeeId,
  mode,
  contract,
}: ContractModalProps) {
  const createMutation = useCreateContract()
  const updateMutation = useUpdateContract()
  const terminateMutation = useTerminateContract()
  const renewMutation = useRenewContract()

  const isPending =
    createMutation.isPending ||
    updateMutation.isPending ||
    terminateMutation.isPending ||
    renewMutation.isPending

  // Form states
  const [contractType, setContractType] = useState<ContractType>("definite")
  const [contractNumber, setContractNumber] = useState("")
  const [title, setTitle] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [trialEndDate, setTrialEndDate] = useState("")
  const [salary, setSalary] = useState("")
  const [probationSalary, setProbationSalary] = useState("")
  const [note, setNote] = useState("")
  const [terminationReason, setTerminationReason] = useState("")
  const [terminationDate, setTerminationDate] = useState("")

  // Reset or initialize form data when modal opens or contract changes
  useEffect(() => {
    if (!isOpen) return

    const generateDefaultContractNumber = () => {
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "")
      const randomSuffix = 1000 + (window.crypto.getRandomValues(new Uint32Array(1))[0] % 9000)
      return `HD-${dateStr}-${randomSuffix}`
    }

    if (mode === "create") {
      setContractType("definite")
      setContractNumber(generateDefaultContractNumber())
      setTitle("Hợp đồng lao động")
      setStartDate(new Date().toISOString().slice(0, 10))
      setEndDate("")
      setTrialEndDate("")
      setSalary("")
      setProbationSalary("")
      setNote("")
      setTerminationReason("")
      setTerminationDate("")
    } else if (mode === "renew" && contract) {
      setContractType(contract.contractType)
      setContractNumber(generateDefaultContractNumber())
      setTitle(`Gia hạn - ${contract.title || "Hợp đồng lao động"}`)
      setStartDate(
        contract.endDate
          ? new Date(contract.endDate).toISOString().slice(0, 10)
          : new Date().toISOString().slice(0, 10)
      )
      setEndDate("")
      setTrialEndDate("")
      setSalary(String(contract.salary || ""))
      setProbationSalary(String(contract.probationSalary || ""))
      setNote(`Gia hạn từ hợp đồng số ${contract.contractNumber}`)
    } else if (contract) {
      setContractType(contract.contractType)
      setContractNumber(contract.contractNumber)
      setTitle(contract.title || "")
      setStartDate(contract.startDate ? new Date(contract.startDate).toISOString().slice(0, 10) : "")
      setEndDate(contract.endDate ? new Date(contract.endDate).toISOString().slice(0, 10) : "")
      setTrialEndDate(
        contract.trialEndDate ? new Date(contract.trialEndDate).toISOString().slice(0, 10) : ""
      )
      setSalary(String(contract.salary || ""))
      setProbationSalary(String(contract.probationSalary || ""))
      setNote(contract.note || "")
      setTerminationReason("")
      setTerminationDate(new Date().toISOString().slice(0, 10))
    }
  }, [isOpen, mode, contract])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (mode === "terminate") {
      if (!contract?.id || !terminationReason) return
      await terminateMutation.mutateAsync({
        id: contract.id,
        data: {
          terminationReason,
          terminationDate: terminationDate || new Date().toISOString(),
        },
      })
      onClose()
      return
    }

    const payload = {
      employeeId,
      contractType,
      contractNumber,
      title: title || undefined,
      startDate,
      endDate: endDate || undefined,
      trialEndDate: trialEndDate || undefined,
      salary: Number(salary) || 0,
      probationSalary: probationSalary ? Number(probationSalary) : undefined,
      note: note || undefined,
    }

    if (mode === "create") {
      await createMutation.mutateAsync(payload)
    } else if (mode === "edit" && contract?.id) {
      await updateMutation.mutateAsync({
        id: contract.id,
        data: {
          contractType,
          contractNumber,
          title: title || undefined,
          startDate,
          endDate: endDate || undefined,
          trialEndDate: trialEndDate || undefined,
          salary: Number(salary) || 0,
          probationSalary: probationSalary ? Number(probationSalary) : undefined,
          note: note || undefined,
        },
      })
    } else if (mode === "renew" && contract?.id) {
      await renewMutation.mutateAsync({
        id: contract.id,
        data: {
          newContract: payload,
        },
      })
    }

    onClose()
  }

  const getTitleText = () => {
    switch (mode) {
      case "create":
        return "Tạo hợp đồng mới"
      case "edit":
        return "Chỉnh sửa hợp đồng"
      case "renew":
        return "Gia hạn hợp đồng"
      case "terminate":
        return "Chấm dứt hợp đồng"
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { onClose(); } }}>
      <DialogContent className="sm:max-w-[540px] rounded-xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-foreground">
            {getTitleText()}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {mode === "terminate"
              ? `Chấm dứt hợp đồng số ${contract?.contractNumber}`
              : "Nhập các thông tin chi tiết cho hợp đồng lao động của nhân sự."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(e) => { void handleSubmit(e); }} className="space-y-4 py-2">
          {mode === "terminate" ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="terminationDate" className="text-xs font-medium">
                  Ngày chấm dứt <span className="text-destructive">*</span>
                </Label>
                <DatePicker
                  id="terminationDate"
                  value={terminationDate || null}
                  onChange={(val) => { setTerminationDate(val || ""); }}
                  placeholder="Chọn ngày chấm dứt..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="terminationReason" className="text-xs font-medium">
                  Lý do chấm dứt <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="terminationReason"
                  placeholder="Nhập lý do chấm dứt hợp đồng..."
                  value={terminationReason}
                  onChange={(e) => { setTerminationReason(e.target.value); }}
                  className="rounded-xl border-border resize-none"
                  rows={3}
                  required
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1 space-y-2">
                <Label htmlFor="contractType" className="text-xs font-medium">
                  Loại hợp đồng <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={contractType}
                  onValueChange={(val) => { setContractType(val as ContractType); }}
                >
                  <SelectTrigger className="rounded-full">
                    <SelectValue placeholder="Chọn loại HĐ" />
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

              <div className="col-span-2 sm:col-span-1 space-y-2">
                <Label htmlFor="contractNumber" className="text-xs font-medium">
                  Số hợp đồng <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="contractNumber"
                  value={contractNumber}
                  onChange={(e) => { setContractNumber(e.target.value); }}
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
                  onChange={(e) => { setTitle(e.target.value); }}
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
                  onChange={(val) => { setStartDate(val || ""); }}
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
                  onChange={(val) => { setEndDate(val || ""); }}
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
                    onChange={(val) => { setTrialEndDate(val || ""); }}
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
                  onChange={(e) => { setSalary(e.target.value); }}
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
                    onChange={(e) => { setProbationSalary(e.target.value); }}
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
                  onChange={(e) => { setNote(e.target.value) }}
                  className="rounded-xl border-border resize-none"
                  rows={2}
                />
              </div>
            </div>
          )}

          <DialogFooter className="pt-4 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-full"
              disabled={isPending}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant={mode === "terminate" ? "destructive" : "default"}
              className="rounded-full"
              disabled={isPending}
            >
              {isPending ? "Đang xử lý..." : mode === "terminate" ? "Xác nhận chấm dứt" : "Lưu hợp đồng"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
