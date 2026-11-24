import { type ContractType } from "@/config/entities/employee-contract.config"
import { ROUTES } from "@/config/routes.config"
import { useCreateContract } from "@/hooks/employee-contract/use-contracts"
import { useEmployees } from "@/hooks/employees/queries/useEmployeeQuery"
import { routerNavigate } from "@/lib/router-navigator"
import type { Employee } from "@/types/employee.types"
import type { IAllowanceRow } from "@/components/features/employee-contract/ContractAllowanceSection"

import { useCallback, useState } from "react"
import { toast } from "sonner"

/**
 * Manages form state, section toggles, and validation for full-page employee contract creation.
 * Handles employee selection, salary allowance arrays, and contract number generation.
 *
 * @returns Contract form state values and submission handlers
 */
export function useEmployeeContractForm() {
  const { data: employeesData } = useEmployees({ limit: 200 })
  const employees: Employee[] = employeesData?.data || []

  const createContractMutation = useCreateContract()

  // Validation State
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false)
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({})

  const handleBlur = useCallback((field: string) => {
    setTouchedFields((prev) => ({ ...prev, [field]: true }))
  }, [])

  // Collapsible sections
  const [openEmployeeInfo, setOpenEmployeeInfo] = useState(true)
  const [openContractInfo, setOpenContractInfo] = useState(true)
  const [openSalaryInfo, setOpenSalaryInfo] = useState(true)

  // Employee selection
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("")
  const selectedEmployee = employees.find((e) => e.id === selectedEmployeeId)

  // Contract configuration
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

  // Compensation and salary structure
  const [salary, setSalary] = useState<number | "">(0)
  const [probationSalaryRate, setProbationSalaryRate] = useState<number | "">(100)
  const [insuranceSalary, setInsuranceSalary] = useState<number | "">(0)

  // Allowance line items
  const [allowanceRows, setAllowanceRows] = useState<IAllowanceRow[]>([
    { id: "1", type: "", value: 0 },
    { id: "2", type: "", value: 0 },
  ])

  const handleAddAllowanceRow = useCallback(() => {
    setAllowanceRows((prev) => [...prev, { id: String(Date.now()), type: "", value: 0 }])
  }, [])

  const handleUpdateAllowanceRow = useCallback(
    (id: string, field: "type" | "value", val: string | number) => {
      setAllowanceRows((prev) =>
        prev.map((row) => (row.id === id ? { ...row, [field]: val } : row)),
      )
    },
    [],
  )

  const handleRemoveAllowanceRow = useCallback((id: string) => {
    setAllowanceRows((prev) => prev.filter((row) => row.id !== id))
  }, [])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setHasAttemptedSubmit(true)

      let hasError = false

      if (!selectedEmployeeId) {
        toast.error("Vui lòng chọn Họ và tên người lao động")
        hasError = true
      }

      if (!contractNumber.trim()) {
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
        routerNavigate(ROUTES.HRM.CONTRACTS)
      } catch (err: unknown) {
        const error = err as { response?: { data?: { message?: string } } }
        toast.error(error.response?.data?.message || "Không thể tạo hợp đồng")
      }
    },
    [
      selectedEmployeeId,
      contractNumber,
      createContractMutation,
      contractType,
      selectedEmployee,
      startDate,
      endDate,
      signedDate,
      salary,
      probationSalaryRate,
      allowanceRows,
      attachmentName,
    ],
  )

  return {
    employees,
    isPending: createContractMutation.isPending,
    hasAttemptedSubmit,
    touchedFields,
    handleBlur,
    openEmployeeInfo,
    setOpenEmployeeInfo,
    openContractInfo,
    setOpenContractInfo,
    openSalaryInfo,
    setOpenSalaryInfo,
    selectedEmployeeId,
    setSelectedEmployeeId,
    selectedEmployee,
    contractNumber,
    setContractNumber,
    referenceContract,
    setReferenceContract,
    contractType,
    setContractType,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    signerId,
    setSignerId,
    signedDate,
    setSignedDate,
    attachmentName,
    setAttachmentName,
    salary,
    setSalary,
    probationSalaryRate,
    setProbationSalaryRate,
    insuranceSalary,
    setInsuranceSalary,
    allowanceRows,
    handleAddAllowanceRow,
    handleUpdateAllowanceRow,
    handleRemoveAllowanceRow,
    handleSubmit,
  }
}
