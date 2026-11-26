import type { CustomQuery } from "@/lib/api/custom-query.api"

import { Trash2 } from "lucide-react"

import { QUICK_QUERY_TYPE } from '@/constants/gantt.constants'

interface GanttSidebarQueriesProps {
  isSidebarExpanded: boolean
  setIsSidebarExpanded: (expanded: boolean) => void
  handleQuickQuery: (type: string) => void
  savedQueries: CustomQuery[]
  applySavedQuery: (q: CustomQuery) => void
  deleteQueryMutation: {
    mutate: (id: string) => void
  }
}

/** Sidebar navigation list of system and user-defined Gantt queries. */
export function GanttSidebarQueries({
  isSidebarExpanded,
  setIsSidebarExpanded,
  handleQuickQuery,
  savedQueries,
  applySavedQuery,
  deleteQueryMutation,
}: GanttSidebarQueriesProps) {
  if (!isSidebarExpanded) {
    return (
      <button
        onClick={() => {
          setIsSidebarExpanded(true)
        }}
        className="p-2.5 border border-border/40 bg-background rounded-full shadow-sm hover:bg-muted transition-colors shrink-0 font-bold text-xs flex items-center justify-center hover:scale-102 cursor-pointer"
        title="Mở rộng truy vấn riêng"
      >
        «
      </button>
    )
  }

  return (
    <div className="w-56 shrink-0 bg-background p-4 rounded-xl border border-border/40 shadow-sm space-y-4 relative transition-all duration-200">
      <button
        onClick={() => {
          setIsSidebarExpanded(false)
        }}
        className="absolute top-3 right-3 text-muted-foreground hover:text-foreground text-xs font-bold cursor-pointer"
        title="Thu nhỏ truy vấn riêng"
      >
        »
      </button>

      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border/10 pb-2">
        Truy vấn riêng
      </h4>

      <ul className="space-y-2 text-xs">
        <li>
          <button
            onClick={() => {
              handleQuickQuery(QUICK_QUERY_TYPE.ASSIGNED_TO_ME)
            }}
            className="text-primary hover:underline text-left font-medium block w-full cursor-pointer"
          >
            Issues assigned to me
          </button>
        </li>
        <li>
          <button
            onClick={() => {
              handleQuickQuery(QUICK_QUERY_TYPE.REPORTED_ISSUES)
            }}
            className="text-primary hover:underline text-left font-medium block w-full cursor-pointer"
          >
            Reported issues
          </button>
        </li>
        <li>
          <button
            onClick={() => {
              handleQuickQuery(QUICK_QUERY_TYPE.UPDATED_ISSUES)
            }}
            className="text-primary hover:underline text-left font-medium block w-full cursor-pointer"
          >
            Updated issues
          </button>
        </li>
        <li>
          <button
            onClick={() => {
              handleQuickQuery(QUICK_QUERY_TYPE.WATCHED_ISSUES)
            }}
            className="text-destructive hover:underline text-left font-medium block w-full cursor-pointer"
          >
            Watched issues
          </button>
        </li>

        {savedQueries && savedQueries.length > 0 && (
          <>
            <li className="border-t border-border/10 my-2 pt-2 text-[10px] uppercase tracking-wider text-muted-foreground font-bold select-none">
              Truy vấn đã lưu
            </li>
            {savedQueries.map((q: CustomQuery) => (
              <li key={q.id} className="flex items-center justify-between group">
                <button
                  onClick={() => {
                    applySavedQuery(q)
                  }}
                  className="text-primary hover:underline text-left font-medium block truncate max-w-37.5 cursor-pointer"
                  title={q.name}
                >
                  {q.name}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    if (confirm(`Bạn chắc chắn muốn xóa truy vấn "${q.name}"?`)) {
                      deleteQueryMutation.mutate(q.id)
                    }
                  }}
                  className="text-muted-foreground hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-muted shrink-0 cursor-pointer"
                  title="Xóa truy vấn này"
                >
                  <Trash2 className="size-3" />
                </button>
              </li>
            ))}
          </>
        )}
      </ul>
    </div>
  )
}


