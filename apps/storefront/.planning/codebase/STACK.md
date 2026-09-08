# STACK 

This document describes the primary technology stack, languages, frameworks, and core dependencies used in the ISG Store Multi-Game Top-Up Platform platform frontend.

## Core Stack
- **Language**: TypeScript (`~5.9.3`)
- **Framework**: React 19 (`^19.2.0`)
- **Build Tool**: Vite (`^7.3.1`)
- **Environment**: Node.js ecosystem

## Application Layer
- **Routing**: @tanstack/react-router (`^1.162.8`) - File-based routing with strict type-safety
- **Data Fetching / Server State**: @tanstack/react-query (`^5.90.21`)
- **Client State Management**: Zustand (`^5.0.11`)

## Styling & UI
- **CSS Framework**: Tailwind CSS v4 (`^4.2.1`) using `@tailwindcss/vite`
- **UI Libraries**: 
  - Hero UI (`@heroui/react` `^3.0.2`)
  - base-ui (`@base-ui/react` `^1.2.0`)
  - shadcn/ui primitives (`radix-ui`)
- **Styling Utilities**: 
  - `class-variance-authority` (CVA)
  - `clsx`
  - `tailwind-merge`

## Forms & Validation
- **Form Handling**: `react-hook-form` (`^7.71.2`)
- **Validation Schema**: `zod` (`^4.3.6`)
- **Resolvers**: `@hookform/resolvers` (`^5.2.2`)

## Additional Utilities
- **HTTP Client**: `axios` (`^1.13.5`)
- **Date Formatting**: `date-fns` (`^4.1.0`)
- **Icons**: `lucide-react` (`^0.575.0`)
- **Theme/Dark Mode**: `next-themes` (`^0.4.6`)
- **UI Components Ext**: `embla-carousel-react`, `input-otp`, `react-day-picker`, `sonner`, `recharts`
