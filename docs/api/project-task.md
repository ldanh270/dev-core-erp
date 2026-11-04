# HRM Project & Task Management - API Endpoints

Base path: `/api`

## Required headers (all endpoints)

- `Authorization: Bearer {token}` (required to authenticate session and decode active employee profile credentials).
- `Content-Type: application/json` (required for all request bodies).

## Common status codes

- `200` / `201`: Success (contains JSON envelope wrapping matching entity `data` properties).
- `400`: Bad request (due to Zod schema validation errors, missing/malformed attributes).
- `401`: Unauthorized (missing authorization token or expired session credentials).
- `403`: Forbidden (user role possesses insufficient permissions to perform action).
- `404`: Not found (target project, task, category, or time log record is missing from database).
- `500`: Internal server error.

---

# MODULE 1: PROJECTS (`/projects`)

## 1. GET `/projects` (List Projects)

Retrieve a list of projects. Users with `admin` or `general_manager` role see all projects; other roles see only projects they are members of.

- **Query Parameters (Optional):**
  - `page`: Page index number (string representation of integer)
  - `limit`: Limits records count per page
  - `search`: Keyword string matching project title/description/techStack
  - `status`: Filter by project status enum values
  - `sortBy`: Sorting field key (e.g., `createdAt`)
  - `sortOrder`: `asc` or `desc`

- **Success Response (200 OK):**
  ```json
  {
    "data": {
      "data": [
        {
          "id": "proj-uuid-12345",
          "name": "E-Commerce Frontend Website",
          "description": "Redesigning checkout pages and product lists.",
          "techStack": ["React", "TypeScript", "Tailwind CSS"],
          "status": "active",
          "taskCreationPolicy": "all_members",
          "startDate": "2026-06-01T00:00:00.000Z",
          "expectedEndDate": "2026-12-31T00:00:00.000Z",
          "actualEndDate": null,
          "teamLeaderId": "emp-uuid-54321",
          "createdAt": "2026-06-14T03:00:00.000Z",
          "updatedAt": "2026-06-14T03:00:00.000Z"
        }
      ],
      "meta": {
        "total": 1,
        "page": 1,
        "limit": 10,
        "totalPages": 1
      }
    },
    "error": null
  }
  ```

---

## 2. GET `/projects/:id` (Get Project Detail)

Retrieve all details of a single project by its ID.

- **Success Response (200 OK):**

  ```json
  {
    "data": {
      "id": "proj-uuid-12345",
      "name": "E-Commerce Frontend Website",
      "description": "Redesigning checkout pages and product lists.",
      "techStack": ["React", "TypeScript", "Tailwind CSS"],
      "status": "active",
      "taskCreationPolicy": "all_members",
      "startDate": "2026-06-01T00:00:00.000Z",
      "expectedEndDate": "2026-12-31T00:00:00.000Z",
      "actualEndDate": null,
      "teamLeaderId": "emp-uuid-54321",
      "teamLeader": {
        "id": "emp-uuid-54321",
        "fullName": "Nguyen Van A",
        "email": "leader.a@company.com"
      },
      "createdAt": "2026-06-14T03:00:00.000Z",
      "updatedAt": "2026-06-14T03:00:00.000Z"
    },
    "error": null
  }
  ```

- **Failed Response (404 Not Found):**
  ```json
  {
    "data": null,
    "error": {
      "message": "Project not found",
      "code": "NOT_FOUND"
    }
  }
  ```

---

## 3. POST `/projects` (Create Project)

Create a new project. Restricted to `admin` or `general_manager` role only.

- **Required Fields:**
  - `name`: string (2-100 characters)
  - `techStack`: string array (at least 1 technology)

- **Optional Fields:**
  - `description`: string (max 500 characters)
  - `status`: string (`planning` | `active` | `on_hold` | `completed` | `cancelled`)
  - `taskCreationPolicy`: string (`leader_only` | `all_members` - default: `all_members`)
  - `startDate`: string (ISO 8601 date format)
  - `expectedEndDate`: string (ISO 8601 date format)
  - `teamLeaderId`: string (valid employee ID)

