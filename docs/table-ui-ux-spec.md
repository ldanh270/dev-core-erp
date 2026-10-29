# Data Table UI/UX Standard

> **Enterprise Data Table UI/UX Specification for DevCore ERP**  
> Modeled after the Job Requisition workspace standard (`/recruitment/requisitions`).

---

## 1. Layout Hierarchy

Every data table page across the application adheres to the following nested structure:

```
Container (p-4 sm:p-6, gap-6)
├── PageHeader (Title, description, primary CTA formatted with rounded-full)
└── PageCard (rounded-xl, padding="none", overflow-hidden)
    ├── Status Tab Navigation (Horizontal scrolling status filter bar)
    ├── DataTableToolbar (Search input + filter dropdowns)
    ├── Table (Responsive data table structure)
    └── AppPagination (Standard footer pagination controls)
```

---

## 2. Component Specifications & Code Snippets

### 2.1. PageCard Container

Wrap tabs, toolbar, table, and pagination inside `<PageCard padding="sm" className="p-0 overflow-hidden">`.

- **Padding:** `p-0` removes outer container padding so status tabs and toolbars span edge-to-edge.
- **Corner Radius:** `rounded-xl` container standard.

---

### 2.2. Status Tab Navigation

Placed at the top of the card with horizontal scrolling support (`overflow-x-auto hide-scrollbar`).

```tsx
<nav
  aria-label="Filter by status"
  className="flex items-center gap-6 overflow-x-auto border-b border-border px-6 hide-scrollbar bg-background"
>
  {TAB_DEFINITIONS.map((tab) => {
    const isActive = activeTab === tab.id
    const count = tabCounts[tab.id] || 0
    return (
      <button
        key={tab.id}
        onClick={() => {
          setActiveTab(tab.id)
          setPage(1)
        }}
        className={`relative flex items-center gap-2 py-4 font-medium text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${
          isActive ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        {tab.label}
        <span
          className={`inline-flex items-center justify-center min-w-[20px] h-[20px] rounded-full text-[11px] font-bold px-1.5 border ${
            isActive
              ? "bg-primary border-primary text-primary-foreground"
              : "bg-background border-border text-muted-foreground"
          }`}
        >
          {count}
        </span>
        {isActive && (
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-t-full" />
        )}
      </button>
    )
  })}
</nav>
```

---

### 2.3. Search & Filter Bar (DataTableToolbar)

Use the shared `<DataTableToolbar />` component. Do not nest extra wrapper divs to prevent unintended drop-shadow duplication.

```tsx
<DataTableToolbar
  searchQuery={keyword}
  onSearchChange={(value) => {
    setKeyword(value)
    setPage(1)
  }}
  searchPlaceholder="Search by ID, name, department..."
  actions={
    <div className="flex items-center gap-2">
      {/* Filter Dropdown */}
      <div className="flex items-center gap-2">
        <Filter className="h-3.5 w-3.5 text-muted-foreground hidden sm:block" />
        <Select
          value={filterValue}
          onValueChange={(val) => {
            setFilterValue(val)
            setPage(1)
          }}
        >
          <SelectTrigger size="sm" className="w-[170px] h-9 text-xs bg-background rounded-full">
            <SelectValue placeholder="Filter attribute" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="OPTION_1">Option 1</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reset Filter Button */}
      {hasActiveFilters && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-9 px-3 text-xs gap-1.5 rounded-full text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </Button>
          </TooltipTrigger>
          <TooltipContent>Reset all active filters</TooltipContent>
        </Tooltip>
      )}
    </div>
  }
