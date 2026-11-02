import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import dbSchemaRaw from "@/data/db-schema-data.json"

import { useMemo, useRef, useState } from "react"
import { Link } from "react-router-dom"
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock,
  Code2,
  Coins,
  Copy,
  CornerDownRight,
  Database,
  ExternalLink,
  FolderKanban,
  Key,
  Layers,
  Link2,
  Network,
  RotateCcw,
  Search,
  ShieldCheck,
  Sliders,
  Table2,
  UserPlus,
  Users,
  ZoomIn,
  ZoomOut,
} from "lucide-react"

// TypeScript interfaces
interface ColumnDef {
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
  description: string
  rawAttributes: string
}

interface OutgoingRelation {
  sourceColumn: string
  targetTable: string
  targetColumn: string
  relationName: string | null
}

interface IncomingRelation {
  sourceTable: string
  sourceColumn: string
  targetColumn: string
  relationName: string | null
}

interface TableDef {
  name: string
  dbName: string
  module: string
  description: string
  columns: ColumnDef[]
  outgoingRelations: OutgoingRelation[]
  incomingRelations: IncomingRelation[]
}

interface ModuleDef {
  id: string
  name: string
  color: string
  icon: string
  description: string
  tableCount: number
  tables: string[]
}

interface EnumDef {
  name: string
  values: string[]
  description: string
}

