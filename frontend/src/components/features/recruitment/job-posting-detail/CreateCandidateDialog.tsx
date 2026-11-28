import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { jobPostingApi } from "@/lib/api/recruitment.api"
import { extractErrorMessage } from "@/utils/error-helper"

import { useState } from "react"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

interface CreateCandidateDialogProps {
  postingId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Modal dialog for manually creating a candidate application directly under a specific job posting.
 */
export function CreateCandidateDialog({
  postingId,
  open,
  onOpenChange,
}: CreateCandidateDialogProps) {
  const queryClient = useQueryClient()
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [cvUrl, setCvUrl] = useState("")
  const [notes, setNotes] = useState("")

  const createMutation = useMutation({
    mutationFn: () =>
      jobPostingApi.createCandidate(postingId, {
        fullName,
        email,
        phone: phone || undefined,
        cvUrl: cvUrl || undefined,
        notes: notes || undefined,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["recruitment", "applications"] })
      void queryClient.invalidateQueries({
        queryKey: ["recruitment", "posting-kanban", postingId],
      })
      void queryClient.invalidateQueries({
        queryKey: ["recruitment", "job-posting-overview", postingId],
      })
      toast.success("Đã thêm ứng viên vào giai đoạn mặc định")
      onOpenChange(false)
      setFullName("")
      setEmail("")
      setPhone("")
      setCvUrl("")
      setNotes("")
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>Thêm ứng viên</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            createMutation.mutate()
          }}
          className="space-y-3"
        >
          <div>
            <Label>
              Họ và tên{" "}
              <span className="text-destructive" aria-hidden="true">
                *
              </span>
            </Label>
            <Input
              required
              value={fullName}
              onChange={(event) => {
                setFullName(event.target.value)
              }}
              className="mt-1 rounded-lg"
            />
          </div>
          <div>
            <Label>
              Email{" "}
              <span className="text-destructive" aria-hidden="true">
                *
              </span>
            </Label>
            <Input
              required
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)
              }}
              className="mt-1 rounded-lg"
            />
          </div>
          <div>
            <Label>Số điện thoại</Label>
            <Input
              value={phone}
              onChange={(event) => {
                setPhone(event.target.value)
              }}
              className="mt-1 rounded-lg"
            />
          </div>
          <div>
            <Label>Link CV</Label>
            <Input
              type="url"
              value={cvUrl}
              onChange={(event) => {
                setCvUrl(event.target.value)
              }}
              className="mt-1 rounded-lg"
            />
          </div>
          <div>
            <Label>Ghi chú</Label>
            <Input
              value={notes}
              onChange={(event) => {
                setNotes(event.target.value)
              }}
              className="mt-1 rounded-lg"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={() => {
                onOpenChange(false)
              }}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={createMutation.isPending} className="rounded-full">
              Tạo ứng viên
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
