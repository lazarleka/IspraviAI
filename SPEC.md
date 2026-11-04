# Ispravi AI: product spec

> Source of truth for **what** we build. `docs/entities.md` is the contract for **how** frontend and
> backend talk. When the two disagree, fix the spec first, then the contract, then the code.

## 1. Goal

A learning app where the AI makes mistakes on purpose. The user types a topic or uploads their own
study notes, the AI turns them into a deck of cards, and every card contains **exactly one wrong part**
in a sentence or a piece of code. The user taps the wrong part. Finding errors builds deeper knowledge
than re-reading, and it trains the skill of not trusting AI blindly.

Built for the AI-DEV 2026 hackathon (presentation on Saturday, 7 November 2026, 7 minutes, demo video ≤ 1 min).

## 2. Users

- Students (high school and university) who learn from their own notes, including programming
- Mostly on a phone (mobile-first), sometimes on a laptop
- UI language: Montenegrin (Latin script, ijekavian). Card content follows the language of the source material.

## 3. Features (MVP)

| # | Feature | Priority |
| --- | --- | --- |
| F1 | Register, sign in, unique username | must |
| F2 | Create a deck from a typed topic or an uploaded file (PDF, TXT, MD) | must |
| F3 | Study a deck: find the error, reveal, explanation, source | must |
| F4 | Spaced repetition: missed cards come back, with the error in a different place | must |
| F5 | Friends: search by username, send, accept, decline, remove | must |
| F6 | PvP match between two friends, live, on a new topic | must |
| F7 | Progress per deck (percentage known) and a "due today" count | should |
| F8 | "No error" cards (about 1 in 10) | should |
| F9 | Code cards with syntax highlighting | should |

**Out of scope for the hackathon:** teachers and classes, photos of notebooks (OCR), shared or public
decks, global leaderboard, push notifications outside the app, payments, native mobile apps.

## 4. Screens

| Route | Screen | Notes |
| --- | --- | --- |
| `/login`, `/register` | Sign in / sign up | register asks for email, password, display name, username |
| `/` | Home | "Danas za ponavljanje: N kartica", list of decks with subject color and progress, "Ubaci skriptu" |
| `/decks/new` | New deck | tab "Tema" (text field) or "Skripta" (file upload); card count 10/15/20 |
| `/decks/:id` | Deck | title, progress, "Uči", list of cards (after they were played) |
| `/study/:deckId` | Study session | one card at a time (see §5) |
| `/friends` | Friends | search, incoming requests, friend list with online dot and "Izazovi" |
| `/match/:id` | PvP match | live screen (see §6) |
| `/match/:id/result` | Match result | winner, scores, missed cards, "Revanš" |

Design (navy and yellow, the yellow "marker") is described in `frontend/DESIGN.md`.

## 5. Study mode

### Card
- A card is a list of **segments** (2–8 short phrases, or code lines/fragments). Exactly one segment is
  wrong, or none for a "no error" card.
- The user taps a segment, then "Provjeri". Or taps "Nema greške".
- Card kinds: `text` and `code` (code cards carry a `language`, e.g. `c`, `python`, `java`).

### Scoring
| Outcome | Points | Next review |
| --- | --- | --- |
| Correct on the first try | +10 | moves up one box |
| Correct on the second try | +5 | stays in the same box |
| Wrong twice | 0, the answer is shown | back to box 1 |

### Reveal
After the answer: the wrong segment is struck through, the correct text is shown next to it, plus a
one-sentence explanation and the source reference (e.g. "skripta, str. 12").

### Spaced repetition (Leitner)
- Boxes 1–4, intervals: box 1 = same day, box 2 = 3 days, box 3 = 7 days, box 4 = 14 days.
- Every fact is generated as **2 variants** with the error in different segments (`factKey` groups them).
  When a fact comes back, the user gets the variant they saw least recently, so they cannot remember
  the position of the error.
- "Due today" = cards whose `dueAt` ≤ now, across all of the user's decks.

## 6. PvP mode

### Rules agreed with the team
- Only **friends** can challenge each other (the server checks it).
- Both players are online and play **live, at the same time**.
- The challenger types a **new topic**; the AI generates a fresh deck just for that match.
- Both players get the **same card at the same moment**. **The first correct answer takes the points.**
- Both players have a **"Ne znam"** button. The match moves to the next card only when **both** clicked it
  (or the card ended another way, see below).
- Every card has a **time limit of 20 seconds**.

### Card flow
A card ends when any of these happens first:
1. a player taps the correct segment → that player wins the card;
2. both players are "done" with the card (each either clicked "Ne znam" or tapped a wrong segment);
3. the 20 seconds run out → nobody wins the card.

A wrong tap locks that player out of the current card (the other player keeps playing it).
After a card ends, both see the answer and explanation for 3 seconds, then the next card starts.

