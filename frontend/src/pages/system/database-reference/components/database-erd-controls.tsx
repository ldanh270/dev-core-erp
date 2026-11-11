import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import type { ModuleDef } from "../database-reference.types"
import { useDatabaseErdControls } from "../hooks/use-database-erd-controls"
import {
  Expand,
  KeyRound,
  Link2,
  Minimize,
  Mouse,
  RotateCcw,
  Scan,
  ZoomIn,
  ZoomOut,
} from "lucide-react"

// Props for the ERD toolbar controls and legend bar.
interface DatabaseErdControlsProps {
  modules: ModuleDef[]
  selectedModule: string
  onModuleChange: (moduleId: string) => void
  tableCount: number
  showCrossModuleRelations: boolean
  onCrossModuleRelationsChange: (show: boolean) => void
  scale: number
  onZoomIn: () => void
  onZoomOut: () => void
  onFit: () => void
  onResetLayout: () => void
  isFullscreen: boolean
  onToggleFullscreen: () => void
}

/**
 * Renders the ERD header toolbar and legend bar.
 * Pure UI presentation component powered by `useDatabaseErdControls` hook.
 */
export function DatabaseErdControls({
  modules,
  selectedModule,
  onModuleChange,
  tableCount,
  showCrossModuleRelations,
  onCrossModuleRelationsChange,
  scale,
  onZoomIn,
  onZoomOut,
  onFit,
  onResetLayout,
  isFullscreen,
  onToggleFullscreen,
}: DatabaseErdControlsProps) {
  const { scalePercent, fullscreenLabel, fullscreenAriaLabel } = useDatabaseErdControls({
    scale,
    isFullscreen,
  })

  return (
    <>
      {/* Top toolbar with module selector, visible table count, cross-module FK switch, and viewport actions */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-background px-3 py-3 sm:px-4">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <label htmlFor="database-erd-module" className="text-xs font-semibold text-muted-foreground">
            Phân hệ
          </label>
          <Select value={selectedModule} onValueChange={onModuleChange}>
            <SelectTrigger id="database-erd-module" size="sm" className="w-48 sm:w-56 bg-card">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả phân hệ</SelectItem>
              {modules.map((module) => (
                <SelectItem key={module.id} value={module.id}>
                  {module.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Badge variant="secondary" className="rounded-full tabular-nums">
            {tableCount} bảng
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="flex h-9 cursor-pointer items-center gap-2 rounded-full border border-border bg-card px-3 text-xs font-semibold">
            <Switch
              size="sm"
              checked={showCrossModuleRelations}
              onCheckedChange={onCrossModuleRelationsChange}
              aria-label="Hiển thị khóa ngoại liên phân hệ"
            />
            <span>FK liên phân hệ</span>
          </label>

          {/* Match 36px (`h-9`) height of adjacent action buttons */}
          <div className="flex h-9 items-center gap-0.5 rounded-full border border-border bg-card px-1">
            <Button type="button" size="icon-xs" variant="ghost" aria-label="Thu nhỏ sơ đồ" onClick={onZoomOut}>
              <ZoomOut className="size-3.5" />
            </Button>
            <span className="min-w-11 text-center font-mono text-[11px] font-semibold text-muted-foreground">
              {scalePercent}%
            </span>
            <Button type="button" size="icon-xs" variant="ghost" aria-label="Phóng to sơ đồ" onClick={onZoomIn}>
              <ZoomIn className="size-3.5" />
            </Button>
          </div>
          <Button type="button" size="sm" variant="outline" className="rounded-full" onClick={onFit}>
            <Scan className="mr-1.5 size-3.5" />
            Fit màn hình
          </Button>
          <Button type="button" size="sm" variant="outline" className="rounded-full" onClick={onResetLayout}>
            <RotateCcw className="mr-1.5 size-3.5" />
            Sắp xếp lại
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="rounded-full"
            onClick={onToggleFullscreen}
            aria-label={fullscreenAriaLabel}
          >
            {isFullscreen ? <Minimize className="mr-1.5 size-3.5" /> : <Expand className="mr-1.5 size-3.5" />}
            {fullscreenLabel}
          </Button>
        </div>
      </header>

      {/* Secondary legend bar explaining PK/FK icons, cross-module styles, and mouse/keyboard shortcuts */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-border/70 bg-muted/20 px-3 py-2 text-[11px] text-muted-foreground sm:px-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1">
            <KeyRound className="size-3 text-amber-600 dark:text-amber-400" />
            PK
          </span>
          <span className="inline-flex items-center gap-1">
            <Link2 className="size-3 text-sky-600 dark:text-sky-400" />
            FK
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="size-2 rounded-sm border-2 border-dashed border-primary/60" />
            Bảng ngoài phân hệ
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-5 border-t-2 border-dashed border-primary/75" />
            FK liên phân hệ
          </span>
        </div>
        <span className="inline-flex items-center gap-1.5">
          <Mouse className="size-3.5" />
          Kéo bảng để sắp xếp · Kéo nền để pan · Shift + cuộn ngang · Ctrl + cuộn trong sơ đồ để zoom · F toàn màn hình
        </span>
      </div>
    </>
  )
}