- **Request Body (JSON):**

  ```json
  {
    "name": "HRM Mobile App Extension",
    "description": "Developing request forms for iOS & Android.",
    "techStack": ["React Native", "Expo", "Zustand"],
    "status": "planning",
    "taskCreationPolicy": "leader_only",
    "startDate": "2026-07-01T00:00:00.000Z",
    "expectedEndDate": "2026-10-30T00:00:00.000Z",
    "teamLeaderId": "emp-uuid-99999"
  }
  ```

- **Success Response (201 Created):**

  ```json
  {
    "data": {
      "id": "proj-uuid-67890",
      "name": "HRM Mobile App Extension",
      "description": "Developing request forms for iOS & Android.",
      "techStack": ["React Native", "Expo", "Zustand"],
      "status": "planning",
      "taskCreationPolicy": "leader_only",
      "startDate": "2026-07-01T00:00:00.000Z",
      "expectedEndDate": "2026-10-30T00:00:00.000Z",
      "actualEndDate": null,
      "teamLeaderId": "emp-uuid-99999",
      "createdAt": "2026-06-14T08:50:00.000Z",
      "updatedAt": "2026-06-14T08:50:00.000Z"
    },
    "error": null
  }
  ```

- **Failed Response (400 Bad Request - Validation Error):**
  ```json
  {
    "data": null,
    "error": {
      "message": "Validation error",
      "code": "VALIDATION_ERROR",
      "meta": [
        {
          "code": "too_small",
          "minimum": 2,
          "type": "string",
          "inclusive": true,
          "exact": false,
          "message": "Project name must be at least 2 characters",
          "path": ["name"]
        }
      ]
    }
  }
  ```

---

## 4. PATCH `/projects/:id` (Update Project Settings)

Modify project parameters. Restricted to `admin`, `general_manager`, or the project's `teamLeaderId`.

- **Optional Fields (At least one must be provided):**
  - `name`: string (2-100 characters)
  - `description`: string (max 500 characters)
  - `techStack`: string array (at least 1 technology)
  - `status`: string (`planning` | `active` | `on_hold` | `completed` | `cancelled`)
  - `taskCreationPolicy`: string (`leader_only` | `all_members`)
  - `startDate`: string (ISO 8601 date format)
  - `expectedEndDate`: string (ISO 8601 date format)
  - `actualEndDate`: string (ISO 8601 date format)
  - `teamLeaderId`: string (valid employee ID or null)

- **Request Body (JSON):**

  ```json
  {
    "status": "active",
    "description": "Updated description with scope extensions."
  }
  ```

- **Success Response (200 OK):**
  ```json
  {
    "data": {
      "id": "proj-uuid-67890",
      "name": "HRM Mobile App Extension",
      "description": "Updated description with scope extensions.",
      "techStack": ["React Native", "Expo", "Zustand"],
      "status": "active",
      "taskCreationPolicy": "leader_only",
      "startDate": "2026-07-01T00:00:00.000Z",
      "expectedEndDate": "2026-10-30T00:00:00.000Z",
      "actualEndDate": null,
      "teamLeaderId": "emp-uuid-99999",
      "createdAt": "2026-06-14T08:50:00.000Z",
      "updatedAt": "2026-06-14T08:55:00.000Z"
    },
    "error": null
  }
  ```

---

## 5. DELETE `/projects/:id` (Delete Project)

Delete a project and its associations. Restricted to `admin` or `general_manager` role only.

- **Success Response (200 OK):**
  ```json
  {
    "data": null,
    "error": null
  }
  ```

---

## 6. GET `/projects/:id/members` (Get Project Members)

Fetch list of employees registered as members of the team.

- **Success Response (200 OK):**
  ```json
  {
    "data": [
      {
        "id": "member-uuid-1",
        "projectId": "proj-uuid-12345",
        "employeeId": "emp-uuid-77777",
        "employee": {
          "id": "emp-uuid-77777",
          "fullName": "Tran Van B",
          "email": "member.b@company.com"
        },
        "createdAt": "2026-06-14T03:30:00.000Z"
      }
    ],
    "error": null
  }
  ```

