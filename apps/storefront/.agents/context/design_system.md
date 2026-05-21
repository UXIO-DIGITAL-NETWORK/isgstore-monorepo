# Design System Brief: UDN Top Up Website

**Target Audience:** UI/UX Designer, Frontend Developer
**Design Theme:** E-sports Premium, Neon Violet Dark Mode, Glassmorphism, Desktop-First Responsive
**Styling Framework:** Tailwind CSS **v4** + **HeroUI**
**Visual Reference:** Figma — Design Topup Game (Internal File)

## 1. Overview

This document defines the visual standards and User Interface (UI) components for the UDN Top Up Website. The design adopts a **premium e-sports aesthetic** with a signature **violet–azure neon gradient** over a near-black background. The primary goal is to create a modern, immersive, and trustworthy _gaming-grade_ impression for top-up transactions. The visual hierarchy is built through a combination of **gradient text for numbers/prices**, **glassmorphism cards**, and **glow shadows** as accents.

**HeroUI Integration Strategy:** HeroUI is used as the base component library for accessible primitives (Modals, Dropdowns, Popovers, Inputs, Buttons, Tabs, etc.). Visual styling is then overridden via:

- Tailwind v4 arbitrary values (e.g. `bg-[#0A0A0C]`, `border-[#C084FC]`).
- HeroUI's `classNames` prop (every HeroUI component accepts slot-based class overrides).
- Custom CSS variables exposed via `@theme` directive in `globals.css`.

This means **DO NOT** use HeroUI's default themed colors when they conflict with our token system — always override with arbitrary Tailwind values or our custom theme tokens.

## 2. Design Principles

- **Neon-on-Dark Hierarchy:** A near-black background (`#0A0A0C`) serves as the foundation, with violet/azure used as accents to draw attention to actionable elements (CTAs, prices, countdown timers). Avoid using solid violet for large backgrounds — use it in the form of gradients, glows, or thin borders.
- **Glassmorphism Surfaces:** Product cards and secondary buttons utilize semi-transparent backgrounds (`rgba(59,130,246,0.05)` or `rgba(255,255,255,0.05)`) with a thin 1px border for a "glass" effect. The countdown timer even uses `backdrop-blur-[6px]` for a stronger glassmorphism feel.
- **Gradient Text for Numbers:** All main prices and key figures use gradient text (white → light lavender) as a visual signature. This makes the numbers feel "premium" and catches the eye.
- **Multi-Family Typography:** Unlike typical platforms, this design strictly uses **4 font families** with highly specific roles — Outfit for branding/headings, IBM Plex Sans Condensed exclusively for numbers (giving a tabular/digital feel), DM Sans for product names, and Inter for body text.
- **Active vs Inactive State Contrast:** Active cards (highlighted/featured) use a `3px #C084FC` (bright violet) border + a violet–azure gradient button. Inactive cards use a thin `1px rgba(59,130,246,0.2)` border + a 5% white glass button. This contrast clearly guides the user's focus.

## 3. Color Palette

The color system utilizes a **"Near-Black + Neon Violet"** approach with azure as the gradient pair. Tokens are extracted directly from Figma variables.

### 3.1 Brand & Primary Colors

| Category             | Color Name     | Tailwind Class   | Hex Code  | Primary Usage                                        |
| -------------------- | -------------- | ---------------- | --------- | ---------------------------------------------------- |
| **Primary/Accent**   | Neon Violet    | `bg-violet-600`  | `#9234EA` | Main brand, gradient pair, stock bar, CTA accent     |
| **Secondary Accent** | Azure Blue     | `bg-blue-500`    | `#3B82F6` | Main gradient pair (azure → violet), icon accent     |
| **Background**       | Near Black     | `bg-neutral-950` | `#0A0A0C` | Main page background (not pure black, slightly warm) |
| **Surface Deep**     | Violet-Black   | `bg-[#0B051D]`   | `#0B051D` | Track background on progress/stock bars              |
| **Text Primary**     | Pure White     | `text-white`     | `#FFFFFF` | Section headings, product names, timer numbers       |
| **Text Body**        | Cool Gray      | `text-gray-500`  | `#6A7282` | Default body text                                    |
| **Text Body Light**  | Light Slate    | `text-slate-300` | `#C9D5E3` | Body text on dark surfaces (secondary buttons)       |
| **Text Muted**       | Subtitle Muted | `text-[#909AAE]` | `#909AAE` | Section subtitles ("Order now! Limited supply")      |

### 3.2 Violet Scale (Neon Purple Family)

| Token                 | Hex / RGBA                | Usage                                                |
| --------------------- | ------------------------- | ---------------------------------------------------- |
| `violet/7`            | `#0B051D`                 | Track background (progress/stock bar)                |
| `violet/32 50%`       | `rgba(88, 28, 135, 0.5)`  | Timer card background (countdown)                    |
| `violet/56`           | `#9333EA`                 | Stock bar fill, timer border                         |
| `violet/65 30%`       | `rgba(168, 85, 247, 0.3)` | Timer card border                                    |
| `violet/75`           | `#C084FC`                 | Active Flash Sale card border, timer separator (`:`) |
| `violet/85`           | `#D8B4FE`                 | "AVAILABLE" label on product cards                   |
| `lavender/light`      | `#E9D5FF`                 | Price gradient end-color, primary button text        |
| `violet/footer-start` | `#671EAB`                 | Footer background gradient (start)                   |
| `violet/footer-end`   | `#270A4F`                 | Footer background gradient (end)                     |

### 3.3 Azure / Blue Scale

| Token          | Hex / RGBA                 | Usage                                   |
| -------------- | -------------------------- | --------------------------------------- |
| `azure/60`     | `#3B82F6`                  | Blue accent, CTA gradient start         |
| `azure/60 5%`  | `rgba(59, 130, 246, 0.05)` | Product card background (glass surface) |
| `azure/60 20%` | `rgba(59, 130, 246, 0.2)`  | Default product card border             |

### 3.4 Functional Colors

| Purpose            | Hex       | Usage                                        |
| ------------------ | --------- | -------------------------------------------- |
| Success / Discount | `#0EA42E` | Discount badge background ("- Rp 2.500")     |
| Original Price     | `#6B7280` | Strikethrough text (line-through)            |
| Subtitle Card      | `#A1A1AA` | Product category subtitle ("Roblox", "PUBG") |

### 3.5 Glassmorphism Whites

| Token         | Value                       | Usage                                      |
| ------------- | --------------------------- | ------------------------------------------ |
| `white/solid` | `#FFFFFF`                   | Pure white                                 |
| `white/80%`   | `rgba(255, 255, 255, 0.8)`  | Body text in hero CTA                      |
| `white/10%`   | `rgba(255, 255, 255, 0.1)`  | Glass border (medium)                      |
| `white/5%`    | `rgba(255, 255, 255, 0.05)` | Secondary button background, subtle border |

## 4. Typography

The typography system uses **4 font families** with highly specific roles. Ensure all fonts are loaded via Google Fonts or self-hosted.

### 4.1 Font Families

| Family                      | Token  | Role                                                     |
| --------------------------- | ------ | -------------------------------------------------------- |
| **Outfit**                  | Font 1 | Headings, button text, accent labels — **most dominant** |
| **Inter**                   | Font 2 | Body text, descriptions, strikethrough price             |
| **IBM Plex Sans Condensed** | Font 3 | Main price, countdown timer, stock numbers               |
| **DM Sans**                 | Font 4 | Product names on cards                                   |

### 4.2 Font Weight Scale

`400` (Regular) · `500` (Medium) · `700` (Bold)

