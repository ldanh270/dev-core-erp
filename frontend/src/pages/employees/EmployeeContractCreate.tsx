import { EntityFormPage } from "@/components/common"
import { ContractAllowanceSection } from "@/components/features/employee-contract/ContractAllowanceSection"
import { ContractInfoSection } from "@/components/features/employee-contract/ContractInfoSection"
import { EmployeeInfoSection } from "@/components/features/employee-contract/EmployeeInfoSection"
import { SalaryInfoSection } from "@/components/features/employee-contract/SalaryInfoSection"
import { ROUTES } from "@/config/routes.config"
import { useEmployeeContractForm } from "@/hooks/employee-contract/use-employee-contract-form"
import { routerNavigate } from "@/lib/router-navigator"

/**
 * EmployeeContractCreate page
 * Thin declarative shell orchestrating employee contract creation
 */
export default function EmployeeContractCreate() {
  const {
    employees,
    isPending,
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
  } = useEmployeeContractForm()

  const isEmployeeError =
    (touchedFields.selectedEmployeeId || hasAttemptedSubmit) && !selectedEmployeeId

  const isContractNumberError =
    (touchedFields.contractNumber || hasAttemptedSubmit) && !contractNumber.trim()

  return (
    <EntityFormPage
      title="Tạo mới hợp đồng lao động"
      onBack={() => {
        routerNavigate(ROUTES.HRM.CONTRACTS)
      }}
      formId="contract-create-form"
      isPending={isPending}
      submitLabel="Lưu"
      cancelLabel="Huỷ bỏ"
    >
      <form
        id="contract-create-form"
        onSubmit={(e) => {
          void handleSubmit(e)
        }}
        className="space-y-6"
        noValidate
      >
        <EmployeeInfoSection
          isOpen={openEmployeeInfo}
          onToggle={() => {
            setOpenEmployeeInfo(!openEmployeeInfo)
          }}
          employees={employees}
          selectedEmployeeId={selectedEmployeeId}
          onSelectEmployeeId={setSelectedEmployeeId}
          selectedEmployee={selectedEmployee}
          onBlur={handleBlur}
          isError={isEmployeeError}
        />

        <ContractInfoSection
          isOpen={openContractInfo}
          onToggle={() => {
            setOpenContractInfo(!openContractInfo)
          }}
          contractNumber={contractNumber}
          onContractNumberChange={setContractNumber}
          referenceContract={referenceContract}
          onReferenceContractChange={setReferenceContract}
          contractType={contractType}
          onContractTypeChange={setContractType}
          startDate={startDate}
          onStartDateChange={setStartDate}
          endDate={endDate}
          onEndDateChange={setEndDate}
          signerId={signerId}
          onSignerIdChange={setSignerId}
          signedDate={signedDate}
          onSignedDateChange={setSignedDate}
          attachmentName={attachmentName}
          onAttachmentNameChange={setAttachmentName}
          employees={employees}
          onBlur={handleBlur}
          isContractNumberError={isContractNumberError}
        />

        <SalaryInfoSection
          isOpen={openSalaryInfo}
          onToggle={() => {
            setOpenSalaryInfo(!openSalaryInfo)
          }}
          salary={salary}
          onSalaryChange={setSalary}
          probationSalaryRate={probationSalaryRate}
          onProbationSalaryRateChange={setProbationSalaryRate}
          insuranceSalary={insuranceSalary}
          onInsuranceSalaryChange={setInsuranceSalary}
        />

        <ContractAllowanceSection
          allowanceRows={allowanceRows}
          onAddRow={handleAddAllowanceRow}
          onUpdateRow={handleUpdateAllowanceRow}
          onRemoveRow={handleRemoveAllowanceRow}
        />
      </form>
    </EntityFormPage>
  )
}
