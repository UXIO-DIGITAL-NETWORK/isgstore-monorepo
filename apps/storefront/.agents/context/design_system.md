# Design System Brief: Multi-Game Top-Up Platform

**Target Audience:** UI/UX Designer, Frontend Developer
**Design Theme:** E-sports Modern, Premium Dark Mode, Cool-Toned, Mobile-First
**Styling Framework:** Tailwind CSS + Hero UI (NextUI)
**Visual Reference:** Zelpoint.com

## 1. Overview

This document defines the visual standards and User Interface (UI) components for the Game Top-Up project. The goal is to closely emulate the premium, e-sports aesthetic of the reference site, focusing on a deep black background, cool blue accents, and highly immersive image-based game cards.

## 2. Design Principles

- **Immersive Visuals:** Rely heavily on high-quality game banners and thumbnails. Cards should use dark gradient overlays to ensure text readability against rich images.
- **Rounded & Friendly:** Utilize fully rounded (pill-shaped) inputs for search bars and softly rounded corners for game cards to balance the harshness of the dark mode.
- **Subtle Surfaces:** Surfaces (like cards or navbars) shouldn't be overly bright. They should blend closely with the background, using very subtle borders or slight lightness differences to establish hierarchy.

## 3. Color Palette

We use a "True Dark" approach with a cool-toned primary action color, matching the mascot/branding style of modern top-up platforms.

| Category           | Color Name    | Tailwind Class     | Hex Code  | Primary Usage                                                                 |
| :----------------- | :------------ | :----------------- | :-------- | :---------------------------------------------------------------------------- |
| **Primary/Accent** | Cyan Blue     | `bg-sky-500`       | `#0ea5e9` | Active navigation links, main action buttons, active borders, mascot accents. |
| **Background**     | True Black    | `bg-neutral-950`   | `#0a0a0a` | Overall main background for the application.                                  |
| **Surface**        | Dark Charcoal | `bg-neutral-900`   | `#171717` | Search bar backgrounds, subtle card backgrounds, sub-navigation bar.          |
| **Text Primary**   | Pure White    | `text-white`       | `#ffffff` | Section headings ("BEST SELLER"), Game Titles, active tabs.                   |
| **Text Secondary** | Muted Gray    | `text-neutral-400` | `#a3a3a3` | Search placeholders, publisher names under game titles, inactive nav items.   |

## 4. Typography

Fonts should be a clean, geometric _sans-serif_ (Recommendation: Inter or Plus Jakarta Sans).

- **Heading 2 (H2):** Bold, White. Used for section titles (e.g., "BEST SELLER 🔥", "Mobile Game").
- **Card Titles:** Semi-bold, White, small text (e.g., "Mobile Legends Indo...").
- **Card Subtitles:** Regular, Muted Gray, extra small text (e.g., "Moonton").
- **Navigation Links:** Medium weight. Muted Gray for inactive, Cyan Blue for active.

## 5. Core UI Components

Based on the visual breakdown, here is the component guide mapped to **Hero UI** and Tailwind:

- **A. Search Bar (Navbar):** \* Shape: Fully rounded (`rounded-full`).
  - Style: Dark Charcoal background (`bg-neutral-900`), no visible border, Muted Gray placeholder text, search icon on the left.
- **B. Sub-Navigation Bar:**
  - Layout: Horizontal flex with spacing (`gap-6`).
  - Style: Text paired with thin line-icons. Active item uses Cyan Blue text.
- **C. Game Cards (Katalog):** \* Layout: Horizontal/Landscape orientation.
  - Shape: Softly rounded corners (`rounded-xl` or `rounded-2xl`).
  - Visuals: Full image background. **Crucial:** Add a linear gradient overlay (`bg-gradient-to-t from-black/80 to-transparent`) at the bottom half to ensure the white game title is always readable regardless of the image behind it.
- **D. Buttons (Checkout):** \* Primary Button: Use `<Button color="primary" />` from Hero UI (configured to use the Cyan Blue primary color). White text, `rounded-full` or `rounded-xl`.
- **E. Layout & Spacing:** \* Ample padding between sections (`py-8` or `py-12`).
  - Left-aligned section headers.