/>
```

---

### 2.4. Table & Row Styling

Enclose within `<div className="overflow-x-auto">` (do not add `border-b` on this wrapper to prevent double borders above footer).

#### Column Specifications & Responsive Behavior
- **Identifier / Code Column:** `w-28 font-mono text-xs text-primary font-medium` (interactive link).
- **Primary Title / Name:** `min-w-56` (supports primary title with subtitle in `text-muted-foreground`).
- **Auxiliary Columns (Department, Budget, Deadline):** Explicit widths (`w-36`, `w-44`) with responsive hiding (`hidden md:table-cell`, `hidden lg:table-cell`).
- **Status Column:** `w-36` using `<StatusPill />`.
- **Actions Column:** `w-36 text-right` housing icon buttons with `rounded-full`.

```tsx
<div className="overflow-x-auto">
  <Table>
    <TableHeader className="bg-muted/40">
      <TableRow>
        <TableHead className="w-28 px-4 py-3 text-xs font-medium uppercase text-muted-foreground">Code</TableHead>
        <TableHead className="min-w-56 px-4 py-3 text-xs font-medium uppercase text-muted-foreground">Title / Role</TableHead>
        <TableHead className="hidden lg:table-cell w-44 px-4 py-3 text-xs font-medium uppercase text-muted-foreground">Department</TableHead>
        <TableHead className="hidden md:table-cell w-44 px-4 py-3 text-xs font-medium uppercase text-muted-foreground">Assignee</TableHead>
        <TableHead className="w-36 px-4 py-3 text-xs font-medium uppercase text-muted-foreground">Status</TableHead>
        <TableHead className="w-36 px-4 py-3 text-right text-xs font-medium uppercase text-muted-foreground">Actions</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {isLoading ? (
        Array.from({ length: 5 }).map((_, index) => (
          <TableRow key={index}>
            <TableCell colSpan={6} className="p-3">
              <Skeleton className="h-12 w-full rounded-lg" />
            </TableCell>
          </TableRow>
        ))
      ) : items.length === 0 ? (
        <TableRow>
          <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
            {hasActiveFilters ? "No matching records found for active filters" : "No records available"}
          </TableCell>
        </TableRow>
      ) : (
        items.map((item) => (
          <TableRow
            key={item.id}
            onClick={() => handleViewDetails(item.id)}
            className="cursor-pointer transition-colors duration-100 hover:bg-muted/25"
          >
            {/* Code */}
            <TableCell className="px-4 py-3 font-mono text-xs font-medium text-primary">
              {item.code}
            </TableCell>

            {/* Title & Subtitle */}
            <TableCell className="px-4 py-3">
              <div className="font-medium text-foreground">{item.name}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{item.subText}</div>
            </TableCell>

            {/* Responsive Columns */}
            <TableCell className="hidden lg:table-cell px-4 py-3 text-sm">
              {item.department}
            </TableCell>
            <TableCell className="hidden md:table-cell px-4 py-3 text-sm">
              {item.assignee}
            </TableCell>

            {/* Status */}
            <TableCell className="px-4 py-3">
              <StatusPill label={item.statusLabel} variant={item.statusVariant} />
            </TableCell>

            {/* Actions */}
            <TableCell className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-end gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>View details</TooltipContent>
                </Tooltip>
              </div>
            </TableCell>
          </TableRow>
        ))
      )}
    </TableBody>
  </Table>
</div>
```

---

### 2.5. Footer Pagination (AppPagination)

Render `<AppPagination>` directly inside `<PageCard>` without additional wrapping div elements.

```tsx
<AppPagination
  currentPage={page}
  totalPages={totalPages}
  onPageChange={setPage}
  totalItems={totalItems}
  itemsPerPage={pageSize}
  onItemsPerPageChange={(value) => {
    setPageSize(value)
    setPage(1)
  }}
/>
```

#### Pagination Design Rules:
- **Divider:** Single `border-t border-border` dividing table and footer.
- **Surface:** Seamless blend with card background (`bg-background`).
- **Page Size Selector (SelectTrigger):** Uses `size="sm"` (`w-16 h-7.5 rounded-full text-xs font-medium px-2.5 shadow-none`).
- **Dimensions:** Padding `px-6 py-2.5`, text size `text-xs`.

---

## 3. UI/UX Definition of Done Checklist

| No. | Rule | Verification Requirement |
| --- | --- | --- |
| 1 | **The Pill Rule** | All Buttons, Search Inputs, SelectTriggers, Badges, and Tooltip Icons must use `rounded-full`. |
| 2 | **No Double Borders** | No duplicate parallel borders between Table and Pagination footer. |
| 3 | **No Double Backgrounds** | Never wrap `DataTableToolbar` or `AppPagination` in dense `bg-muted/20` containers. |
| 4 | **Select Size** | Pagination items-per-page select must use `size="sm" w-16 h-7.5 text-xs`. |
| 5 | **Responsive Widths** | Primary columns enforce `min-w-*`; secondary columns apply `hidden md:table-cell` or `hidden lg:table-cell`. |
| 6 | **State Handling** | Proper loading skeletons when `isLoading` is true; dedicated EmptyState when filter results are empty. |
