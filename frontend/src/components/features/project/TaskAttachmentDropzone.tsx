import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { type ChangeEvent, type DragEvent, useRef } from "react"

import { UploadCloud, X } from "lucide-react"
import { toast } from "sonner"

export interface TaskAttachmentDropzoneProps {
  selectedFiles: File[]
  onFilesChange: (files: File[]) => void
  isDragOver: boolean
  onDragOverChange: (isOver: boolean) => void
}

/** Drag-and-drop file upload zone for task attachments. */
export function TaskAttachmentDropzone({
  selectedFiles,
  onFilesChange,
  isDragOver,
  onDragOverChange,
}: TaskAttachmentDropzoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
    onDragOverChange(true)
  }

  const handleDragLeave = () => {
    onDragOverChange(false)
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    onDragOverChange(false)
    if (e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files)
      const validFiles = filesArray.filter((file) => {
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`Tệp ${file.name} vượt quá dung lượng tối đa 10MB`)
          return false
        }
        return true
      })
      if (validFiles.length > 0) {
        onFilesChange([...selectedFiles, ...validFiles])
        toast.success(`Đã thêm ${validFiles.length} tệp đính kèm (bản nháp)`)
      }
    }
  }

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files)
      const validFiles = filesArray.filter((file) => {
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`Tệp ${file.name} vượt quá dung lượng tối đa 10MB`)
          return false
        }
        return true
      })
      if (validFiles.length > 0) {
        onFilesChange([...selectedFiles, ...validFiles])
        toast.success(`Đã thêm ${validFiles.length} tệp đính kèm (bản nháp)`)
      }
    }
  }

  const removeFile = (index: number) => {
    onFilesChange(selectedFiles.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-3">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors",
          isDragOver
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 bg-muted/20",
        )}
      >
        <UploadCloud className="size-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-xs font-semibold text-foreground">
          Kéo thả tệp đính kèm vào đây, hoặc{" "}
          <span className="text-primary hover:underline">chọn tệp</span>
        </p>
        <p className="text-[11px] text-muted-foreground mt-1">Dung lượng tối đa mỗi tệp: 10MB</p>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          multiple
          className="hidden"
        />
      </div>

      {selectedFiles.length > 0 && (
        <div className="space-y-1.5">
          {selectedFiles.map((file, idx) => (
            <div
              key={`${file.name}-${idx}`}
              className="flex items-center justify-between p-2 rounded-lg border border-border bg-background text-xs"
            >
              <div className="flex items-center gap-2 truncate">
                <span className="font-medium text-foreground truncate">{file.name}</span>
                <span className="text-[10px] text-muted-foreground">
                  ({(file.size / 1024).toFixed(1)} KB)
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-6 text-muted-foreground hover:text-destructive rounded-full"
                onClick={(e) => {
                  e.stopPropagation()
                  removeFile(idx)
                }}
              >
                <X className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