### 4.3 Type Scale & Hierarchy

| Style                | Font                    | Size   | Line Height | Tracking | Color             | Use Case                                         |
| -------------------- | ----------------------- | ------ | ----------- | -------- | ----------------- | ------------------------------------------------ |
| **Hero Heading**     | Outfit Bold             | 45px   | 58px        | -1.8px   | White             | "Create Account & Enjoy..." in CTA section       |
| **Section Heading**  | Outfit Bold (uppercase) | 32px   | 28px        | -0.5px   | White             | "FLASH SALE", "POPULAR", section titles          |
| **Heading 2**        | Outfit Bold             | 28px   | 32px        | -0.5px   | White             | Sub-section title                                |
| **Heading 3**        | Outfit Bold             | 20px   | 25px        | -0.45px  | White             | Card section title                               |
| **Body Large**       | Inter Regular           | 18px   | 28px        | 0        | White 80%         | Hero body text                                   |
| **Body Default**     | Inter Regular           | 16px   | 20px        | 0        | `#909AAE`         | Section subtitle, description                    |
| **Body Small**       | Inter Regular           | 14px   | 20px        | 0        | `#C9D5E3`         | Form labels, small body text                     |
| **Card Product**     | DM Sans Bold            | 14px   | 20px        | 0        | White             | Product name on card ("500 Robux")               |
| **Card Subtitle**    | Inter Regular           | 10px   | 15px        | 0        | `#A1A1AA`         | Product category ("Roblox", "PUBG")              |
| **Price Main**       | IBM Plex Condensed Bold | 25px   | 28px        | 0        | Gradient text     | Main price (white → lavender gradient)           |
| **Price Original**   | Inter Regular           | 13px   | 16px        | 0        | `#6B7280`         | Strikethrough price (line-through)               |
| **Discount Badge**   | Inter Medium            | 10px   | 14px        | 0        | White (on green)  | "- Rp 2.500"                                     |
| **Label Available**  | Outfit Bold (uppercase) | 10px   | 15px        | +0.5px   | `#D8B4FE`         | "AVAILABLE"                                      |
| **Stock Counter**    | IBM Plex Condensed      | 10px   | 15px        | 0        | White / `#6B7280` | "93 / 100" (Bold for current, Regular for total) |
| **Timer Number**     | IBM Plex Condensed Bold | 25.4px | 29.7px      | 0        | White             | Countdown numbers ("23 : 30 : 02")               |
| **Button Primary**   | Outfit Bold             | 14px   | 16px        | 0        | `#E9D5FF`         | "Top Up Now" (highlighted)                       |
| **Button Secondary** | Outfit Medium           | 14px   | 16px        | 0        | `#C9D5E3`         | "Top Up Now" (default state)                     |
| **Button CTA Large** | Inter Bold              | 18px   | 28px        | 0        | `#0A0A0C` / White | "Register Now", "Login"                          |

## 5. Spacing System

### 5.1 Item Spacing Tokens

| Token               | Value |
| ------------------- | ----- |
| `item-spacing/0`    | 0     |
| `item-spacing/xxxs` | 2px   |
| `item-spacing/6`    | 6px   |
| `item-spacing/xs`   | 8px   |
| `item-spacing/16`   | 16px  |

### 5.2 Layout Spacing

| Purpose                    | Value                        |
| -------------------------- | ---------------------------- |
| Page horizontal padding    | 105px                        |
| Container max width        | 1230px / 1440px (full bleed) |
| Section vertical gap       | 48–64px                      |
| Card internal padding      | 16px                         |
| Card grid gap (Flash Sale) | 20px                         |
| Card content vertical gap  | 12px                         |
| CTA button padding         | `px-10 py-5` (40×19px)       |
| Card button padding        | `py-2.5` (9px vertical)      |
| Form field gap             | 25px                         |

### 5.3 Component Sizing

| Component                 | Size            |
| ------------------------- | --------------- |
| Flash Sale Card           | 215 × 300px     |
| Popular Card              | 240 × 304px     |
| Game Card (Top Up)        | 192 × 256px     |
| Product Image (thumbnail) | 64 × 64px       |
| Header height             | 120px           |
| Footer height             | 525px           |
| Search bar                | 716 × 38px      |
| Timer segment             | 47.6 × 47.6px   |
| CTA Button (large)        | auto × 66px     |
| Card Button               | 187–189 × ~34px |

## 6. Border Radius & Borders

### 6.1 Radius Scale

| Use Case                  | Radius       | Tailwind         |
| ------------------------- | ------------ | ---------------- |
| Stock progress bar        | `9999px`     | `rounded-full`   |
| Pill button (Hero CTA)    | `33554400px` | `rounded-full`   |
| Product card button       | `50px`       | `rounded-[50px]` |
| Main section card         | `20px`       | `rounded-[20px]` |
| Product card (Flash Sale) | `16px`       | `rounded-2xl`    |
| Product image thumbnail   | `12px`       | `rounded-xl`     |
| Timer card                | `7.4–12.1px` | `rounded-lg`     |
| Discount badge            | `10px`       | `rounded-[10px]` |

### 6.2 Border Weights

| Weight    | Use Case                                      |
| --------- | --------------------------------------------- |
| `1px`     | Default — cards, dividers, glass borders      |
| `1.213px` | Timer container border (slightly thicker)     |
| `1.487px` | Timer segment border                          |
| **`3px`** | **Active Flash Sale card border** (highlight) |

## 7. Gradients & Shadows

One of the **visual signatures** of this design is the use of violet–azure gradients and glow shadows.

### 7.1 Linear Gradients (Must Remember)

```css
/* 1. Primary Button Gradient (azure → violet) — most frequently used */
.gradient-cta {
  background: linear-gradient(to right, #3b82f6, #9234ea);
}

/* 2. Price Text Gradient (white → lavender) — signature for every price */
.gradient-price {
  background: linear-gradient(to right, #ffffff, #e9d5ff);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

/* 3. Section Header Background Gradient (subtle violet) */
.gradient-section-header {
  background: rgba(146, 52, 234, 0.1);
  border-bottom: 1px solid rgba(146, 52, 234, 0.5);
}

/* 4. Glass Surface (default product card) */
.glass-card {
  background: rgba(59, 130, 246, 0.05);
  border: 1px solid rgba(59, 130, 246, 0.2);
}

/* 5. White Glass Surface (secondary button) */
.glass-button {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.05);
}
```

### 7.2 Box Shadows

| Context            | Shadow                                                            |
| ------------------ | ----------------------------------------------------------------- |
| Product thumbnail  | `0 10px 15px rgba(0,0,0,0.4), 0 4px 6px rgba(0,0,0,0.4)`          |
| CTA primary button | `0 25px 50px -12px rgba(0,0,0,0.25)`                              |
| Timer card glow    | `0 0 14.87px rgba(147, 51, 234, 0.3)` — **signature violet glow** |
| Inner shadow timer | `inset 0 4.85px 4.85px rgba(0,0,0,0.25)`                          |

### 7.3 Backdrop Blur (Glassmorphism)

| Use Case                               | Value                  |
| -------------------------------------- | ---------------------- |
| Semi-transparent "Login" button (Hero) | `backdrop-blur-[6px]`  |
| Ambient shadow (Flash Sale)            | `backdrop-blur-[25px]` |

## 8. Core UI Components

Component mapping based on the Figma design visual breakdown. All components below are built on top of **HeroUI primitives** where applicable, with visual styling overridden via Tailwind v4 arbitrary values and HeroUI's `classNames` slot API.

### A. Header / Navbar

