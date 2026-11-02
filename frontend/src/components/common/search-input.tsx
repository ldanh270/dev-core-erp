import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

import { useEffect, useRef, useState } from "react"
import type { KeyboardEvent } from "react"
import { Search, X } from "lucide-react"

export interface SearchInputProps {
  /** Initial or controlled search value from parent. */
  value?: string
  /** Callback fired after debounce timer expires, on Enter press, or on clear. */
  onSearch: (keyword: string) => void
  /** Debounce delay in milliseconds. Defaults to 400ms. */
  debounceMs?: number
  /** Input placeholder string. Defaults to "Tìm kiếm...". */
  placeholder?: string
  /** Additional custom class names for the outer container. */
  className?: string
  /** Accessible label for the input element. */
  ariaLabel?: string
  /** Disabled state for loading queries. */
  disabled?: boolean
}

/**
 * Standardized search input with 400ms debouncing, instant visual 60fps typing,
 * Enter-key fast-path, and instantaneous clear.
 * Prevents server API flooding and eliminates repetitive debounce boilerplate.
 */
export function SearchInput({
  value: controlledValue = "",
  onSearch,
  debounceMs = 400,
  placeholder = "Tìm kiếm...",
  className,
  ariaLabel = "Tìm kiếm",
  disabled = false,
}: SearchInputProps) {
  const [searchTerm, setSearchTerm] = useState(controlledValue)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isFirstRender = useRef(true)

  // Sync with controlled value changes from outside (e.g. tab switches or resets)
  useEffect(() => {
    setSearchTerm(controlledValue)
  }, [controlledValue])

  // Handle auto-debounce after user stops typing
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    timerRef.current = setTimeout(() => {
      onSearch(searchTerm.trim())
    }, debounceMs)

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [searchTerm, debounceMs, onSearch])

  // Fast-path: Fire immediately on Enter key
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault()
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
      onSearch(searchTerm.trim())
    }
  }

  // Instant reset on clear button click
  const handleClear = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
    setSearchTerm("")
    onSearch("")
  }

  // Fast-path: Fire immediately on search icon button click
  const handleTriggerSearch = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
    onSearch(searchTerm.trim())
  }

  return (
    <div className={cn("relative flex items-center min-w-[220px]", className)}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        tabIndex={-1}
        onClick={handleTriggerSearch}
        disabled={disabled}
        aria-label="Kích hoạt tìm kiếm"
        className="absolute left-1 size-7 rounded-full text-muted-foreground hover:text-foreground"
      >
        <Search className="size-3.5" />
      </Button>

      <Input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        aria-label={ariaLabel}
        disabled={disabled}
        className="h-9 rounded-full bg-background border-border/80 pl-9 pr-8 text-xs text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary shadow-none"
      />

      {searchTerm && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleClear}
          disabled={disabled}
          aria-label="Xóa nội dung tìm kiếm"
          className="absolute right-1 size-6 rounded-full text-muted-foreground hover:text-foreground"
        >
          <X className="size-3.5" />
        </Button>
      )}
    </div>
  )
}
