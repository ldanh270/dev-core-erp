import { useCreateEmployee } from "@/hooks/employees/queries/useEmployeeQuery"
import {
  getBioFieldError,
  getJobFieldError,
  hasRequiredEmployeeFields,
} from "@/lib/employee-form-validation"
import { routerNavigate } from "@/lib/router-navigator"
import type {
  IEducationItem,
  IEmployeeWizardFormData,
  IExperienceItem,
  IFamilyMemberItem,
  WizardTab,
} from "@/types/employee-wizard.types"

import { useState } from "react"

import { toast } from "sonner"

export function useEmployeeCreateWizard() {
  const [activeTab, setActiveTab] = useState<WizardTab>("bio")
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)

  const [defaultEmployeeCode] = useState(
    () => `Outfiz${10000 + (window.crypto.getRandomValues(new Uint32Array(1))[0] % 90000)}`,
  )

  const [formData, setFormData] = useState<IEmployeeWizardFormData>({
    // Tab 1: Sơ yếu lý lịch
    fullName: "",
    gender: "male",
    dateOfBirth: "",
    placeOfBirth: "",
    nationality: "Việt Nam",
    ethnicity: "Kinh",
    religion: "",
    nationalId: "",
    idIssueDate: "",
    idIssuePlace: "",
    permanentAddress: "",
    province: "",
    district: "",
    maritalStatus: "single",
    idFrontUrl: "",
    idBackUrl: "",

    phone: "",
    email: "",
    currentAddress: "",
    currentProvince: "",
    currentDistrict: "",

    educations: [],
    experiences: [],

    // Tab 2: Công việc
    employeeCode: defaultEmployeeCode,
    workLocation: "",
    department: "",
    positionId: "",
    startDate: new Date().toISOString().slice(0, 10),
    workScheduleType: "full_time",
    managerId: "",

    username: defaultEmployeeCode,
    password: "Password@123",
    role: "EMPLOYEE",
    autoGenUsername: true,
    autoGenPassword: true,

    // Tab 3: Thành viên gia đình
    familyCode: "",
    headFullName: "",
    headPhone: "",
    headNationalId: "",
    householdAddress: "",
    householdProvince: "",
    householdDistrict: "",
    familyMembers: [],
  })

  const createEmployeeMutation = useCreateEmployee()

  const updateField = <K extends keyof IEmployeeWizardFormData>(
    field: K,
    value: IEmployeeWizardFormData[K],
  ) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value }
      if (field === "autoGenUsername" && value === true) {
        next.username = prev.employeeCode || defaultEmployeeCode
      }
      if (field === "employeeCode" && prev.autoGenUsername) {
        next.username = String(value)
      }
      return next
    })
  }

  // Education helpers
  const addEducation = () => {
    const newItem: IEducationItem = {
      id: String(Date.now()),
      fromMonthYear: "",
      toMonthYear: "",
      degree: "",
      trainingType: "",
      major: "",
      school: "",
    }
    setFormData((prev) => ({ ...prev, educations: [...prev.educations, newItem] }))
  }

  const updateEducation = (id: string, field: keyof IEducationItem, value: string) => {
    setFormData((prev) => ({
      ...prev,
      educations: prev.educations.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    }))
  }

  const removeEducation = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      educations: prev.educations.filter((item) => item.id !== id),
    }))
  }

  // Experience helpers
  const addExperience = () => {
    const newItem: IExperienceItem = {
      id: String(Date.now()),
      fromMonthYear: "",
      toMonthYear: "",
      company: "",
      position: "",
      description: "",
    }
    setFormData((prev) => ({ ...prev, experiences: [...prev.experiences, newItem] }))
  }

  const updateExperience = (id: string, field: keyof IExperienceItem, value: string) => {
    setFormData((prev) => ({
      ...prev,
      experiences: prev.experiences.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    }))
  }

  const removeExperience = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      experiences: prev.experiences.filter((item) => item.id !== id),
    }))
  }

  // Family Member helpers
  const addFamilyMember = () => {
    const newItem: IFamilyMemberItem = {
      id: String(Date.now()),
      nationalId: "",
      gender: "male",
      dateOfBirth: "",
      nationality: "Việt Nam",
      ethnicity: "Kinh",
      relationship: "",
      birthAddress: "",
      isDependent: false,
    }
    setFormData((prev) => ({
      ...prev,
      familyMembers: [...prev.familyMembers, newItem],
    }))
  }

  const updateFamilyMember = (
    id: string,
    field: keyof IFamilyMemberItem,
    value: string | boolean,
  ) => {
    setFormData((prev) => ({
      ...prev,
      familyMembers: prev.familyMembers.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    }))
  }

  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false)

  const removeFamilyMember = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      familyMembers: prev.familyMembers.filter((item) => item.id !== id),
    }))
  }

  const validateTab = (tab: WizardTab): boolean => {
    if (tab === "bio") {
      const hasError =
        getBioFieldError("fullName", formData.fullName) ||
        getBioFieldError("phone", formData.phone) ||
        getBioFieldError("email", formData.email)

      if (hasError) toast.error("Vui lòng kiểm tra thông tin trong Sơ yếu lý lịch")
      return !hasError
    }

    if (tab === "job") {
      const hasError =
        getJobFieldError("employeeCode", formData.employeeCode) ||
        getJobFieldError("positionId", formData.positionId) ||
        getJobFieldError("department", formData.department) ||
        getJobFieldError("workLocation", formData.workLocation) ||
        getJobFieldError("startDate", formData.startDate)

      if (hasError) toast.error("Vui lòng kiểm tra thông tin trong Công việc")
      return !hasError
    }

    return true
  }

  const moveToTab = (nextTab: WizardTab) => {
    const getTabOrder = (tab: WizardTab): number => {
      switch (tab) {
        case "bio":
          return 0
        case "job":
          return 1
        case "family":
          return 2
      }
    }
    const nextOrder = getTabOrder(nextTab)
    const activeOrder = getTabOrder(activeTab)

    if (nextOrder > activeOrder) {
      setHasAttemptedSubmit(true)
      if (!validateTab(activeTab)) return
    }

    setActiveTab(nextTab)
    setHasAttemptedSubmit(false)
  }

  const handleNextTab = () => {
    if (activeTab === "family") {
      setIsConfirmModalOpen(true)
      return
    }

    moveToTab(activeTab === "bio" ? "job" : "family")
  }

  const handleFinalSubmit = async () => {
    setHasAttemptedSubmit(true)

    if (!hasRequiredEmployeeFields(formData)) {
      toast.error("Vui lòng kiểm tra lại các thông tin bắt buộc")
      setIsConfirmModalOpen(false)
      setActiveTab("bio")
      return
    }

    try {
      await createEmployeeMutation.mutateAsync({
        fullName: formData.fullName,
        email: formData.email || `${formData.username}@company.com`,
        username: formData.username,
        password: formData.password || "Password@123",
        phone: formData.phone,
        positionId: formData.positionId || undefined,
        employeeType: "full_time",
        workScheduleType: formData.workScheduleType as "full_time" | "part_time",
        role: formData.role,
        nationalId: formData.nationalId || undefined,
        address: formData.permanentAddress || formData.currentAddress || undefined,
        startDate: formData.startDate,
        dateOfBirth: formData.dateOfBirth || undefined,
      })

      toast.success("Tạo mới hồ sơ nhân sự thành công")
      setIsConfirmModalOpen(false)
      routerNavigate("/hrm/employees")
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      toast.error(error.response?.data?.message || "Không thể tạo hồ sơ nhân sự")
      setIsConfirmModalOpen(false)
    }
  }

  return {
    activeTab,
    moveToTab,
    formData,
    updateField,

    // Sub-lists
    addEducation,
    updateEducation,
    removeEducation,

    addExperience,
    updateExperience,
    removeExperience,

    addFamilyMember,
    updateFamilyMember,
    removeFamilyMember,

    // Actions
    isConfirmModalOpen,
    setIsConfirmModalOpen,
    handleNextTab,
    handleFinalSubmit,
    isSubmitting: createEmployeeMutation.isPending,
    hasAttemptedSubmit,
  }
}