- **Base Component:** `<Navbar>` from HeroUI, but with custom layout.
- **Layout:** Horizontal flex, height `120px`, horizontal padding `168px`.
- **Search Bar:** Width `716px`, height `38px`, `bg-white/5`, `border border-white/5`, `rounded-full`. Placeholder: "Search games to top up...". Use HeroUI `<Input>` with `classNames` override.
- **Language Switcher Button:** `82 × 38px`, `bg-white/5`, flag icon + locale code + chevron up. Use HeroUI `<Dropdown>` for the locale picker. **Triggers `react-i18next` language change AND URL navigation to the same logical route under the new locale prefix** (see PRD Workflow 3).
- **Login Button:** `90 × 38px`, `rounded-full`, text "Masuk" / "Login" (translated) Outfit Medium 14px.
- **Sub-Navigation:** Below header, 75–130px gap between items, color: muted for inactive, white for active.

### B. Game Card (Flash Sale) — Hero Component

Vertical layout with a 3-part structure:

1. **Image Section (top):** Padding `pt-4 px-4`, `64×64px` thumbnail `rounded-xl` with drop shadow, horizontally centered, followed by product name (DM Sans Bold 14px) + category (Inter 10px).
2. **Price & Stock Section (middle):** Padding `px-4 py-3`. Contains:
   - Main price with **gradient text** (`bg-clip-text`)
   - Strikethrough price + green discount badge `#0EA42E` rounded-[10px]
   - "AVAILABLE" label + "93 / 100" counter
   - Stock bar: track `bg-[#0B051D]` rounded-full, fill `bg-[#9333EA]` rounded-full
3. **Action Button (bottom):** Width `187–189px`, padding `py-2.5`, `rounded-[50px]`.

**State Variations:**

- **Active/Featured:** Border `border-[3px] border-[#C084FC]` + button `bg-gradient-to-r from-[#3B82F6] to-[#9234EA]`.
- **Default:** Border `border border-[rgba(59,130,246,0.2)]` + button `bg-white/5 border border-white/5`.

> Implement these states as an explicit `variant` prop using **CVA** (`class-variance-authority`), NOT via `:hover` pseudo-classes — the active state is _persistent_ (the first card is always highlighted).

### C. Popular Card

- **Size:** 240×304px, top image area 220px, bottom text area ~73px.
- **Badge:** Top-right corner, rounded, text "Best Seller", "Promo", etc.
- **Image:** Full-bleed with gradient overlay for text readability.
- **Title (Outfit Bold ~18px) + Subtitle (Inter ~12px muted).**

### D. Timer Countdown Component

- **Container:** `bg-violet-700/50` (rgba 88,28,135,0.5), border `1.487px rgba(168,85,247,0.3)`, `rounded-lg`, **glow shadow** `0 0 14.87px rgba(147,51,234,0.3)`.
- **Per Segment:** `47.6×47.6px`, IBM Plex Condensed Bold 25.4px white, separator `:` IBM Plex Condensed Bold 17.8px violet `#C084FC`.

### E. Section Header with Banner Strip

Signature pattern for the "FLASH SALE" section:

- **Container:** `rounded-[20px]`, border `1px rgba(147,51,234,0.5)`, background `rgba(147,51,234,0.05)`.
- **Header Strip (top):** Height 107px, background `rgba(146,52,234,0.1)`, border-bottom `1px rgba(146,52,234,0.5)`.
- Contains: Heading (Outfit Bold 32px uppercase + ⚡ emoji) + subtitle (Inter Regular 16px `#909AAE`) on the left, and **countdown timer** on the right.

### F. Buttons

Built on HeroUI `<Button>` with `classNames` override.

| Variant             | Background                                          | Text                         | Use Case                 |
| ------------------- | --------------------------------------------------- | ---------------------------- | ------------------------ |
| **Primary CTA**     | `gradient azure → violet`                           | Outfit Bold 14px `#E9D5FF`   | "Top Up Now" highlighted |
| **Secondary Glass** | `bg-white/5` border `1px white/5`                   | Outfit Medium 14px `#C9D5E3` | "Top Up Now" default     |
| **Hero Primary**    | `bg-white`                                          | Inter Bold 18px `#0A0A0C`    | "Register Now"           |
| **Hero Secondary**  | `bg-black/20` `backdrop-blur-[6px]` border white/50 | Inter Bold 18px white        | "Login"                  |
| **Tab Button**      | `bg-violet-600` (active) / transparent (inactive)   | Outfit 14px                  | Game category tab        |

### G. Form Inputs (Login & Register)

Built on HeroUI `<Input>` primitive.

- **Input Field:** `h-10`, `rounded-md`, semi-transparent background, thin border. Horizontal padding `px-2 py-2.5`.
- **Label:** Inter Medium 14px, color `#C9D5E3`, `6px` gap to input.
- **Required Indicator:** Red/accent asterisk.

### H. Layout & Spacing

- Section vertical padding: `py-12` to `py-16`.
- Main container: `max-w-[1230px]` with `px-[105px]` on the parent.
- Flash Sale Grid: `grid grid-cols-5 gap-5` (1230px / 5 cards).
- Popular Grid: `grid grid-cols-6 gap-5` (1235px / 6 cards).

## 9. Tailwind v4 Configuration

This project uses **Tailwind CSS v4 exclusively**. There is **no `tailwind.config.ts` file**. All design tokens are defined via the `@theme` directive in the main CSS entry (`src/styles/globals.css`).

```css
@import "tailwindcss";

/* HeroUI plugin import (if using HeroUI's Tailwind plugin path) */
@plugin "@heroui/theme";

@theme {
  /* === Colors === */
  --color-primary: #9234ea;
  --color-primary-secondary: #3b82f6;

  --color-violet-deep: #0b051d;
  --color-violet-56: #9333ea;
  --color-violet-75: #c084fc;
  --color-violet-85: #d8b4fe;
  --color-violet-lavender: #e9d5ff;

  --color-azure-60: #3b82f6;

  --color-surface-base: #0a0a0c;
  --color-surface-glass: rgba(59, 130, 246, 0.05);
  --color-surface-glass-white: rgba(255, 255, 255, 0.05);

  --color-text-primary: #ffffff;
  --color-text-body: #6a7282;
  --color-text-body-light: #c9d5e3;
  --color-text-muted: #909aae;
  --color-text-subtitle: #a1a1aa;

  --color-success: #0ea42e;

  /* === Typography === */
  --font-outfit: "Outfit", sans-serif;
  --font-inter: "Inter", sans-serif;
  --font-plex: "IBM Plex Sans Condensed", sans-serif;
  --font-dmsans: "DM Sans", sans-serif;

  /* === Background Images / Gradients === */
  --background-image-gradient-cta: linear-gradient(to right, #3b82f6, #9234ea);
  --background-image-gradient-price: linear-gradient(to right, #ffffff, #e9d5ff);
  --background-image-gradient-section: rgba(146, 52, 234, 0.1);
  --background-image-gradient-footer: linear-gradient(to bottom, #671eab, #270a4f);

  /* === Box Shadows === */
  --shadow-product-thumb: 0 10px 15px rgba(0, 0, 0, 0.4), 0 4px 6px rgba(0, 0, 0, 0.4);
  --shadow-cta-primary: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  --shadow-glow-violet: 0 0 14.87px rgba(147, 51, 234, 0.3);
  --shadow-timer-inset: inset 0 4.85px 4.85px rgba(0, 0, 0, 0.25);

  /* === Border Radius === */
  --radius-card: 16px;
  --radius-section: 20px;

  /* === Letter Spacing === */
  --tracking-hero: -1.8px;
  --tracking-heading: -0.5px;
}
```

