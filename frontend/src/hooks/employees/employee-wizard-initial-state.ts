import type {
  IEducationItem,
  IEmployeeWizardFormData,
  IExperienceItem,
  IFamilyMemberItem,
} from "@/types/employee-wizard.types"

/**
 * Creates an empty education item factory object for employee wizard.
 *
 * @returns Fresh education record with unique timestamp ID
 */
export function createEducationItem(): IEducationItem {
  return {
    id: String(Date.now()),
    fromMonthYear: "",
    toMonthYear: "",
    degree: "",
    trainingType: "",
    major: "",
    school: "",
  }
}

/**
 * Creates an empty work experience item factory object for employee wizard.
 *
 * @returns Fresh experience record with unique timestamp ID
 */
export function createExperienceItem(): IExperienceItem {
  return {
    id: String(Date.now()),
    fromMonthYear: "",
    toMonthYear: "",
    company: "",
    position: "",
    description: "",
  }
}

/**
 * Creates an empty family member item factory object for employee wizard.
 *
 * @returns Fresh family member record with unique timestamp ID
 */
export function createFamilyMemberItem(): IFamilyMemberItem {
  return {
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
}

/**
 * Generates initial default form state values for the multi-step employee wizard.
 *
 * @param defaultEmployeeCode - Pre-generated employee identifier code
 * @returns Complete initial form state covering bio, job, and family steps
 */
export function getInitialWizardFormData(defaultEmployeeCode: string): IEmployeeWizardFormData {
  return {
    // Biography and personal identity
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

    // Job configuration and credentials
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

    // Household and family members
    familyCode: "",
    headFullName: "",
    headPhone: "",
    headNationalId: "",
    householdAddress: "",
    householdProvince: "",
    householdDistrict: "",
    familyMembers: [],
  }
}
