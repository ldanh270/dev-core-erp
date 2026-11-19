import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useNewChatModal } from "@/hooks/chat/use-new-chat-modal"

import { Search } from "lucide-react"

import { NewChatGroupFields } from "./NewChatGroupFields"
import { NewChatMemberList } from "./NewChatMemberList"
import { NewChatTabs } from "./NewChatTabs"

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
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent showCloseButton className="max-h-[85vh] max-w-md gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b border-border p-4">
          <DialogTitle>Tạo cuộc trò chuyện mới</DialogTitle>
        </DialogHeader>

        <NewChatTabs tab={tab} onTabChange={setTab} />

        {tab === "group" && (
          <NewChatGroupFields
            groupTitle={groupTitle}
            selectedMembers={selectedMembers}
            onGroupTitleChange={setGroupTitle}
            onRemoveMember={toggleMember}
          />
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
          <NewChatMemberList
            employees={employees}
            selectedMembers={selectedMembers}
            isLoading={isLoading}
            isGroup={tab === "group"}
            onEmployeeClick={(employee) => {
              if (tab === "direct") {
                selectDirectFromClick(employee.id)
              } else {
                toggleMember(employee)
              }
            }}
          />
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
      </DialogContent>
    </Dialog>
  )
}
