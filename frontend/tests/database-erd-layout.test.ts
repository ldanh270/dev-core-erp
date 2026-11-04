import { describe, expect, test } from "bun:test"
import { createErdLayout, ERD_NODE_WIDTH } from "../src/pages/system/database-reference/database-erd-layout"
import type { OutgoingRelation, TableDef } from "../src/pages/system/database-reference/database-reference.types"

function createTable(
  name: string,
  outgoingRelations: OutgoingRelation[] = [],
  module = "TEST",
): TableDef {
  return {
    name,
    dbName: name,
    module,
    description: "",
    columns: [],
    outgoingRelations,
    incomingRelations: [],
  }
}

function relation(sourceColumn: string, targetTable: string): OutgoingRelation {
  return {
    sourceColumn,
    targetTable,
    targetColumn: "id",
    relationName: null,
  }
}

describe("createErdLayout", () => {
  test("places referenced tables before dependent tables and separates siblings", () => {
    const tables = [
      createTable("Assignment", [relation("projectId", "Project"), relation("userId", "User")]),
      createTable("Project"),
      createTable("User"),
    ]

    const layout = createErdLayout(tables, null, false)
    const positions = new Map(layout.nodes.map(({ table, position }) => [table.name, position]))

    expect(positions.get("Project")?.x).toBeLessThan(positions.get("Assignment")?.x ?? 0)
    expect(positions.get("User")?.x).toBeLessThan(positions.get("Assignment")?.x ?? 0)
    expect(positions.get("Project")?.y).not.toBe(positions.get("User")?.y)
    expect(layout.edges).toHaveLength(2)
    expect(layout.width).toBeGreaterThan(ERD_NODE_WIDTH)
  })

  test("lays out cycles and isolated models without overlapping nodes", () => {
    const tables = [
      createTable("Alpha", [relation("betaId", "Beta")]),
      createTable("Beta", [relation("alphaId", "Alpha")]),
      createTable("Standalone"),
    ]

    const layout = createErdLayout(tables, "Alpha", false)
    const positions = layout.nodes.map(({ position }) => position)

    expect(layout.nodes).toHaveLength(3)
    expect(layout.edges.some((edge) => edge.highlighted)).toBe(true)
    expect(new Set(positions.map(({ x, y }) => `${x}:${y}`)).size).toBe(positions.length)
  })

  test("limits only the all-module overview and omits edges to hidden nodes", () => {
    const tables = Array.from({ length: 26 }, (_, index) =>
      createTable(`Model${index}`, index > 0 ? [relation("parentId", "Model0")] : []),
    )

    const overview = createErdLayout(tables, null, true)
    const moduleView = createErdLayout(tables, null, false)

    expect(overview.nodes).toHaveLength(24)
    expect(moduleView.nodes).toHaveLength(26)
    expect(moduleView.edges).toHaveLength(25)
  })

  test("stretches relationship layers to fill the available viewport width", () => {
    const tables = [
      createTable("Assignment", [relation("projectId", "Project")]),
      createTable("Project"),
    ]

    const compact = createErdLayout(tables, null, false)
    const expanded = createErdLayout(tables, null, false, 1600)
    const assignmentPosition = expanded.nodes.find((node) => node.table.name === "Assignment")
      ?.position.x

    expect(compact.width).toBeLessThan(1600)
    expect(expanded.width).toBeGreaterThanOrEqual(1600)
    expect(assignmentPosition).toBeGreaterThan(
      compact.nodes.find((node) => node.table.name === "Assignment")?.position.x ?? 0,
    )
  })

  test("moves dragged nodes and their relation endpoints while retaining the canvas bounds", () => {
    const tables = [createTable("Assignment", [relation("projectId", "Project")]), createTable("Project")]
    const initial = createErdLayout(tables, null, false)
    const movedPosition = { x: 700, y: 460 }
    const moved = createErdLayout(tables, null, false, 0, new Map([["Assignment", movedPosition]]))
    const assignmentNode = moved.nodes.find((node) => node.table.name === "Assignment")

    expect(assignmentNode?.position).toEqual(movedPosition)
    expect(moved.width).toBeGreaterThanOrEqual(movedPosition.x + ERD_NODE_WIDTH)
    expect(moved.height).toBeGreaterThan(movedPosition.y)
    expect(moved.edges[0]?.from).not.toEqual(initial.edges[0]?.from)
  })

  test("marks foreign keys between modules as cross-module relations", () => {
    const tables = [
      createTable("Attendance", [relation("employeeId", "Employee")], "ATTENDANCE"),
      createTable("Employee", [], "HR"),
    ]

    const layout = createErdLayout(tables, null, false)

    expect(layout.edges[0]?.crossModule).toBe(true)
  })

  test("marks foreign keys within the same module as regular relations", () => {
    const tables = [
      createTable("Attendance", [relation("scheduleId", "Schedule")], "ATTENDANCE"),
      createTable("Schedule", [], "ATTENDANCE"),
    ]

    const layout = createErdLayout(tables, null, false)

    expect(layout.edges[0]?.crossModule).toBe(false)
  })

  test("places a dominant hub table in the center with connected satellites on both sides", () => {
    const children = Array.from({ length: 6 }, (_, i) =>
      createTable(`ChildDetail${i}`, [relation("hubId", "CoreHub")]),
    )
    const tables = [createTable("Parent"), createTable("CoreHub", [relation("parentId", "Parent")]), ...children]

    const layout = createErdLayout(tables, null, false)
    const hubNode = layout.nodes.find((n) => n.table.name === "CoreHub")
    expect(hubNode).toBeDefined()

    const leftNodes = layout.nodes.filter((n) => n.position.x < (hubNode?.position.x ?? 0))
    const rightNodes = layout.nodes.filter((n) => n.position.x > (hubNode?.position.x ?? 0))

    expect(leftNodes.length).toBeGreaterThanOrEqual(1)
    expect(rightNodes.length).toBeGreaterThanOrEqual(1)
  })
})