interface DbSchemaData {
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

const dbSchema = dbSchemaRaw as unknown as DbSchemaData

// Module theme map using semantic utility classes (Strictly token-only, 0 raw hex)
const MODULE_THEMES: Record<
  string,
  {
    badge: string
    border: string
    bgLight: string
    text: string
    dot: string
  }
> = {
  HRM: {
    badge: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
    border: "border-sky-500/30",
    bgLight: "bg-sky-500/10",
    text: "text-sky-600 dark:text-sky-400",
    dot: "bg-sky-500",
  },
  ATTENDANCE: {
    badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    border: "border-emerald-500/30",
    bgLight: "bg-emerald-500/10",
    text: "text-emerald-600 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
  PAYROLL: {
    badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    border: "border-amber-500/30",
    bgLight: "bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
    dot: "bg-amber-500",
  },
  PROJECT: {
    badge: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
    border: "border-violet-500/30",
    bgLight: "bg-violet-500/10",
    text: "text-violet-600 dark:text-violet-400",
    dot: "bg-violet-500",
  },
  RECRUITMENT: {
    badge: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
    border: "border-orange-500/30",
    bgLight: "bg-orange-500/10",
    text: "text-orange-600 dark:text-orange-400",
    dot: "bg-orange-500",
  },
  SECURITY: {
    badge: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    border: "border-rose-500/30",
    bgLight: "bg-rose-500/10",
    text: "text-rose-600 dark:text-rose-400",
    dot: "bg-rose-500",
  },
  SYSTEM: {
    badge: "bg-muted text-muted-foreground border-border",
    border: "border-border",
    bgLight: "bg-muted/40",
    text: "text-muted-foreground",
    dot: "bg-muted-foreground",
  },
}

function getTheme(moduleId: string) {
  return MODULE_THEMES[moduleId] ?? MODULE_THEMES.SYSTEM
}

// Helper icon resolver
function getModuleIcon(iconName: string) {
  switch (iconName) {
    case "Users":
      return <Users className="size-4" />
    case "Clock":
      return <Clock className="size-4" />
    case "BadgeDollarSign":
      return <Coins className="size-4" />
    case "FolderKanban":
      return <FolderKanban className="size-4" />
    case "UserPlus":
      return <UserPlus className="size-4" />
    case "ShieldCheck":
      return <ShieldCheck className="size-4" />
    default:
      return <Sliders className="size-4" />
  }
}

export default function DatabaseReference() {
  const [activeTab, setActiveTab] = useState<"tables" | "diagram" | "enums">("tables")
  const [selectedModule, setSelectedModule] = useState<string>("ALL")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [selectedTableName, setSelectedTableName] = useState<string>("Employee")
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [tableDetailModal, setTableDetailModal] = useState<TableDef | null>(null)

  // ERD Diagram Interactive Canvas State
  const [diagramScale, setDiagramScale] = useState<number>(1)
  const [diagramPan, setDiagramPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState<boolean>(false)
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })

  const copyToClipboard = (text: string, key: string) => {
    void navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  // Filtered table list
  const filteredTables = useMemo(() => {
    const list = Object.values(dbSchema.tables)
    return list.filter((table) => {
      const matchModule = selectedModule === "ALL" || table.module === selectedModule
      if (!matchModule) return false

      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase().trim()
      const matchName =
        table.name.toLowerCase().includes(q) || table.dbName.toLowerCase().includes(q)
      const matchDesc = table.description.toLowerCase().includes(q)
      const matchCol = table.columns.some(
        (c) => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q),
      )
      return matchName || matchDesc || matchCol
    })
  }, [selectedModule, searchQuery])

  // Active selected table object
  const currentTable: TableDef | undefined =
    dbSchema.tables[selectedTableName] ?? filteredTables[0]

  // Filtered enums list
  const filteredEnums = useMemo(() => {
    const enumEntries = Object.entries(dbSchema.enums)
    if (!searchQuery.trim()) return enumEntries
    const q = searchQuery.toLowerCase().trim()
    return enumEntries.filter(
      ([name, def]) =>
        name.toLowerCase().includes(q) ||
        def.values.some((v) => v.toLowerCase().includes(q)),
    )
  }, [searchQuery])

  // Compute node positions for ERD Diagram
  const erdGraphData = useMemo(() => {
    const tablesToRender =
      selectedModule === "ALL"
        ? filteredTables.slice(0, 24)
        : filteredTables

    const cols = Math.max(1, Math.ceil(Math.sqrt(tablesToRender.length * 1.5)))
    const nodeWidth = 260
    const nodeHeight = 220
    const gapX = 120
    const gapY = 80

    const positions: Record<string, { x: number; y: number }> = {}

    tablesToRender.forEach((table, idx) => {
      const r = Math.floor(idx / cols)
      const c = idx % cols
      const offsetY = c % 2 === 1 ? 30 : 0
      positions[table.name] = {
        x: 60 + c * (nodeWidth + gapX),
        y: 60 + r * (nodeHeight + gapY) + offsetY,
      }
    })

    // Edges between rendered nodes
    const edges: Array<{
      id: string
      from: string
      to: string
      fromCol: string
      toCol: string
      fromPos: { x: number; y: number }
      toPos: { x: number; y: number }
      isHighlighted: boolean
    }> = []

    tablesToRender.forEach((tbl) => {
      tbl.outgoingRelations.forEach((rel) => {
        if (positions[tbl.name] && positions[rel.targetTable]) {
          const fromPos = {
            x: positions[tbl.name].x + nodeWidth,
            y: positions[tbl.name].y + 40,
          }
          const toPos = {
            x: positions[rel.targetTable].x,
            y: positions[rel.targetTable].y + 40,
          }
          const isHighlighted =
            tbl.name === selectedTableName || rel.targetTable === selectedTableName

          edges.push({
            id: `${tbl.name}-${rel.sourceColumn}->${rel.targetTable}`,
            from: tbl.name,
            to: rel.targetTable,
            fromCol: rel.sourceColumn,
            toCol: rel.targetColumn,
            fromPos,
            toPos,
            isHighlighted,
          })
        }
      })
    })

    return {
      nodes: tablesToRender,
      positions,
      edges,
      nodeWidth,
      nodeHeight,
    }
  }, [selectedModule, filteredTables, selectedTableName])

  // Pan event handlers for ERD canvas
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return
    setIsPanning(true)
    panStartRef.current = {
      x: e.clientX - diagramPan.x,
      y: e.clientY - diagramPan.y,
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return
    setDiagramPan({
      x: e.clientX - panStartRef.current.x,
      y: e.clientY - panStartRef.current.y,
    })
  }

  const handleMouseUp = () => {
    setIsPanning(false)
  }

  const resetDiagramView = () => {
    setDiagramScale(1)
    setDiagramPan({ x: 0, y: 0 })
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Top Header & Metrics Banner */}
      <div className="border-b border-border bg-card/60 backdrop-blur-md px-6 py-4 sticky top-0 z-30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shadow-xs">
              <Database className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight">Database Schema & ERD Reference</h1>
                <Badge variant="outline" className="text-xs font-mono font-semibold">
                  v{dbSchema.metadata.version}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {dbSchema.metadata.schemaEngine}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Mô hình dữ liệu chuẩn của DevCore ERP được biên soạn từ{" "}
                <span className="font-mono text-primary font-medium">backend/prisma/schema.prisma</span>
              </p>
            </div>
          </div>

          {/* Quick Metrics Bar & Back Button */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/60 border border-border text-xs">
              <Table2 className="size-3.5 text-primary" />
              <span className="text-muted-foreground">Bảng (Tables):</span>
              <span className="font-bold text-foreground">{dbSchema.metadata.totalTables}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/60 border border-border text-xs">
              <Layers className="size-3.5 text-emerald-500" />
              <span className="text-muted-foreground">Cột (Columns):</span>
              <span className="font-bold text-foreground">{dbSchema.metadata.totalColumns}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/60 border border-border text-xs">
              <Network className="size-3.5 text-violet-500" />
              <span className="text-muted-foreground">Khóa ngoại (FKs):</span>
              <span className="font-bold text-foreground">{dbSchema.metadata.totalRelations}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/60 border border-border text-xs">
              <Code2 className="size-3.5 text-amber-500" />
              <span className="text-muted-foreground">Enums:</span>
              <span className="font-bold text-foreground">{dbSchema.metadata.totalEnums}</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="rounded-full text-xs gap-1.5 ml-1"
              asChild
            >
              <Link to="/">
                <ArrowLeft className="size-3.5" />
                Vào ERP
              </Link>
            </Button>
          </div>
        </div>

        {/* Global Controls & Module Filters Bar */}
        <div className="mt-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-3 border-t border-border/60">
          {/* Main Navigation Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={(val) => setActiveTab(val as "tables" | "diagram" | "enums")}
          >
            <TabsList className="bg-muted p-1">
              <TabsTrigger value="tables" className="gap-1.5 text-xs">
                <Table2 className="size-3.5" />
                Danh bạ Dữ liệu (Tables)
              </TabsTrigger>
              <TabsTrigger value="diagram" className="gap-1.5 text-xs">
                <Network className="size-3.5" />
                Sơ đồ Quan hệ (ERD Diagram)
              </TabsTrigger>
              <TabsTrigger value="enums" className="gap-1.5 text-xs">
                <Code2 className="size-3.5" />
                Danh mục Enums ({dbSchema.metadata.totalEnums})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm bảng, cột hoặc nghiệp vụ..."
              className="pl-9 pr-4 h-9 text-xs rounded-full bg-background"
            />
          </div>
        </div>

        {/* Module Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-3 pb-1 no-scrollbar">
          <Button
            size="xs"
            variant={selectedModule === "ALL" ? "default" : "outline"}
            onClick={() => setSelectedModule("ALL")}
            className="rounded-full text-xs"
          >
            Tất cả ({dbSchema.metadata.totalTables})
          </Button>

          {dbSchema.modules.map((m) => {
            const isSelected = selectedModule === m.id
            const theme = getTheme(m.id)
            return (
              <Button
                key={m.id}
                size="xs"
                variant={isSelected ? "default" : "outline"}
                onClick={() => setSelectedModule(m.id)}
                className={`rounded-full text-xs gap-1.5 ${
                  isSelected ? "bg-primary text-primary-foreground" : theme.badge
                }`}
              >
                {getModuleIcon(m.icon)}
                <span>{m.name.split(" ")[0]}</span>
                <span className="opacity-70 text-[10px]">({m.tableCount})</span>
              </Button>
            )
          })}
        </div>
      </div>

      {/* Main Content Areas */}
      <div className="flex-1 p-6">
        {/* TAB 1: DATA DICTIONARY / TABLES VIEW */}
        {activeTab === "tables" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Tables Directory Sidebar */}
            <Card className="lg:col-span-4 rounded-xl border border-border shadow-xs flex flex-col h-[calc(100vh-270px)] sticky top-[210px]">
              <CardHeader className="py-3 px-4 border-b border-border bg-muted/30">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Table2 className="size-4 text-primary" />
                    Danh sách Bảng ({filteredTables.length})
                  </CardTitle>
                  <span className="text-[11px] text-muted-foreground">Nhấp để xem chi tiết</span>
                </div>
              </CardHeader>
              <CardContent className="p-0 flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="p-2 space-y-1">
                    {filteredTables.length === 0 ? (
                      <div className="text-center py-12 text-xs text-muted-foreground">
                        Không tìm thấy bảng phù hợp với từ khóa.
                      </div>
                    ) : (
                      filteredTables.map((table) => {
                        const isSelected = table.name === (currentTable?.name ?? "")
                        const theme = getTheme(table.module)

                        return (
                          <button
                            key={table.name}
                            type="button"
                            onClick={() => setSelectedTableName(table.name)}
                            className={`w-full text-left px-3 py-2.5 rounded-lg transition-all flex flex-col gap-1 border cursor-pointer ${
                              isSelected
                                ? "bg-primary/10 border-primary/40 text-foreground shadow-xs"
                                : "hover:bg-muted/60 border-transparent text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span
                                className={`text-xs font-semibold font-mono ${
                                  isSelected ? "text-primary" : "text-foreground"
                                }`}
                              >
                                {table.name}
                              </span>
                              <Badge
                                variant="outline"
                                className={`text-[10px] px-1.5 py-0 h-4 ${theme.badge}`}
                              >
                                {table.module}
                              </Badge>
                            </div>

                            <p className="text-[11px] line-clamp-1 text-muted-foreground">
                              {table.description}
                            </p>

                            <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-mono mt-0.5">
                              <span>{table.columns.length} cols</span>
                              <span>•</span>
                              <span>{table.outgoingRelations.length} FK out</span>
                              {table.incomingRelations.length > 0 && (
                                <>
                                  <span>•</span>
                                  <span>{table.incomingRelations.length} ref in</span>
                                </>
                              )}
                            </div>
                          </button>
                        )
                      })
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Right Column: Active Table Details View */}
            <div className="lg:col-span-8 space-y-6">
              {currentTable ? (
                <>
                  {/* Table Header Card */}
                  <Card className="rounded-xl border border-border shadow-xs">
                    <CardHeader className="py-4 px-6 border-b border-border bg-card">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2.5">
                            <h2 className="text-xl font-bold font-mono tracking-tight text-foreground">
                              {currentTable.name}
                            </h2>
                            {currentTable.dbName !== currentTable.name && (
                              <Badge variant="secondary" className="font-mono text-xs">
                                @@map(&quot;{currentTable.dbName}&quot;)
                              </Badge>
                            )}
                            <Badge
                              variant="outline"
                              className={`text-xs ${getTheme(currentTable.module).badge}`}
                            >
                              {dbSchema.modules.find((m) => m.id === currentTable.module)?.name}
                            </Badge>
                          </div>
                          <CardDescription className="text-xs text-muted-foreground mt-1.5">
                            {currentTable.description}
                          </CardDescription>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-full text-xs gap-1.5"
                            onClick={() => {
                              setSelectedModule(currentTable.module)
                              setActiveTab("diagram")
                            }}
                          >
                            <Network className="size-3.5 text-primary" />
                            Xem trên ERD
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="rounded-full text-xs gap-1.5"
                            onClick={() =>
                              copyToClipboard(formatTableSummary(currentTable), "model-copy")
                            }
                          >
                            {copiedKey === "model-copy" ? (
                              <Check className="size-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="size-3.5" />
                            )}
                            Copy Metadata
                          </Button>
                        </div>
                      </div>
                    </CardHeader>

                    {/* Columns Table */}
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader className="bg-muted/40">
                            <TableRow>
                              <TableHead className="w-[200px] text-xs font-semibold">Tên cột (Field)</TableHead>
                              <TableHead className="w-[140px] text-xs font-semibold">Kiểu dữ liệu (Type)</TableHead>
                              <TableHead className="w-[180px] text-xs font-semibold">Ràng buộc (Constraints)</TableHead>
                              <TableHead className="text-xs font-semibold">Mô tả nghiệp vụ (Description)</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {currentTable.columns.map((col) => {
                              return (
                                <TableRow key={col.name} className="hover:bg-muted/30">
                                  {/* Column Name */}
                                  <TableCell className="font-mono text-xs font-semibold">
                                    <div className="flex items-center gap-1.5">
                                      {col.isPk && (
                                        <span title="Primary Key"><Key className="size-3.5 text-amber-500 shrink-0" /></span>
                                      )}
                                      {col.isFk && (
                                        <span title="Foreign Key"><Link2 className="size-3.5 text-sky-500 shrink-0" /></span>
                                      )}
                                      <span className={col.isPk ? "text-amber-600 dark:text-amber-400 font-bold" : ""}>
                                        {col.name}
                                      </span>
                                    </div>
                                  </TableCell>

                                  {/* Type */}
                                  <TableCell className="font-mono text-xs">
                                    <div className="flex items-center gap-1">
                                      <span className="text-foreground">{col.type}</span>
                                      {col.isArray && <span className="text-muted-foreground font-bold">[]</span>}
                                      {col.isOptional && (
                                        <span className="text-muted-foreground text-[10px]" title="Nullable">
                                          ?
                                        </span>
                                      )}
                                      {col.isEnum && (
                                        <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 bg-muted">
                                          Enum
                                        </Badge>
                                      )}
                                    </div>
                                  </TableCell>

                                  {/* Constraints */}
                                  <TableCell className="text-xs">
                                    <div className="flex flex-wrap gap-1">
                                      {col.isPk && (
                                        <Badge
                                          variant="default"
                                          className="text-[10px] px-1.5 py-0 bg-amber-500 hover:bg-amber-600"
                                        >
                                          PK
                                        </Badge>
                                      )}
                                      {col.isFk && col.fkTargetTable && (
                                        <button
                                          type="button"
                                          onClick={() => setSelectedTableName(col.fkTargetTable ?? "")}
                                          className="inline-flex items-center gap-1 px-1.5 py-0 rounded-full text-[10px] font-mono bg-sky-500/10 text-sky-600 dark:text-sky-400 hover:bg-sky-500/20 border border-sky-500/20 transition-all cursor-pointer"
                                          title={`Trỏ tới bảng ${col.fkTargetTable}.${col.fkTargetField}`}
                                        >
                                          FK &#8594; {col.fkTargetTable}
                                        </button>
                                      )}
                                      {col.isUnique && (
                                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                          Unique
                                        </Badge>
                                      )}
                                      {col.defaultValue !== null && (
                                        <span
                                          className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded-sm"
                                          title={`Mặc định: ${col.defaultValue}`}
                                        >
                                          def: {col.defaultValue}
                                        </span>
                                      )}
                                    </div>
                                  </TableCell>

                                  {/* Description */}
                                  <TableCell className="text-xs text-muted-foreground">
                                    {col.description}
                                  </TableCell>
                                </TableRow>
                              )
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Relationships Section (Outgoing & Incoming) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Outgoing Foreign Keys */}
                    <Card className="rounded-xl border border-border shadow-xs">
                      <CardHeader className="py-3 px-4 border-b border-border bg-muted/20">
                        <CardTitle className="text-xs font-semibold flex items-center gap-2">
                          <ArrowRight className="size-3.5 text-sky-500" />
                          Khóa ngoại trỏ đi ({currentTable.outgoingRelations.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-3">
                        {currentTable.outgoingRelations.length === 0 ? (
                          <p className="text-xs text-muted-foreground py-3 text-center">
                            Bảng này không trỏ khóa ngoại đến bảng nào khác.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {currentTable.outgoingRelations.map((rel) => (
                              <div
                                key={`${rel.sourceColumn}->${rel.targetTable}`}
                                className="flex items-center justify-between p-2 rounded-lg bg-card border border-border/80 text-xs hover:border-primary/50 transition-all"
                              >
                                <div className="flex items-center gap-2 font-mono">
                                  <span className="text-foreground font-semibold">{rel.sourceColumn}</span>
                                  <CornerDownRight className="size-3 text-muted-foreground" />
                                  <button
                                    type="button"
                                    onClick={() => setSelectedTableName(rel.targetTable)}
                                    className="text-primary hover:underline font-bold flex items-center gap-1 cursor-pointer"
                                  >
                                    {rel.targetTable}.{rel.targetColumn}
                                    <ExternalLink className="size-3" />
                                  </button>
                                </div>
                                {rel.relationName && (
                                  <span className="text-[10px] text-muted-foreground font-mono">
                                    &quot;{rel.relationName}&quot;
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Incoming References */}
                    <Card className="rounded-xl border border-border shadow-xs">
                      <CardHeader className="py-3 px-4 border-b border-border bg-muted/20">
                        <CardTitle className="text-xs font-semibold flex items-center gap-2">
                          <Link2 className="size-3.5 text-emerald-500" />
                          Được tham chiếu bởi ({currentTable.incomingRelations.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-3">
                        {currentTable.incomingRelations.length === 0 ? (
                          <p className="text-xs text-muted-foreground py-3 text-center">
                            Chưa có bảng nào trỏ khóa ngoại tới bảng này.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {currentTable.incomingRelations.map((rel) => (
                              <div
                                key={`${rel.sourceTable}->${rel.sourceColumn}`}
                                className="flex items-center justify-between p-2 rounded-lg bg-card border border-border/80 text-xs hover:border-emerald-500/50 transition-all"
                              >
                                <div className="flex items-center gap-2 font-mono">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedTableName(rel.sourceTable)}
                                    className="text-emerald-600 dark:text-emerald-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                                  >
                                    {rel.sourceTable}
                                    <ExternalLink className="size-3" />
                                  </button>
                                  <span className="text-muted-foreground text-[10px]">
                                    ({rel.sourceColumn})
                                  </span>
                                </div>
                                <span className="text-[10px] font-mono text-muted-foreground">
                                  &#8594; {rel.targetColumn}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </>
              ) : (
                <div className="text-center py-24 text-muted-foreground">
                  Vui lòng chọn một bảng từ danh sách bên trái để xem cấu trúc chi tiết.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: INTERACTIVE ERD DIAGRAM VIEW */}
        {activeTab === "diagram" && (
          <div className="flex flex-col h-[calc(100vh-270px)] rounded-xl border border-border bg-card overflow-hidden shadow-xs relative">
            {/* Diagram Controls Toolbar */}
            <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-background/80 backdrop-blur-md p-1.5 rounded-full border border-border shadow-xs">
              <Button
                size="icon-xs"
                variant="ghost"
                onClick={() => setDiagramScale((s) => Math.min(2, s + 0.15))}
                title="Phóng to (Zoom In)"
              >
                <ZoomIn className="size-3.5" />
              </Button>
              <Button
                size="icon-xs"
                variant="ghost"
                onClick={() => setDiagramScale((s) => Math.max(0.3, s - 0.15))}
                title="Thu nhỏ (Zoom Out)"
              >
                <ZoomOut className="size-3.5" />
              </Button>
              <Button
                size="icon-xs"
                variant="ghost"
                onClick={resetDiagramView}
                title="Đặt lại góc nhìn (Reset View)"
              >
                <RotateCcw className="size-3.5" />
              </Button>
              <span className="text-[10px] font-mono px-2 text-muted-foreground">
                {Math.round(diagramScale * 100)}%
              </span>
            </div>

            {/* Top Right Legend / Help */}
            <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-background/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-border text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-full bg-amber-500" /> PK
              </span>
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-full bg-sky-500" /> FK
              </span>
              <span>• Kéo chuột để di chuyển canvas</span>
            </div>

            {/* SVG Canvas for Relationship Edges & Nodes */}
            <div
              className="flex-1 w-full h-full cursor-grab active:cursor-grabbing overflow-hidden bg-[radial-gradient(var(--border)_1px,transparent_1px)] [background-size:24px_24px]"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <div
                style={{
                  transform: `translate(${diagramPan.x}px, ${diagramPan.y}px) scale(${diagramScale})`,
                  transformOrigin: "top left",
                  transition: isPanning ? "none" : "transform 0.1s ease-out",
                  position: "relative",
                  width: "4000px",
                  height: "3000px",
                }}
              >
                {/* SVG Connections Layer */}
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  style={{ overflow: "visible" }}
                >
                  <defs>
                    <marker
                      id="arrow"
                      viewBox="0 0 10 10"
                      refX="8"
                      refY="5"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 0 L 10 5 L 0 10 z" className="fill-muted-foreground/60" />
                    </marker>
                    <marker
                      id="arrow-active"
                      viewBox="0 0 10 10"
                      refX="8"
                      refY="5"
                      markerWidth="7"
                      markerHeight="7"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 0 L 10 5 L 0 10 z" className="fill-primary" />
                    </marker>
                  </defs>

                  {erdGraphData.edges.map((edge) => {
                    const dx = edge.toPos.x - edge.fromPos.x
                    const c1x = edge.fromPos.x + dx * 0.5
                    const c1y = edge.fromPos.y
                    const c2x = edge.toPos.x - dx * 0.5
                    const c2y = edge.toPos.y
                    const pathD = `M ${edge.fromPos.x} ${edge.fromPos.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${edge.toPos.x} ${edge.toPos.y}`

                    return (
                      <path
                        key={edge.id}
                        d={pathD}
                        fill="none"
                        className={
                          edge.isHighlighted
                            ? "stroke-primary stroke-2 opacity-95"
                            : "stroke-muted-foreground/30 stroke-1 opacity-40 [stroke-dasharray:4_2]"
                        }
                        markerEnd={edge.isHighlighted ? "url(#arrow-active)" : "url(#arrow)"}
                      />
                    )
                  })}
                </svg>

                {/* Table Nodes Layer */}
                {erdGraphData.nodes.map((table) => {
                  const pos = erdGraphData.positions[table.name]
                  if (!pos) return null

                  const isSelected = table.name === selectedTableName
                  const theme = getTheme(table.module)

                  // Primary & foreign key columns to show inside the node preview
                  const keyCols = table.columns.filter((c) => c.isPk || c.isFk).slice(0, 5)

                  return (
                    <div
                      key={table.name}
                      style={{
                        position: "absolute",
                        left: `${pos.x}px`,
                        top: `${pos.y}px`,
                        width: `${erdGraphData.nodeWidth}px`,
                      }}
                      onClick={() => {
                        setSelectedTableName(table.name)
                        setTableDetailModal(table)
                      }}
                      className={`rounded-xl border bg-card/95 backdrop-blur-xs shadow-md transition-all cursor-pointer select-none group hover:shadow-lg ${
                        isSelected
                          ? "border-primary ring-2 ring-primary/30 z-10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      {/* Node Header */}
                      <div
                        className={`px-3 py-2 border-b border-border/80 rounded-t-xl flex items-center justify-between ${theme.bgLight}`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className={`size-2 rounded-full ${theme.dot}`} />
                          <span className="font-mono text-xs font-bold text-foreground">
                            {table.name}
                          </span>
                        </div>
                        <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-transparent">
                          {table.columns.length} col
                        </Badge>
                      </div>

                      {/* Node Body: Columns Preview */}
                      <div className="p-2 space-y-1 text-[11px] font-mono">
                        {keyCols.map((c) => (
                          <div
                            key={c.name}
                            className="flex items-center justify-between text-muted-foreground group-hover:text-foreground"
                          >
                            <div className="flex items-center gap-1">
                              {c.isPk && <Key className="size-2.5 text-amber-500" />}
                              {c.isFk && <Link2 className="size-2.5 text-sky-500" />}
                              <span className={c.isPk ? "font-bold text-foreground" : ""}>
                                {c.name}
                              </span>
                            </div>
                            <span className="text-[10px] opacity-75">{c.type}</span>
                          </div>
                        ))}
                        {table.columns.length > keyCols.length && (
                          <div className="text-[10px] text-muted-foreground pt-1 border-t border-border/50 text-center">
                            + {table.columns.length - keyCols.length} trường khác...
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ENUMS & CONSTANTS DICTIONARY */}
        {activeTab === "enums" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold tracking-tight">Danh mục Kiểu Liệt kê (Enums)</h2>
                <p className="text-xs text-muted-foreground">
                  Tổng hợp toàn bộ {filteredEnums.length} kiểu Enum được khai báo trong Prisma Schema của hệ thống.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEnums.map(([enumName, def]) => {
                // Find tables that use this enum
                const usedInTables = Object.values(dbSchema.tables)
                  .filter((t) => t.columns.some((c) => c.type === enumName))
                  .map((t) => t.name)

                return (
                  <Card key={enumName} className="rounded-xl border border-border shadow-xs hover:shadow-md transition-all">
                    <CardHeader className="py-3 px-4 border-b border-border bg-muted/20">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xs font-mono font-bold text-primary flex items-center gap-1.5">
                          <Code2 className="size-3.5" />
                          {enumName}
                        </CardTitle>
                        <Badge variant="outline" className="text-[10px] font-mono">
                          {def.values.length} giá trị
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="p-4 space-y-3">
                      {/* Values Badges */}
                      <div className="flex flex-wrap gap-1.5">
                        {def.values.map((val) => (
                          <span
                            key={val}
                            className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-muted border border-border text-foreground font-medium"
                          >
                            {val}
                          </span>
                        ))}
                      </div>

                      {/* Used in tables */}
                      {usedInTables.length > 0 && (
                        <div className="pt-2 border-t border-border/60 text-xs">
                          <span className="text-[11px] text-muted-foreground block mb-1">
                            Sử dụng trong các bảng:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {usedInTables.map((tName) => (
                              <button
                                key={tName}
                                type="button"
                                onClick={() => {
                                  setSelectedTableName(tName)
                                  setActiveTab("tables")
                                }}
                                className="text-[10px] font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded-sm hover:bg-primary/20 transition-all cursor-pointer"
                              >
                                {tName}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Table Detail Dialog (When clicking node on ERD canvas) */}
      <Dialog
        open={tableDetailModal !== null}
        onOpenChange={(open) => !open && setTableDetailModal(null)}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 rounded-xl overflow-hidden">
          {tableDetailModal && (
            <>
              <DialogHeader className="p-6 border-b border-border bg-card">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <DialogTitle className="text-lg font-bold font-mono">
                      {tableDetailModal.name}
                    </DialogTitle>
                    <Badge variant="secondary" className="text-xs">
                      {tableDetailModal.module}
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full text-xs gap-1"
                    onClick={() => {
                      setSelectedTableName(tableDetailModal.name)
                      setTableDetailModal(null)
                      setActiveTab("tables")
                    }}
                  >
                    Xem đầy đủ trên Data Dictionary
                    <ArrowRight className="size-3.5" />
                  </Button>
                </div>
                <DialogDescription className="text-xs text-muted-foreground mt-1">
                  {tableDetailModal.description}
                </DialogDescription>
              </DialogHeader>

              <ScrollArea className="flex-1 p-6">
                <div className="space-y-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Danh sách cột ({tableDetailModal.columns.length})
                  </h4>
                  <div className="border border-border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted/40">
                        <TableRow>
                          <TableHead className="text-xs">Tên cột</TableHead>
                          <TableHead className="text-xs">Kiểu</TableHead>
                          <TableHead className="text-xs">Mô tả</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tableDetailModal.columns.map((c) => (
                          <TableRow key={c.name} className="hover:bg-muted/30">
                            <TableCell className="font-mono text-xs font-semibold">
                              <div className="flex items-center gap-1.5">
                                {c.isPk && <Key className="size-3 text-amber-500" />}
                                {c.isFk && <Link2 className="size-3 text-sky-500" />}
                                <span>{c.name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-xs text-muted-foreground">
                              {c.type}
                              {c.isOptional ? "?" : ""}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {c.description}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </ScrollArea>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function formatTableSummary(currentTable: TableDef) {
  return JSON.stringify(
    {
      model: currentTable.name,
      dbTable: currentTable.dbName,
      module: currentTable.module,
      columnsCount: currentTable.columns.length,
      columns: currentTable.columns.map((c) => ({
        name: c.name,
        type: c.type,
        isPk: c.isPk,
        isFk: c.isFk,
        nullable: c.isOptional,
        description: c.description,
      })),
      foreignKeys: currentTable.outgoingRelations,
    },
    null,
    2,
  )
}
