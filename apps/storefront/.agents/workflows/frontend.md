---
description: Develop minimalist, modern React interfaces based on a Feature-Based architecture and the prepared state.
---

# Workflow: Frontend Development

**Objective:** Build component-based React user interfaces (UI) with a modern/minimalist design aesthetic, tightly integrated with the feature architecture.
**Trigger:** When the API integration/hooks foundation is ready, or when the user specifically requests UI/UX implementations.
**Execution Order:** @frontend -> @integration

**Steps:**

1. **@frontend** creates new `.tsx` files inside `src/features/[feature-name]/components/` or `pages/` following the Feature-Based architecture rules. Cross-importing between features that violates domain boundaries is strictly prohibited.
2. **@frontend** defines strict TypeScript interfaces for component props.
3. **@frontend** builds the UI structure. **CRITICAL RULE:** Built-in Design System components (like custom `Link`, `Box`, `Container`, `Text`) MUST be used as-is and MUST NOT be converted into pure Tailwind utility classes.
4. **@frontend** integrates form components with libraries like React Hook Form along with Zod resolvers, and consumes custom hooks (TanStack Query) from **@backend** to handle loading states, error boundaries, and data submission.
5. Once the UI is built and hooked to the TanStack Router routes, **@frontend** passes execution to **@integration** (or @qa) for wiring and testing.
