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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { ContractType } from "@/config/entities/employee-contract.config"
import {
  useCreateContract,
  useRenewContract,
  useTerminateContract,
  useUpdateContract,
} from "@/hooks/employee-contract/use-contracts"
import type { IContract } from "@/types/employee-contract.types"
import React, { useEffect, useState } from "react"
import { ContractStandardFormFields } from "./ContractStandardFormFields"

export type ContractModalMode = "create" | "edit" | "renew" | "terminate"

interface UseContractModalFormProps {
  isOpen: boolean
  onClose: () => void
  employeeId: string
  mode: ContractModalMode
  contract?: IContract | null
}

function useContractModalForm({
  isOpen,
  onClose,
  employeeId,
  mode,
  contract,
}: UseContractModalFormProps) {
  const createMutation = useCreateContract()
  const updateMutation = useUpdateContract()
  const terminateMutation = useTerminateContract()
  const renewMutation = useRenewContract()

  const isPending =
    createMutation.isPending ||
    updateMutation.isPending ||
    terminateMutation.isPending ||
    renewMutation.isPending

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
          : new Date().toISOString().slice(0, 10),
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
      setStartDate(
        contract.startDate ? new Date(contract.startDate).toISOString().slice(0, 10) : "",
      )
      setEndDate(contract.endDate ? new Date(contract.endDate).toISOString().slice(0, 10) : "")
      setTrialEndDate(
        contract.trialEndDate ? new Date(contract.trialEndDate).toISOString().slice(0, 10) : "",
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

  const titleText =
    mode === "create"
      ? "Tạo hợp đồng mới"
      : mode === "edit"
        ? "Chỉnh sửa hợp đồng"
        : mode === "renew"
          ? "Gia hạn hợp đồng"
          : "Chấm dứt hợp đồng"

  return {
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
    terminationReason,
    setTerminationReason,
    terminationDate,
    setTerminationDate,
    isPending,
    titleText,
    handleSubmit,
  }
}

export interface ContractModalProps {
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
  const {
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
    terminationReason,
    setTerminationReason,
    terminationDate,
    setTerminationDate,
    isPending,
    titleText,
    handleSubmit,
  } = useContractModalForm({ isOpen, onClose, employeeId, mode, contract })

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-[540px] rounded-xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-foreground">
            {titleText}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {mode === "terminate"
              ? `Chấm dứt hợp đồng số ${contract?.contractNumber}`
              : "Nhập các thông tin chi tiết cho hợp đồng lao động của nhân sự."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(e) => { void handleSubmit(e) }} className="space-y-4 py-2">
          {mode === "terminate" ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="terminationDate" className="text-xs font-medium">
                  Ngày chấm dứt <span className="text-destructive">*</span>
                </Label>
                <DatePicker
                  id="terminationDate"
                  value={terminationDate || null}
                  onChange={(val) => {
                    setTerminationDate(val || "")
                  }}
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
                  onChange={(e) => {
                    setTerminationReason(e.target.value)
                  }}
                  className="rounded-xl border-border resize-none"
                  rows={3}
                  required
                />
              </div>
            </div>
          ) : (
            <ContractStandardFormFields
              contractType={contractType}
              setContractType={setContractType}
              contractNumber={contractNumber}
              setContractNumber={setContractNumber}
              title={title}
              setTitle={setTitle}
              startDate={startDate}
              setStartDate={setStartDate}
              endDate={endDate}
              setEndDate={setEndDate}
              trialEndDate={trialEndDate}
              setTrialEndDate={setTrialEndDate}
              salary={salary}
              setSalary={setSalary}
              probationSalary={probationSalary}
              setProbationSalary={setProbationSalary}
              note={note}
              setNote={setNote}
            />
          )}

          <DialogFooter className="pt-4 border-t border-border/40">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
              className="rounded-full"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className={`rounded-full ${
                mode === "terminate"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : ""
              }`}
            >
              {isPending
                ? "Đang lưu..."
                : mode === "terminate"
                  ? "Xác nhận chấm dứt"
                  : mode === "renew"
                    ? "Gia hạn hợp đồng"
                    : mode === "edit"
                      ? "Cập nhật"
                      : "Tạo hợp đồng"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
