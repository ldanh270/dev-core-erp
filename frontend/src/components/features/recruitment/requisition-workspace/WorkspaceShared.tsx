interface WorkspaceHeaderProps {
  title: string
  description: string
  count: number
}

/**
 * Reusable header component for requisition workspace tabs displaying
 * the tab title, contextual description, and total item counter.
 */
export function WorkspaceHeader({ title, description, count }: WorkspaceHeaderProps) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div>
        <h2 className="font-semibold">{title}</h2>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <span className="text-xs text-muted-foreground">{count} mục</span>
    </div>
  )
}

interface EmptyRowProps {
  visible: boolean
  message: string
}

/**
 * Presentational placeholder row rendered inside workspace tables when datasets are empty.
 */
export function EmptyRow({ visible, message }: EmptyRowProps) {
  if (!visible) return null

  return (
    <tr>
      <td colSpan={4} className="p-10 text-center text-muted-foreground">
        {message}
      </td>
    </tr>
  )
}