### 9.1 HeroUI Provider Setup

Wrap the app in `<HeroUIProvider>` at the root level (`__root.tsx` or `main.tsx`):

```tsx
import { HeroUIProvider } from "@heroui/react";

<HeroUIProvider>{/* App content */}</HeroUIProvider>;
```

### 9.2 HeroUI Style Override Pattern

Always use the `classNames` slot API to override HeroUI defaults. Example:

```tsx
<Button
  classNames={{
    base: "rounded-[50px] bg-linear-to-r from-[#3B82F6] to-[#9234EA] shadow-cta-primary",
    label: "font-outfit font-bold text-[14px] text-[#E9D5FF]",
  }}
>
  Top Up Now
</Button>
```

Do **NOT** rely on HeroUI's `color="primary"` / `variant="solid"` etc. when they conflict with our token system — always pass `classNames` with our exact arbitrary values.

## 10. Implementation Notes

Several critical things that **must be paid attention to** during implementation:

1. **Multi-Family Font Consistency:** Do not mix up font roles. IBM Plex Sans Condensed is **strictly** for numbers (prices, timers, stock counters) — this provides the crucial "tabular/digital" feel for the gaming context. Outfit is for all headings and brand labels.
2. **Gradient Price Must Use `bg-clip-text`:** Every main price must use the following pattern, no compromises:

```tsx
<p className="bg-linear-to-r from-white to-[#E9D5FF] bg-clip-text text-transparent font-plex font-bold text-[25px] leading-7">
  Rp 72.500
</p>
```

3. **Active vs Default Card:** Implement this as an explicit variant via **CVA**. Don't rely solely on `:hover` — this design utilizes a _persistent active state_ (the first Flash Sale card is always highlighted).
4. **Page Background is not Pure Black:** Use `#0A0A0C` (slightly warm), not `#000000`. This is a detail often missed but significantly affects the visual vibe.
5. **Glow Shadow is a Signature:** The countdown timer has `box-shadow: 0 0 14.87px rgba(147,51,234,0.3)`. Ensure this glow is applied — without it, the timer feels "flat" and loses its premium identity.
6. **Two-Layer Stock Bar:** The stock bar has **2 layers** — a dark track `#0B051D` and a violet fill `#9333EA`. Make sure the fill width is calculated from the `current/total` ratio (e.g., 93/100 = 93%).
7. **Responsive Consideration:** This design is built desktop-first with a 1440px width. Mobile breakpoints must be considered separately — especially for the Flash Sale grid (5 columns → 2 columns on mobile) and the countdown timer (compact mode).
8. **HeroUI Override Discipline:** Whenever you reach for a HeroUI component, immediately think "what does the design require?" and override via `classNames`. Default HeroUI theme colors will NOT match this design system out of the box.
9. **i18n-Ready Strings:** All hardcoded UI text (labels, button text, placeholders, error messages) MUST be wrapped in `t('namespace.key')` from `react-i18next`. Never inline raw strings in components — even during initial implementation. This prevents the painful refactor later.

## 11. Section Breakdown (Homepage)

This section breaks down **every visible section** of the homepage (`01 - Design homepage (top up game) rev.1`) into concrete style specs — background, color, typography, spacing, and layout — extracted directly from the Figma source (`homepage-design.json`). Use this as a **build-along reference** when implementing each section to ensure pixel-fidelity with the design.

### Section Order (Top → Bottom)

| #   | Section            | Width × Height (px) | Container Style                                 |
| --- | ------------------ | ------------------- | ----------------------------------------------- |
| 1   | Header / Navbar    | 1440 × 120          | Full-bleed, solid `#0A0A0B`                     |
| 2   | Hero Slider        | 1440 × 541          | Full-bleed banner carousel                      |
| 3   | Flash Sale         | 1227 × 492          | Contained card, `rounded-[20px]`, violet glass  |
| 4   | Game Populer       | 1235 × 408          | Contained, no card surface                      |
| 5   | Top Up Game (Tabs) | 1448 × 802          | Contained + tabs + 2-row grid                   |
| 6   | Keunggulan Layanan | 1230 × 454          | Contained, 3-column feature row                 |
| 7   | Artikel Terbaru    | 1230 × 592          | Contained, 3-column article grid                |
| 8   | CTA "Buat Akun"    | 1602 × 541          | Full-bleed, violet gradient + mascot            |
| 9   | Footer             | 1440 × 525          | Full-bleed, violet gradient `#671EAB → #270A4F` |

> **Layout Rule:** Sections 3, 4, 6, 7 are constrained to `max-w-[1230px]` with `px-[105px]` horizontal padding on the page. Sections 1, 2, 8, 9 are **full-bleed** (1440px+) with their own internal alignment. Section 5 (`1448px`) slightly overflows the standard container to allow card grid bleed.

---

### 11.1 Header / Navbar

**Source ID:** `511:1609` · **Size:** 1440 × 120 · **Layout:** `flex-col` with two stacked rows (`gap-[18px]`)

#### Container

- Background: `bg-[#0A0A0B]`
- Padding: vertical `py-[22px]`, horizontal `px-[106px]`
- Inner container: `w-[1228px] h-[76px]` flex-col `gap-[18px]`

#### Row 1 — Brand + Search + Actions (`h-[38px]`, `flex-row gap-[34px]`)

- **Logo block:** `w-[166px] h-[32px]` flex-row `gap-[8px]`
  - Icon square: `w-8 h-8` with gradient `bg-linear-to-r from-[#3B82F6] to-[#9333EA]`
  - Wordmark "TOPUP GAME": `font-outfit font-bold text-[21.5px] leading-[30px] tracking-[-0.54px] text-[#F2F4F6]`
- **Search bar:** `w-[834px] h-[38px] rounded-full bg-white/5 border border-white/5`, padding `px-[15px] py-2 gap-[5px]`
  - Placeholder: `font-inter text-[13px] text-[#909AAE]`
- **Language switcher:** `w-[82px] h-[38px] rounded-full bg-white/5`, padding `px-[15px] py-2 gap-[5px]`
- **Login CTA:** `w-[90px] h-[38px] rounded-full bg-linear-to-r from-[#3B82F6] to-[#9333EA]`, padding `px-5 py-2.5`
  - Label "Masuk / Login": `font-outfit font-medium text-[14px] text-white`

#### Row 2 — Sub-Navigation (`h-[20px]`, `flex-row gap-[32px]`)

- Link active: `font-outfit font-medium text-[13px] leading-5 text-[#3B82F6]`
- Link default: `font-outfit font-medium text-[13px] leading-5 text-[#C9D5E3]`
- Items: Topup · Cek pesanan · Daftar Harga · Leaderboard · Berita · Kalkulator

```tsx
<header className="w-full h-30 bg-[#0A0A0B] flex items-center justify-center">
  <div className="w-307 flex flex-col gap-4.5">
    <div className="h-9.5 flex items-center gap-8.5">{/* logo, search, lang, login */}</div>
    <nav className="h-5 flex items-center gap-8">{/* sub-nav links */}</nav>
  </div>
</header>
```

---

### 11.2 Hero Slider (Slide Home)

**Source ID:** `246:54` · **Size:** 1440 × 541 · **Layout:** Full-bleed banner with pagination overlay

#### Container

- Background: inherited page `bg-[#0A0A0C]`
- Banner image area: `w-[1236px] h-[488px]`, centered, drop-shadow heavy
- Side-peek banners (next/prev): `w-[920px] h-[363px]`, partially visible at edges for carousel hint

#### Pagination

