import type { Employee, UpdateEmployeeDto } from "@/types/employee.types"

import { useMemo } from "react"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { buildEmployeeEditFormValues } from "./build-employee-edit-form-values.util"
import { employeeEditFormSchema, type EmployeeEditFormValues } from "./employee-edit-form.schema"
import { useUpdateEmployee } from "./queries/useEmployeeQuery"

/** Form state + mutation for EmployeeEditDrawer. */
export function useEmployeeEditModal(employee: Employee | null, isOpen: boolean) {
  const updateMutation = useUpdateEmployee()
  const formValues = useMemo(
    () => (employee && isOpen ? buildEmployeeEditFormValues(employee) : undefined),
    [employee, isOpen],
  )

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EmployeeEditFormValues>({
    resolver: zodResolver(employeeEditFormSchema),
    mode: "onBlur",
    values: formValues,
  })

  const onSubmitEmployee = async (data: EmployeeEditFormValues) => {
    if (!employee) return
    const formattedData: UpdateEmployeeDto = {
      ...data,
      password: data.password === "" ? undefined : data.password,
      phone: data.phone === "" ? null : data.phone,
      position: data.position === "" ? null : data.position,
      positionId: data.positionId === "" ? null : data.positionId,
      dateOfBirth: data.dateOfBirth === "" ? null : data.dateOfBirth,
      nationalId: data.nationalId === "" ? null : data.nationalId,
      address: data.address === "" ? null : data.address,
      startDate: data.startDate === "" ? null : data.startDate,
      endDate: data.endDate === "" ? null : data.endDate,
    }
    await updateMutation.mutateAsync({ id: employee.id, data: formattedData })
  }

  return {
    register,
    setValue,
    handleSubmit,
    watch,
    onSubmitEmployee,
    errors,
    isPending: updateMutation.isPending,
  }
}
