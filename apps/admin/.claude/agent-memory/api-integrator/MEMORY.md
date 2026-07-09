# API Integrator — Project Memory

> **STATUS:** backend is **separate and not built yet**. Deliver a typed data layer where the mock->real swap is one file per service. Only `auth` has a real service today.

## Contracts
- `src/types/api.type.ts`: `ApiResponse<T> = { status: "success"|"error"; message; data: T }`, `ApiError = { status; message; errors }`. **Add `PaginatedResponse<T>`** = Laravel paginator `{ data: T[]; links: {first,last,prev,next}; meta: {current_page,from,last_page,path,per_page,to,total} }`.
- Global entities: `src/types/models/` (migrate `src/models/user.model.ts` here). Provisional (pending API): `Transaction`, `BalanceMovement`, `Game`, `Product`, view-models `DashboardSummary`/`FinanceSummary` (`product_requirements.md §6`).

## Patterns (reference the shipped auth feature)
- Service returns the **payload directly** (interceptor unwraps `response.data`): `features/auth/services/auth.service.ts` -> `api.post("/login", data)` typed `Promise<AuthApiResponse>`.
- Mutation hook: `features/auth/hooks/useLogin.ts` -> `useMutation({ mutationFn, onSuccess: (res, vars) => { setToken(res.data.token, vars.remember); navigate({to:"/dashboard"}); } })`.
- Query hook (new): `useQuery({ queryKey:[...], queryFn: () => service.list(params) })`; server-side tables send `page`/`per_page`/`sort`/`filter[...]`/`search`, type against `PaginatedResponse<T>`.

## Mock-swap seam (this phase)
- Each feature service exposes a typed interface (e.g. `transactionsService.list(params): Promise<PaginatedResponse<Transaction>>`), implemented against **typed fixtures in `features/<f>/data/`** (optionally a small artificial delay). Later, replace only the service body with real `api.*` calls. Optionally gate via `ENV.USE_MOCKS`. **Never put mock data in components.**

## Wiring facts
- `api` in `src/lib/axios.ts` (STAYS): Bearer from `useAuthStore`, unwraps `response.data`, on 401 (not `/login`) `clearAuth()` + redirect `/login`. Base URL `ENV.API_BASE_URL` (`src/config/env.ts`, Laravel dev `127.0.0.1:8000/api/`).
- `QueryClient` is inline in `src/main.tsx`; `src/lib/react-query.ts` is empty -> move the client + defaults there.
- `useAuthStore` (`src/store/useAuthStore.ts`): `token` in `access_token` cookie via `js-cookie`, `setToken(token, remember)` sets expiry (30d vs session). **Extend with `roles`/`permissions`** hydrated from login/`me` for RBAC (`super-admin` = `["*"]`).
- Uploads: multipart `FormData` helper (no S3). Polling: `refetchInterval`, stop on terminal status. Never call the payment/provider gateway directly.

## Decisions log
- Two envelopes: `ApiResponse<T>` (single/action) + `PaginatedResponse<T>` (lists). Provisional entity fields until the real contract lands — revise then, and log it.
