import { chatApi } from "@/lib/chat-api"
import type { MentionEmployeeItem } from "@/types/chat.types"

import React, { useEffect, useState } from "react"

import { Check, Search, User, Users, X } from "lucide-react"

interface NewChatModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateDirect: (partnerId: string) => Promise<void>
  onCreateGroup: (data: { title: string; participantIds: string[] }) => Promise<void>
}

export const NewChatModal: React.FC<NewChatModalProps> = ({
  isOpen,
  onClose,
  onCreateDirect,
  onCreateGroup,
}) => {
  const [tab, setTab] = useState<"direct" | "group">("direct")
  const [searchQuery, setSearchQuery] = useState("")
  const [employees, setEmployees] = useState<MentionEmployeeItem[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Group state
  const [groupTitle, setGroupTitle] = useState("")
  const [selectedMembers, setSelectedMembers] = useState<MentionEmployeeItem[]>([])

  // Debounce employee search and discard results when the query changes or the modal closes.
  useEffect(() => {
    if (!isOpen) return

    let isMounted = true
    setIsLoading(true)

    const fetchEmps = async () => {
      try {
        const res = await chatApi.searchMentionEmployees(searchQuery, 15)
        if (isMounted) setEmployees(res)
      } catch (err) {
        console.error("Failed to search employees:", err)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    const timer = setTimeout(() => {
      void fetchEmps()
    }, 150)
    return () => {
      isMounted = false
      clearTimeout(timer)
    }
  }, [isOpen, searchQuery])

  if (!isOpen) return null

  const handleSelectDirect = async (empId: string) => {
    // Close only after creation succeeds so a failed request leaves the dialog available for retry.
    await onCreateDirect(empId)
    onClose()
  }

  const toggleMember = (emp: MentionEmployeeItem) => {
    if (selectedMembers.some((m) => m.id === emp.id)) {
      setSelectedMembers((prev) => prev.filter((m) => m.id !== emp.id))
    } else {
      setSelectedMembers((prev) => [...prev, emp])
    }
  }

  const handleCreateGroup = async () => {
    // The creator is added by the backend, so the picker requires two other members plus a title.
    if (!groupTitle.trim() || selectedMembers.length < 2) return
    await onCreateGroup({
      title: groupTitle.trim(),
      participantIds: selectedMembers.map((m) => m.id),
    })
    onClose()
  }

  // Parent mutations show user-facing errors; these wrappers also prevent unhandled rejections from click events.
  const handleSelectDirectFromClick = (empId: string) => {
    void handleSelectDirect(empId).catch((error: unknown) => {
      console.error("Failed to create direct conversation:", error)
    })
  }

  const handleCreateGroupFromClick = () => {
    void handleCreateGroup().catch((error: unknown) => {
      console.error("Failed to create group conversation:", error)
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md bg-card text-card-foreground border border-border rounded-xl shadow-xl flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-base">Tạo cuộc trò chuyện mới</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-border p-1 bg-muted/40">
          <button
            type="button"
            onClick={() => {
              setTab("direct")
            }}
            className={`flex-1 py-1.5 text-xs font-medium rounded-full cursor-pointer transition-colors flex items-center justify-center gap-1.5 ${
              tab === "direct"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Nhắn tin 1-1</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("group")
            }}
            className={`flex-1 py-1.5 text-xs font-medium rounded-full cursor-pointer transition-colors flex items-center justify-center gap-1.5 ${
              tab === "group"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Tạo nhóm chat</span>
          </button>
        </div>

        {/* Group title input if group tab */}
        {tab === "group" && (
          <div className="p-3 border-b border-border space-y-2">
            <input
              type="text"
              value={groupTitle}
              onChange={(e) => {
                setGroupTitle(e.target.value)
              }}
              placeholder="Đặt tên nhóm chat..."
              className="w-full px-3 py-1.5 rounded-full bg-muted/60 text-xs text-foreground placeholder:text-muted-foreground outline-none border border-border focus:border-primary transition-colors"
            />

            {/* Selected chips */}
            {selectedMembers.length > 0 && (
              <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto pt-1">
                {selectedMembers.map((m) => (
                  <span
                    key={m.id}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20"
                  >
                    <span>{m.fullName}</span>
                    <button
                      type="button"
                      onClick={() => {
                        toggleMember(m)
                      }}
                      className="p-0.5 hover:text-destructive cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Search member */}
        <div className="p-3 border-b border-border">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
              }}
              placeholder="Tìm theo tên hoặc tên đăng nhập..."
              className="w-full pl-9 pr-3 py-1.5 rounded-full bg-muted/60 text-xs text-foreground placeholder:text-muted-foreground outline-none border border-border focus:border-primary transition-colors"
            />
          </div>
        </div>

        {/* Member List */}
        <div className="flex-1 overflow-y-auto divide-y divide-border/40 p-1">
          {isLoading ? (
            <div className="p-4 text-center text-xs text-muted-foreground">Đang tìm...</div>
          ) : employees.length === 0 ? (
            <div className="p-4 text-center text-xs text-muted-foreground">
              Không tìm thấy nhân viên phù hợp
            </div>
          ) : (
            employees.map((emp) => {
              const isSelected = selectedMembers.some((m) => m.id === emp.id)

              return (
                <button
                  key={emp.id}
                  type="button"
                  onClick={() => {
                    if (tab === "direct") {
                      handleSelectDirectFromClick(emp.id)
                    } else {
                      toggleMember(emp)
                    }
                  }}
                  className="w-full px-3 py-2.5 rounded-lg flex items-center justify-between text-left hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                      {emp.fullName.charAt(0)}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-medium text-foreground truncate">
                        {emp.fullName}
                      </span>
                      <span className="text-[10px] text-muted-foreground truncate">
                        @{emp.username} {emp.position ? `• ${emp.position}` : ""}
                      </span>
                    </div>
                  </div>

                  {tab === "group" && (
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center border transition-colors ${
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border bg-background"
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                    </div>
                  )}
                </button>
              )
            })
          )}
        </div>

        {/* Footer for group creation */}
        {tab === "group" && (
          <div className="p-3 border-t border-border flex items-center justify-between bg-muted/20">
            <span className="text-xs text-muted-foreground">
              Đã chọn: {selectedMembers.length} thành viên
            </span>
            <button
              type="button"
              onClick={handleCreateGroupFromClick}
              disabled={!groupTitle.trim() || selectedMembers.length < 2}
              className="px-4 py-1.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
            >
              Tạo nhóm
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
