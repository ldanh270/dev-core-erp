/**
 * Formats header line for a CSV export, escaping double-quotes.
 *
 * @param columns - Column definitions containing header titles
 * @returns Formatted CSV header row terminated by newline
 */
export function buildCSVHeaders(columns: { header: string }[]): string {
  return columns.map((c) => `"${c.header.replace(/"/g, '""')}"`).join(",") + "\n"
}

/**
 * Formats a chunk of data records into CSV string rows.
 *
 * @template T - Record data type
 * @param data - Array of record items to format
 * @param columns - Array of column accessors mapping record to cell value
 * @returns Formatted CSV rows terminated by newlines
 */
export function buildCSVChunk<T>(
  data: T[],
  columns: { accessor: (item: T) => unknown }[],
): string {
  return (
    data
      .map((item) =>
        columns
          .map((col) => {
            const val = col.accessor(item)
            const str = val === null || val === undefined ? "" : String(val)
            return `"${str.replace(/"/g, '""')}"`
          })
          .join(","),
      )
      .join("\n") + "\n"
  )
}

/**
 * Combines CSV string chunks and triggers browser file download with UTF-8 BOM.
 * Prepends UTF-8 BOM (\uFEFF) to ensure Microsoft Excel displays Vietnamese characters properly.
 *
 * @param chunks - Array of CSV chunk strings (headers + body rows)
 * @param filename - Target filename for download (e.g. "employees.csv")
 */
export function downloadCSVFromChunks(chunks: string[], filename: string): void {
  const csvContent = chunks.join("")
  // Prepend UTF-8 BOM (\uFEFF) so Excel opens Vietnamese characters correctly
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.setAttribute("download", filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
