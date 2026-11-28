import { PageCard } from "@/components/common"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import type { ApplicationNote } from "@/types/recruitment.types"

import { format } from "date-fns"
import { Send } from "lucide-react"

interface ApplicationNotesTabProps {
  notes: ApplicationNote[]
  isLoadingNotes: boolean
  noteText: string
  setNoteText: (val: string) => void
  onAddNote: (text: string) => void
  isPending: boolean
}

/**
 * Pure UI presentational tab facilitating internal hiring team notes and discussions.
 */
export function ApplicationNotesTab({
  notes,
  isLoadingNotes,
  noteText,
  setNoteText,
  onAddNote,
  isPending,
}: ApplicationNotesTabProps) {
  return (
    <PageCard className="space-y-4 border border-border/60 p-6">
      <h3 className="border-b border-border pb-2 text-base font-bold text-foreground">
        Ghi chú & Thảo luận nội bộ
      </h3>

      <div className="space-y-3">
        <Textarea
          value={noteText}
          onChange={(e) => {
            setNoteText(e.target.value)
          }}
          placeholder="Nhập ghi chú hoặc thảo luận về ứng viên này..."
          className="min-h-[90px] rounded-xl text-xs transition-all focus:border-primary/60"
        />
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={() => {
              if (noteText.trim()) onAddNote(noteText.trim())
            }}
            disabled={!noteText.trim() || isPending}
            className="rounded-full px-4 text-xs shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          >
            <Send className="mr-1.5 size-3.5" />
            Gửi ghi chú
          </Button>
        </div>
      </div>

      <div className="space-y-3 border-t border-border/40 pt-4">
        {isLoadingNotes ? (
          <span className="text-xs text-muted-foreground">Đang tải ghi chú...</span>
        ) : notes.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">Chưa có ghi chú nào.</p>
        ) : (
          notes.map((note: ApplicationNote) => (
            <div
              key={note.id}
              className="space-y-1 rounded-xl border border-border/50 bg-secondary/10 p-3.5 transition-all duration-200 hover:border-primary/30 hover:bg-secondary/20"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">{note.addedBy.fullName}</span>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {format(new Date(note.createdAt), "HH:mm, dd/MM/yyyy")}
                </span>
              </div>
              <p className="text-xs leading-relaxed text-foreground">{note.note}</p>
            </div>
          ))
        )}
      </div>
    </PageCard>
  )
}