---

## 7. POST `/projects/:id/members` (Add Project Member)

Register a new member to the project team. Restricted to `admin`, `general_manager`, or the project's `teamLeaderId`.

- **Required Fields:**
  - `employeeId`: string (ID of the employee to add)

- **Request Body (JSON):**

  ```json
  {
    "employeeId": "emp-uuid-77777"
  }
  ```

- **Success Response (200 OK):**
  ```json
  {
    "data": null,
    "error": null
  }
  ```

---

## 8. DELETE `/projects/:id/members/:employeeId` (Remove Project Member)

Remove an employee member relationship from the project team. Restricted to `admin`, `general_manager`, or the project's `teamLeaderId`.

- **Success Response (200 OK):**
  ```json
  {
    "data": null,
    "error": null
  }
  ```

---

---

# MODULE 2: TASKS (`/tasks`)

## 1. GET `/tasks` (List Tasks)

Retrieve a paginated, filtered list of tasks.

- **Query Parameters (Optional):**
  - `projectId`: Filter tasks by specific project ID
  - `page`: Page index (string representation of integer)
  - `limit`: Number of tasks per page
  - `search`: Keyword string matching task title
  - `tracker`: Filter by tracker type (`bug` | `feature` | `support`)
  - `status`: Filter by task status (`todo` | `in_progress` | `in_review` | `done` | `cancelled` | `reopened`)
  - `priority`: Filter by priority level (`low` | `medium` | `high` | `urgent`)
  - `assigneeId`: Filter tasks by assignee ID
  - `createdById`: Filter tasks by creator ID
  - `sortBy`: Sorting field key (default: `createdAt`)
  - `sortOrder`: Sorting direction (`asc` | `desc`)

- **Success Response (200 OK):**
  ```json
  {
    "data": {
      "data": [
        {
          "id": "task-uuid-001",
          "projectId": "proj-uuid-12345",
          "title": "Setup basic ESLint configs",
          "description": "Configure rules to follow clean coding constitution.",
          "tracker": "feature",
          "status": "todo",
          "priority": "medium",
          "progress": 0,
          "assigneeId": "emp-uuid-77777",
          "createdById": "emp-uuid-54321",
          "estimatedTime": 4,
          "startDate": "2026-06-15T00:00:00.000Z",
          "dueDate": "2026-06-18T00:00:00.000Z",
          "completedAt": null,
          "categoryId": "cat-uuid-111",
          "createdAt": "2026-06-14T09:00:00.000Z",
          "updatedAt": "2026-06-14T09:00:00.000Z"
        }
      ],
      "meta": {
        "total": 1,
        "page": 1,
        "limit": 25,
        "totalPages": 1
      }
    },
    "error": null
  }
  ```

---

## 2. GET `/tasks/:id` (Get Task Detail)

Retrieve all details of a single task by its ID.

- **Success Response (200 OK):**
  ```json
  {
    "data": {
      "id": "task-uuid-001",
      "projectId": "proj-uuid-12345",
      "title": "Setup basic ESLint configs",
      "description": "Configure rules to follow clean coding constitution.",
      "tracker": "feature",
      "status": "todo",
      "priority": "medium",
      "progress": 0,
      "assigneeId": "emp-uuid-77777",
      "assignee": {
        "id": "emp-uuid-77777",
        "fullName": "Tran Van B"
      },
      "createdById": "emp-uuid-54321",
      "createdBy": {
        "id": "emp-uuid-54321",
        "fullName": "Nguyen Van A"
      },
      "estimatedTime": 4,
      "startDate": "2026-06-15T00:00:00.000Z",
      "dueDate": "2026-06-18T00:00:00.000Z",
      "completedAt": null,
      "categoryId": "cat-uuid-111",
      "category": {
        "id": "cat-uuid-111",
        "name": "Backend Setup"
      },
      "createdAt": "2026-06-14T09:00:00.000Z",
      "updatedAt": "2026-06-14T09:00:00.000Z"
    },
    "error": null
  }
  ```

---