- Container: `w-[706px] h-[5px] flex-row gap-[10px]`, absolutely positioned bottom-centered with `mt-[16px]` from banner
- 6 segments (one per slide), each `w-[110px] h-[5px] rounded-full`
- Active: `bg-[#9333EA]`
- Inactive: `bg-white`

```tsx
<section className="relative w-full h-135.25">
  <div className="absolute inset-0 flex items-center justify-center">
    {/* prev peek 920x363 · main 1236x488 · next peek 920x363 */}
  </div>
  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2.5">
    {slides.map((_, i) => (
      <span
        key={i}
        className={cn("w-27.5 h-1.25 rounded-full", i === active ? "bg-[#9333EA]" : "bg-white")}
      />
    ))}
  </div>
</section>
```

---

### 11.3 Flash Sale Section

**Source ID:** `137:275` · **Size:** 1227 × 492 · **Layout:** `flex-col` card with header strip + 5-column grid

#### Container

- Background: `bg-[rgba(146,52,234,0.05)]` (violet 5%)
- Border: `border border-[rgba(147,51,234,0.5)]`
- Radius: `rounded-[20px]`
- Drop shadow: ambient `backdrop-blur-[25px]`

#### Header Strip (top)

- Height: `h-[107px]`
- Background: `bg-[rgba(146,52,234,0.1)]`
- Border-bottom: `border-b border-[rgba(146,52,234,0.5)]`
- Padding: `px-[34px] py-[24px]`
- Layout: `flex-row justify-between items-center`

**Left — Title block (`flex-col gap-[11px]`):**

- Title "⚡ FLASH SALE": `font-outfit font-bold text-[32px] leading-[28px] tracking-[-0.5px] text-white uppercase`
- Subtitle "Pesan sekarang! Persediaan terbatas": `font-inter font-normal text-[16px] leading-5 text-[#909AAE]`

**Right — Countdown Timer:**

- Wrapper: `w-[228px] h-[77px] bg-black/20` (decorative shadow layer)
- Inner timer container: `w-[185px] h-12 flex-row gap-2`
- Each segment: `w-12 h-12 rounded-lg bg-[rgba(88,28,135,0.5)] border-[1.487px] border-[rgba(168,85,247,0.3)] shadow-glow-violet shadow-timer-inset`
  - Number: `font-plex font-bold text-[25.4px] leading-[29.7px] text-white`
- Separator `:`: `font-plex font-bold text-[17.8px] text-[#C084FC]`

#### Products Grid (below header)

- Padding: `px-[34px] py-[24px]`
- Layout: `grid grid-cols-5 gap-5` (5 cards × 215px = 1075px + 4 × 20px gap = 1155px ≤ 1177px inner width)

#### Flash Sale Card (per item) — `w-[215px] h-[300px]`

**Card variants — apply via CVA `variant: "active" | "default"`:**

- **Active (first card):** `border-[3px] border-[#C084FC] rounded-2xl`
- **Default:** `border border-[rgba(59,130,246,0.2)] bg-[rgba(59,130,246,0.05)] rounded-2xl`

**Internal structure (`flex-col` 3 sections):**

1. **Image block** — `h-[133px] pt-4 px-4 flex-col items-center gap-3`
   - Thumbnail: `w-16 h-16 rounded-xl shadow-product-thumb`
   - Product name "500 Robux": `font-dmsans font-bold text-[14px] leading-5 text-white text-center`
   - Category "Roblox": `font-inter font-normal text-[10px] leading-[15px] text-[#A1A1AA] text-center`

2. **Price + Stock block** — `h-[117px] px-4 py-3 flex-col gap-3`
   - **Price row** (`flex-col gap-[3px]`):
     - Main price "Rp 72.500": `bg-linear-to-r from-white to-[#E9D5FF] bg-clip-text text-transparent font-plex font-bold text-[25px] leading-7`
     - Sub-row (`flex-row items-center gap-2`):
       - Original price "Rp 75.000": `font-inter text-[13px] leading-4 text-[#767676] line-through`
       - Discount badge: `bg-[#0DA32E] rounded-[10px] px-[5px] py-[1px]`
         - Text "- Rp 2.500": `font-inter font-medium text-[10px] leading-[14px] text-white`
   - **Stock row** (`flex-col gap-1.5`):
     - Header (`flex-row justify-between`):
       - "TERSEDIA" / "AVAILABLE": `font-outfit font-bold text-[10px] leading-[15px] text-[#D8B4FE] uppercase tracking-[0.5px]`
       - "93 / 100": `font-plex font-bold text-[10px] leading-[15px] text-white`
     - Stock bar: `h-2 rounded-full bg-[#0B051D] overflow-hidden`
       - Fill: `h-full rounded-full bg-[#9333EA]` width = `(current/total)%`

3. **CTA Button** — `w-[187px] h-[34px] mx-auto rounded-[50px] py-2`
   - Active: `bg-linear-to-r from-[#3B82F6] to-[#9234EA]`
     - Label: `font-outfit font-bold text-[14px] leading-4 text-[#E9D5FF]`
   - Default: `bg-white/5 border border-white/5`
     - Label: `font-outfit font-medium text-[14px] leading-4 text-[#C9D5E3]`

```tsx
<section className="rounded-[20px] bg-[rgba(146,52,234,0.05)] border border-[rgba(147,51,234,0.5)]">
  <header className="h-26.75 px-8.5 flex items-center justify-between bg-[rgba(146,52,234,0.1)] border-b border-[rgba(146,52,234,0.5)] rounded-t-[20px]">
    <div className="flex flex-col gap-2.75">
      <h2 className="font-outfit font-bold text-[32px] leading-7 tracking-[-0.5px] text-white uppercase">
        ⚡ Flash Sale
      </h2>
      <p className="font-inter text-[16px] leading-5 text-[#909AAE]">Pesan sekarang! Persediaan terbatas</p>
    </div>
    <CountdownTimer />
  </header>
  <div className="grid grid-cols-5 gap-5 px-8.5 py-6">
    {products.map((p) => (
      <FlashSaleCard
        key={p.id}
        {...p}
        variant={p.featured ? "active" : "default"}
      />
    ))}
  </div>
</section>
```

---

### 11.4 Game Populer Hari Ini

**Source ID:** `123:281` · **Size:** 1235 × 408 · **Layout:** `flex-col gap-[30px]` — header + 6-column card row

#### Section Header (shared "Heading 2" pattern)

A reusable pattern used by sections 11.4, 11.5, 11.6, 11.7:

- Wrapper: `flex-col gap-[10px]`
- Title row: `flex-row items-center gap-2`
  - Left blue bar: `w-1 h-5 bg-[#3B82F6]` (vertical accent)
  - Title: `font-outfit font-bold text-[28px] leading-7 tracking-[-0.5px] text-white uppercase`
- Description: `font-inter font-normal text-[16px] leading-5 text-[#697282]`

> **Note:** In Figma the accent bar is sometimes rendered horizontally (`20×4`) flanking the heading. For sections 11.6 and 11.7 (Keunggulan & Artikel), the bars flank **both sides** of the title with `gap-2`. For sections 11.4 and 11.5 (Game Populer & Top Up Game), only one bar appears on the **left**.

#### Container

- Background: page default `bg-[#0A0A0C]` (no card surface)
- Padding: section vertical `py-12` to `py-16`
- Inner: `w-[1235px]`

#### Title content

- Title "GAME POPULER HARI INI"
- Subtitle: "Pilih kategori favoritmu dan lakukan top up dengan proses cepat, aman, dan tanpa ribet."

#### Cards Grid — `grid grid-cols-6 gap-5` (`h-[304px]`)

#### Populer Card — `w-[240px] h-[304px]`

