# Design System Brief: UDN Admin Dashboard

> **Source of truth for the _look_.** Agents MUST read this before building any UI.
> **Pixel source of truth:** Figma file `UDN-Admin-Dashboard` (key `l7izBcDr0PtS2FUdMdHFk3`). Pull exact values from the referenced node IDs via the Figma MCP before finalizing a screen. Reference node: Dashboard `22011-2008`; component sheet `22078-1614`.
>
> **⚠️ The Figma MCP cannot read this file (confirmed 2026-07-28).** It authenticates fine — `whoami` returns the account and its teams — but every call on this file key returns *"Looks like you don't have edit access to this file."* The account holds a **View** seat on the owning team, and the Figma MCP requires **edit** access. This supersedes the "token expired" diagnosis in the two prior feature logs: **re-authenticating does not fix it; only a seat change will.** Until then, screens are reconciled against supplied screenshots only — say "attempted and blocked" in the log, never "reconciled". Verify with `mcp__figma__whoami` plus one `get_metadata` call before promising a design cross-check.

---

## 1. Overview

UDN Admin Dashboard is a **monochrome, black-and-white** back-office UI built on **shadcn/ui (`new-york` style, `neutral` base color)** + Tailwind v4. It is deliberately **not** the consumer platform's "Neon Violet" identity — the admin trades brand personality for **density, clarity, and scanability**.

- **Base color:** shadcn `neutral` (true grayscale — no hue). Confirmed by sampling the design: `#0C0C0C` background, `#171717` surfaces, `#212121` borders, `#F9F9F9` text.
- **Themes:** **light + dark, dark is the default.** Both must reach full parity.
- **Type:** **Inter for everything** (UI, headings, body, and numbers). No IBM Plex / DM Sans / JetBrains Mono. Numeric alignment is handled with Inter's `tabular-nums`.
- **Color usage:** color appears **only functionally** — green for positive trends, red for negative/destructive, blue+green for the two chart series. Everything else is grayscale.
- **Framework fit:** `components.json` already declares `style: new-york`, `baseColor: neutral`, `cssVariables: true`, `iconLibrary: lucide`. Tokens live in `src/index.css` under Tailwind v4's `@theme` — **there is no `tailwind.config.*`** (matches the project's Tailwind-v4-only rule).

---

## 2. Design Principles

1. **Clarity over decoration.** No gradients, no glow, no ornamental color. Structure comes from spacing, borders, and type weight.
2. **Monochrome + functional color.** Grayscale by default; color carries meaning (trend up/down, chart series, destructive).
3. **Density & scanability.** Compact tables, tight vertical rhythm, right-aligned tabular numbers, quiet dividers.
4. **Primitive-first consistency.** Compose from shadcn primitives + the `common/` wrappers; never restyle ad-hoc.
5. **Token-only.** No raw hex in app code. Every color/space/radius comes from a CSS variable / Tailwind utility.
6. **Accessible.** WCAG AA contrast, visible focus rings (`ring`), keyboard-navigable menus/tables/dialogs.

---

## 3. Color Palette (exact tokens)

Grayscale is true-neutral (chroma `0`). Sampled reference values from the Figma export:

| Role | Dark (hex) | Light (hex) |
| --- | --- | --- |
| Background (app) | `#0C0C0C` | `#FFFFFF` |
| Surface (card / sidebar / popover / input) | `#171717` | `#FFFFFF` |
| Muted / secondary / accent surface | `#212121` | `#F5F5F5` |
| Border / separator | `#212121` (≈ white @ 10%) | `#EBEBEB` |
| Foreground (primary text) | `#F9F9F9` | `#0A0A0A` |
| Muted foreground (secondary text) | `#A1A1A1` | `#737373` |
| Extra-muted (section labels) | `#5C5C5C` | `#A3A3A3` |
| Success (positive trend) | `#22C55E` (bg tint `#173121`) | `#16A34A` |
| Destructive (negative / dangerous) | `#EF4444` (bg tint `#261818`) | `#DC2626` |
| Warning (pending/attention, amber) | `oklch(0.828 0.189 84.429)` | `oklch(0.769 0.188 70.08)` |
| Chart 1 — Revenue | `#3B82F6` (blue) | `#3B82F6` |
| Chart 2 — Net Income | `#22C55E` (green) | `#16A34A` |

> **Revision (2026-07-10):** added `--warning`/`--warning-foreground` (amber) as a 3rd functional-color exception alongside success/destructive, for the Transaction feature's "Pending" status pill (`text-warning`/`border-warning`/`bg-warning`). Same rule applies: functional use only, never decorative.

### 3.1 Ready-to-paste tokens (`src/index.css`)

This **replaces the current blue-tinted values** with true-neutral grayscale and adds a `--success` token. Keep the existing `@theme inline` mapping and base layer.