## 3. POST `/tasks` (Create Task)

Create a new task under a project. Restricted by the project's task creation policy.
If the policy is `leader_only`, only `admin`, `general_manager`, or the project's `teamLeaderId` can invoke this.
If the policy is `all_members`, any member added to the project team can invoke this.

- **Required Fields:**
  - `projectId`: string (valid project ID)
  - `title`: string (2-150 characters)

- **Optional Fields:**
  - `description`: string (max 1000 characters)
  - `tracker`: string (`bug` | `feature` | `support` - default: `feature`)
  - `priority`: string (`low` | `medium` | `high` | `urgent` - default: `medium`)
  - `status`: string (`todo` | `in_progress` | `in_review` | `done` | `cancelled` | `reopened` - default: `todo`)
  - `assigneeId`: string (valid employee ID who is a member of the project)
  - `startDate`: string (ISO 8601 date format)
  - `dueDate`: string (ISO 8601 date format)
  - `estimatedTime`: number (non-negative)
  - `progress`: integer (0-100 - default: 0)
  - `categoryId`: string (valid project category ID)

- **Request Body (JSON):**

  ```json
  {
    "projectId": "proj-uuid-12345",
    "title": "Fix memory leak in Dashboard",
    "description": "Inspect chart re-renders.",
    "tracker": "bug",
    "priority": "high",
    "status": "todo",
    "assigneeId": "emp-uuid-77777",
    "startDate": "2026-06-14T00:00:00.000Z",
    "dueDate": "2026-06-16T00:00:00.000Z",
    "estimatedTime": 6,
    "progress": 0,
    "categoryId": "cat-uuid-111"
  }
  ```

- **Success Response (201 Created):**

  ```json
  {
    "data": {
      "id": "task-uuid-002",
      "projectId": "proj-uuid-12345",
      "title": "Fix memory leak in Dashboard",
      "description": "Inspect chart re-renders.",
      "tracker": "bug",
      "status": "todo",
      "priority": "high",
      "progress": 0,
      "assigneeId": "emp-uuid-77777",
      "createdById": "emp-uuid-11111",
      "estimatedTime": 6,
      "startDate": "2026-06-14T00:00:00.000Z",
      "dueDate": "2026-06-16T00:00:00.000Z",
      "completedAt": null,
      "categoryId": "cat-uuid-111",
      "createdAt": "2026-06-14T09:30:00.000Z",
      "updatedAt": "2026-06-14T09:30:00.000Z"
    },
    "error": null
  }
  ```

- **Failed Response (400 Bad Request - Date Validation Fail):**
  ```json
  {
    "data": null,
    "error": {
      "message": "Validation failed: startDate: Start date must be before or equal to due date",
      "code": "VALIDATION_ERROR"
    }
  }
  ```

---

## 4. PATCH `/tasks/:id` (Update Task)

Update task details. Restricted to `admin`, the project's `teamLeaderId`, the task creator (`createdById`), or the task assignee (`assigneeId`).

- **Optional Fields:**
  - `title`: string (2-150 characters)
  - `description`: string (max 1000 characters)
  - `tracker`: string (`bug` | `feature` | `support`)
  - `priority`: string (`low` | `medium` | `high` | `urgent`)
  - `status`: string (`todo` | `in_progress` | `in_review` | `done` | `cancelled` | `reopened`)
  - `assigneeId`: string (valid employee ID or null)
  - `startDate`: string (ISO 8601 date format or null)
  - `dueDate`: string (ISO 8601 date format or null)
  - `completedAt`: string (ISO 8601 date format or null - auto-assigned if status becomes `done`)
  - `estimatedTime`: number (non-negative)
  - `progress`: integer (0-100)
  - `categoryId`: string (valid category ID or null)

- **Request Body (JSON):**

  ```json
  {
    "status": "in_progress",
    "progress": 30
  }
  ```

