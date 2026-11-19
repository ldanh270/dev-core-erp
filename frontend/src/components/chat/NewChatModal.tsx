import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useNewChatModal } from "@/hooks/chat/use-new-chat-modal"

import { Check, Search, User, Users, X } from "lucide-react"

interface NewChatModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateDirect: (partnerId: string) => Promise<void>
  onCreateGroup: (data: { title: string; participantIds: string[] }) => Promise<void>
}

export function NewChatModal({
  isOpen,
  onClose,
  onCreateDirect,
  onCreateGroup,
}: NewChatModalProps) {
  const {
    tab,
    setTab,
    searchQuery,
    setSearchQuery,
    employees,
    isLoading,
    groupTitle,
    setGroupTitle,
    selectedMembers,
    toggleMember,
    selectDirectFromClick,
    createGroupFromClick,
  } = useNewChatModal({ isOpen, onClose, onCreateDirect, onCreateGroup })

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xl">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h3 className="text-base font-semibold">Tạo cuộc trò chuyện mới</h3>
          <Button type="button" variant="ghost" size="icon-sm" onClick={onClose} aria-label="Đóng">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex border-b border-border bg-muted/40 p-1">
          <Button
            type="button"
            variant={tab === "direct" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => {
              setTab("direct")
            }}
            className="flex-1"
          >
            <User className="h-3.5 w-3.5" />
            Nhắn tin 1-1
          </Button>
          <Button
            type="button"
            variant={tab === "group" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => {
              setTab("group")
            }}
            className="flex-1"
          >
            <Users className="h-3.5 w-3.5" />
            Tạo nhóm chat
          </Button>
        </div>

        {tab === "group" && (
          <div className="space-y-2 border-b border-border p-3">
            <Input
              type="text"
              value={groupTitle}
              onChange={(event) => {
                setGroupTitle(event.target.value)
              }}
              placeholder="Đặt tên nhóm chat..."
              className="rounded-full border-border bg-muted/60 text-xs"
            />
            {selectedMembers.length > 0 && (
              <div className="flex max-h-20 flex-wrap gap-1 overflow-y-auto pt-1">
                {selectedMembers.map((member) => (
                  <span
                    key={member.id}
                    className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                  >
                    {member.fullName}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => {
                        toggleMember(member)
                      }}
                      aria-label={`Bỏ ${member.fullName}`}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="border-b border-border p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value)
              }}
              placeholder="Tìm theo tên hoặc tên đăng nhập..."
              className="rounded-full border-border bg-muted/60 pl-9 text-xs"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-border/40 p-1">
          {isLoading ? (
            <div className="p-4 text-center text-xs text-muted-foreground">Đang tìm...</div>
          ) : employees.length === 0 ? (
            <div className="p-4 text-center text-xs text-muted-foreground">
              Không tìm thấy nhân viên phù hợp
            </div>
          ) : (
            employees.map((employee) => {
              const isSelected = selectedMembers.some((member) => member.id === employee.id)
              return (
                <Button
                  key={employee.id}
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    if (tab === "direct") {
                      selectDirectFromClick(employee.id)
                    } else {
                      toggleMember(employee)
                    }
                  }}
                  className="h-auto w-full justify-between rounded-lg px-3 py-2.5 text-left"
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {employee.fullName.charAt(0)}
                    </span>
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate text-xs font-medium text-foreground">
                        {employee.fullName}
                      </span>
                      <span className="truncate text-[10px] text-muted-foreground">
                        @{employee.username} {employee.position ? `• ${employee.position}` : ""}
                      </span>
                    </span>
                  </span>
                  {tab === "group" && (
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background"
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                    </span>
                  )}
                </Button>
              )
            })
          )}
        </div>

        {tab === "group" && (
          <div className="flex items-center justify-between border-t border-border bg-muted/20 p-3">
            <span className="text-xs text-muted-foreground">
              Đã chọn: {selectedMembers.length} thành viên
            </span>
            <Button
              type="button"
              size="sm"
              onClick={createGroupFromClick}
              disabled={!groupTitle.trim() || selectedMembers.length < 2}
            >
              Tạo nhóm
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
