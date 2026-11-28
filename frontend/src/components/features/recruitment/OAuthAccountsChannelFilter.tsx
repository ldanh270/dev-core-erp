import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { POSTING_CHANNELS } from "@/config/entities/recruitment.config"
import { Filter, RotateCcw } from "lucide-react"

export interface OAuthAccountsChannelFilterProps {
  channelFilter: string
  hasActiveFilters: boolean
  onChannelFilterChange: (value: string) => void
  onResetFilters: () => void
}

/**
 * Pure UI presenter rendering channel select filter and reset filter button
 * for the OAuth linked accounts data table toolbar.
 */
export function OAuthAccountsChannelFilter({
  channelFilter,
  hasActiveFilters,
  onChannelFilterChange,
  onResetFilters,
}: OAuthAccountsChannelFilterProps) {
  return (
    <div className="flex items-center gap-2">
      <Filter className="h-3.5 w-3.5 text-muted-foreground hidden sm:block" />
      <Select value={channelFilter} onValueChange={onChannelFilterChange}>
        <SelectTrigger className="w-[160px] text-sm font-semibold bg-background rounded-full">
          <SelectValue placeholder="Lọc theo kênh" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả kênh</SelectItem>
          {POSTING_CHANNELS.map((ch) => (
            <SelectItem key={ch.value} value={ch.value}>
              {ch.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          onClick={onResetFilters}
          className="h-10 px-4 text-sm font-semibold gap-1.5 rounded-full text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="h-4 w-4" />
          Xóa lọc
        </Button>
      )}
    </div>
  )
}
