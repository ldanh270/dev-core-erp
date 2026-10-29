# Attendance & Working Shift Module - API Description

Base paths:

- `/api/attendance` — Attendance management (check-in / check-out / history / export)
- `/api/shifts` — Working shift management
- `/api/schedules` — Employee schedules
- `/api/shift-change-requests` — Shift swap and change requests

## Required headers (all endpoints)

- Authorization: Bearer {token} (required by authenticate middleware; empId and role extracted from JWT).

## Common status codes

- 200: Success.
- 400: Bad request (validation error from Zod schema).
- 401: Unauthorized (missing/invalid token, or empId not found in token).
- 403: Forbidden (insufficient role).
- 404: Not found.
- 409: Conflict (e.g. already checked out today).
- 500: Internal server error.

---

## [Attendance] Fingerprint Check-in / Check-out

### POST /api/attendance/check-in (Check-in)

Create a check-in record for the authenticated employee. Body: JSON.

Required fields (validated/used in logic):

- location.lat (number, -90 to 90)
- location.lng (number, -180 to 180)

Output body (success):

- id (string, cuid)
- employeeId (string, cuid)
- date (date-time)
- checkInAt (date-time)
- checkOutAt (null)
- status (string: on_time | late)
- lateMinutes (int)

Output body (failed):

- 401: error.message = "Unauthorized", error.code = "UNAUTHORIZED"
- 400: error.message = "Validation error", error.code = "VALIDATION_ERROR", error.meta = zod issues array

### POST /api/attendance/check-out (Check-out)

Create a check-out record for the authenticated employee. Body: JSON.

Required fields (validated/used in logic):

- location.lat (number, -90 to 90)
- location.lng (number, -180 to 180)

Output body (success):

- id (string, cuid)
- employeeId (string, cuid)
- date (date-time)
- checkInAt (date-time)
- checkOutAt (date-time)
- status (string: on_time | early_leave | overtime)
- earlyLeaveMinutes (int)
- overtimeMinutes (int)
- totalWorkMinutes (int)

Output body (failed):

- 401: error.message = "Unauthorized", error.code = "UNAUTHORIZED"
- 400: error.message = "Validation error", error.code = "VALIDATION_ERROR", error.meta = zod issues array

### POST /api/attendance/scan (Automated Check-in — QR / Virtual Scanner)

Smart scan — auto-determines check-in or check-out based on today's existing record. Body: JSON.

Logic:

- No record today, or checkInAt is null → performs check-in
- Has checkInAt but checkOutAt is null → performs check-out
- Both checkInAt and checkOutAt exist → returns 409

Required fields (validated/used in logic):

- location.lat (number, -90 to 90)
- location.lng (number, -180 to 180)

Output body (success): same shape as check-in or check-out depending on which action was performed.

Output body (failed):

- 409: error.message = "Attendance already checked out", error.code = "CONFLICT"
- 401: error.message = "Unauthorized", error.code = "UNAUTHORIZED"
- 400: error.message = "Validation error", error.code = "VALIDATION_ERROR", error.meta = zod issues array

---

## [Attendance] Auto-calculate Work Hours & Handle Late/Early/Absent

Handled automatically by the system on check-out. No separate endpoint — logic runs inside POST /api/attendance/check-out.

System logic (used in logic, not input fields):

- totalWorkMinutes: calculated from checkInAt to checkOutAt
- lateMinutes: calculated if checkInAt > shift.startTime by more than grace period
- earlyLeaveMinutes: calculated if checkOutAt < shift.endTime
- overtimeMinutes: calculated if checkOutAt > shift.endTime
- status: determined as on_time | late | early_leave | absent | overtime based on above values

---

## [Attendance] View Attendance History (Employee — Personal History)

### GET /api/attendance (Attendance History)

Query attendance records. Query string parameters.

Role logic:

- ADMIN, HR_MANAGER, GENERAL_MANAGER: can query any employee.
- Other roles (Employee): query is automatically scoped to their own employeeId.

Optional query params:

- startDate (date-time)
- endDate (date-time)
- employeeId (string, cuid) — ignored for non-admin/HR roles
- status (string: on_time | late | early_leave | absent | overtime)

Output body (success):

- data (array)
  - id (string, cuid)
  - employeeId (string, cuid)
  - date (date-time)
  - checkInAt (date-time | null)
  - checkOutAt (date-time | null)
  - status (string)
  - lateMinutes (int)
  - earlyLeaveMinutes (int)
  - overtimeMinutes (int)
  - totalWorkMinutes (int)
  - employee.fullName (string)
  - employee.email (string)
  - employeeShift.shift.name (string)
  - employeeShift.shift.startTime (int, minutes from midnight)
  - employeeShift.shift.endTime (int, minutes from midnight)

Output body (failed):

