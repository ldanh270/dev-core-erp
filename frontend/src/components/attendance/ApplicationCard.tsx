import { APPLICATION_STATUS } from "@/config/entities/attendance.config"
import type { IApplication } from "@/lib/api/application.api"

import { useState } from "react"

import { Check, ChevronDown, X } from "lucide-react"

import { APP_TYPE_META, STATUS_META } from "./attendance-ui.meta"

export interface ApplicationCardProps {
  app: IApplication
  mode: "mine" | "manage"
  onCancelRequest?: (app: IApplication) => void
  onApproveRequest?: (app: IApplication) => void
  onRejectRequest?: (app: IApplication) => void
  processingId?: string | null
}

export function ApplicationCard({
  app,
  mode,
  onCancelRequest,
  onApproveRequest,
  onRejectRequest,
  processingId,
}: ApplicationCardProps) {
  const [expanded, setExpanded] = useState(false)
  const typeMeta = APP_TYPE_META[app.type as keyof typeof APP_TYPE_META]
  const statusMeta = STATUS_META[app.status as keyof typeof STATUS_META]
  const TypeIcon = typeMeta.icon
  const StatusIcon = statusMeta.icon

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition-all duration-200">
      <div
        className="flex items-center gap-4 p-4 cursor-pointer select-none"
        onClick={() => {
          setExpanded((v) => !v)
        }}
      >
        <div
          className={`h-10 w-10 shrink-0 rounded-xl flex items-center justify-center border ${typeMeta.bg} ${typeMeta.border} ${typeMeta.color}`}
        >
          <TypeIcon size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-slate-800">{typeMeta.label}</span>
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${statusMeta.color} ${statusMeta.bg} ${statusMeta.border}`}
            >
              <StatusIcon size={10} />
              {statusMeta.label}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {new Date(app.startDate).toLocaleDateString("vi-VN")}
            {app.endDate && app.endDate !== app.startDate && (
              <> → {new Date(app.endDate).toLocaleDateString("vi-VN")}</>
            )}
            <span className="mx-1.5">·</span>
            Tạo: {new Date(app.createdAt).toLocaleDateString("vi-VN")}
          </p>
        </div>
        <ChevronDown
          size={16}
          className={`text-slate-300 shrink-0 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
        />
      </div>

      {expanded && (
        <div className="border-t border-slate-100 px-4 pb-4 pt-3 flex flex-col gap-3">
          <div className="flex flex-col gap-2 text-xs">
            {app.reason && (
              <div className="flex flex-col gap-0.5">
                <span className="text-slate-400 font-medium">Lý do</span>
                <span className="text-slate-700">{app.reason}</span>
              </div>
            )}
            {app.note && (
              <div className="flex flex-col gap-0.5">
                <span className="text-slate-400 font-medium">Ghi chú</span>
                <span className="text-slate-700">{app.note}</span>
              </div>
            )}
            {mode === "manage" && app.employee && (
              <div className="flex flex-col gap-0.5">
                <span className="text-slate-400 font-medium">Nhân viên</span>
                <span className="text-slate-700 font-semibold">{app.employee.fullName}</span>
              </div>
            )}
            {app.rejectReason && (
              <div className="flex flex-col gap-0.5 p-2 rounded-lg bg-red-50 border border-red-100">
                <span className="text-red-500 font-semibold">Lý do không duyệt</span>
                <span className="text-red-700">{app.rejectReason}</span>
              </div>
            )}
            {(app.approvedBy || app.assignedTo) && (
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground font-medium">Người duyệt:</span>
                <span className="text-slate-700">
                  {app.approvedBy?.fullName || app.assignedTo?.fullName}
                </span>
              </div>
            )}
          </div>

          {app.status === APPLICATION_STATUS.PENDING && mode === "mine" && onCancelRequest && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onCancelRequest(app)
              }}
              className="self-start flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-full transition-colors"
            >
              <X size={12} />
              Hủy đơn
            </button>
          )}

          {app.status === APPLICATION_STATUS.PENDING &&
            mode === "manage" &&
            onApproveRequest &&
            onRejectRequest && (
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onApproveRequest(app)
                  }}
                  disabled={processingId === app.id}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Check size={14} />
                  Phê duyệt
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onRejectRequest(app)
                  }}
                  disabled={processingId === app.id}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50"
                >
                  <X size={14} />
                  Không duyệt
                </button>
              </div>
            )}
        </div>
      )}
    </div>
  )
}