```css
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --destructive-foreground: oklch(0.985 0 0);
  --success: oklch(0.627 0.194 149.214);
  --success-foreground: oklch(0.985 0 0);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
  --chart-1: oklch(0.62 0.19 259.8);   /* revenue — blue */
  --chart-2: oklch(0.7 0.15 162);      /* net income — green */
  --chart-3: oklch(0.556 0 0);
  --chart-4: oklch(0.708 0 0);
  --chart-5: oklch(0.439 0 0);
  --sidebar: oklch(0.985 0 0);
  --sidebar-foreground: oklch(0.145 0 0);
  --sidebar-primary: oklch(0.205 0 0);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.97 0 0);
  --sidebar-accent-foreground: oklch(0.205 0 0);
  --sidebar-border: oklch(0.922 0 0);
  --sidebar-ring: oklch(0.708 0 0);
  --font-sans: Inter, system-ui, sans-serif;
  --radius: 0.375rem;
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.205 0 0);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.205 0 0);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.985 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --secondary: oklch(0.269 0 0);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --accent: oklch(0.269 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.704 0.191 22.216);
  --destructive-foreground: oklch(0.985 0 0);
  --success: oklch(0.696 0.17 162.48);
  --success-foreground: oklch(0.205 0 0);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.556 0 0);
  --chart-1: oklch(0.62 0.19 259.8);
  --chart-2: oklch(0.7 0.15 162);
  --chart-3: oklch(0.708 0 0);
  --chart-4: oklch(0.556 0 0);
  --chart-5: oklch(0.439 0 0);
  --sidebar: oklch(0.205 0 0);
  --sidebar-foreground: oklch(0.985 0 0);
  --sidebar-primary: oklch(0.985 0 0);
  --sidebar-primary-foreground: oklch(0.205 0 0);
  --sidebar-accent: oklch(0.269 0 0);
  --sidebar-accent-foreground: oklch(0.985 0 0);
  --sidebar-border: oklch(1 0 0 / 10%);
  --sidebar-ring: oklch(0.556 0 0);
}
```

Add `--color-success` and `--color-success-foreground` to the existing `@theme inline` block so `bg-success` / `text-success` become available utilities.

### 3.2 Semantic usage
- **Primary button:** `bg-primary text-primary-foreground` → white-on-black (light) / black-on-white (dark). Reserved for the single main action per view.
- **Surfaces:** app = `bg-background`; cards/sidebar/topbar/inputs = `bg-card` (dark) / `bg-background` + `border` (light).
- **Trend up:** `text-success`, pill bg `bg-success/10`. **Trend down / danger:** `text-destructive`, pill bg `bg-destructive/10`.
- **Never** introduce a new hue for emphasis — use weight, size, or a border instead.

---

## 4. Typography

**Single family: Inter** (load `400 / 500 / 600 / 700`). Set `--font-sans: Inter, system-ui, sans-serif`; drop the mono/serif roles from app usage.

| Token | Size / line-height | Weight | Use |
| --- | --- | --- | --- |
| Display | 30–36px / tight | 600 | Big page/stat numbers (e.g. `Rp 15.231,89`) |
| H1 | 24px / 1.2 | 600 | Page titles ("Welcome, …") |
| H2 | 20px / 1.3 | 600 | Card/section titles |
| H3 | 16px / 1.4 | 600 | Sub-sections, table group headers |
| Body | 14px / 1.5 | 400–500 | Default UI text, table cells |
| Small | 13px / 1.4 | 400 | Secondary/table meta |
| Caption | 12px / 1.3 | 400 | "Since last month", timestamps |
| Label (section) | 11–12px / 1.2, uppercase, `tracking-wide` | 500 | Sidebar group labels — use `text-muted-foreground`/extra-muted |

### 4.1 Numbers (critical)
- All numeric/tabular values (money, counts, IDs, percentages) use **`tabular-nums`** (and `slashed-zero` where helpful) so columns align. Utility: `class="tabular-nums slashed-zero"`.
- Money is rendered via the shared `formatCurrency` util (IDR, `Rp 15.231,89`). Never hand-format currency in components.
- Colored numbers only for trends (`text-success` / `text-destructive`); all other numbers are `text-foreground`.

---

## 5. Spacing System

4px base scale (Tailwind `--spacing: 0.25rem`). Common steps: `1(4) · 2(8) · 3(12) · 4(16) · 6(24) · 8(32)`.

**Layout constants:**
- Sidebar width: `~260px` (`w-64`). Collapsible to an icon rail.
- Top bar height: `~56–64px` (`h-14`/`h-16`), sticky.
- Content max width: fluid within the content column; inner page padding `p-6`.
- Card padding: `p-4` to `p-6`; gap between cards `gap-4`/`gap-6`.
- Table row height: **compact** — `h-11`/`h-12`, cell padding `px-4 py-2`.
- Section vertical rhythm: `space-y-6` between major dashboard regions.

