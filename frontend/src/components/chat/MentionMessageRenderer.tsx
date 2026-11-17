import { ROUTES } from "@/config/routes.config"
import { routerNavigate } from "@/lib/router-navigator"
import type { ChatMessageMention } from "@/types/chat.types"

import React from "react"

import { Briefcase, CheckSquare, User } from "lucide-react"

interface MentionMessageRendererProps {
  /** Message text containing the bracketed mention-token syntax emitted by MentionInput. */
  content: string
  /** Optional structured metadata; token rendering is currently driven by `content`. */
  mentions?: ChatMessageMention[] | null
  /** Applies outgoing-message contrast styles to rendered mention pills. */
  isOutgoing?: boolean
}

/**
 * Renders message content with interactive pills for employee (@), project (#), and task (!) tokens.
 * Plain text surrounding tokens is preserved; project and task pills navigate to their details.
 * Pills use semantic theme classes and rounded-full styling rather than hard-coded colors.
 */
export const MentionMessageRenderer: React.FC<MentionMessageRendererProps> = ({
  content,
  isOutgoing = false,
}) => {
  if (!content) return null

  // Match the token syntax emitted by MentionInput: @[Name](emp:id), #[Name](proj:id),
  // or ![Name](task:id). Matching against message content preserves ordinary text between tokens.
  const mentionRegex = /([@#!])\[(.+?)\]\((emp|proj|task):([^)]+)\)/g

  const elements: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = mentionRegex.exec(content)) !== null) {
    // Push regular text before this mention
    if (match.index > lastIndex) {
      elements.push(content.substring(lastIndex, match.index))
    }

    const prefix = match[1]
    const label = match[2]
    const type = match[3]
    const entityId = match[4]
    const key = `mention-${match.index}-${entityId}`

    if (prefix === "@" || type === "emp") {
      // Employee Mention
      elements.push(
        <span
          key={key}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium align-middle select-all mx-0.5 ${
            isOutgoing
              ? "bg-primary-foreground/15 text-primary-foreground border border-primary-foreground/30"
              : "bg-primary/10 text-primary border border-primary/20"
          }`}
          title={`Nhân viên: ${label}`}
        >
          <User className="w-3 h-3 text-current shrink-0" />
          <span>@{label}</span>
        </span>,
      )
    } else if (prefix === "#" || type === "proj") {
      // Project Mention (Clickable to open Project details)
      elements.push(
        <button
          key={key}
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            routerNavigate(`${ROUTES.PROJECT.BASE}/${entityId}`)
          }}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium align-middle cursor-pointer transition-colors mx-0.5 ${
            isOutgoing
              ? "bg-primary-foreground/15 text-primary-foreground hover:bg-primary-foreground/25 border border-primary-foreground/30"
              : "bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 border border-blue-500/20"
          }`}
          title={`Mở dự án: ${label}`}
        >
          <Briefcase
            className={`w-3 h-3 shrink-0 ${isOutgoing ? "text-current" : "text-blue-500"}`}
          />
          <span>#{label}</span>
        </button>,
      )
    } else if (prefix === "!" || type === "task") {
      // Task Mention (Clickable to open Task details)
      elements.push(
        <button
          key={key}
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            routerNavigate(`${ROUTES.PROJECT.TASK_DETAIL}/${entityId}`)
          }}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium align-middle cursor-pointer transition-colors mx-0.5 ${
            isOutgoing
              ? "bg-primary-foreground/15 text-primary-foreground hover:bg-primary-foreground/25 border border-primary-foreground/30"
              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20"
          }`}
          title={`Mở công việc: ${label}`}
        >
          <CheckSquare
            className={`w-3 h-3 shrink-0 ${isOutgoing ? "text-current" : "text-emerald-500"}`}
          />
          <span>!{label}</span>
        </button>,
      )
    }

    lastIndex = match.index + match[0].length
  }

  // Push remaining text
  if (lastIndex < content.length) {
    elements.push(content.substring(lastIndex))
  }

  return <span className="whitespace-pre-wrap break-words">{elements}</span>
}