- 401: error.message = "Unauthorized", error.code = "UNAUTHORIZED"
- 400: error.message = "Validation error", error.code = "VALIDATION_ERROR", error.meta = zod issues array

---

## [Attendance] View All Attendance History (HR Manager — Organization-wide)

Same endpoint as above: GET /api/attendance

HR_MANAGER, ADMIN, GENERAL_MANAGER roles can pass any employeeId in query params to view all employees. Employee role is auto-scoped to their own records.

Additional filter for HR:

- employeeId (string, cuid, optional) — filter by specific employee

---

## [Attendance] Export Attendance Report (HR Manager — Export)

### GET /api/attendance/export (Export Attendance Report)

Export attendance records as a UTF-8 CSV file. Query string parameters.

Required role: ADMIN, HR_MANAGER, or GENERAL_MANAGER.

Optional query params:

- startDate (date-time)
- endDate (date-time)
- employeeId (string, cuid)
- status (string: on_time | late | early_leave | absent | overtime)

Output (success):

- Content-Type: text/csv; charset=utf-8
- Content-Disposition: attachment; filename="attendance_report_YYYY-MM-DD.csv"
- CSV columns: Date, Employee Name, Employee ID, Email, Shift Name, Scheduled Hours, Check In, Check Out, Status, Late (min), Early Leave (min), Overtime (min), Total Work (min)

Output body (failed):

- 403: error.message = "Forbidden: Only HR and Admins can export reports", error.code = "FORBIDDEN"
- 401: error.message = "Unauthorized", error.code = "UNAUTHORIZED"
- 400: error.message = "Validation error", error.code = "VALIDATION_ERROR", error.meta = zod issues array

---

## [Working Shift] Create Working Shift (HR Manager — Create Shift)

### POST /api/shifts (Create Working Shift)

Create a new working shift. Body: JSON.

Required role: ADMIN, HR_MANAGER, or GENERAL_MANAGER.

Required fields (validated/used in logic):

- name (string)
- startTime (int, minutes from midnight — e.g. 480 = 08:00)
- endTime (int, minutes from midnight — e.g. 1020 = 17:00)

Output body (success):

- id (string, cuid)
- name (string)
- startTime (int)
- endTime (int)
- createdAt (date-time)

Output body (failed):

- 403: error.message = "Forbidden", error.code = "FORBIDDEN"
- 401: error.message = "Unauthorized", error.code = "UNAUTHORIZED"
- 400: error.message = "Validation error", error.code = "VALIDATION_ERROR", error.meta = zod issues array

---

## [Working Shift] Modify Working Shift (HR Manager — Update Shift)

### PATCH /api/shifts/:id (Update Working Shift)

Update an existing working shift. Body: JSON.

Required role: ADMIN, HR_MANAGER, or GENERAL_MANAGER.

Path params:

- id (string, cuid, required)

Optional fields (any subset):

- name (string)
- startTime (int, minutes from midnight)
- endTime (int, minutes from midnight)

Output body (success):

- id (string, cuid)
- name (string)
- startTime (int)
- endTime (int)
- updatedAt (date-time)

Output body (failed):

- 403: error.message = "Forbidden", error.code = "FORBIDDEN"
- 404: error.message = "Not found", error.code = "NOT_FOUND"
- 401: error.message = "Unauthorized", error.code = "UNAUTHORIZED"
- 400: error.message = "Validation error", error.code = "VALIDATION_ERROR", error.meta = zod issues array

---

## [Working Shift] View Working Shift (Employee — View Own Shifts)

### GET /api/shifts (List Working Shifts)

List all working shifts. No role restriction beyond authentication.

No required fields.

Output body (success):

- data (array)
  - id (string, cuid)
  - name (string)
  - startTime (int, minutes from midnight)
  - endTime (int, minutes from midnight)

Output body (failed):

- 401: error.message = "Unauthorized", error.code = "UNAUTHORIZED"

### GET /api/shifts/:id (Working Shift Details)

Get a specific shift by ID.

Path params:

- id (string, cuid, required)

Output body (success): shift object (same shape as array item above).

Output body (failed):

- 404: error.message = "Not found", error.code = "NOT_FOUND"
- 401: error.message = "Unauthorized", error.code = "UNAUTHORIZED"

### GET /api/schedules/my (Current Employee Schedule)

Get the authenticated employee's current assigned schedule. Employee identified by JWT.

No required fields.

Output body (success):

- employeeId (string, cuid)
- shift.name (string)
- shift.startTime (int, minutes from midnight)
- shift.endTime (int, minutes from midnight)
- effectiveDate (date-time)

Output body (failed):

- 401: error.message = "Unauthorized", error.code = "UNAUTHORIZED"

### GET /api/schedules/my/all (Historical Employee Schedules)

List all schedule history for the authenticated employee.

No required fields.

Output body (success): array of schedule objects (same shape as above).

