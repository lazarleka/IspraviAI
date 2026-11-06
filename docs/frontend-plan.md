# Plan za frontend: Ispravi AI

## Kontekst
Hakaton je u subotu, 7.11. Frontend radi **jedna osoba**. Backend za sada ima samo prijavu
(`/api/auth/*`), a nema rute za špilove, kartice, prijatelje ni PvP. Zato se frontend radi **prvo sa mock
podacima, pa se prebacuje na pravi API**:
- Svaki ekran prvo radi sa lažnim podacima iz `src/features/<x>/api/<x>-api.ts`, tačno po
  `docs/entities.md`.
- Kad backend ruta bude gotova, mijenja se **samo taj jedan fajl**. Hookovi, komponente i ekrani ostaju isti.

Cilj: do petka popodne da rade svi ekrani iz `SPEC.md` §4, u dizajnu teget i žuta (`frontend/DESIGN.md`),
uključujući PvP sa izmišljenim protivnikom, i to dovoljno dobro za demo video.

## Pravila kojih se držimo (već postoje u repou)
- Svaki feature ima svoj folder `src/features/<name>/` sa `types.ts`, `api/<name>-api.ts`,
  `api/use-<name>.ts` i `components/`. Feature-i ne importuju jedni druge, a route ih spaja.
  Ovo provjerava `pnpm lint` (`scripts/check-boundaries.mjs`).
- Šablon je primjer `src/features/listings/`: `delay` i `NotFoundError` iz `src/lib/mock-db.ts`, `useQuery`
  i `useMutation` sa `invalidateQueries`.
- Komande `/new-feature` i `/new-page` (`.claude/commands/`) vode kroz svaki korak. Prije commita ide
  `/check`, a `ui-reviewer` za veće ekrane.
- Boje se pišu samo preko tokena iz `src/index.css` (`bg-primary`, `bg-marker`, `bg-success-surface`,
  `text-subject-biology`...), bez hex vrijednosti u komponentama.
- Tekst u aplikaciji je na crnogorskom, a kod na engleskom.
- **Klijent nikad ne dobija tačan odgovor prije nego što korisnik odgovori.** To važi i za mock:
  `next()` vraća `CardQuestion`, a tek `answer()` vraća `CardAnswer`.

## Koraci (redom, jedna osoba)

### 0. Priprema (srijeda uveče, ~30 min)
- `pnpm install`
- Dodati shadcn komponente koje fale: `tabs`, `progress`, `dialog`, `sonner` (toast), `avatar`.
  Komanda: `pnpm dlx shadcn@latest add ...` u `frontend/`.
- `index.html`: `lang="sr-Latn-ME"` i naslov „Ispravi AI“.

### 1. Zajednički temelj (srijeda)
- `src/lib/api-client.ts`: `apiFetch()` oko `fetch('/api/...')`. Dodaje `Authorization: Bearer`, a greške
  pretvara u `ApiError {message, code, fieldErrors}` (oblik greške iz `entities.md`). Tu je i tip `Page<T>`.
- `src/lib/auth-token.ts`: čuva token u memoriji i u `localStorage`.
- `src/components/layout/app-layout.tsx`, prepraviti:
  - teget pozadina i logo „Ispravi AI“,
  - **donja navigacija** za telefon: Početna, Prijatelji,
  - na desktopu je sadržaj u uskoj koloni (max ~480 px), kao aplikacija.
- `src/app/require-auth.tsx`: ako korisnik nije prijavljen, šalje ga na `/login`.

### 2. Feature `auth` (srijeda) — **odmah pravi API** (backend ga već ima)
- `types.ts` (User, AuthResponse), `auth-api.ts` (register, login, me), `use-auth.ts`
- Ekrani `/login` i `/register` (react-hook-form + zod). Greške se prikazuju pored polja, iz `fieldErrors`.
  Registracija šalje i `username`. Dok backend to polje ne doda, prijava radi i bez njega.
- Obrisati primjer `listings` i njegove rute.