- **Success Response (200 OK):**
  ```json
  {
    "data": {
      "id": "task-uuid-002",
      "projectId": "proj-uuid-12345",
      "title": "Fix memory leak in Dashboard",
      "description": "Inspect chart re-renders.",
      "tracker": "bug",
      "status": "in_progress",
      "priority": "high",
      "progress": 30,
      "assigneeId": "emp-uuid-77777",
      "createdById": "emp-uuid-11111",
      "estimatedTime": 6,
      "startDate": "2026-06-14T00:00:00.000Z",
      "dueDate": "2026-06-16T00:00:00.000Z",
      "completedAt": null,
      "categoryId": "cat-uuid-111",
      "createdAt": "2026-06-14T09:30:00.000Z",
      "updatedAt": "2026-06-14T09:45:00.000Z"
    },
    "error": null
  }
  ```

---

## 5. DELETE `/tasks/:id` (Delete Task)

Delete a task. Restricted to `admin`, the project's `teamLeaderId`, or the task creator (`createdById`).

- **Success Response (200 OK):**
  ```json
  {
    "data": null,
    "error": null
  }
  ```

---

---

# MODULE 3: TASK CATEGORIES (`/projects/:projectId/categories`)

## 1. GET `/projects/:projectId/categories` (List Categories)

List all custom task tags/categories defined under a project.

- **Success Response (200 OK):**
  ```json
  {
    "data": [
      {
        "id": "cat-uuid-111",
        "projectId": "proj-uuid-12345",
        "name": "Backend Setup",
        "createdAt": "2026-06-14T03:00:00.000Z",
        "updatedAt": "2026-06-14T03:00:00.000Z"
      }
    ],
    "error": null
  }
  ```

---

## 2. POST `/projects/:projectId/categories` (Create Category)

Create a new category for the project. Restricted to `admin`, `general_manager`, or the project's `teamLeaderId`.

- **Required Fields:**
  - `name`: string (1-50 characters)

- **Request Body (JSON):**

  ```json
  {
    "name": "UI Redesign"
  }
  ```

- **Success Response (201 Created):**
  ```json
  {
    "data": {
      "id": "cat-uuid-222",
      "projectId": "proj-uuid-12345",
      "name": "UI Redesign",
      "createdAt": "2026-06-14T10:00:00.000Z",
      "updatedAt": "2026-06-14T10:00:00.000Z"
    },
    "error": null
  }
  ```

---

## 3. PATCH `/projects/:projectId/categories/:id` (Update Category)

Update category properties. Restricted to `admin`, `general_manager`, or the project's `teamLeaderId`.

- **Required Fields:**
  - `name`: string (1-50 characters)

- **Request Body (JSON):**

  ```json
  {
    "name": "Visual Interface Polish"
  }
  ```

- **Success Response (200 OK):**
  ```json
  {
    "data": {
      "id": "cat-uuid-222",
      "projectId": "proj-uuid-12345",
      "name": "Visual Interface Polish",
      "createdAt": "2026-06-14T10:00:00.000Z",
      "updatedAt": "2026-06-14T10:05:00.000Z"
    },
    "error": null
  }
  ```

---

## 4. DELETE `/projects/:projectId/categories/:id` (Delete Category)

Remove a category. Restricted to `admin`, `general_manager`, or the project's `teamLeaderId`.

- **Success Response (200 OK):**
  ```json
  {
    "data": null,
    "error": null
  }
  ```

---

---

# MODULE 4: SPENT TIME LOGS (`/spent-times`)

## 1. GET `/spent-times` (List Spent Times)

Retrieve spent time logs with optional filtering.

- **Query Parameters (Optional):**
  - `taskId`: Filter logs by task ID
  - `employeeId`: Filter logs by employee ID
  - `projectId`: Filter logs by project ID
  - `startDate`: Filter logs from this date (ISO 8601 format)
  - `endDate`: Filter logs up to this date (ISO 8601 format)

- **Success Response (200 OK):**
  ```json
  {
    "data": [
      {
        "id": "spent-uuid-01",
        "taskId": "task-uuid-001",
        "employeeId": "emp-uuid-77777",
        "employee": {
          "fullName": "Tran Van B"
        },
        "date": "2026-06-14T00:00:00.000Z",
        "hours": 3.5,
        "comment": "Implemented route validators and test scripts.",
        "activity": "development",
        "workTimeType": "working_day",
        "createdAt": "2026-06-14T10:10:00.000Z",
        "updatedAt": "2026-06-14T10:10:00.000Z"
      }
    ],
    "error": null
  }
  ```