Output body (failed):

- 401: error.message = "Unauthorized", error.code = "UNAUTHORIZED"

---

## [Working Shift] Shift Change Request (Employee — Submit Swap Request)

### POST /api/shift-change-requests (Submit Shift Change Request)

Submit a shift change request. Body: JSON.

Required fields (validated/used in logic):

- employeeShiftId (string, cuid) — own shift to swap away

Optional fields:

- workingShiftId (string, cuid) — target shift type to swap to
- swapWithEmployeeId (string, cuid) — specific employee to swap with
- swapWithShiftId (string, cuid) — that employee's specific shift

Output body (success):

- id (string, cuid)
- status (string: pending)
- employeeShiftId (string, cuid)
- workingShiftId (string, cuid | null)
- swapWithEmployeeId (string, cuid | null)
- createdAt (date-time)

Output body (failed):

- 401: error.message = "Unauthorized", error.code = "UNAUTHORIZED"
- 400: error.message = "Validation error", error.code = "VALIDATION_ERROR", error.meta = zod issues array

### GET /api/shift-change-requests/mine (List My Shift Change Requests)

List the authenticated employee's own shift change requests.

No required fields.

Output body (success):

- data (array)
  - id (string, cuid)
  - status (string: pending | approved | rejected | cancelled)
  - employeeShiftId (string, cuid)
  - workingShiftId (string, cuid | null)
  - swapWithEmployeeId (string, cuid | null)
  - createdAt (date-time)

Output body (failed):

- 401: error.message = "Unauthorized", error.code = "UNAUTHORIZED"

---

## [Working Shift] Approve/Reject Shift Change Request (HR / Team Leader)

### PATCH /api/shift-change-requests/:id/approve (Approve Shift Change Request)

Approve a pending shift change request. Body: JSON.

Required role: ADMIN, HR_MANAGER, GENERAL_MANAGER, or TEAM_LEADER.

Path params:

- id (string, cuid, required)

Required fields (validated/used in logic):

- status (string, must be exactly "approved")

Output body (success): updated shift change request object with status = approved.

Output body (failed):

- 403: error.message = "Forbidden", error.code = "FORBIDDEN"
- 404: error.message = "Not found", error.code = "NOT_FOUND"
- 401: error.message = "Unauthorized", error.code = "UNAUTHORIZED"
- 400: error.message = "Validation error", error.code = "VALIDATION_ERROR", error.meta = zod issues array

### PATCH /api/shift-change-requests/:id/reject (Reject Shift Change Request)

Reject a pending shift change request with a mandatory reason. Body: JSON.

Required role: ADMIN, HR_MANAGER, GENERAL_MANAGER, or TEAM_LEADER.

Path params:

- id (string, cuid, required)

Required fields (validated/used in logic):

- rejectReason (string, 5–500 chars)

Output body (success): updated shift change request object with status = rejected and rejectReason populated.

Output body (failed):

- 403: error.message = "Forbidden", error.code = "FORBIDDEN"
- 404: error.message = "Not found", error.code = "NOT_FOUND"
- 401: error.message = "Unauthorized", error.code = "UNAUTHORIZED"
- 400: error.message = "Validation error", error.code = "VALIDATION_ERROR", error.meta = zod issues array

---

## [Working Shift] Assign Schedule to Employee (HR Manager — Assign Schedule)

### POST /api/schedules/assign (Assign Employee Schedule)

Assign a working shift to an employee. Body: JSON.

Required role: ADMIN, HR_MANAGER, or GENERAL_MANAGER.

Required fields (validated/used in logic):

- employeeId (string, cuid)
- workingShiftId (string, cuid)
- effectiveDate (date-time)

Output body (success): created schedule assignment object.

Output body (failed):

- 403: error.message = "Forbidden", error.code = "FORBIDDEN"
- 401: error.message = "Unauthorized", error.code = "UNAUTHORIZED"
- 400: error.message = "Validation error", error.code = "VALIDATION_ERROR", error.meta = zod issues array

### POST /api/schedules/override (Override Schedule for Date)

Override an employee's assigned shift for a specific date. Body: JSON.

Required role: ADMIN, HR_MANAGER, or GENERAL_MANAGER.

Required fields (validated/used in logic):

- employeeId (string, cuid)
- workingShiftId (string, cuid)
- date (date-time)

Output body (success): override record object.

Output body (failed):

- 403: error.message = "Forbidden", error.code = "FORBIDDEN"
- 401: error.message = "Unauthorized", error.code = "UNAUTHORIZED"
- 400: error.message = "Validation error", error.code = "VALIDATION_ERROR", error.meta = zod issues array

---

## Enums Reference

- AttendanceStatus: on_time | late | early_leave | absent | overtime
- ShiftChangeRequestStatus: pending | approved | rejected | cancelled
