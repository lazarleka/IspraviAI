# AGENTS.md

Instructions for any coding agent working in this repository (Claude Code, Codex, Cursor, Copilot, ...).
Claude Code also reads `CLAUDE.md`; the two files say the same thing, keep them in sync.

## Project
**Ispravi AI**: a learning app where the AI makes mistakes on purpose. Users type a topic or upload notes,
the AI generates cards with exactly one wrong segment each, users find the error, and friends play live
PvP matches. Product rules: `SPEC.md`. API and WebSocket contract: `docs/entities.md`.

## Layout
| Path | What |
| --- | --- |
| `frontend/` | React 19 + TypeScript + Vite + Tailwind v4 + shadcn/ui + React Router + TanStack Query |
| `beckend/` | FastAPI + SQLAlchemy 2 + Alembic + Pydantic 2 + kink DI, Poetry, PostgreSQL 17 |
| `docs/entities.md`, `beckend/docs/entities.md` | the same contract, kept identical |
| `SPEC.md` | product spec |
| `frontend/DESIGN.md` | visual identity: navy background, white cards, yellow marker |

Detailed rules: `frontend/CLAUDE.md` + `.claude/rules/` for the frontend, `beckend/CLAUDE.md` +
`beckend/.claude/rules/` + `beckend/.claude/decisions.md` (ADRs) for the backend. Read them before editing.

## Setup and commands
```bash
# frontend (repo root)
pnpm install
pnpm dev          # http://localhost:5173, proxies /api to :8000
pnpm typecheck && pnpm lint

# backend (beckend/)
docker compose up -d db
poetry install
poetry run migrate && poetry run seed
poetry run start  # http://localhost:8000/docs
poetry run lint && poetry run typecheck && poetry run test && poetry run alembic check
```

## Language
Code, comments, commits and docs in English. UI copy in Montenegrin (Latin, ijekavian).

## Rules
- Contract first: change `docs/entities.md`, copy it to `beckend/docs/entities.md`, then the code on both sides, in one change
- Backend: one package per domain (`app/<domain>/{api,models,repositories,schemas,services,exceptions}/`), thin endpoints, services behind a Protocol with `@inject`, repositories `flush()` and never `commit()`, camelCase schemas, `Page[T]` for lists, migrations for every model change, no SQL strings, `from __future__ import annotations` in every file
- Frontend: feature-first (`src/features/<name>/`), features never import each other, components never call `*-api.ts` directly (only through hooks), colors only from tokens in `src/index.css`, every data view has loading, empty and error states, no `any`
- Never send a card's answer to the client before it was answered; the PvP match is decided on the server
- Never read or print `.env` files; secrets only in `beckend/.env`; `.env.example` holds placeholders
- No destructive commands (`git push --force`, `git reset --hard`, `rm -rf`, `alembic downgrade`, `docker compose down -v`, `DROP`/`TRUNCATE`)
- Ask before adding a dependency; never edit `pnpm-lock.yaml` or `poetry.lock` by hand
- When unsure how a library works, read its current docs instead of guessing

## Done when
Frontend and backend checks above pass, the changed screen works at 375 px, and both `entities.md`
files match the code.
