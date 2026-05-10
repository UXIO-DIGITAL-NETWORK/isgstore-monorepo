# Design System Brief: Multi-Game Top-Up Platform

**Target Audience:** UI/UX Designer, Frontend Developer
**Design Theme:** E-sports Premium, Neon Violet Dark Mode, Glassmorphism, Desktop-First Responsive
**Styling Framework:** Tailwind CSS + ShadcnUI
**Visual Reference:** Figma — Design Topup Game (Internal File)

## 1. Overview

This document defines the visual standards and User Interface (UI) components for the Game Top-Up project. The design adopts a **premium e-sports aesthetic** with a signature **violet–azure neon gradient** over a near-black background. The primary goal is to create a modern, immersive, and trustworthy _gaming-grade_ impression for top-up transactions. The visual hierarchy is built through a combination of **gradient text for numbers/prices**, **glassmorphism cards**, and **glow shadows** as accents.

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

| Token            | Hex / RGBA                | Usage                                                |
| ---------------- | ------------------------- | ---------------------------------------------------- |
| `violet/7`       | `#0B051D`                 | Track background (progress/stock bar)                |
| `violet/32 50%`  | `rgba(88, 28, 135, 0.5)`  | Timer card background (countdown)                    |
| `violet/56`      | `#9333EA`                 | Stock bar fill, timer border                         |
| `violet/65 30%`  | `rgba(168, 85, 247, 0.3)` | Timer card border                                    |
| `violet/75`      | `#C084FC`                 | Active Flash Sale card border, timer separator (`:`) |
| `violet/85`      | `#D8B4FE`                 | "AVAILABLE" label on product cards                   |
| `lavender/light` | `#E9D5FF`                 | Price gradient end-color, primary button text        |

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

Component mapping based on the Figma design visual breakdown.

### A. Header / Navbar

- **Layout:** Horizontal flex, height `120px`, horizontal padding `168px`.
- **Search Bar:** Width `716px`, height `38px`, `bg-white/5`, `border border-white/5`, `rounded-full`. Placeholder: "Search games to top up...".
- **Language Switcher Button:** `82 × 38px`, `bg-white/5`, flag icon + "ID" text + chevron up.
- **Login Button:** `90 × 38px`, `rounded-full`, text "Masuk" Outfit Medium 14px.
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

| Variant             | Background                                          | Text                         | Use Case                 |
| ------------------- | --------------------------------------------------- | ---------------------------- | ------------------------ |
| **Primary CTA**     | `gradient azure → violet`                           | Outfit Bold 14px `#E9D5FF`   | "Top Up Now" highlighted |
| **Secondary Glass** | `bg-white/5` border `1px white/5`                   | Outfit Medium 14px `#C9D5E3` | "Top Up Now" default     |
| **Hero Primary**    | `bg-white`                                          | Inter Bold 18px `#0A0A0C`    | "Register Now"           |
| **Hero Secondary**  | `bg-black/20` `backdrop-blur-[6px]` border white/50 | Inter Bold 18px white        | "Login"                  |
| **Tab Button**      | `bg-violet-600` (active) / transparent (inactive)   | Outfit 14px                  | Game category tab        |

### G. Form Inputs (Login & Register)

- **Input Field:** `h-10`, `rounded-md`, semi-transparent background, thin border. Horizontal padding `px-2 py-2.5`.
- **Label:** Inter Medium 14px, color `#C9D5E3`, `6px` gap to input.
- **Required Indicator:** Red/accent asterisk.

### H. Layout & Spacing

- Section vertical padding: `py-12` to `py-16`.
- Main container: `max-w-[1230px]` with `px-[105px]` on the parent.
- Flash Sale Grid: `grid grid-cols-5 gap-5` (1230px / 5 cards).
- Popular Grid: `grid grid-cols-6 gap-5` (1235px / 6 cards).

## 9. Tailwind Configuration

Here are the two versions of the Tailwind configuration based on the version you are using.

### Version 1: Tailwind CSS v3 (`tailwind.config.ts`)

