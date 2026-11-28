import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { ArrowUpDown, Filter } from "lucide-react"

/**
 * Props for PermissionMatrixToolbarActions component.
 */
export interface PermissionMatrixToolbarActionsProps {
  sortBy: string
  onSortChange: (sort: string) => void
  methodFilter: string
  onMethodChange: (method: string) => void
}

/**
 * Presenter component for sorting and HTTP method filtering in the Permission Matrix view.
 */
export function PermissionMatrixToolbarActions({
  sortBy,
  onSortChange,
  methodFilter,
  onMethodChange,
}: PermissionMatrixToolbarActionsProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <ArrowUpDown size={16} className="text-muted-foreground shrink-0" />
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-[190px] bg-background rounded-full text-xs font-semibold cursor-pointer">
            <SelectValue placeholder="Sắp xếp theo..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="DEFAULT">Đường dẫn (A-Z)</SelectItem>
            <SelectItem value="PATH_DESC">Đường dẫn (Z-A)</SelectItem>
            <SelectItem value="SEC_DESC">Bảo mật (Cao đến thấp)</SelectItem>
            <SelectItem value="SEC_ASC">Bảo mật (Thấp đến cao)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Filter size={16} className="text-muted-foreground shrink-0" />
        <Select value={methodFilter} onValueChange={onMethodChange}>
          <SelectTrigger className="w-[160px] bg-background rounded-full text-xs font-semibold cursor-pointer">
            <SelectValue placeholder="Phương thức..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả phương thức</SelectItem>
            <SelectItem value="GET">GET</SelectItem>
            <SelectItem value="POST">POST</SelectItem>
            <SelectItem value="PUT">PUT</SelectItem>
            <SelectItem value="PATCH">PATCH</SelectItem>
            <SelectItem value="DELETE">DELETE</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
