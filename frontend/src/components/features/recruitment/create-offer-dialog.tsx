import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DatePicker } from "@/components/common"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useCreateOffer } from "@/hooks/recruitment/use-recruitment-queries"
import type { KanbanApplication } from "@/types/recruitment.types"

interface CreateOfferDialogProps {
  applications: KanbanApplication[]
  defaultApplicationId?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => void
}

const EMPLOYMENT_TYPES = [
  ["full_time", "Toàn thời gian"],
  ["part_time", "Bán thời gian"],
  ["contractor", "Hợp đồng"],
  ["intern", "Thực tập"],
] as const

export function CreateOfferDialog({ applications, defaultApplicationId, open, onOpenChange, onCreated }: CreateOfferDialogProps) {
  const [applicationId, setApplicationId] = useState("")
  const [salary, setSalary] = useState("")
  const [startDate, setStartDate] = useState("")
  const [employmentType, setEmploymentType] = useState("full_time")
  const createOffer = useCreateOffer()
  const application = applications.find((item) => item.id === applicationId)

  useEffect(() => {
    if (open) {
      const selectedId = defaultApplicationId || (applications.length === 1 ? applications[0].id : "")
      if (selectedId) {
        setApplicationId(selectedId)
      }
    }
  }, [open, defaultApplicationId, applications])

  useEffect(() => {
    if (application) {
      setSalary(String(application.requisition.salaryMin ?? ""))
    }
  }, [application])

  const close = (nextOpen: boolean) => {
    if (!nextOpen) {
      setApplicationId("")
      setSalary("")
      setStartDate("")
      setEmploymentType("full_time")
    }
    onOpenChange(nextOpen)
  }

  const submit = () => {
    if (!application || !salary || !startDate) return
    createOffer.mutate({
      applicationId: application.id,
      offeredSalary: Number(salary),
      currency: "VND",
      startDate: new Date(startDate).toISOString(),
      jobTitle: application.requisition.title,
      department: application.requisition.department,
      employmentType,
    }, {
      onSuccess: () => {
        onCreated()
        close(false)
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-lg rounded-xl border-border bg-popover">
        <DialogHeader>
          <DialogTitle>Tạo offer nháp</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>Ứng viên</Label>
            {applications.length === 1 || defaultApplicationId ? (
              <Input
                readOnly
                value={application ? `${application.candidate.fullName} · ${application.requisition.title}` : "Đang chọn..."}
                className="rounded-full bg-muted font-medium text-foreground cursor-not-allowed"
              />
            ) : (
              <Select value={applicationId} onValueChange={setApplicationId}>
                <SelectTrigger className="rounded-full">
                  <SelectValue placeholder="Chọn ứng viên" />
                </SelectTrigger>
                <SelectContent>
                  {applications.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.candidate.fullName} · {item.requisition.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Mức lương (VND)</Label>
              <Input type="number" min="1" value={salary} onChange={(event) => { setSalary(event.target.value); }} className="rounded-full" />
            </div>
            <div className="grid gap-2">
              <Label>Ngày bắt đầu</Label>
              <DatePicker
                value={startDate || null}
                onChange={(val) => { setStartDate(val || ""); }}
                placeholder="Chọn ngày bắt đầu..."
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Loại hợp đồng</Label>
            <Select value={employmentType} onValueChange={setEmploymentType}>
              <SelectTrigger className="rounded-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EMPLOYMENT_TYPES.map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" className="rounded-full" onClick={() => { close(false) }}>
            Hủy
          </Button>
          <Button type="button" className="rounded-full" onClick={submit} disabled={!application || !salary || !startDate || createOffer.isPending}>
            {createOffer.isPending ? "Đang tạo..." : "Tạo offer nháp"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
