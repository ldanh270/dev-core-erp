# HRM Request - Payroll & Salary Endpoints

Base paths: `/api/salary-components`, `/api/salary-variables`, `/api/payslip-templates`, `/api/employees`, `/api/payrolls`

## Required headers (all endpoints)

- Content-Type: application/json (Required for requests containing a JSON body).
- Authorization: Bearer {token} (Required for all endpoints).

## Common status codes

- 200: Success.
- 201: Created.
- 400: Bad request (Invalid input data or business rule violation, e.g. invalid formula).
- 401: Unauthorized (Missing or invalid token).
- 403: Forbidden (Insufficient permissions).
- 404: Not found (Resource not found).
- 500: Internal server error.

---

## 1. Salary Component APIs

Salary components can represent an addition or deduction, evaluated as currency, number, or percentage. Components define mathematical formulas evaluated with variables.

### GET /api/salary-components

List all salary components. Body: None.
Required roles: `ADMIN`, `HR_MANAGER`.

### POST /api/salary-components

Create a new salary component. Body: JSON.
Required roles: `ADMIN`, `HR_MANAGER`.

```json
{
  "name": "Lunch Allowance",
  "type": "addition",
  "valueType": "currency",
  "formula": "500000",
  "description": "Monthly lunch allowance"
}
```

### PUT /api/salary-components/:id

Update salary component details. Body: JSON.
Required roles: `ADMIN`, `HR_MANAGER`.

### DELETE /api/salary-components/:id

Delete (or deactivate) salary component. Body: None.
Required roles: `ADMIN`, `HR_MANAGER`.

### POST /api/salary-components/validate

Validate salary formula syntax and variable resolution. Body: JSON.
Required roles: `ADMIN`, `HR_MANAGER`.

```json
{
  "formula": "base_salary * 0.1 + overtime_hours * 100000"
}
```

---

## 2. Salary Variable APIs

Salary variables supply values for formula evaluation (e.g., tax brackets, standard monthly working days, statutory rates).

### GET /api/salary-variables

List all salary variables. Body: None.
Required roles: `ADMIN`, `HR_MANAGER`.

### GET /api/salary-variables/:id

Get salary variable details by ID. Body: None.
Required roles: `ADMIN`, `HR_MANAGER`.

### POST /api/salary-variables

Create a new salary variable. Body: JSON.
Required roles: `ADMIN`, `HR_MANAGER`.

```json
{
  "code": "TAX_RATE",
  "name": "Income Tax Rate",
  "value": 10,
  "description": "Standard personal income tax rate (10%)"
}
```

### PUT /api/salary-variables/:id

Update salary variable. Body: JSON.
Required roles: `ADMIN`, `HR_MANAGER`.

### DELETE /api/salary-variables/:id

Delete salary variable. Body: None.
Required roles: `ADMIN`, `HR_MANAGER`.

---

## 3. Payslip Template APIs

Manage payslip templates for employee cohorts, binding associated salary components.

### GET /api/payslip-templates

List all payslip templates. Body: None.
Required roles: `ADMIN`, `HR_MANAGER`.

### POST /api/payslip-templates

Create a new payslip template. Body: JSON.
Required roles: `ADMIN`, `HR_MANAGER`.

```json
{
  "name": "Office Staff Template",
  "description": "Applied to corporate administrative staff",
  "componentIds": ["comp_id_1", "comp_id_2"]
}
```

### PUT /api/payslip-templates/:id

Update payslip template. Body: JSON.
Required roles: `ADMIN`, `HR_MANAGER`.

### DELETE /api/payslip-templates/:id

Delete payslip template. Body: None.
Required roles: `ADMIN`, `HR_MANAGER`.

---

## 4. Employee Salary Config APIs

Configure base compensation amounts and assign payslip templates to employees.

### GET /api/employees/:id/salary-config

Get active salary configuration for an employee. Body: None.
Required roles: `ADMIN`, `HR_MANAGER`.

### GET /api/employees/:id/salary-config/history

Get change history of employee salary configurations. Body: None.
Required roles: `ADMIN`, `HR_MANAGER`.

### POST /api/employees/:id/salary-config

Assign new salary configuration to employee. Body: JSON.
Required roles: `ADMIN`, `HR_MANAGER`.

```json
{
  "templateId": "template_id_here",
  "baseSalary": 15000000,
  "effectiveFrom": "2026-06-01T00:00:00Z",
  "effectiveTo": null,
  "note": "Annual compensation review"
}
```

---

## 5. Payroll & Payslip APIs

### GET /api/payrolls/settings

Get scheduled payroll generation settings (day of month, hour, minute). Body: None.
Required roles: `ADMIN`, `HR_MANAGER`.

### PUT /api/payrolls/settings

Update scheduled payroll automation settings. Body: JSON.
Required roles: `ADMIN`, `HR_MANAGER`.

```json
{
  "triggerDay": 25,
  "triggerHour": 0,
  "triggerMinute": 0
}
```

### POST /api/payrolls/generate

Generate a new payroll run for the designated month and year. Body: JSON.
Required roles: `ADMIN`, `HR_MANAGER`.

```json
{
  "periodMonth": 6,
  "periodYear": 2026,
  "name": "Payroll June 2026"
}
```

### GET /api/payrolls

List generated payroll runs. Body: None.
Required roles: `ADMIN`, `HR_MANAGER`, `GENERAL_MANAGER`.

### GET /api/payrolls/:id

View details of a specific payroll run including payslips and summary aggregates. Body: None.
Required roles: `ADMIN`, `HR_MANAGER`, `GENERAL_MANAGER`.

### POST /api/payrolls/:id/approve

Approve payroll run (transitions status from `pending_approval` to `approved`). Body: None.
Required roles: `ADMIN`, `GENERAL_MANAGER`.

### POST /api/payrolls/:id/reject

Reject payroll run and request revisions. Body: JSON.
Required roles: `ADMIN`, `GENERAL_MANAGER`.

```json
{
  "rejectReason": "Discrepancy in allowance calculation"
}
```

### GET /api/payrolls/:id/payslips/:empId

Get employee payslip details for a specific payroll period. Body: None.
Required roles: `ADMIN`, `HR_MANAGER`, `GENERAL_MANAGER`.

### GET /api/payrolls/employee/:empId/payslips

Get historical payslips for an employee across all cycles. Body: None.
Required roles: `ADMIN`, `HR_MANAGER`.

### GET /api/payrolls/my/payslips

Get payslips of the currently authenticated employee. Body: None.
Required roles: All roles.

```json
{
  "status": "success",
  "data": [
    {
      "id": "payslip_id_1",
      "payroll": {
        "periodMonth": 5,
        "periodYear": 2026
      },
      "totalAdditions": 2000000,
      "totalDeductions": 500000,
      "netSalary": 16500000
    }
  ]
}
```
