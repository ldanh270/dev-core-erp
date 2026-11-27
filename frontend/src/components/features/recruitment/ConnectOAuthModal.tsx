import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { POSTING_CHANNELS } from "@/config/entities/recruitment.config"
import { TYPOGRAPHY } from "@/config/typography.config"
import { Link2, RefreshCw } from "lucide-react"

/**
 * Props for ConnectOAuthModal component.
 */
export interface ConnectOAuthModalProps {
  /** Controls modal visibility */
  open: boolean
  /** Callback fired when dialog open state changes */
  onOpenChange: (open: boolean) => void
  /** The selected recruitment channel key */
  selectedChannel: string
  /** Callback when user changes the target channel */
  onChannelChange: (channel: string) => void
  /** User-defined account alias / label */
  accountName: string
  /** Callback when user edits account name */
  onAccountNameChange: (name: string) => void
  /** Indicates whether the OAuth redirect initiation is pending */
  isConnecting: boolean
  /** Triggers OAuth initiation process */
  onStartOAuth: () => Promise<void>
}

/**
 * Presenter dialog modal for initiating OAuth2 channel connection.
 * Allows user to pick a channel provider and assign a distinguishing identifier before OAuth redirect.
 */
export function ConnectOAuthModal({
  open,
  onOpenChange,
  selectedChannel,
  onChannelChange,
  accountName,
  onAccountNameChange,
  isConnecting,
  onStartOAuth,
}: ConnectOAuthModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-xl">
        <DialogHeader>
          <DialogTitle className={TYPOGRAPHY.MODAL_TITLE}>Kết nối tài khoản kênh mới</DialogTitle>
          <DialogDescription className={TYPOGRAPHY.MODAL_DESCRIPTION}>
            Đăng nhập ủy quyền qua OAuth2 để hệ thống tự động xuất bản tin hoặc đồng bộ hồ sơ ứng
            viên.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className={TYPOGRAPHY.FORM_LABEL}>Kênh ứng tuyển</Label>
            <Select value={selectedChannel} onValueChange={onChannelChange}>
              <SelectTrigger className="w-full h-10 text-xs rounded-full">
                <SelectValue placeholder="Chọn kênh" />
              </SelectTrigger>
              <SelectContent>
                {POSTING_CHANNELS.map((ch) => (
                  <SelectItem key={ch.value} value={ch.value}>
                    {ch.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className={TYPOGRAPHY.FORM_LABEL}>
              Tên nhận diện tài khoản <span className="text-destructive">*</span>
            </Label>
            <Input
              placeholder="Ví dụ: Google HR Team, LinkedIn Tuyển dụng..."
              value={accountName}
              onChange={(e) => onAccountNameChange(e.target.value)}
              className="h-10 text-xs rounded-full"
            />
            <p className={TYPOGRAPHY.FORM_HELPER}>
              Đặt tên giúp bạn phân biệt nếu liên kết nhiều tài khoản trong cùng một kênh.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isConnecting}
            className="rounded-full h-9 text-xs"
          >
            Hủy
          </Button>
          <Button
            onClick={onStartOAuth}
            disabled={isConnecting}
            className="rounded-full h-9 text-xs gap-1.5 font-semibold"
          >
            {isConnecting ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                Đang chuyển hướng...
              </>
            ) : (
              <>
                <Link2 className="h-3.5 w-3.5" />
                Tiếp tục đăng nhập
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
