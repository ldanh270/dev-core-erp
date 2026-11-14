import { mapStatusNameToEnum } from "../../utils/status-mapping.util"

/// <reference types="jest" />
jest.mock("@prisma/client", () => ({
  TaskStatus: {
    TODO: "TODO",
    IN_PROGRESS: "IN_PROGRESS",
    IN_REVIEW: "IN_REVIEW",
    DONE: "DONE",
    CANCELLED: "CANCELLED",
    REOPENED: "REOPENED",
  },
}))

jest.mock(
  "@/configs/entities/project.config.ts",
  () => ({
    TASK_STATUS: {
      TODO: "TODO",
      IN_PROGRESS: "IN_PROGRESS",
      IN_REVIEW: "IN_REVIEW",
      DONE: "DONE",
      CANCELLED: "CANCELLED",
      REOPENED: "REOPENED",
    },
    STATUS_KEYWORD_MAP: {
      TODO: ["todo", "backlog"],
      IN_PROGRESS: ["progress", "doing"],
      IN_REVIEW: ["review"],
      DONE: ["done", "complete"],
      CANCELLED: ["cancel", "discard"],
      REOPENED: ["reopen"],
    },
  }),
  { virtual: true },
)

describe("mapStatusNameToEnum", () => {
  describe("Happy Paths (Keyword Matching)", () => {
    it('should map a status name containing "doing" to TASK_STATUS.IN_PROGRESS', () => {
      // Arrange
      const name = "Currently doing this task"
      const isCompleted = false

      // Act
      const result = mapStatusNameToEnum(name, isCompleted)

      // Assert
      expect(result).toBe("IN_PROGRESS")
    })

    it('should map a status name containing "backlog" to TASK_STATUS.TODO ignoring case and whitespace', () => {
      // Arrange
      const name = "  BACKLOG  "
      const isCompleted = false

      // Act
      const result = mapStatusNameToEnum(name, isCompleted)

      // Assert
      expect(result).toBe("TODO")
    })

    it('should map a status name containing "review" to TASK_STATUS.IN_REVIEW', () => {
      // Arrange
      const name = "in review phase"
      const isCompleted = false

      // Act
      const result = mapStatusNameToEnum(name, isCompleted)

      // Assert
      expect(result).toBe("IN_REVIEW")
    })

    it('should map a status name containing "complete" to TASK_STATUS.DONE', () => {
      // Arrange
      const name = "mark as complete"
      const isCompleted = false

      // Act
      const result = mapStatusNameToEnum(name, isCompleted)

      // Assert
      expect(result).toBe("DONE")
    })

    it('should map a status name containing "discard" to TASK_STATUS.CANCELLED', () => {
      // Arrange
      const name = "discarded"
      const isCompleted = false

      // Act
      const result = mapStatusNameToEnum(name, isCompleted)

      // Assert
      expect(result).toBe("CANCELLED")
    })

    it('should map a status name containing "reopen" to TASK_STATUS.REOPENED', () => {
      // Arrange
      const name = "reopened task"
      const isCompleted = false

      // Act
      const result = mapStatusNameToEnum(name, isCompleted)

      // Assert
      expect(result).toBe("REOPENED")
    })
  })

  describe("Fallback Cases", () => {
    it("should fallback to TASK_STATUS.DONE when no keywords match and isCompleted is true", () => {
      // Arrange
      const name = "Unknown custom status"
      const isCompleted = true

      // Act
      const result = mapStatusNameToEnum(name, isCompleted)

      // Assert
      expect(result).toBe("DONE")
    })

    it("should fallback to TASK_STATUS.TODO when no keywords match and isCompleted is false", () => {
      // Arrange
      const name = "Unknown custom status"
      const isCompleted = false

      // Act
      const result = mapStatusNameToEnum(name, isCompleted)

      // Assert
      expect(result).toBe("TODO")
    })
  })
})
