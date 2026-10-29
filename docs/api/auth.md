# HRM Request - Authentication & Authorization Endpoints

Base path: /api/auth and /api/security

## Required headers (all endpoints)

- Content-Type: application/json (Required for requests containing a JSON body).
- Authorization: Bearer {token} (Required for authenticated endpoints: logout, change password, activity logs, security dashboard, unlock account).

## Common status codes

- 200: Success (ResponseInfo).
- 400: Bad request (invalid request body, missing fields, or Zod validation errors).
- 401: Unauthorized (missing or invalid Authorization token).
- 403: Forbidden (insufficient roles or permissions).
- 404: Not found (resource not found).
- 500: Internal server error.

## POST /login (User Login)

Full URL: {{base_url}}/api/auth/login
Authenticate user credentials and receive access and refresh tokens. Body: JSON.

### Request Body

```json
{
  "username": "username_or_email",
  "password": "Password123!"
}
```

### Response (200 OK)

```json
{
  "status": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "employee": {
      "id": "7b58fae4-05db-4e1b-90a6-c9bc6b328a9b",
      "username": "nguyenvana",
      "email": "vana@company.com",
      "fullName": "John Doe",
      "role": "employee"
    }
  }
}
```

### Response (401 Unauthorized)

```json
{
  "status": "error",
  "message": "Invalid username or password"
}
```

---

## POST /logout (User Logout)

Full URL: {{base_url}}/api/auth/logout
Log out the current user session and record security audit log. Body: None.
Requires header `Authorization: Bearer {token}`.

### Response (200 OK)

```json
{
  "status": "success",
  "message": "Logged out successfully"
}
```

---

## POST /change-password (Change Password)

Full URL: {{base_url}}/api/auth/change-password
Change password for currently authenticated user. Body: JSON.
Requires header `Authorization: Bearer {token}`.

### Request Body

```json
{
  "oldPassword": "CurrentPassword123!",
  "newPassword": "NewSecurePassword123!"
}
```

### Response (200 OK)

```json
{
  "status": "success",
  "message": "Password changed successfully."
}
```

---

## POST /forgot-password (Forgot Password)

Full URL: {{base_url}}/api/auth/forgot-password
Request password reset email. The system sends a reset token to the registered email if the account exists. Body: JSON.

### Request Body

```json
{
  "email": "employee_email@company.com"
}
```

### Response (200 OK - Generic response to prevent account enumeration)

```json
{
  "status": "success",
  "message": "If an account exists, a reset email has been sent."
}
```

---

## POST /validate-reset-token (Validate Reset Token)

Full URL: {{base_url}}/api/auth/validate-reset-token
Validate whether the reset token received via email is valid and unexpired. Body: JSON.

### Request Body

```json
{
  "token": "token_chuoi_hex_nhan_tu_email"
}
```

### Response (200 OK - Valid token)

```json
{
  "status": "success",
  "data": {
    "isValid": true
  }
}
```

### Response (400 Bad Request - Invalid or expired token)

```json
{
  "status": "error",
  "message": "Reset link has expired"
}
```

---

## POST /reset-password (Reset Password)

Full URL: {{base_url}}/api/auth/reset-password
Set a new password using the validated reset token received via email. Body: JSON.

### Request Body

```json
{
  "token": "token_chuoi_hex",
  "newPassword": "NewPassword123!"
}
```

### Response (200 OK)

```json
{
  "status": "success",
  "message": "Password reset successfully. You can now login with your new password."
}
```

---

## GET /activity-logs (View Activity Logs)

Full URL: {{base_url}}/api/auth/activity-logs
Retrieve paginated and filtered activity audit logs. Query Parameters.
Requires header `Authorization: Bearer {token}`. Allowed roles: `ADMIN`, `HR_MANAGER`, `GENERAL_MANAGER`.

### Optional Query Parameters