---

## 6. Border Radius & Borders

- **Radius:** base `--radius: 0.375rem` (6px). Scale: `sm = radius-4px`, `md = radius-2px`, `lg = radius`, `xl = radius+4px`. Cards/popovers use `rounded-lg`/`rounded-xl`; inputs/badges `rounded-md`; pills `rounded-full`.
- **Borders carry the structure** (more than shadows). Default `border border-border` (1px). Dividers use `border-border`/`separator`. In dark mode borders are `white @ 10%`.

---

## 7. Elevation & Shadows

Minimal by design — a dark monochrome UI reads structure from borders, not drop shadows.

- Prefer **`border` + subtle surface contrast** over shadow for cards and panels.
- Reserve soft shadows for **floating** layers only: dropdowns, popovers, dialogs, command menu (`shadow-md`/`shadow-lg`).
- **No neon/glow shadows.** No colored shadows.

---

## 8. Core UI Components

Described as **class strings + structure outlines** (not full JSX), per project convention — this file is reference material, not source code. Build with shadcn primitives (add via the shadcn CLI / MCP) wrapped in `components/common`.

### 8.1 App Shell
`DashboardLayout` = fixed **Sidebar** (`w-64`, `bg-sidebar`, `border-r border-border`) + sticky **Top bar** (`h-16`, `bg-background/`card, `border-b`) + scrollable **content** (`p-6`, `space-y-6`). Built on shadcn `sidebar`.

### 8.2 Sidebar
- **Brand block** (top): logo + "Admin Dashboard / UXIOTOPUP" + collapse toggle.
- **Search** field (`⌘F`) → opens the command menu (`cmdk`).
- **Grouped nav:** group label (uppercase, extra-muted) → items. Item = `lucide` icon + label.
  - Default: `text-muted-foreground hover:bg-accent hover:text-foreground`.
  - Active: `bg-accent text-foreground` (subtle), with a left/rounded active indicator.
- **Footer card:** newsletter/subscribe card (`bg-accent`, `rounded-lg`, `p-4`) with a `bg-primary` button.

### 8.3 Top bar
Left: sidebar toggle + breadcrumb/title. Right: icon buttons (support, utility, **theme toggle**, notifications) as `ghost` icon buttons (`size-9 rounded-md`), then the **user menu** (avatar + name + email + chevron → `dropdown-menu`).

### 8.4 Stat / Metric Card
Structure: `Card` (`bg-card border-border rounded-xl p-4`) → label (`text-sm text-muted-foreground`) + **trend pill** (top-right) → big value (`text-3xl font-semibold tabular-nums`) → caption (`text-xs text-muted-foreground`, e.g. "Since last month").

### 8.5 Trend Pill (badge, `cva` variants)
`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums`
- `up`: `bg-success/10 text-success` + `ArrowUpRight` icon.
- `down`: `bg-destructive/10 text-destructive` + `ArrowDownRight` icon.

### 8.6 Data Table (workhorse)
shadcn `table` + TanStack Table (server mode). Structure:
- Header row: `text-xs font-medium text-muted-foreground`, sortable headers show a chevron.
- Body rows: `h-11`, `hover:bg-accent/50`, `border-b border-border`; **numeric columns right-aligned + `tabular-nums`**.
- Entity cell: `Avatar` (game/user image) + name (`font-medium`) over sub-label (`text-xs text-muted-foreground`).
- Status: a `Badge` variant per status.
- **States:** `Skeleton` rows while loading; `empty` component when no data; inline error with retry.
- **Footer:** pagination (`pagination` primitive) + per-page select, driven by server params.

### 8.7 Chart Card (recharts)
- `Card` header: title + optional selector (month/range) via `select`.
- Area chart: two series — **Revenue (`chart-1` blue)**, **Net Income (`chart-2` green)** — with soft area fills; grid lines `border`-toned and faint; axis ticks `text-muted-foreground`.
- Tooltip: `bg-popover border-border shadow-md rounded-md`; legend below with colored dots.
- Use the shadcn `chart` wrapper (`ChartContainer`/`ChartTooltip`) so series colors bind to `--chart-*` tokens.

### 8.8 List / Feed Widgets
- **Pending Orders:** `Card` with a header (title + "Show More") and rows of `label` ↔ `count` (count `tabular-nums font-medium`).
- **Recent Log Activity:** rows of `Avatar` + (`action` over "By {actor} as {role}") + relative timestamp (`text-xs text-muted-foreground`, right-aligned).

