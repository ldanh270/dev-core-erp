# API Documentation

This document provides the OpenAPI 3.0 specification (Swagger) for the backend routes implemented in the **DevCore ERP** system — a Web-Based Enterprise Resource Planning System for IT Outsourcing Companies.

## OpenAPI Specification (YAML)

```yaml
openapi: 3.0.0
info:
  title: DevCore ERP API
  description: REST API for the DevCore ERP system — managing employees, projects, payroll, attendance, and authentication for IT Outsourcing companies.
  version: 1.0.0
servers:
  - url: http://localhost:5000
    description: Local development server

paths:
  /:
    get:
      summary: Health check
      description: Check if the server is running.
      responses:
        '200':
          description: Server is running
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                    example: Connect to server successfully

  /api/auth/login:
    post:
      tags:
        - Authentication
      summary: Login
      description: Authenticate a user and return a JWT token.
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/LoginDto'
      responses:
        '200':
          description: Login successful
          content:
            application/json:
              schema:
                type: object
                properties:
                  status:
                    type: string
                    example: success
                  data:
                    $ref: '#/components/schemas/AuthResponseDto'
        '400':
          description: Invalid input (validation error)
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '401':
          description: Unauthorized (invalid credentials)
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'

  /api/auth/logout:
    post:
      tags:
        - Authentication
      summary: Logout
      description: Log out the current user and record the activity.
      security:
        - bearerAuth: []
      responses:
        '200':
          description: Logout successful
          content:
            application/json:
              schema:
                type: object
                properties:
                  status:
                    type: string
                    example: success
                  message:
                    type: string
                    example: Logout successful
        '401':
          description: Unauthorized
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'

  /api/employees:
    get:
      tags:
        - Employees
      summary: List Employees
      description: Retrieve a list of all employees.
      responses:
        '200':
          description: List of employees
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/Employee'
                  error:
                    type: string
                    nullable: true
                    example: null

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    LoginDto:
      type: object
      required:
        - email
        - password
      properties:
        email:
          type: string
          format: email
          example: user@example.com
        password:
          type: string
          example: password123

    AuthResponseDto:
      type: object
      properties:
        token:
          type: string
        employee:
          type: object
          properties:
            id:
              type: string
            email:
              type: string
            fullName:
              type: string
            role:
              $ref: '#/components/schemas/EmployeeRole'

    Employee:
      type: object
      properties:
        id:
          type: string
        fullName:
          type: string
        email:
          type: string
        role:
          $ref: '#/components/schemas/EmployeeRole'
        phone:
          type: string
          nullable: true
        position:
          type: string
          nullable: true
        employeeType:
          $ref: '#/components/schemas/EmployeeType'
        status:
          $ref: '#/components/schemas/EmployeeStatus'
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time

    EmployeeRole:
      type: string
      enum: [admin, manager, employee]

    EmployeeType:
      type: string
      enum: [full_time, part_time, contractor, intern]

    EmployeeStatus:
      type: string
      enum: [active, inactive, on_leave, terminated]

    ErrorResponse:
      type: object
      properties:
        status:
          type: string
          example: error
        message:
          type: string
        errors:
          type: array
          items:
            type: object
```