- **Container:** `rounded-2xl overflow-hidden relative bg-[#0C0C16]`
- **Card overlay (top accent):** Absolute fill, color varies per card: `#9B3BF6` (violet variant) or `#443BF6` (azure-violet variant). Used as **3px top border / glow** via the overlay layer.
- **Image:** Top area `w-full h-[220px]`, full-bleed, `object-cover`
  - Gradient overlay (image bottom): `bg-linear-to-b from-transparent to-[#0C0C16]` for text readability
- **"Best Seller" badge (top-right):** Absolute `top-3 right-3`, small pill, `bg-[#9333EA]/90 rounded-full px-2 py-1`, text `font-outfit font-bold text-[10px] uppercase tracking-[0.5px] text-white`
- **Text container (bottom):** `h-[73px] px-4 py-3 flex-col gap-[3px]`
  - Title: `font-outfit font-bold text-[18px] leading-6 text-white`
  - Subtitle (region/category): `font-inter font-normal text-[12px] leading-4 text-[#A1A1AA]`
- **Right-edge fade shadow** (entire section): `w-[105px] h-[487px] bg-linear-to-r from-[#0A0A0B] to-transparent` positioned at the right edge to create a "swipe more" hint

```tsx
<section className="flex flex-col gap-7.5 py-12">
  <SectionHeading
    title="Game Populer Hari Ini"
    subtitle="Pilih kategori favoritmu..."
  />
  <div className="relative">
    <div className="grid grid-cols-6 gap-5 w-308.75">
      {popularCards.map((c) => (
        <PopularCard {...c} />
      ))}
    </div>
    <div
      aria-hidden
      className="absolute right-0 top-0 w-26.25 h-full bg-linear-to-r from-transparent to-[#0A0A0B]"
    />
  </div>
</section>
```

---

### 11.5 Top Up Game (Tabs + Grid)

**Source ID:** `193:315` · **Size:** 1448 × 802 · **Layout:** `flex-col` — heading + tabs + 2-row × 6-col grid + "show more" button

#### Container

- Page padding context: `py-12` to `py-16`
- Inner content: `w-[1227px]`

#### Section Heading

Same "Heading 2" pattern as 11.4. Title "TOP UP GAME", subtitle "Pilih game favoritmu dan lakukan top up dengan cepat, aman, dan praktis."

#### Tabs Row — `flex-row gap-2.5` (`h-11`)

- **Tab active** (e.g. "Semua"): `h-11 px-[25px] py-3 rounded-full bg-[#9333EA]`
  - Label: `font-inter font-bold text-[14.7px] leading-[21px] text-white`
- **Tab inactive** (e.g. "MOBA", "Battle Royale", "FPS", "PC Games", "Voucher"): `h-[42px] px-6 py-2.5 rounded-full bg-white/5 border border-white/5`
  - Label: `font-inter font-bold text-[14px] leading-5 text-[#90A1B8]`

> **Implementation note:** Use CVA on a `<TabButton>` component with `variant: "active" | "default"`. Bind to TanStack Query category filter or Zustand UI state, depending on whether the active tab is server-derived or client-only.

#### Image Grid — 2 rows × 6 cols (`flex-col gap-5`)

- Each row: `flex-row gap-4` (`h-[256px]`)
- Each card: `w-[192px] h-[256px] rounded-2xl overflow-hidden bg-black`
  - Image: full-bleed cover
  - Bottom text container (overlaid): `absolute bottom-0 px-4 py-3 flex-col gap-[3px]`
    - Game title: `font-outfit font-bold text-[14px] leading-5 text-white`
    - Region/variant: `font-inter font-normal text-[10px] leading-[15px] text-[#A1A1AA]`

#### "Show More" Button — centered below grid

- Button: `w-[265px] h-[46px] rounded-full bg-white border border-white/5 backdrop-blur-[6px] px-6 py-3 gap-2 flex-row items-center justify-center`
- Label "TAMPILKAN LEBIH BANYAK": `font-inter font-bold text-[12px] leading-4 tracking-[1.2px] text-[#9333EA] uppercase`
- Trailing chevron icon: `w-5 h-5 stroke-[#9333EA]`

```tsx
<section className="flex flex-col gap-8 py-12">
  <SectionHeading
    title="Top Up Game"
    subtitle="Pilih game favoritmu..."
  />
  <div className="flex gap-2.5">
    {categories.map((cat) => (
      <TabButton variant={cat.active ? "active" : "default"}>{cat.label}</TabButton>
    ))}
  </div>
  <div className="grid grid-cols-6 gap-4 grid-rows-2 w-306.75">
    {games.map((g) => (
      <GameCard {...g} />
    ))}
  </div>
  <button className="mx-auto rounded-full bg-white px-6 py-3 font-inter font-bold text-[12px] tracking-[1.2px] text-[#9333EA] uppercase flex items-center gap-2">
    Tampilkan Lebih Banyak <ChevronDown className="w-5 h-5" />
  </button>
</section>
```

---

### 11.6 Keunggulan Layanan Kami

**Source ID:** `259:183` · **Size:** 1230 × 454 · **Layout:** Section heading + 3-column feature row

#### Container

- Page padding: `py-12` to `py-16`
- Inner: `w-[1230px]`

#### Section Heading (with flanking bars)

- Wrapper: `flex-col gap-[10px] text-center`
- Title row: `flex-row items-center justify-center gap-2`
  - Left bar: `w-5 h-1 bg-[#3B82F6]` (horizontal)
  - Title "KEUNGGULAN LAYANAN KAMI": `font-outfit font-bold text-[28px] leading-7 tracking-[-0.5px] text-white uppercase`
  - Right bar: `w-5 h-1 bg-[#3B82F6]`
- Subtitle: `font-inter font-normal text-[16px] leading-5 text-[#697282]` — "Solusi top up cepat, aman, dan praktis dalam satu platform."

#### Features Grid — `flex-row gap-[33px]` (`h-[347px]`)

Three columns, each `w-[388px]` center-aligned, internal `flex-col items-center text-center`:

**Per Feature Column structure:**

1. **Icon block** — `w-[89px] h-[89px] rounded-2xl flex items-center justify-center mb-[35px]`
   - Feature 1 (Pembayaran Aman): `bg-[#2B7FFF]` (azure)
   - Feature 2 (Pengiriman Instan): `bg-[#AC46FF]` (violet)
   - Feature 3 (24/7 Support): `bg-[#2B7FFF]` (azure)
   - Icon (24-28px): white stroke `text-white`

2. **Heading** — `font-outfit font-bold text-[20px] leading-[36px] tracking-[-0.45px] text-white mb-[18px]`
   - Examples: "Pembayaran Aman", "Pengiriman Instan", "24/7 Support"

3. **Description** — `font-inter font-normal text-[17.7px] leading-[28.8px] text-[#90A1B8] px-6`
   - ~2-3 lines, e.g. "Kami menggunakan sistem enkripsi berstandar tinggi untuk memastikan transaksi selalu terlindungi."

4. **Footer slot (varies per card):**
   - **Card 1:** Trust list — `flex-col gap-[9px] pt-[27px]`
     - Each item: `flex-row items-center gap-2`, icon (sm) + `font-inter text-[12px] text-[#90A1B8]` ("Terlindungi standar keamanan PCI DSS")
   - **Card 2:** "Sistem Otomatis Aktif" pill — `w-[280px] h-[47px] rounded-full bg-white px-[27px] py-[13px] flex-row items-center gap-[18px] mt-[35px]`
     - Label: `font-inter font-bold text-[12px] tracking-[1.2px] text-[#9333EA] uppercase`
   - **Card 3:** "HUBUNGI ADMIN" text link — `font-inter font-bold text-[12px] tracking-[1.2px] text-[#9333EA] uppercase pt-[35px]`