### 8.9 Tabs, Buttons, Inputs, Overlays, Feedback
- **Tabs** (shadcn `tabs`) for the performance table ("Category / Product / User Performance").
- **Buttons:** `primary` (one per view), `secondary`, `ghost` (icon actions), `destructive` (refund/override). Sizes `sm`/`default`.
- **Inputs/Select/Combobox/Date range** via shadcn; forms use RHF + Zod + `Field`.
- **Overlays:** `dialog` (confirmations for destructive actions), `sheet`/`drawer` (transaction detail or filters), `dropdown-menu` (row actions), `command` (global search).
- **Feedback:** `sonner` toasts for action success/failure; `skeleton` for loading; `tooltip` for icon buttons.

---

## 9. Tailwind v4 Configuration

- **No `tailwind.config.*`.** All theming is in `src/index.css` via `@import "tailwindcss";` + `@custom-variant dark (&:is(.dark *));` + the `:root`/`.dark` token blocks + `@theme inline { … }` mapping (`--color-*`, `--radius-*`, `--font-sans`, …).
- Add the new `--color-success` / `--color-success-foreground` to `@theme inline` so `bg-success`/`text-success` exist.
- Base layer applies `border-border`, `outline-ring/50`, `bg-background text-foreground`.
- shadcn primitives are added through the CLI/MCP into `src/components/ui/` (aliases in `components.json`).

---

## 10. Implementation Notes

1. **Tokens only — no raw hex** in app code (`bg-card`, `text-muted-foreground`, `border-border`, `text-success`, `text-destructive`, `bg-chart-1`, …).
2. **Dark is default; ship light in parity.** Test every screen in both (`next-themes`, `attribute="class"`).
3. **Inter everywhere + `tabular-nums`** for all numeric/tabular content; money via `formatCurrency`.
4. **Density first:** compact rows, `p-6` pages, `gap-4/6`, quiet 1px borders instead of shadows.
5. **Add primitives via shadcn CLI/MCP**, don't hand-write; wrap raw HTML with `components/common`.
6. **Figma is binding for pixels** — before finishing a screen, pull the exact frame/tokens from `l7izBcDr0PtS2FUdMdHFk3` (Dashboard `22011-2008`, components `22078-1614`) via the Figma MCP and reconcile.
7. **Icons:** `lucide-react` only, monochrome, `size-4`/`size-5`.

---

## 11. Screen Breakdown — Dashboard (`/dashboard`)

Region → component → data → Figma node (fill exact node IDs from the file when building).

| # | Region | Component(s) | Data (mock this phase) | Figma node |
| --- | --- | --- | --- | --- |
| 11.1 | Welcome banner | `Heading` + `Text` | operator name + current date | `22011-2008` |
| 11.2 | Balance cards ×3 (Credit / Debit / Today's Sales) | `StatCard` + `TrendPill` | `DashboardSummary` (value, delta, direction) | `22011-2008` |
| 11.3 | Monthly Performance | `PerformanceChartCard` (recharts area) + month `Select` | time-series `{ day, revenue, netIncome }[]` | `22011-2008` |
| 11.4 | Pending Orders | `PendingOrdersCard` (label↔count list) | `{ manualOrders, pendingPayment, processing, failed }` | `22011-2008` |
| 11.5 | Recent Log Activity | `ActivityFeedCard` | `ActivityLog[]` (actor, action, role, timestamp) | `22011-2008` |
| 11.6 | Performance table (tabbed) | `Tabs` + `DataTable` | per-tab rows: entity (avatar+name+sub), totalTransaction, revenue | `22011-2008` |

> The same `StatCard`, `TrendPill`, `PerformanceChartCard`, and `DataTable` are reused across Financial and Transaction screens — build them generically in `features/dashboard/components` or promote shared ones to `components/common`/a shared location if used cross-feature (respecting feature isolation).

**No per-feature node IDs were ever recorded.** §11 covers Dashboard only; Financial, Transaction, Integration, Categories and Product all reused `22011-2008` as a nominal "reference node" without a real frame of their own. Since the MCP is now blocked by seat level (see the warning at the top of this document), a screen's Figma reconciliation cannot be performed at all — record it as *attempted and blocked*, and treat supplied screenshots as the working reference.

**Shared table, promoted 2026-07-28.** `src/components/common/DataTable.tsx` is the server-mode workhorse (TanStack manual mode; checkbox select, `No.` column, skeleton/empty/error, page-size select, windowed pagination). It came out of `features/categories` when `products` became its second consumer. `entityLabel` is a **required** prop precisely because every reference frame ships the footer as "of 9999999 transactions" whatever the table lists — the type system now forces each caller to name its own noun. Note the name collision with `features/dashboard/components/DataTable.tsx`, a different client-mode component; merging the two is an open follow-up.