### 3. Zajedničke komponente kartice (četvrtak ujutru)
Kartice koriste i `study` i `matches`, pa idu u `src/components/card/`:
- `segment-card.tsx`: bijela kartica sa dijelovima na koje se tapka (`button`), stanja `idle`, `selected`
  (žuti marker), `wrong`, `correct` i `disabled`, uz traku u boji predmeta.
- `code-segments.tsx`: varijanta za kod, sa monospace fontom, brojevima linija i tamnom podlogom (`bg-code`).
- `answer-reveal.tsx`: precrtana greška, tačan tekst, objašnjenje sa sijalicom, izvor.
- `subject-badge.tsx` i `subject-icon.tsx`: boja i ikonica (lucide) za svaki predmet.

### 4. Feature `decks` (četvrtak)
- `types.ts` (Deck, Subject, DeckStatus). Mock `decks-api.ts`: `list`, `get`, `create`, `upload`, `remove`,
  sa 4–5 realnih špilova (Biologija, Istorija, Programiranje C...). Novi špil je 3 s u stanju `generating`,
  pa prelazi u `ready`.
- `use-decks.ts`: `useDeck(id)` ponavlja upit svake 2 s dok je `status === 'generating'`
  (`refetchInterval`).
- Komponente: `deck-row`, `deck-list` (učitavanje, prazno, greška), `new-deck-form` (tabovi „Tema“ i
  „Skripta“, izbor fajla, broj kartica 10/15/20), `generating-state` („Pravim kartice…“).
- Ekrani:
  - `/`: početni ekran, žuti blok „Danas za ponavljanje“ (iz `study`) i lista špilova,
  - `/decks/new`,
  - `/decks/:id`.

### 5. Feature `study` (četvrtak) — **najvažniji ekran za demo**
- `types.ts` (CardQuestion, CardAnswer, AnswerResult). Mock `study-api.ts`: `today`, `next`, `answer`,
  `report`, sa ~15 kartica teksta i koda i po 2 varijante iste činjenice. Mock prati Leitner kutije u memoriji.
- `hooks/use-study-session.ts`, stanja sesije:
  izbor dijela → provjera → (ako je pogrešno) drugi pokušaj → otkrivanje odgovora → sljedeća kartica → rezime.
- Komponente: `study-header` (predmet, „4 / 12“, traka napretka), `answer-actions` („Nema greške“ i
  „Provjeri“), `result-banner` (+10 / +5 / 0), `session-summary`.
- Ekran `/study/:deckId`. Animacije: marker se „docrta“, kod greške kartica se kratko protrese, i obje
  poštuju `prefers-reduced-motion`.

### 6. Feature `friends` (petak ujutru)
- `types.ts` (PublicUser, Friendship). Mock `friends-api.ts`: `search`, `list`, `requests`, `sendRequest`,
  `accept`, `remove`.
- Komponente: `user-search` (traži dok kucaš, od 2 slova), `request-list` (Prihvati/Odbij), `friend-list`
  (zelena tačka za online, dugme „Izazovi“).
- Ekran `/friends`.

### 7. Realtime sloj (petak ujutru)
- `src/lib/realtime.ts`: jedan interfejs, `connect()`, `send(msg)` i `subscribe(type, handler)`, sa tipovima
  poruka iz `entities.md` (WebSocket dio). Ima dvije implementacije:
  - `ws`: pravi WebSocket na `/api/ws`. Prva poruka je `auth`, ponovno povezivanje ide sa pauzom, a ping
    ide svakih 20 s.
  - `mock`: lažni server u browseru sa **botom protivnikom**. Bot odgovara za 3–15 s, nekad tačno, nekad
    pogrešno, nekad klikne „Ne znam“, i šalje `card_start`, privatni `answer_result`, `card_end`, `match_end`.
    Tako se PvP može razvijati i snimiti bez backenda.
- Implementacija se bira preko `VITE_REALTIME=mock|ws` (podrazumijevano `mock`).

### 8. Feature `matches` (petak)
- `types.ts` (Challenge, Match, poruke za meč). Mock `matches-api.ts`: `createChallenge`, `pending`,
  `accept`, `decline`, `get`, `result`.