---

## 2. GET `/spent-times/:id` (Get Spent Time Detail)

Retrieve a single time entry details.

- **Success Response (200 OK):**
  ```json
  {
    "data": {
      "id": "spent-uuid-01",
      "taskId": "task-uuid-001",
      "employeeId": "emp-uuid-77777",
      "date": "2026-06-14T00:00:00.000Z",
      "hours": 3.5,
      "comment": "Implemented route validators.",
      "activity": "development",
      "workTimeType": "working_day",
      "createdAt": "2026-06-14T10:10:00.000Z",
      "updatedAt": "2026-06-14T10:10:00.000Z"
    },
    "error": null
  }
  ```

---

## 3. POST `/spent-times` (Log Spent Time)

Log work hours spent on a task. Any project member can log spent time for their tasks.

- **Required Fields:**
  - `taskId`: string (valid task ID)
  - `date`: string (ISO 8601 format)
  - `hours`: number (0.01 - 24)
  - `activity`: string (`design` | `development` | `testing` | `documentation` | `management` | `other`)

- **Optional Fields:**
  - `employeeId`: string (ID of the employee logging. Defaults to the authenticated user ID)
  - `comment`: string (max 255 characters)
  - `workTimeType`: string (`working_day` | `overtime` | `weekend` | `holiday` - default: `working_day`)

- **Request Body (JSON):**

  ```json
  {
    "taskId": "task-uuid-001",
    "date": "2026-06-14T00:00:00.000Z",
    "hours": 4.5,
    "comment": "Refactoring state hooks logic.",
    "activity": "development",
    "workTimeType": "working_day"
  }
  ```

- **Success Response (201 Created):**
  ```json
  {
    "data": {
      "id": "spent-uuid-02",
      "taskId": "task-uuid-001",
      "employeeId": "emp-uuid-77777",
      "date": "2026-06-14T00:00:00.000Z",
      "hours": 4.5,
      "comment": "Refactoring state hooks logic.",
      "activity": "development",
      "workTimeType": "working_day",
      "createdAt": "2026-06-14T10:20:00.000Z",
      "updatedAt": "2026-06-14T10:20:00.000Z"
    },
    "error": null
  }
  ```

---

## 4. PATCH `/spent-times/:id` (Update Spent Time Log)

Update logged time entry. Restricted to `admin`, GMs, or the employee who created the log entry (`employeeId`).

- **Optional Fields (At least one must be provided):**
  - `date`: string (ISO 8601 format)
  - `hours`: number (0.01 - 24)
  - `comment`: string (max 255 characters or null)
  - `activity`: string (`design` | `development` | `testing` | `documentation` | `management` | `other`)
  - `workTimeType`: string (`working_day` | `overtime` | `weekend` | `holiday`)

- **Request Body (JSON):**

  ```json
  {
    "hours": 5.0,
    "comment": "Refactoring state hooks logic & writing documentation."
  }
  ```

- **Success Response (200 OK):**
  ```json
  {
    "data": {
      "id": "spent-uuid-02",
      "taskId": "task-uuid-001",
      "employeeId": "emp-uuid-77777",
      "date": "2026-06-14T00:00:00.000Z",
      "hours": 5.0,
      "comment": "Refactoring state hooks logic & writing documentation.",
      "activity": "development",
      "workTimeType": "working_day",
      "createdAt": "2026-06-14T10:20:00.000Z",
      "updatedAt": "2026-06-14T10:30:00.000Z"
    },
    "error": null
  }
  ```

---

## 5. DELETE `/spent-times/:id` (Delete Spent Time Log)

Delete logged spent time record. Restricted to `admin`, GMs, or the employee who created the log entry (`employeeId`).

- **Success Response (200 OK):**
  ```json
  {
    "data": null,
    "error": null
  }
  ```
