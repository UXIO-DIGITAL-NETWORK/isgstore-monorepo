---
name: build-data-table
description: Server-side data table (TanStack Table manual mode + shadcn table) with pagination/filter/sort and loading/empty/error states. Activate for any list screen (transactions, ledger).
---
# Build a Data Table (server-side)
Authoritative: `context/system_architecture.md §4.8`, `design_system.md §8.6`.
- Built on `@tanstack/react-table` **manual/server mode** + shadcn `table`. Do NOT client-paginate large lists.
- Table state (page, per_page, sorting, column filters, search) -> query params -> service -> `PaginatedResponse<T>`; drive pagination UI from `meta`.
- Columns: header row `text-xs text-muted-foreground` with sortable chevrons; body rows compact (`h-11`, `hover:bg-accent/50`, `border-b border-border`); **numeric columns right-aligned + `tabular-nums`**; entity cell = `Avatar` + name over `text-xs` sub-label; status via `Badge` variants; row actions via `dropdown-menu` (gate with `<Can>`).
- **Always** provide `Skeleton` rows (loading), an empty component, and an inline error with retry.
- Filters (status, date range, game/product, channel, search) live in a feature `components/` filter bar; export CSV/Excel from the current filtered result.
Reuse one generic `DataTable` across `transactions` and the financial ledger.
