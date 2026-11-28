// Metadata for a single physical column in a Prisma database model.
export interface ColumnDef {
  name: string
  type: string
  isArray: boolean
  isOptional: boolean
  isPk: boolean
  isUnique: boolean
  defaultValue: string | null
  isFk: boolean
  fkTargetTable: string | null
  fkTargetField: string | null
  isEnum: boolean
  isPrismaVirtual?: boolean
  description: string
  rawAttributes: string
  relationName?: string | null
}

// Metadata for a database index or key constraint (Primary, Unique, or Standard index).
export interface TableIndexDef {
  name: string
  columns: string[]
  isUnique: boolean
  isPrimary: boolean
}

// Represents an outgoing foreign-key reference from the current table to a target table (`→`).
export interface OutgoingRelation {
  sourceColumn: string
  targetTable: string
  targetColumn: string
  relationName: string | null
}

// Represents an incoming foreign-key reference from a source table to the current table (`←`).
export interface IncomingRelation {
  sourceTable: string
  sourceColumn: string
  targetColumn: string
  relationName: string | null
}

// Complete metadata definition for a single Prisma model / database table.
export interface TableDef {
  name: string
  dbName: string
  module: string
  description: string
  columns: ColumnDef[]
  indexes?: TableIndexDef[]
  outgoingRelations: OutgoingRelation[]
  incomingRelations: IncomingRelation[]
}

// Grouping metadata for a business subsystem / module in the schema reference.
export interface ModuleDef {
  id: string
  name: string
  color: string
  icon: string
  description: string
  tableCount: number
  tables: string[]
}

// Metadata for a Prisma enum type and its allowed values.
export interface EnumDef {
  name: string
  values: string[]
  description: string
}

// Full runtime dictionary combining summary metadata, modules, tables, and enums.
export interface DbSchemaData {
  metadata: {
    generatedAt: string
    schemaEngine: string
    sourceFile: string
    totalTables: number
    totalEnums: number
    totalColumns: number
    totalRelations: number
    version: string
  }
  modules: ModuleDef[]
  tables: Record<string, TableDef>
  enums: Record<string, EnumDef>
}

// Shape of `frontend/src/data/schema-summary.json` generated from `backend/prisma/schema.prisma`.
export interface DbSchemaSummary {
  metadata: DbSchemaData["metadata"]
  modules: ModuleDef[]
  tables: {
    name: string
    dbName: string
    module: string
    description: string
    columnCount: number
    indexCount?: number
    outgoingRelationCount: number
    incomingRelationCount: number
  }[]
  enums: Record<string, EnumDef>
}

// Semantic Tailwind token classes used to style badges and ERD cards per module.
export interface ModuleTheme {
  badge: string
  border: string
  bgLight: string
  text: string
  dot: string
}
