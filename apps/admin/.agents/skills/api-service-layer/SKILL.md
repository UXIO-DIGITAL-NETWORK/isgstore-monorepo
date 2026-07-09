---
name: api-service-layer
description: The typed data layer — axios services, TanStack Query hooks, response envelopes, and the mock->real swap seam. Activate when adding data fetching/mutations.
---
# API Service Layer (mock-backed, swappable)
Authoritative: `context/system_architecture.md §1, §4.4, §6`.
- **Envelopes** (`src/types/api.type.ts`): `ApiResponse<T>` (single/action) and `PaginatedResponse<T>` (Laravel paginator — `{ data, links, meta }`).
- **Service** (`features/<f>/api|services/`) exposes a typed interface, e.g. `transactionsService.list(params): Promise<PaginatedResponse<Transaction>>`. This phase, back it with typed mock fixtures in `features/<f>/data/`; later swap the body to `api.get/post(...)` — hooks/UI untouched.
- **Hook** (`features/<f>/hooks/`) wraps the service in `useQuery`/`useMutation`. Mutation pattern (from `features/auth/hooks/useLogin.ts`): `mutationFn -> onSuccess: update store -> navigate`.
- `api` (`src/lib/axios.ts`) injects Bearer, **unwraps `response.data`** (services return the payload directly), and auto-logs-out on 401. Server-side tables send `page`/`per_page`/`sort`/`filter[...]`/`search`.
- Never call `api` from a component; never scatter mocks in components; never move axios out of `src/lib/`. Recommend the `QueryClient` move to `src/lib/react-query.ts`.
Enforcement mirror: `.claude/rules/project.md`.
