import { SYSTEM_CONFIG } from "@/config/system.config"
import { applicationApi } from "@/lib/api/application.api"

import { useRef, useState } from "react"

import { FileIcon, Loader2, UploadCloud, X } from "lucide-react"

interface FileUploaderProps {
  onUploadSuccess: (url: string) => void
  disabled?: boolean
}

export function FileUploader({ onUploadSuccess, disabled }: FileUploaderProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [file, setFile] = useState<{ name: string; url: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (!selected) return

    // Limit size
    if (selected.size > SYSTEM_CONFIG.UPLOAD.MAX_FILE_SIZE) {
      setError(`Kích thước tệp không được vượt quá ${SYSTEM_CONFIG.UPLOAD.MAX_FILE_SIZE_MB}MB`)
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      const { url } = await applicationApi.uploadAttachment(selected)
      setFile({ name: selected.name, url })
      onUploadSuccess(url)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Lỗi tải lên tệp")
    } finally {
      setIsUploading(false)
      // reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleRemove = () => {
    setFile(null)
    onUploadSuccess("")
    setError(null)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-4">
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={(e) => {
            void handleFileChange(e)
          }}
          accept={SYSTEM_CONFIG.UPLOAD.ALLOWED_MIME_TYPES}
          disabled={disabled || isUploading}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading}
          className="flex items-center gap-2 px-4 py-2 border border-input rounded-md bg-background text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
        >
          {isUploading ? (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          ) : (
            <UploadCloud className="w-4 h-4 text-muted-foreground" />
          )}
          Chọn tệp
        </button>
        {!file && (
          <span className="text-[13px] text-muted-foreground">Không có tệp nào được chọn</span>
        )}
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      {file && (
        <div className="flex items-center justify-between p-3 border border-border rounded-md bg-muted/30">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <FileIcon className="w-4 h-4 text-primary" />
            </div>
            <div className="truncate">
              <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
              <a
                href={file.url}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-primary hover:underline"
              >
                Xem tệp đính kèm
              </a>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="p-2 hover:bg-destructive/10 text-destructive rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
