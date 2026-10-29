# HRM Application - Endpoints

Base path: /api/1.0/hrm/application

## Required headers (all endpoints)

- x-requestid: UUID (required by CheckRequestId filter).
- x-apikey: API key (required by CheckRequestId filter).
- Authorization: Bearer {token} (required by API security scheme; used for identity/serial checks).
- x-serial-number: required when header x-fromWeb is not true; validated against token serial in CheckRequestId.

## Common status codes

- 200: Success.
- 201: Created (for POST requests).
- 400: Bad request (invalid request id, missing/invalid api key, or validation/Zod errors).
- 401: Unauthorized.
- 403: Forbidden (Insufficient role permissions).
- 406: Not acceptable (serial mismatch).
- 500: Internal server error.

---

## POST / (Create Application)

Full URL: https://api-staging-lm.vnbro.com/api/1.0/hrm/application
Create a new application. Body: JSON.
_Note: `employeeId` is automatically extracted by the system from the authenticated JWT token._

Required base fields (validated via Zod):

- type (string): "leave" | "overtime" | "work_from_home" | "shift_swap" | "business_trip" | "late_early" | "regime"
- startDate (date-time)
- detail (object): Specific fields required depend on the `type` value (see details below)

Optional base fields:

- endDate (date-time) - _Required when type is "leave"_
- reason (string): 5 to 500 characters
- note (string): Maximum 1000 characters
- assignedToId (string cuid)

### Required fields in object `detail` by `type`:

**1. type = "leave" (Leave Request)**

- Required: `leaveType` (enum), `regimeType` (enum).
- _(Note: `endDate` is required in base fields)._

**2. type = "overtime" (Overtime Request)**

- Required: `employeeShiftId` (string cuid).

**3. type = "work_from_home" (Remote / Work From Home Request)**

- Optional: `location` (string, max 255 characters).

**4. type = "shift_swap" (Shift Swap Request)**

- Required: `employeeShiftId` (string cuid).
- Optional: `workingShiftId` (string cuid), `swapWithEmployeeId` (string cuid), `swapWithShiftId` (string cuid).

**5. type = "business_trip" (Business Trip Request)**

- Required: `location` (string, 2-255 characters).
- Optional: `purpose` (string, max 500 characters), `budget` (number).

**6. type = "late_early" (Late Arrival / Early Departure Request)**

- Required: `employeeShiftId` (string cuid), `durationMinutes` (int, 1-480 minutes), `isLate` (boolean).

**7. type = "regime" (Statutory Regime Request: maternity, sick leave, etc.)**

- Required: `regimeType` (enum), `reducedMinutesPerDay` (int, 0-480).
- Optional: `applyToStart` (boolean, default false), `applyToEnd` (boolean, default false), `documentUrl` (url string).

---

## GET /me (List Personal Applications)

Full URL: https://api-staging-lm.vnbro.com/api/1.0/hrm/application/me
List own applications with pagination and filters.

Query parameters (optional):

- page (int): default 1
- pageSize (int): default 20
- type (string)
- status (string)
- startDate (date-time)
- endDate (date-time)

---

## GET /:id (Application Details)

Full URL: https://api-staging-lm.vnbro.com/api/1.0/hrm/application/{id}
Get specific application by ID (accessible by applicant or managers).

---

## PATCH /:id/cancel (Cancel Application)

Full URL: https://api-staging-lm.vnbro.com/api/1.0/hrm/application/{id}/cancel
Cancel own pending application. Body: JSON.

Optional fields:

- reason (string): max 500 characters

---

## GET / (List All Applications)

Full URL: https://api-staging-lm.vnbro.com/api/1.0/hrm/application
List all applications across the organization.
_Required roles: Admin, HR Manager, General Manager, or Team Leader._

Query parameters (optional):

- page (int): default 1
- pageSize (int): default 20
- type (string)
- status (string)
- employeeId (string cuid)
- startDate (date-time)
- endDate (date-time)

---

## GET /employee/:employeeId (List Applications by Employee)

Full URL: https://api-staging-lm.vnbro.com/api/1.0/hrm/application/employee/{employeeId}
List applications for a specific employee.
_Required roles: Admin, HR Manager, General Manager, or Team Leader._

Required fields:

- employeeId (string cuid) provided as a URL route parameter.

Query parameters (optional):

- Same as GET `/me` (page, pageSize, type, status, startDate, endDate).

---

## PATCH /:id/approve (Approve Application)

Full URL: https://api-staging-lm.vnbro.com/api/1.0/hrm/application/{id}/approve
Approve a pending application.
_Required roles: Admin, HR Manager, General Manager, or Team Leader._
Body: JSON.

Required fields:

- status (string): Required value is `"approved"`

---

## PATCH /:id/reject (Reject Application)

Full URL: https://api-staging-lm.vnbro.com/api/1.0/hrm/application/{id}/reject
Reject a pending application.
_Required roles: Admin, HR Manager, General Manager, or Team Leader._
Body: JSON.

Required fields:

- rejectReason (string): Required, 5 to 500 characters.

Optional fields:

- status (string): `"rejected"`
