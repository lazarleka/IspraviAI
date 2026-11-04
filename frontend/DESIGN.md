# Ispravi AI: design

## Product
A learning app where the AI hides exactly one error in every card and the user has to find it; solo study
and live PvP matches between friends.

## Users
High school and university students, 15–25, mostly on a phone (375–430 px), sometimes on a laptop.
UI copy in Montenegrin (Latin, ijekavian).

## Tone
Focused, confident, a little playful. It feels like hunting for errors with a highlighter, not like a kids' game.

## Visuals
- **Background:** deep navy everywhere (`--background`). Cards are **white** with dark text and stand out
  from the navy like a sheet of paper.
- **Yellow is the action and the marker:** primary buttons, the selected chip, the selected segment (it
  looks like a highlighter stroke over the text, `--marker`). Yellow is never a card, a block or a border:
  surfaces stay navy with white text for contrast. Hover states are blue (`--accent`).
- **Surfaces on navy:** lighter navy (`--secondary` / `--muted`) for deck rows, explanation boxes, the
  opponent's score.
- **Result colors:** green (`--success`) for correct, red (`--destructive`) for wrong; the wrong segment is
  struck through in red and the correction is shown next to it on a light green background.
- **Subject colors** (deck icon, progress, subject badge): biology green `--subject-biology`, history pink
  `--subject-history` (no orange anywhere), programming violet `--subject-programming`, everything else blue `--subject-other`.
- **Code cards:** monospace font, line numbers, a dark code surface (`--code`) inside the white card frame.
- **Fonts:** Poppins (headings, numbers, scores), Mulish (body). Both support č ć š ž đ.
- **Shape:** rounded (12 px cards, 10 px buttons, pills for badges), borders instead of shadows.
- **Images:** none in the MVP; icons only.
- **Icons:** `lucide-react` only (Leaf, Landmark, Code, Upload, Lightbulb, CircleCheck, CircleX, Swords, Users, Timer).

## Key screens (see SPEC.md §4)
- **Home:** greeting, a navy block "Danas za ponavljanje: N kartica" with a yellow "Kreni" button, deck
  rows with subject icon and %, a dashed white "Dodaj karticu" button. It opens a dialog with two choices,
  "Unesi temu" and "Ubaci skriptu", which open the new-deck form on the matching tab.
- **Card:** subject pill + "4 / 12", a thin yellow progress bar, "Nađi grešku", the white card with tappable
  segments, the source reference, buttons "Nema greške" (outline) and "Provjeri" (yellow).
- **Result:** green banner "Tačno, uhvatio si ga" (or red), the corrected sentence, an explanation box with
  a yellow lightbulb, "Sljedeća kartica".
- **Match:** both names and scores on top (you left, opponent right), a 20 s timer bar (yellow, turns red
  under 5 s), the same white card, "Ne znam" at the bottom; "Marko je bio brži" / "Marko ne zna" as small
  status lines.

## Motion
- Selecting a segment: the marker "draws" in from left to right (150 ms)
- Correct: the card flashes green once; wrong: a short horizontal shake (respects `prefers-reduced-motion`)
- No other animation

## References
- `docs/ref/`: put screenshots here when the team picks references

## Don't
- Gradients, glow, neon, drop shadows
- Emoji instead of icons, a "Welcome to…" hero
- Yellow text on white (unreadable); yellow is a fill on navy or the marker behind dark text
- Hex values in components: add a token to `src/index.css` first
- Light mode: the MVP has one theme (navy)
