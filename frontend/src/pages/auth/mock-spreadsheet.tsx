import { AlignLeft, Database, FileText, Filter, Folder, Play, Search, Settings } from "lucide-react"

/**
 * Render a high-quality, crisp vector SVG collaborator avatar.
 */
const CollaboratorAvatar = () => (
  <div className="relative h-10 w-10 overflow-hidden rounded-full border-2 border-background bg-primary/10 text-primary flex items-center justify-center shadow-md transition-all hover:scale-110">
    <span className="text-xs font-bold">JD</span>
  </div>
)

/**
 * Render a high-quality vector SVG sidebar user avatar.
 */
const UserAvatar = () => (
  <div className="relative h-8 w-8 overflow-hidden rounded-full border border-border bg-muted flex items-center justify-center shadow transition-all hover:scale-110 text-muted-foreground">
    <span className="text-[10px] font-bold">AD</span>
  </div>
)

/**
 * MockSpreadsheetCard component
 * Implements a premium preview UI representing the application's interface.
 * Features realistic layout elements, hover state animations, and clean markup.
 */
export default function MockSpreadsheetCard() {
  const tableRows = Array.from({ length: 7 })

  return (
    <div className="relative w-full max-w-xl animate-float">
      {/* Top overlapping collaborator profile */}
      <div className="absolute -top-5 right-28 z-10">
        <CollaboratorAvatar />
      </div>

      <div className="flex overflow-hidden rounded-xl border border-border/40 bg-card text-card-foreground shadow-2xl backdrop-blur-sm">
        {/* Mock App Sidebar */}
        <div className="flex w-16 flex-col items-center justify-between bg-primary/95 py-5 text-primary-foreground/80 dark:bg-primary/90">
          <div className="flex flex-col items-center gap-6">
            {/* Logo */}
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 text-white font-bold">
              Q
            </div>
            {/* Sidebar Navigation */}
            <button
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/25 text-white"
              aria-label="Folder tab"
            >
              <Folder size={18} />
            </button>
            <button
              className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-white/10 hover:text-white"
              aria-label="Play tab"
            >
              <Play size={18} />
            </button>
            <button
              className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-white/10 hover:text-white"
              aria-label="Database tab"
            >
              <Database size={18} />
            </button>
          </div>

          <div className="flex flex-col items-center gap-4">
            <button
              className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-white/10 hover:text-white"
              aria-label="Settings"
            >
              <Settings size={18} />
            </button>
            <UserAvatar />
          </div>
        </div>

        {/* Mock App Content */}
        <div className="flex-1 bg-background p-5 text-foreground">
          {/* Header */}
          <div className="mb-4 flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
                <FileText size={16} />
              </div>
              <span className="font-semibold text-sm">Example File</span>
            </div>

            {/* Top Toolbar actions */}
            <div className="flex items-center gap-2">
              <div className="h-6 w-12 rounded bg-secondary/80 animate-pulse" />
              <div className="h-6 w-16 rounded bg-secondary/80 animate-pulse" />
              <div className="h-6 w-8 rounded bg-secondary/80 animate-pulse" />
            </div>
          </div>

          {/* Sub Toolbar */}
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="absolute top-2.5 left-3 text-muted-foreground" size={14} />
              <div className="h-8 w-full rounded-full border border-border bg-secondary/20 pl-9" />
            </div>
            <button
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground"
              aria-label="Filter"
            >
              <Filter size={14} />
            </button>
          </div>

          {/* Data Table */}
          <div className="overflow-hidden rounded-lg border border-border/80">
            <div className="grid grid-cols-12 bg-secondary/40 border-b border-border/80 py-2 px-3 text-xs font-semibold text-muted-foreground">
              <div className="col-span-1 text-center">#</div>
              <div className="col-span-3 flex items-center gap-1">
                <AlignLeft size={10} /> Type
              </div>
              <div className="col-span-4 text-center">Value A</div>
              <div className="col-span-4 text-center">Value B</div>
            </div>

            {/* Table Rows (Skeleton styling) */}
            <div className="divide-y divide-border/60">
              {tableRows.map((_, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-12 items-center py-2.5 px-3 text-xs text-muted-foreground hover:bg-secondary/20"
                >
                  <div className="col-span-1 text-center font-mono font-medium">{idx + 1}</div>
                  <div className="col-span-3 flex items-center gap-2">
                    <div
                      className={`h-2.5 w-2.5 rounded-full ${idx % 2 === 0 ? "bg-emerald-500" : "bg-blue-500"}`}
                    />
                    <div className="h-3 w-12 rounded bg-secondary/80 animate-pulse" />
                  </div>
                  <div className="col-span-4 px-2">
                    <div className="mx-auto h-3 w-16 rounded bg-secondary/60 animate-pulse" />
                  </div>
                  <div className="col-span-4 px-2">
                    <div className="mx-auto h-3 w-20 rounded bg-secondary/50 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