- `hooks/use-match.ts`: reducer koji obrađuje poruke sa servera i drži stanje meča (kartica, `endsAt`,
  rezultati, „ko je bio brži“). **Klijent ništa ne računa sam.**
- Komponente:
  - `challenge-dialog` (tema i 5/10/15 kartica),
  - `challenge-toast` (stigao izazov: Prihvati/Odbij),
  - `scoreboard` (ti lijevo, protivnik desno),
  - `timer-bar` (20 s, crvena pod 5 s),
  - `match-status` („Marko je bio brži“, „Marko ne zna“),
  - `countdown` (3, 2, 1),
  - `match-result`.
- Spajanje (u `src/app`, jer feature-i ne smiju jedan drugog):
  - `/friends` dobija `friend-list` iz `friends` i dugme koje otvara `challenge-dialog` iz `matches`,
  - novi `src/app/authed-layout.tsx` = `AppLayout` + `challenge-toast`, da izazov stigne na bilo kom ekranu.
- Ekrani `/match/:id` i `/match/:id/result` (pobjednik, rezultat, kartice koje niste znali, „Revanš“).

### 9. Prebacivanje na pravi API (petak popodne, po potrebi)
Kad backend tim završi neku rutu, u odgovarajućem `*-api.ts` mock se zamjenjuje sa `apiFetch`, a liste
čitaju `items`. Na kraju se postavi `VITE_REALTIME=ws`. Ostali fajlovi se ne diraju.

### 10. Dorada i demo (petak uveče / subota ujutru)
- Demo podaci na crnogorskom: špilovi, kartice i dva prijatelja.
- Svi ekrani se provjeravaju sa Playwright na 375 px i 1440 px, a pregleda ih `ui-reviewer` agent.
- Snimanje videa do 1 minuta: ubaci skriptu → kartica → greška → PvP.

## Raspored
| Kad | Koraci |
| --- | --- |
| Srijeda uveče (4.11.) | 0, 1, 2 |
| Četvrtak (5.11.) | 3, 4, 5 |
| Petak (6.11.) | 6, 7, 8, a popodne 9 i 10 |
| Subota ujutru (7.11.) | ispravke, proba prezentacije |

Ako ponestane vremena, režemo ovim redom: varijante sa novom greškom → prijava kartice →
`/decks/:id` detalji → upload fajla (ostaje samo „Tema“). Učenje i PvP se ne režu.

## Ključni fajlovi
- Novi: `src/lib/api-client.ts`, `src/lib/auth-token.ts`, `src/lib/realtime.ts`, `src/components/card/*`,
  `src/features/{auth,decks,study,friends,matches}/**`, `src/app/require-auth.tsx`,
  `src/app/authed-layout.tsx`, a u `src/app/routes/` po jedan fajl za svaki ekran
- Mijenjaju se: `src/app/router.tsx`, `src/components/layout/app-layout.tsx`, `index.html`
- Brišu se: `src/features/listings/`, `src/app/routes/listings.tsx`
- Postojeći fajlovi koji se koriste: `src/lib/mock-db.ts` (`delay`, `NotFoundError`), `src/lib/utils.ts` (`cn`),
  `src/components/ui/*`, `src/app/providers.tsx`

## Provjera
- Poslije svakog koraka: `pnpm typecheck` i `pnpm lint` (uključuje provjeru granica između feature-a)
- Poslije svakog ekrana: `pnpm dev`, otvoriti ekran sa Playwright MCP na 375 px i 1440 px, uporediti sa
  `DESIGN.md`, pa provjeriti da u konzoli nema grešaka
- Cijeli put kroz aplikaciju u mock modu:
  registracija → novi špil („Fotosinteza“) → čekanje generisanja → učenje 5 kartica (tačno, pogrešno, „Nema
  greške“) → prijatelji → izazov → meč protiv bota do kraja → ekran rezultata
- Kad backend bude spreman: isti put sa `VITE_REALTIME=ws` i pokrenutim `poetry run start`