- `employeeId` (string): Filter by employee ID
- `category` (string): Filter by action category (`auth`, `role`, `security`)
- `actionType` (string): Filter by action type (`login`, `logout`, `failed_login`, `account_locked`, etc.)
- `fromDate` (date-string ISO): Start date (e.g., `2026-06-01T00:00:00Z`)
- `toDate` (date-string ISO): End date (e.g., `2026-06-15T23:59:59Z`)
- `page` (int, default: 1): Page number
- `limit` (int, default: 20): Items per page

### Response (200 OK)

```json
{
  "status": "success",
  "data": {
    "data": [
      {
        "id": "e391ca34-738b-4b1f-aa2c-29a3a9bf8c19",
        "employeeId": "7b58fae4-05db-4e1b-90a6-c9bc6b328a9b",
        "employeeName": "John Doe",
        "category": "auth",
        "actionType": "login",
        "ipAddress": "127.0.0.1",
        "details": null,
        "createdAt": "2026-06-14T12:00:00.000Z"
      }
    ],
    "meta": {
      "total": 120,
      "page": 1,
      "limit": 20,
      "totalPages": 6
    }
  }
}
```

---

## GET /activity-logs/:id (Activity Log Details)

Full URL: {{base_url}}/api/auth/activity-logs/{id}
Retrieve details of a specific activity log record by ID. Body: None.
Requires header `Authorization: Bearer {token}`. Allowed roles: `ADMIN`, `HR_MANAGER`, `GENERAL_MANAGER`.

### Response (200 OK)

```json
{
  "status": "success",
  "data": {
    "id": "e391ca34-738b-4b1f-aa2c-29a3a9bf8c19",
    "employeeId": "7b58fae4-05db-4e1b-90a6-c9bc6b328a9b",
    "employeeName": "John Doe",
    "category": "security",
    "actionType": "account_locked",
    "ipAddress": "127.0.0.1",
    "details": "{\"failedLoginCount\":5,\"lockedUntil\":\"2026-06-14T12:05:00.000Z\"}",
    "createdAt": "2026-06-14T12:00:00.000Z"
  }
}
```

---

## GET /security/dashboard (Security Dashboard Overview)

Full URL: {{base_url}}/api/security/dashboard
Retrieve summary statistics for the security monitoring dashboard. Body: None.
Requires header `Authorization: Bearer {token}`. Allowed roles: `ADMIN`, `GENERAL_MANAGER`, `HR_MANAGER`.

### Response (200 OK)

```json
{
  "status": "success",
  "data": {
    "lockedAccountsCount": 2,
    "failedLoginsToday": 8,
    "successfulLoginsToday": 42,
    "recentSecurityEvents": [
      {
        "id": "a1b2c3d4-...",
        "employeeName": "Jane Smith",
        "category": "security",
        "actionType": "account_locked",
        "createdAt": "2026-06-14T09:15:30.000Z"
      }
    ],
    "recentRoleEvents": []
  }
}
```

---

## GET /security/locked-accounts (List Locked Accounts)

Full URL: {{base_url}}/api/security/locked-accounts
Retrieve list of employee accounts temporarily locked due to excessive failed login attempts (5+). Body: None.
Requires header `Authorization: Bearer {token}`. Allowed roles: `ADMIN`, `GENERAL_MANAGER`, `HR_MANAGER`.

### Response (200 OK)

```json
{
  "status": "success",
  "data": [
    {
      "employeeId": "8f8bca12-32a1-432d-98bc-ab543ef8902c",
      "employeeName": "Jane Smith",
      "email": "tranvanb@company.com",
      "failedLoginCount": 5,
      "lockedUntil": "2026-06-14T13:05:00.000Z"
    }
  ]
}
```

---

## PATCH /security/unlock/:employeeId (Unlock Account)

Full URL: {{base_url}}/api/security/unlock/{employeeId}
Manually unlock a locked employee account. Body: None.
Requires header `Authorization: Bearer {token}`. Allowed roles: `ADMIN`, `GENERAL_MANAGER`, `HR_MANAGER`.

### Response (200 OK)

```json
{
  "status": "success",
  "message": "Account unlocked successfully"
}
```
