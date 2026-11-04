# Ispravi AI

A learning app where the AI makes mistakes on purpose: students type a topic or upload their notes, get a
deck of cards with exactly one wrong part each, find the error, and play live PvP matches against friends.

Read these before any non-trivial change:
- @SPEC.md: what we build (features, screens, study and PvP rules, AI pipeline, plan until Saturday)
- @docs/entities.md: the contract between frontend and backend (fields, routes, status codes, WebSocket messages)
- `frontend/CLAUDE.md` when working in `frontend/`, `beckend/CLAUDE.md` when working in `beckend/`
- `frontend/DESIGN.md` before any UI change

## Monorepo layout
- `frontend/`: React 19 + TypeScript + Vite + Tailwind v4 + shadcn/ui + TanStack Query (pnpm workspace package)
- `beckend/`: FastAPI + SQLAlchemy 2 + Alembic + Pydantic 2 + kink DI, Poetry, PostgreSQL (the folder name is `beckend`, keep it)
- `docs/entities.md` and `beckend/docs/entities.md`: the same contract, kept identical
- `SPEC.md`: product spec; `AGENTS.md`: the same rules for other coding agents

## Language
- Code, identifiers, comments, commit messages and docs: English
- UI copy (labels, buttons, messages the user sees): Montenegrin, Latin script, ijekavian (`Nađi grešku`, `Provjeri`, `Ne znam`)
- Card content: the language of the source material (the AI is told to keep it)
- You may talk to me in any language

## Commands
Frontend (from the repo root):
- `pnpm install`, `pnpm dev` (http://localhost:5173), `pnpm typecheck`, `pnpm lint`, `pnpm build`, `pnpm format`

Backend (from `beckend/`):
- `docker compose up -d db`: PostgreSQL 17 on localhost:5432
- `poetry install`, `poetry run migrate`, `poetry run seed`, `poetry run start` (http://localhost:8000/docs)
- `poetry run lint`, `poetry run typecheck`, `poetry run test`, `poetry run alembic check`
- `poetry run makemigrations "<what>"` after a model change, then read the generated file

Run both servers at once; Vite proxies `/api` (REST and the `/api/ws` WebSocket) to port 8000.

## Working in the monorepo
- One feature = one change across `beckend/`, `frontend/` and both `entities.md` files
- Order for a feature: SPEC.md section → contract in `docs/entities.md` (copy to `beckend/docs/entities.md`) → backend (model, migration, service, endpoint, tests) → frontend (types, api, hooks, components, route)
- The contract is changed first and on purpose; never let code and `entities.md` drift
- Secrets (Gemini API key, JWT secret, database password) live only in `beckend/.env`; never read, print or commit it
- A new dependency is proposed first (name, why, alternative); I run `pnpm add` / `poetry add`

## Rules that cut across both sides
- The server never sends a card's answer (`wrongIndex`, `correctText`, `explanation`, ...) before the user answered or the match card ended
- PvP is authoritative on the server: timer, who was first, points. The client only renders events
- Only friends can challenge each other; the backend checks it, the UI only hides the button
- Mobile-first: every screen works at 375 px

## Done when
- Frontend: `pnpm typecheck` and `pnpm lint` pass; the page was checked with Playwright at 375 px and 1440 px
- Backend: `poetry run lint && poetry run typecheck && poetry run test` pass and `poetry run alembic check` is clean
- Both `entities.md` files describe what the code does, and are identical
