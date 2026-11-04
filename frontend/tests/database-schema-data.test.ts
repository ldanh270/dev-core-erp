import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { fileURLToPath } from "node:url"

import { describe, expect, test } from "bun:test"
import schemaSummary from "../src/data/schema-summary.json"
import type {
  DbSchemaSummary,
  TableDef,
} from "../src/pages/system/database-reference/database-reference.types"

const tablesDirectory = fileURLToPath(new URL("../src/data/tables/", import.meta.url))

describe("generated database schema data", () => {
  test("summary table entries match the generated per-table files", () => {
    // The test reads only the fixed generated-data directory.
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const tableFiles = readdirSync(tablesDirectory).filter((fileName) => fileName.endsWith(".json"))
    const summary = schemaSummary as DbSchemaSummary

    expect(tableFiles).toHaveLength(summary.metadata.totalTables)
    expect(summary.tables).toHaveLength(tableFiles.length)

    for (const tableSummary of summary.tables) {
      const fileName = `${tableSummary.name}.json`
      // Filenames come from the Prisma generator's word-character model identifiers.
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      const tableJson = readFileSync(join(tablesDirectory, fileName), "utf8")
      const table = JSON.parse(tableJson) as TableDef

      expect(table.name).toBe(tableSummary.name)
      expect(table.dbName).toBe(tableSummary.dbName)
      expect(table.module).toBe(tableSummary.module)
      expect(table.columns).toHaveLength(tableSummary.columnCount)
      expect(table.indexes).toHaveLength(tableSummary.indexCount ?? 0)
      expect(table.outgoingRelations).toHaveLength(tableSummary.outgoingRelationCount)
      expect(table.incomingRelations).toHaveLength(tableSummary.incomingRelationCount)
    }
  })
})
