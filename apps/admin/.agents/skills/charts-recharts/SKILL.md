---
name: charts-recharts
description: Dashboard/finance charts with recharts + the shadcn chart wrapper, bound to design tokens. Activate for the Monthly Performance / revenue charts.
---
# Charts (recharts + shadcn chart)
Authoritative: `context/design_system.md §8.7`.
- Use the shadcn `chart` wrapper (`ChartContainer`/`ChartTooltip`) so series colors bind to `--chart-*` tokens — never hardcode chart colors.
- Monthly Performance = an area chart with two series: **Revenue -> `chart-1` (blue)**, **Net Income -> `chart-2` (green)**, soft fills, faint token-toned grid, `text-muted-foreground` axis ticks, month/range `Select` in the card header, legend with colored dots.
- Tooltip: `bg-popover border-border shadow-md rounded-md`. Numbers formatted via `formatCurrency` where money.
- Keep it monochrome elsewhere — no extra hues; extra series use neutral `chart-3..5`.
- Testing scope (`rules/testing-strategy.md`): smoke-test only — renders without crashing, the legend/axis labels and selector are present. Don't write deep visual/pixel assertions against a chart; that's brittle and low-value with RTL.
The same `PerformanceChartCard` is reused on Dashboard and Financial.
