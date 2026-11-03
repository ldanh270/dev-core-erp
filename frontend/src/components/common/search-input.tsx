import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

import { useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from "react"

import { Search, X } from "lucide-react"

export interface SearchInputProps {
  value?: string
  defaultValue?: string
  placeholder?: string
  debounceMs?: number
  onSearch: (value: string) => void
  onClear?: () => void
  className?: string
  disabled?: boolean
  autoFocus?: boolean
  ariaLabel?: string
}

/**
 * Enterprise debounced search input component.
 * Provides instant 60fps local state response while debouncing server callbacks by 400ms (default).
 * Supports manual Enter key trigger and instant Clear button.
 * Aligned to 40px standard control height (h-10 rounded-full).
 */
export function SearchInput({
  value: controlledValue,
  defaultValue = "",
  placeholder = "Tìm kiếm...",
  debounceMs = 400,
  onSearch,
  onClear,
  className,
  disabled = false,
  autoFocus = false,
  ariaLabel = "Tìm kiếm",
}: SearchInputProps) {
  const isControlled = controlledValue !== undefined
  const [searchTerm, setSearchTerm] = useState(isControlled ? controlledValue : defaultValue)
  const isFirstRender = useRef(true)
  const prevSearchTermRef = useRef(searchTerm)
  const onSearchRef = useRef(onSearch)

  // Keep latest onSearch callback in ref to prevent re-triggering debounce on parent re-renders
  useEffect(() => {
    onSearchRef.current = onSearch
  }, [onSearch])

  // Keep local state in sync when controlled value changes externally
  useEffect(() => {
    if (isControlled && controlledValue !== searchTerm) {
      prevSearchTermRef.current = controlledValue
      setSearchTerm(controlledValue)
    }
  }, [controlledValue, isControlled])

  // Debounced callback execution on term change
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    if (prevSearchTermRef.current === searchTerm) {
      return
    }

    prevSearchTermRef.current = searchTerm

    const timer = setTimeout(() => {
      onSearchRef.current(searchTerm.trim())
    }, debounceMs)

    return () => {
      clearTimeout(timer)
    }
  }, [searchTerm, debounceMs])

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const handleClear = () => {
    setSearchTerm("")
    prevSearchTermRef.current = ""
    onSearchRef.current("")
    if (onClear) {
      onClear()
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      onSearchRef.current(searchTerm.trim())
    } else if (e.key === "Escape") {
      e.preventDefault()
      handleClear()
    }
  }

  const handleTriggerSearch = () => {
    prevSearchTermRef.current = searchTerm
    onSearchRef.current(searchTerm.trim())
  }

  return (
    <div className={cn("relative flex items-center min-w-[200px]", className)}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={handleTriggerSearch}
        disabled={disabled}
        aria-label="Kích hoạt tìm kiếm"
        className="absolute left-1 size-8 rounded-full text-muted-foreground hover:text-foreground"
      >
        <Search className="size-4" />
      </Button>

      <Input
        type="text"
        value={searchTerm}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        autoFocus={autoFocus}
        placeholder={placeholder}
        aria-label={ariaLabel}
        disabled={disabled}
        className="h-10 rounded-full bg-background border-border/80 pl-10 pr-9 text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary shadow-none"
      />

      {searchTerm && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleClear}
          disabled={disabled}
          aria-label="Xóa nội dung tìm kiếm"
          className="absolute right-1 size-8 rounded-full text-muted-foreground hover:text-foreground"
        >
          <X className="size-4" />
        </Button>
      )}
    </div>
  )
}
