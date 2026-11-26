import { PageCard } from "@/components/common"
import { Button } from "@/components/ui/button"
import type { CustomQuery } from "@/lib/api/custom-query.api"

import { Plus, Trash2 } from "lucide-react"

import { ALL_FILTER_VALUE } from "./issue-columns.config"

interface IssuesSidebarQueriesProps {
  user: {
    id: string
    role?: string
    fullName: string
  } | null
  assigneeFilter: string
  setAssigneeFilter: (val: string) => void
  createdByIdFilter: string
  setCreatedByIdFilter: (val: string) => void
  sortBy: string
  setSortBy: (val: string) => void
  sortOrder: string
  setSortOrder: (val: string) => void
  clearAllFilters: () => void
  savedQueries: CustomQuery[]
  applySavedQuery: (q: CustomQuery) => void
  onDeleteQuery: (id: string) => void
  onOpenNewQueryDialog: () => void
}

/** Sidebar navigation listing standard and user-saved custom issue queries. */
export function IssuesSidebarQueries({
  user,
  assigneeFilter,
  setAssigneeFilter,
  createdByIdFilter,
  setCreatedByIdFilter,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  clearAllFilters,
  savedQueries,
  applySavedQuery,
  onDeleteQuery,
  onOpenNewQueryDialog,
}: IssuesSidebarQueriesProps) {
  return (
    <div className="col-span-12 lg:col-span-3 space-y-4">
      {/* Quick Queries Card */}
      <PageCard className="p-4 space-y-4">
        <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground pb-2 border-b border-border">
          Truy vấn nhanh
        </h4>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => {
              setAssigneeFilter(user?.id || ALL_FILTER_VALUE)
              setCreatedByIdFilter(ALL_FILTER_VALUE)
            }}
            className={`text-left text-xs font-semibold px-3 py-2 rounded-lg transition-colors cursor-pointer ${
              assigneeFilter === user?.id && createdByIdFilter === ALL_FILTER_VALUE
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            }`}
          >
            Phân công cho tôi
          </button>
          <button
            onClick={() => {
              setCreatedByIdFilter(user?.id || ALL_FILTER_VALUE)
              setAssigneeFilter(ALL_FILTER_VALUE)
            }}
            className={`text-left text-xs font-semibold px-3 py-2 rounded-lg transition-colors cursor-pointer ${
              createdByIdFilter === user?.id && assigneeFilter === ALL_FILTER_VALUE
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            }`}
          >
            Do tôi tạo
          </button>
          <button
            onClick={() => {
              setSortBy("updatedAt")
              setSortOrder("desc")
            }}
            className={`text-left text-xs font-semibold px-3 py-2 rounded-lg transition-colors cursor-pointer ${
              sortBy === "updatedAt" && sortOrder === "desc"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            }`}
          >
            Cập nhật gần đây
          </button>
          <button
            onClick={clearAllFilters}
            className="text-left text-xs font-semibold px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground border border-dashed border-border mt-2 cursor-pointer"
          >
            Xóa bộ lọc
          </button>
        </div>
      </PageCard>

      {/* Saved Custom Queries Card */}
      <PageCard className="p-4 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
            Truy vấn riêng
          </h4>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onOpenNewQueryDialog}
            className="rounded-full cursor-pointer hover:bg-muted text-primary"
            title="Tạo truy vấn mới"
          >
            <Plus className="size-3.5" />
          </Button>
        </div>

        <div className="flex flex-col gap-2">
          {savedQueries && savedQueries.length > 0 ? (
            savedQueries.map((q) => (
              <div key={q.id} className="flex items-center justify-between group">
                <button
                  onClick={() => {
                    applySavedQuery(q)
                  }}
                  className="text-left text-xs font-semibold px-2 py-1.5 rounded-lg text-sky-600 dark:text-sky-400 hover:underline truncate max-w-[170px]"
                  title={q.name}
                >
                  {q.name}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    if (confirm(`Bạn chắc chắn muốn xóa truy vấn "${q.name}"?`)) {
                      onDeleteQuery(q.id)
                    }
                  }}
                  className="text-muted-foreground hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-muted shrink-0 cursor-pointer"
                  title="Xóa truy vấn này"
                >
                  <Trash2 className="size-3" />
                </button>
              </div>
            ))
          ) : (
            <span className="text-xs text-muted-foreground italic px-2">
              Chưa có truy vấn nào được lưu
            </span>
          )}
        </div>
      </PageCard>
    </div>
  )
}
