import {
  approveRequisitionSchema,
  updateBackgroundCheckSchema,
  updateInterviewRoundSchema,
  updateJobPostingSchema,
  updateJobRequisitionSchema,
} from "@/schemas/recruitment.schema"

describe("updateJobRequisitionSchema", () => {
  it("rejects workflow status changes from the generic update boundary", () => {
    const result = updateJobRequisitionSchema.safeParse({ status: "approved" })

    expect(result.success).toBe(false)
  })

  it("accepts editable requisition fields without a workflow status", () => {
    const result = updateJobRequisitionSchema.safeParse({
      title: "Senior Backend Engineer",
      salaryMin: 30000000,
      salaryMax: 50000000,
    })

    expect(result.success).toBe(true)
  })
})

describe("approveRequisitionSchema", () => {
  it("requires a reason when rejecting a requisition", () => {
    expect(approveRequisitionSchema.safeParse({ approved: false }).success).toBe(false)
    expect(
      approveRequisitionSchema.safeParse({ approved: false, comment: "Budget needs review" })
        .success,
    ).toBe(true)
  })
})

describe("updateJobPostingSchema", () => {
  it("accepts HTTPS URLs and rejects unsafe protocols", () => {
    expect(
      updateJobPostingSchema.safeParse({ postingUrl: "https://careers.example.com/apply" }).success,
    ).toBe(true)
    expect(updateJobPostingSchema.safeParse({ postingUrl: "javascript:alert(1)" }).success).toBe(
      false,
    )
    expect(updateJobPostingSchema.safeParse({ postingUrl: "data:text/html,test" }).success).toBe(
      false,
    )
  })
})

describe("workflow update schemas", () => {
  it("rejects workflow state changes through generic patch DTOs", () => {
    expect(updateInterviewRoundSchema.safeParse({ status: "completed" }).success).toBe(false)
    expect(updateInterviewRoundSchema.safeParse({ result: "pass" }).success).toBe(false)
    expect(updateBackgroundCheckSchema.safeParse({ status: "passed" }).success).toBe(false)
  })
})
