export interface EmployeeDetails {
  id: string
  username: string
  email: string
  fullName: string
  role: string
}

export interface LoginResponse {
  status: string
  data: {
    token: string
    employee: EmployeeDetails
  }
}

export interface GenericResponse<T = any> {
  status: string
  message?: string
  data?: T
}