```tsx
<section className="flex flex-col items-center gap-12 py-12 w-307.5 mx-auto">
  <SectionHeading
    variant="centered"
    title="Keunggulan Layanan Kami"
    subtitle="Solusi top up cepat, aman, dan praktis dalam satu platform."
  />
  <div className="flex gap-8.25">
    {features.map((f) => (
      <article
        key={f.id}
        className="w-97 flex flex-col items-center text-center"
      >
        <div className={cn("w-22.25 h-22.25 rounded-2xl flex items-center justify-center mb-8.75", f.iconBg)}>
          <f.Icon className="w-7 h-7 text-white" />
        </div>
        <h3 className="font-outfit font-bold text-[20px] leading-9 tracking-[-0.45px] text-white mb-4.5">{f.title}</h3>
        <p className="font-inter text-[17.7px] leading-[28.8px] text-[#90A1B8] px-6">{f.description}</p>
        <FeatureFooter slot={f.footerSlot} />
      </article>
    ))}
  </div>
</section>
```

---

### 11.7 Artikel Terbaru Seputar Game

**Source ID:** `259:185` · **Size:** 1230 × 592 · **Layout:** Heading + 3-column article grid + "Lihat Semua" button

#### Container

- Page padding: `py-12` to `py-16`
- Inner: `w-[1230px]`

#### Section Heading (centered, with flanking bars — same as 11.6)

- Title "ARTIKEL TERBARU SEPUTAR GAME"
- Subtitle "Temukan informasi, tips, dan update terbaru seputar top up game, promo menarik."

#### Articles Grid — `flex-row gap-[33px]` (`h-[398px]`)

Three article cards, each `w-[388px] h-[398px]`:

#### Article Card

- **Wrapper:** `rounded-2xl overflow-hidden relative bg-[#0C0C16]`
- **Image** — `w-full h-[216px] object-cover` (top portion)
- **Category badge (overlay on image, top-left):** `absolute top-3 left-3 px-3 py-1 rounded-full bg-[#9333EA] font-outfit font-bold text-[10px] uppercase tracking-[0.5px] text-white`
  - Example: "MOBILE LEGENDS", "FREE FIRE", "PUBG MOBILE"
- **Figure (text block, below image):** `w-full h-[182px] px-[42px] py-[22px] flex-col gap-[9px]`
  - Title (2-line clamp): `font-outfit font-bold text-[18px] leading-6 text-white line-clamp-2`
  - Date row: `flex-row items-center gap-2`
    - Calendar icon: `w-3.5 h-3.5 text-[#90A1B8]`
    - Date: `font-inter font-normal text-[12px] leading-4 text-[#90A1B8]` (e.g. "21 Nov 2026")

#### "Lihat Semua Artikel" Button — centered below grid

- Button: `w-[235px] h-[46px] rounded-full bg-white px-6 py-3 gap-2 flex-row items-center justify-center backdrop-blur-[6px]`
- Label: `font-inter font-bold text-[12px] leading-4 tracking-[1.2px] text-[#9333EA] uppercase`
- Chevron: `w-5 h-5 stroke-[#9333EA]`

```tsx
<section className="flex flex-col items-center gap-12.5 py-12 w-307.5 mx-auto">
  <SectionHeading
    variant="centered"
    title="Artikel Terbaru Seputar Game"
    subtitle="Temukan informasi, tips, dan update terbaru..."
  />
  <div className="flex gap-8.25">
    {articles.map((a) => (
      <ArticleCard
        key={a.id}
        {...a}
      />
    ))}
  </div>
  <button className="rounded-full bg-white px-6 py-3 font-inter font-bold text-[12px] tracking-[1.2px] text-[#9333EA] uppercase flex items-center gap-2">
    Lihat Semua Artikel <ChevronRight className="w-5 h-5" />
  </button>
</section>
```

---

### 11.8 CTA "Buat Akun & Nikmati Lebih Banyak Keuntungan"

**Source ID:** `193:321` · **Size:** 1602 × 541 · **Layout:** Full-bleed banner with violet gradient background, mascot image, and dual CTA buttons

#### Container

- **Full-bleed width:** Spans 1602px (wider than 1440px viewport — overflows on both sides for visual emphasis)
- Background image (decorative violet bg): `w-[1443px] h-[505px]` covering most of the frame
- Inner content container: `w-[540px] h-[294px]` left-aligned with horizontal offset matching the page container (`pl-[105px]` from viewport edge)
- Mascot image: `w-[462px] h-[471px]` positioned to the **right side**
- Decorative SVG (top-right corner): `w-[647px] h-[647px]` with rotating border accent at `w-[384px] h-[384px]`

#### Text Content Block (`flex-col gap-5`)

1. **Heading** (`h-[116px]`) — Two-line text
   - "Buat Akun & Nikmati Lebih Banyak Keuntungan": `font-outfit font-bold text-[45px] leading-[58px] tracking-[-1.8px] text-white`

2. **Description** (`h-[56px]`)
   - "Dapatkan harga lebih hemat, riwayat transaksi, dan proses top up yang lebih cepat dalam satu akun.": `font-inter font-normal text-[18px] leading-7 text-white/80`

3. **Button Row** (`flex-row gap-4 pt-4`)
   - **Primary "Daftar Sekarang":** `w-[224px] h-[66px] rounded-full bg-white px-10 py-[19px] shadow-cta-primary`
     - Label: `font-inter font-bold text-[18px] leading-7 text-[#0A0A0C]`
   - **Secondary "Masuk":** `w-[141px] h-[66px] rounded-full bg-[#0A090B] border border-white/50 backdrop-blur-[6px] px-10 py-[18px]`
     - Label: `font-inter font-bold text-[18px] leading-7 text-white`

```tsx
<section className="relative w-full h-135.25 overflow-hidden">
  <img
    src="/cta-bg-violet.png"
    alt=""
    aria-hidden
    className="absolute inset-0 w-full h-full object-cover"
  />
  <img
    src="/mascot.png"
    alt=""
    aria-hidden
    className="absolute right-0 bottom-0 w-115.5 h-117.75 object-contain"
  />
  <div className="relative max-w-307.5 mx-auto h-full flex items-center px-26.25">
    <div className="w-135 flex flex-col gap-5">
      <h2 className="font-outfit font-bold text-[45px] leading-14.5 tracking-[-1.8px] text-white">
        Buat Akun & Nikmati Lebih
        <br />
        Banyak Keuntungan
      </h2>
      <p className="font-inter text-[18px] leading-7 text-white/80">
        Dapatkan harga lebih hemat, riwayat transaksi, dan proses top up yang lebih cepat dalam satu akun.
      </p>
      <div className="flex gap-4 pt-4">
        <Button
          classNames={{
            base: "rounded-full bg-white px-10 py-[19px] shadow-cta-primary",
            label: "font-inter font-bold text-[18px] text-[#0A0A0C]",
          }}
        >
          Daftar Sekarang
        </Button>
        <Button
          classNames={{
            base: "rounded-full bg-[#0A090B] border border-white/50 backdrop-blur-[6px] px-10 py-[18px]",
            label: "font-inter font-bold text-[18px] text-white",
          }}
        >
          Masuk
        </Button>
      </div>
    </div>
  </div>
</section>
```

---

### 11.9 Footer

**Source ID:** `262:211` · **Size:** 1440 × 525 · **Layout:** Full-bleed violet gradient footer with multi-column info

#### Container