```ts
// tailwind.config.ts
import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#9234EA",
          secondary: "#3B82F6",
        },
        violet: {
          deep: "#0B051D", // track background
          56: "#9333EA",
          75: "#C084FC",
          85: "#D8B4FE",
          lavender: "#E9D5FF",
        },
        azure: {
          60: "#3B82F6",
        },
        surface: {
          base: "#0A0A0C", // page background
          glass: "rgba(59, 130, 246, 0.05)",
          "glass-white": "rgba(255, 255, 255, 0.05)",
        },
        text: {
          primary: "#FFFFFF",
          body: "#6A7282",
          "body-light": "#C9D5E3",
          muted: "#909AAE",
          subtitle: "#A1A1AA",
        },
        success: "#0EA42E",
      },
      fontFamily: {
        outfit: ["Outfit", "sans-serif"],
        inter: ["Inter", "sans-serif"],
        plex: ['"IBM Plex Sans Condensed"', "sans-serif"],
        dmsans: ['"DM Sans"', "sans-serif"],
      },
      backgroundImage: {
        "gradient-cta": "linear-gradient(to right, #3B82F6, #9234EA)",
        "gradient-price": "linear-gradient(to right, #FFFFFF, #E9D5FF)",
        "gradient-section": "rgba(146, 52, 234, 0.1)",
      },
      boxShadow: {
        "product-thumb": "0 10px 15px rgba(0,0,0,0.4), 0 4px 6px rgba(0,0,0,0.4)",
        "cta-primary": "0 25px 50px -12px rgba(0,0,0,0.25)",
        "glow-violet": "0 0 14.87px rgba(147, 51, 234, 0.3)",
        "timer-inset": "inset 0 4.85px 4.85px rgba(0,0,0,0.25)",
      },
      borderRadius: {
        card: "16px",
        section: "20px",
      },
      letterSpacing: {
        hero: "-1.8px",
        heading: "-0.5px",
      },
    },
  },
  plugins: [],
} satisfies Config;
```

### Version 2: Tailwind CSS v4 (`globals.css` or `app.css`)

In Tailwind v4, configuration moves away from the `.ts` file into the main CSS file using CSS variables and the `@theme` directive.

```css
@import "tailwindcss";

@theme {
  /* Colors */
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

  /* Typography */
  --font-outfit: "Outfit", sans-serif;
  --font-inter: "Inter", sans-serif;
  --font-plex: "IBM Plex Sans Condensed", sans-serif;
  --font-dmsans: "DM Sans", sans-serif;

  /* Background Images / Gradients */
  --background-image-gradient-cta: linear-gradient(to right, #3b82f6, #9234ea);
  --background-image-gradient-price: linear-gradient(to right, #ffffff, #e9d5ff);
  --background-image-gradient-section: rgba(146, 52, 234, 0.1);

  /* Box Shadows */
  --shadow-product-thumb: 0 10px 15px rgba(0, 0, 0, 0.4), 0 4px 6px rgba(0, 0, 0, 0.4);
  --shadow-cta-primary: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  --shadow-glow-violet: 0 0 14.87px rgba(147, 51, 234, 0.3);
  --shadow-timer-inset: inset 0 4.85px 4.85px rgba(0, 0, 0, 0.25);

  /* Border Radius */
  --radius-card: 16px;
  --radius-section: 20px;

  /* Letter Spacing */
  --tracking-hero: -1.8px;
  --tracking-heading: -0.5px;
}
```

## 10. Implementation Notes

Several critical things that **must be paid attention to** during implementation:

1. **Multi-Family Font Consistency:** Do not mix up font roles. IBM Plex Sans Condensed is **strictly** for numbers (prices, timers, stock counters) — this provides the crucial "tabular/digital" feel for the gaming context. Outfit is for all headings and brand labels.
2. **Gradient Price Must Use `bg-clip-text`:** Every main price must use the following pattern, no compromises:

```tsx
<p className="bg-linear-to-r from-white to-[#E9D5FF] bg-clip-text text-transparent font-plex font-bold text-[25px] leading-[28px]">
  Rp 72.500
</p>
```

3. **Active vs Default Card:** Implement this as an explicit variant. Don't rely solely on `:hover` — this design utilizes a _persistent active state_ (the first Flash Sale card is always highlighted).
4. **Page Background is not Pure Black:** Use `#0A0A0C` (slightly warm), not `#000000`. This is a detail often missed but significantly affects the visual vibe.
5. **Glow Shadow is a Signature:** The countdown timer has `box-shadow: 0 0 14.87px rgba(147,51,234,0.3)`. Ensure this glow is applied — without it, the timer feels "flat" and loses its premium identity.
6. **Two-Layer Stock Bar:** The stock bar has **2 layers** — a dark track `#0B051D` and a violet fill `#9333EA`. Make sure the fill width is calculated from the `current/total` ratio (e.g., 93/100 = 93%).
7. **Responsive Consideration:** This design is built desktop-first with a 1440px width. Mobile breakpoints must be considered separately — especially for the Flash Sale grid (5 columns → 2 columns on mobile) and the countdown timer (compact mode).
