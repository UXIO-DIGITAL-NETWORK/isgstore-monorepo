---
name: form-with-zod
description: Forms with React Hook Form + Zod + shadcn Field — schemas/types separation, resolver usage, no inline validation. Activate for any form (filters, refund/override dialogs, settings).
---
# Forms (RHF + Zod)
Authoritative: `context/system_architecture.md §4.5`.
- All forms use `react-hook-form` + `@hookform/resolvers/zod`. **No manual validation in JSX.**
- **Zod schemas -> `features/<f>/schemas/`**; **static types -> `features/<f>/types/`** (usually `z.infer<typeof schema>`). Pattern reference: `features/auth/schemas/auth.schema.ts`.
- Markup uses shadcn `Field`/form primitives + our `common/` wrappers; inputs/selects/date-range from shadcn.
- Submit via a mutation hook (`useMutation`) -> `onSuccess` toast + invalidate/refetch queries; destructive submits get a confirm dialog first.
- Keep error messages in the schema (`z.string().min(..., "message")`), localized to the copy needed.
- Test-first (`rules/testing-strategy.md`): write the failing validation-behavior test before wiring the form — empty/invalid submit surfaces the schema's error messages via accessible labels, valid submit calls the mutation once. Implement to green.
