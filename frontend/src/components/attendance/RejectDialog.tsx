import type { IApplication } from "@/lib/api/application.api"

import React, { useState } from "react"

import { X } from "lucide-react"
import { toast } from "sonner"

import { APP_TYPE_META } from "./attendance-ui.meta"

export interface RejectDialogProps {
  app: IApplication
  onCancel: () => void
  onConfirm: (reason: string) => void
  isLoading: boolean
}

export function RejectDialog({ app, onCancel, onConfirm, isLoading }: RejectDialogProps) {
  const [reason, setReason] = useState("")
  const typeMeta = APP_TYPE_META[app.type]

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!reason.trim()) {
      toast.error("Vui lòng nhập lý do không duyệt")
      return
    }
    onConfirm(reason)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 flex flex-col gap-5">
        <div className="flex flex-col items-center text-center gap-2">
          <div className="h-12 w-12 rounded-full bg-red-50 border border-red-100 flex items-center justify-center text-red-500 mb-1">
            <X size={22} />
          </div>
          <h3 className="text-base font-bold text-slate-800">Không duyệt đơn?</h3>
          <p className="text-sm text-slate-500">
            Không duyệt đơn <strong className={typeMeta.color}>{typeMeta.label}</strong> của{" "}
            <strong>{app.employee?.fullName}</strong>?
          </p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600">Lý do không duyệt *</label>
            <textarea
              rows={3}
              required
              value={reason}
              onChange={(e) => {
                setReason(e.target.value)
              }}
              placeholder="Nhập lý do..."
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2.5 border border-slate-200 rounded-full text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white rounded-full text-sm font-bold transition-colors"
            >
              {isLoading ? "Đang xử lý..." : "Xác nhận không duyệt"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