- **Background gradient:** `bg-linear-to-b from-[#671EAB] to-[#270A4F]` (top → bottom violet fade — use new token `--background-image-gradient-footer`)
- Padding: `pt-[60px] pb-[40px]`, horizontal centered with inner `w-[1106px]`
- Layout: Top area `flex-row` (~5 columns) + Bottom border row

#### Top Area Columns

**Column 1 — Topup Game Info** (`w-[387px] h-[159px] flex-col gap-4`)

- Logo + wordmark row (`h-[35px] flex-row gap-[9px]`):
  - Icon: `w-[35px] h-[35px] rounded-md bg-linear-to-r from-[#3B82F6] to-[#9333EA] flex items-center justify-center`
  - Wordmark "TOPUP GAME": `font-outfit font-bold text-[21.5px] leading-[30px] tracking-[-0.54px] text-[#F2F4F6]`
- Description: `font-inter font-normal text-[14px] leading-[17.9px] tracking-[0.24px] text-[#90A1B8]`

**Column 2 — Payment Methods** (`w-[376px] h-[124px]`)

- Title "Metode Pembayaran": `font-outfit font-medium text-[15px] leading-[23px] tracking-[0.24px] text-white`
- Logo strip: `flex-row gap-[6px] flex-wrap`, 9 payment icons each `w-[77-84px] h-[33px] bg-white rounded-md`

**Column 3 — Support Information** (`w-[256px] h-[155px] flex-col gap-4`)

- Title "Butuh Bantuan?": `font-outfit font-medium text-[18px] leading-[23px] tracking-[0.24px] text-white`
- WhatsApp CTA: `w-[246px] h-12 rounded-full bg-white flex-row items-center gap-[11px] px-4`
  - Label: `font-inter font-medium text-[14px] text-[#0A0A0C]` ("Chat WhatsApp")
- Contact list (`flex-col gap-[7px]`):
  - WhatsApp: icon + `font-inter text-[12px] text-white` ("Jam Operasional: 24 Jam")
  - Email: icon + `font-inter text-[12px] text-white` ("E-mail: support@topupgame.com")

**Column 4 — Quick Links (Menu Link)** (`w-[127px] flex-col gap-4`)

- Title "Menu Link": `font-outfit font-medium text-[18px] leading-[23px] tracking-[0.24px] text-white`
- Links list (`flex-col gap-[10px]`):
  - Each link: `font-inter font-normal text-[13px] leading-[17.9px] tracking-[0.24px] text-[#90A1B8]`
  - Items: Dashboard · Daftar Harga · Leaderboard · Berita · Kalkulator

**Column 5 — Legalitas** (`w-[155px] flex-col gap-4`)

- Title "Legalitas": same style as Menu Link
- Links: Kebijakan Pengembalian · Kebijakan Privasi · Syarat & Ketentuan

#### Sub-row — Follow Kami + Guarantee

**Follow Kami** (`w-[250px] h-[72px] flex-col gap-[10px]`)

- Title: `font-outfit font-medium text-[18px] leading-[23px] text-white`
- Icon row (`flex-row gap-[15px]`):
  - Each social icon: `w-[38px] h-[38px] rounded-full flex items-center justify-center`
  - Instagram (active): `bg-[#9333EA]`, icon `text-white`
  - Other platforms (YT, X, Facebook, LinkedIn): `bg-white`, icon `text-[#0A0A0C]`

**Guarantee Pill** (`w-[210px] h-14 flex-row gap-[9px]`)

- Icon block: `w-[54px] h-14 rounded-md bg-[#2BFF59] flex items-center justify-center` (green) with shield icon
- Text block (`flex-col gap-[2px]`):
  - Title "Jaminan Transaksi": `font-outfit font-light text-[14px] leading-[23px] tracking-[0.24px] text-white`
  - Subtext "100% Legal & Aman": `font-outfit font-medium text-[16px] leading-[23px] tracking-[0.24px] text-white`

#### Bottom Border Row (`pt-8 mt-8`)

- Container: `w-[1106px] flex-row justify-between items-center` (CSS Grid 2-col)
- Copyright: `font-sans font-normal text-[12.8px] leading-[17.9px] tracking-[0.24px] text-[#CDDBEF]` — "© 2026 Topup Game. All Rights Reserved. All trademarks,"
- Disclaimer: `font-sans font-normal text-[12.8px] leading-[17.9px] tracking-[0.24px] text-[#CDDBEF]` — "logos and brand names are the property of their respective owners."

> **Note:** Copyright/disclaimer text uses **Arial** in Figma — fall back gracefully to system `sans-serif` (`font-family: Arial, sans-serif`) or simply use `font-inter` if Arial is undesired for brand consistency. Document this as a design decision.

```tsx
<footer className="w-full bg-linear-to-b from-[#671EAB] to-[#270A4F] pt-15 pb-10">
  <div className="w-276.5 mx-auto flex flex-col gap-8">
    <div className="flex justify-between">
      <FooterBrand /> {/* Column 1 */}
      <FooterPayments /> {/* Column 2 */}
      <FooterSupport /> {/* Column 3 */}
      <FooterMenu /> {/* Column 4 */}
      <FooterLegal /> {/* Column 5 */}
    </div>
    <div className="flex justify-between items-center">
      <FooterSocials />
      <FooterGuarantee />
    </div>
    <div className="border-t border-white/10 pt-8 grid grid-cols-2 gap-4">
      <p className="font-sans text-[12.8px] tracking-[0.24px] text-[#CDDBEF]">
        © 2026 Topup Game. All Rights Reserved...
      </p>
      <p className="font-sans text-[12.8px] tracking-[0.24px] text-[#CDDBEF]">
        logos and brand names are the property of their respective owners.
      </p>
    </div>
  </div>
</footer>
```

---

### 11.10 Reusable Patterns Recap

For DRY implementation, extract these recurring patterns into shared components:

| Pattern                       | Used In Sections     | Component Name                            |
| ----------------------------- | -------------------- | ----------------------------------------- |
| Section Heading (left-bar)    | 11.4, 11.5           | `<SectionHeading variant="left-bar">`     |
| Section Heading (centered)    | 11.6, 11.7           | `<SectionHeading variant="centered">`     |
| White "Show More" pill button | 11.5, 11.7           | `<ShowMoreButton>`                        |
| Glass surface card            | 11.3 (default), 11.5 | `<GlassCard>`                             |
| Gradient text (price)         | 11.3                 | `<GradientPrice>`                         |
| Tab pill (active/default)     | 11.5                 | `<TabButton variant="active"\|"default">` |

> **Placement note:** Reusable presentational components (not feature-specific) go under `src/components/ui/` per system architecture. Feature-coupled compositions (e.g. `FlashSaleCard` with business logic for stock display) stay in `src/features/<feature>/components/`.

### 11.11 Section Vertical Rhythm

Page-level vertical spacing between sections — **applied as `py-*` on each section**, NOT as margin (margin collapses inconsistently across browsers):

| Between Sections           | Vertical Gap |
| -------------------------- | ------------ |
| Header → Hero              | `0`          |
| Hero → Flash Sale          | `py-12`      |
| Flash Sale → Game Populer  | `py-12`      |
| Game Populer → Top Up Game | `py-12`      |
| Top Up Game → Keunggulan   | `py-16`      |
| Keunggulan → Artikel       | `py-12`      |
| Artikel → CTA              | `py-16`      |
| CTA → Footer               | `0`          |

> **Heuristic:** Use `py-16` (64px) before major thematic shifts (e.g. transactional → marketing → legal), and `py-12` (48px) between sibling product-discovery sections.
