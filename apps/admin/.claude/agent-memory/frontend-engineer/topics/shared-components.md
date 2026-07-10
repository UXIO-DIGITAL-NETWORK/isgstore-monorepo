# Shared workhorses (`src/components/common/`, no barrel — import each file directly)

## StatCard
`src/components/common/StatCard.tsx` — takes one `StatCardData`; label + `TrendPill` (top-right) + big value (`formatCurrency`, `text-3xl font-semibold tabular-nums`) + caption. `bg-card border border-border rounded-xl p-4`. **Promoted from `features/dashboard/components/` on 2026-07-10** (financial was the second consumer) — `StatCardData` is now exported from this file, not from a feature's `types/`; `dashboard/types/dashboard.type.ts` re-exports it (`export type { StatCardData } from "@/components/common/StatCard"`) so existing dashboard imports of the type didn't need to change.

## TrendPill
`src/components/common/TrendPill.tsx` — `cva` variants `up` (`bg-success/10 text-success` + `ArrowUpRight`) / `down` (`bg-destructive/10 text-destructive` + `ArrowDownRight`); `rounded-full px-2 py-0.5 text-xs font-medium tabular-nums`. Sign (`+`/`-`) follows the `direction` prop, not the raw `deltaPct` sign (fixture values are always positive). `TrendDirection` type is exported from this file (promoted alongside StatCard).

## Promoting a feature-local component to `components/common`
Move any type it exports along with it (don't leave the type behind in the old feature — a `common/` file importing back into a feature inverts the dependency direction). Re-export the type from the old feature's type file if other code there still imports it by that path, so only the promoted files themselves need new imports.

## PerformanceChartCard
Self-contained (owns its own `month` state + `useChartSeries(month)` call, no props). recharts `AreaChart` via shadcn `chart` (`ChartContainer`/`ChartTooltip`/`ChartTooltipContent`, `ChartConfig` colors as `"var(--chart-1)"` / `"var(--chart-2)"`, `Area fill/stroke="var(--color-<key>)"`). X-axis label pre-formatted with `date-fns` `format(date, "MMM d")`. Manual legend below (colored dot `Box` + `Text`) rather than `ChartLegendContent` (simpler, matches spec exactly). **Wrap the root in `<Box as="section" aria-label="Monthly Performance">`** — needed so tests (and any future page with >1 `Select`/combobox) can scope queries via `getByRole("region", {name})` instead of guessing DOM structure or querying by className (className queries are banned by the testing rule).

## PendingOrdersCard / ActivityFeedCard
Self-contained (own their `usePendingOrders()`/`useActivityLog()` calls), `bg-card border border-border rounded-xl p-4`, header row = `Heading` + decorative "Show More" `Button variant="link"`. `PendingOrders` fixture keys are camelCase (`manualOrders`/`pendingPayment`/`processing`/`failedTransaction`) — map to human labels ("Manual Orders" etc.) in the component, fixture keys are never rendered raw.

## CopyableAmount
`src/features/financial/components/CopyableAmount.tsx` (feature-local — only financial needs it so far) — click-to-copy pattern: shadcn `Button variant="ghost"` rendering `formatCurrency(value)` (`tabular-nums`), `aria-label={\`Copy ${formatted}\`}` for a11y, `onClick` -> `navigator.clipboard.writeText(formatted)` + `toast.success(...)` (sonner) for confirmation. If a second feature needs this, promote it to `components/common` the same way StatCard/TrendPill were.

## DataTable (dashboard, client-mode)
`DataTable<TData>` — **client-mode** `@tanstack/react-table` (`getCoreRowModel` only, no pagination) + shadcn `table`. Props: `columns`, `data`, `isLoading`, `isError`, `onRetry`, `emptyMessage`. Loading -> skeleton rows sized to `columns.length`; error -> inline message + retry `Button`; empty -> single-row message. Right-aligns every column after the first via index check (`index > 0`), not a `meta` flag (avoids TanStack `ColumnMeta` generic augmentation for a single consumer). Triggers a React Compiler warning ("Compilation Skipped: incompatible library") on `useReactTable()` — expected/unavoidable with this API, not a lint error, don't try to fix it. **This is intentionally feature-local and client-mode** — `transactions/components/TransactionsTable.tsx` is the server-mode sibling (see `topics/transactions-feature.md`), a separate component, not a promotion of this one.

## `Table` primitive's `containerClassName` (added 2026-07-10)
`src/components/ui/table.tsx`'s `Table` takes an optional `containerClassName` prop, forwarded via `cn()` onto its `data-slot="table-container"` wrapper div (the one with `overflow-x-auto`) — added so a consumer can style a real horizontal-scroll indicator (rounded scrollbar track/thumb via `[&::-webkit-scrollbar]:...`/`[scrollbar-width:thin]` arbitrary-variant utilities, token-based, no hex) without touching every other `Table` consumer. Default behavior unchanged for existing consumers (`DataTable` etc.) — purely additive. See `topics/transactions-feature.md` for the concrete usage.

## `Table`'s `TableRow` and `Button` are now `forwardRef` (added 2026-07-10)
Both were plain function components (no ref forwarding) until the transactions table needed to attach dnd-kit's `setNodeRef`/`setActivatorNodeRef` for drag-and-drop rows/handles. Both changes are additive/backward-compatible — existing call sites that don't pass a `ref` are unaffected. If a future shared `ui/*` primitive needs the same (e.g. for a tooltip anchor, a measured element, another dnd/virtualization use), forwardRef is the established pattern here, not a special case.

## `Dialog`'s `DialogContent` now takes an optional `overlayClassName` (added 2026-07-10)
`src/components/ui/dialog.tsx` — forwarded to the internal `DialogOverlay`'s `className`, so one dialog instance can darken/restyle its own overlay (e.g. `EditTransactionDialog` uses `bg-black/70 duration-300`) without changing every other dialog's scrim. Same additive/scoped-override family as `Table`'s `containerClassName` and the `Button`/`TableRow` `forwardRef` changes above — the established pattern for "this one screen needs X" asks against a shared `ui/*` primitive: add an optional prop, don't touch the default.
