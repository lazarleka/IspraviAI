# Frontend

React 19 + TypeScript + Vite + Tailwind CSS v4 + shadcn/ui + React Router + TanStack Query.
Design is described in @DESIGN.md, entities in @../docs/entities.md, the product in @../SPEC.md.
All paths below are relative to `frontend/`.

## Ispravi AI specifics
- Features: `auth`, `decks`, `study`, `friends`, `matches` (one folder each in `src/features/`); delete the
  `listings` example once the first real feature exists
- The REST API is the FastAPI backend in `../beckend/` (Vite proxies `/api` to :8000); `*-api.ts` files call
  `fetch('/api/...')` and read paginated lists from `items`. Mock data is only for screens whose backend route
  does not exist yet
- The token is kept in memory plus `localStorage` (`src/lib/auth-token.ts`) and sent as `Authorization: Bearer`
- Realtime: one WebSocket per user in `src/lib/realtime.ts` (connect to `/api/ws`, send `auth` first, reconnect
  with backoff, typed messages from `docs/entities.md`); `friends` and `matches` subscribe through their own hooks
- The match screen renders server events only: the timer counts down to `endsAt` from the server, points and
  "who was first" come from `card_end`; never compute the result on the client
- UI copy is Montenegrin (Latin, ijekavian); code and comments stay English

## Feature-first
Every feature (listings, users, messages…) lives in `src/features/<name>/` and has only the
subfolders it needs: `api/`, `components/`, `hooks/`, `types.ts`. Features do not import each
other; a route in `src/app/routes/` combines them on one page. Shared code goes to
`src/components/ui` or `src/lib`, and only once at least two features use it.
Dependency direction: shared code -> features -> app, never the other way around.

## Structure
- `src/app/router.tsx`: all routes; `src/app/providers.tsx`: global providers (TanStack Query)
- `src/app/routes/`: one file per route, only combines features and layout
- `src/features/<name>/types.ts`: entity types of that feature
- `src/features/<name>/api/<name>-api.ts`: the only place that fetches data (mock for now)
- `src/features/<name>/api/use-<name>.ts`: TanStack Query hooks around the API
- `src/features/<name>/components/`: components of that feature (e.g. `listing-card.tsx`)
- `src/components/ui/`: shadcn/ui components, added with `pnpm dlx shadcn@latest add <name>` (run inside `frontend/`)
- `src/components/layout/`: app layout (header, navigation)
- `src/lib/`: `utils.ts` (`cn`) and `mock-db.ts` (mock database and delay)

## Rules
- A feature never imports another feature; `src/components` and `src/lib` never import from `src/features` or `src/app`
- No barrel `index.ts` files: import the file directly (`@/features/listings/components/listings-list`)
- Components and routes never call `*-api.ts` directly, only through a hook from `use-<name>.ts`
- Use an existing component from `src/components/ui` first, only then create a new one
- Colors, fonts and radius only from tokens in `src/index.css`, no hex values in components
- Every list and data page has loading, empty and error states
- No `any` and no `!` (non-null assertion)
- If you are not sure how a library API works (Tailwind v4, React Router 8, TanStack Query 5), check the docs via Context7, do not guess.

## Done when
- `pnpm typecheck` and `pnpm lint` pass
- The page was opened with Playwright MCP and screenshots at 375 px and 1440 px match DESIGN.md
- No errors in the browser console