### Points
| Event | Points |
| --- | --- |
| Correct answer (first) | +10, plus a speed bonus of up to +5 (`round(5 × remaining / 20)`) |
| Three cards won in a row | +5 combo bonus |
| Wrong tap | −5 |
| "Ne znam", timeout | 0 |

The higher score wins; equal scores are a draw. Cards nobody answered correctly are added to both players'
review queue.

### Challenge flow
1. Challenger picks a friend, types a topic, picks 5, 10 or 15 cards (default 10) and sends the challenge.
2. The server starts generating the deck immediately.
3. The friend receives the invite live (in-app) and can accept or decline. An invite expires after 2 minutes.
4. When the friend accepts and the deck is ready, both see a 3-2-1 countdown and the match starts.

### Disconnects
A player who loses the connection has 15 seconds to come back; otherwise the match ends and the other
player wins (`abandoned`).

### Open questions (defaults used until the team decides)
- Wrong tap: locked out for the card and −5 (alternative: −5 and may try again).
- Head-to-head record between two friends (wins/losses) on the friends screen: **should**, not must.

## 7. AI card generation

Provider: Google Gemini API (free tier) behind a Protocol, so it can be swapped (see ADR-020 in
`beckend/.claude/decisions.md`). The API key lives only in `beckend/.env`.

Pipeline (backend, runs as a background task, deck `status` goes `generating` → `ready` | `failed`):
1. **Extract text**: from the typed topic, or from the uploaded file (PDF text layer, TXT, MD).
   Limits: file ≤ 10 MB, text ≤ 50 000 characters (longer text is cut to the first 50 000).
2. **Extract facts**: the model returns a list of key facts, each with a source reference when the text has one.
3. **Generate cards**: for each fact, 2 variants as strict JSON (segments, wrongIndex, correctText,
   explanation, errorType, sourceRef). About 1 in 10 cards has no error (`wrongIndex = null`).
4. **Validate** (code, not the model): 2–8 segments, `wrongIndex` in range or null, the wrong segment
   differs from `correctText`, no empty strings. Invalid cards are dropped.
5. **Verify** (second model call): checks that exactly one segment is wrong and the rest agrees with the
   source. Cards that fail are dropped. If fewer than the requested number survive, the deck is still
   `ready` with what survived (at least 5), otherwise `failed`.

Error types: `fact` (wrong term, date, number), `calculation`, `logic`, `fake_source`, `exaggeration`,
`code_bug` (wrong operator, off-by-one, wrong return value, wrong condition).

Users can report a card ("Prijavi karticu"); a reported card is hidden from that user.

## 8. Architecture

```
frontend/  React 19 + TS + Vite + Tailwind v4 + shadcn/ui + TanStack Query   (http://localhost:5173)
   │  REST  /api/...        (Vite proxies /api to :8000)
   │  WebSocket /api/ws     (presence, challenge invites, live match)
beckend/   FastAPI + SQLAlchemy 2 + Alembic + Pydantic 2 + kink DI           (http://localhost:8000)
   │
   ├─ PostgreSQL 17 (docker compose, `beckend/docker-compose.yml`)
   └─ Gemini API (card generation)
```

- **Backend domains** (`beckend/app/<domain>/`): `auth`, `users`, `decks` (decks + cards + generation),
  `study` (progress, reviews), `friends`, `matches` (challenges, matches, answers, the live engine).
- **Live match engine**: in memory in the API process (one uvicorn worker), authoritative: it holds the
  timer, decides who answered first by server receive time, and never sends `wrongIndex` to a client
  before the card ends. Results are written to the database at the end of every card (ADR-019).
- **Frontend features** (`frontend/src/features/<name>/`): `auth`, `decks`, `study`, `friends`, `matches`.
  The WebSocket client lives in `frontend/src/lib/realtime.ts` (shared by `friends` and `matches`).

## 9. Non-functional

- Mobile-first, works at 375 px; touch targets ≥ 44 px
- Generation of a 10-card deck finishes in under 30 seconds
- A tap in a match reaches the opponent's screen in under 300 ms on the same network
- No secrets in git; the AI key and JWT secret only in `beckend/.env`
- The card's correct answer is never sent to the client before the card ends (study and match)

## 10. Plan until Saturday

| Day | Goal |
| --- | --- |
| Wed 4.11. | Docs, Postgres, auth + username, decks + generation pipeline (mocked model first, then Gemini) |
| Thu 5.11. | Study screen, scoring, spaced repetition, home screen; friends |
| Fri 6.11. | PvP: challenge, WebSocket, match engine, match screen, result; record the demo video |
| Sat 7.11. | Morning: bug fixes, seed demo data, rehearse the 7-minute pitch |

## 11. Demo script (pitch)

1. Upload real study notes live, get a deck in about 20 seconds.
2. Someone from the jury looks for the error on the first card.
3. Show the same fact coming back with the error in a different place.
4. Two team members play a PvP match live on two phones, projected side by side.
