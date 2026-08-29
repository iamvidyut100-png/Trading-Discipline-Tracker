# Trading Discipline Tracker

A mobile-first trading ritual that helps traders capture before, during, and after trade discipline with minimal typing.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Auth: cookie-based OIDC sessions with the project's managed identity provider
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/trading-discipline/src/` — React dashboard, trade flow, history, and analytics UI
- `artifacts/api-server/src/routes/trades.ts` — trade CRUD and analytics endpoints
- `artifacts/api-server/src/routes/auth.ts` — browser login, callback, logout, and current-user endpoint
- `artifacts/api-server/src/middlewares/authMiddleware.ts` — session loading and route identity
- `lib/api-spec/openapi.yaml` — source-of-truth API contract
- `lib/db/src/schema/trades.ts` — PostgreSQL trade record schema
- `artifacts/trading-discipline/src/index.css` — app theme and visual tokens

## Architecture decisions

- The web client uses generated React Query hooks from the shared OpenAPI contract.
- Trade answers are stored as JSONB so the check-in flow can evolve without migrations for every question.
- Screenshots are represented as an array of paths in the trade record; file-byte storage can be added independently.
- Trade records are scoped by the authenticated user's ID; private screenshot objects are readable only when referenced by that user's trade.

## Product

Users can review dashboard performance, complete a three-stage trade check-in, browse and filter history, inspect trade details, and view performance trends.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
