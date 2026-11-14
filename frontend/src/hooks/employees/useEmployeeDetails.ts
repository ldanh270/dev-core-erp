import { ROUTES } from "@/config/routes.config"
import { usePermission } from "@/hooks/use-permission"

import { useState } from "react"

import { useNavigate, useParams } from "react-router-dom"

import { useEmployee } from "./queries/useEmployeeQuery"

/**
 * Custom hook to manage employeedetails.
 */
export const useEmployeeDetails = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: employee, isLoading, error } = useEmployee(id!)
  const { hasAnyPermission } = usePermission()
  const isAdminOrManager = hasAnyPermission([
    "employee.create",
    "employee.update",
    "employee.delete",
  ])

  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const handleBackToList = () => {
    navigate(ROUTES.HRM.EMPLOYEES)
  }

  return {
    employee,
    isLoading,
    error,
    isAdminOrManager,
    isEditModalOpen,
    setIsEditModalOpen,
    handleBackToList,
  }
}
