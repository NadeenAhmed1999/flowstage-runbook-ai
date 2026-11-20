# Step 4 — Excel import for real event master sheets + fully editable review

## What exists today (checked)
- `src/lib/excel-io.ts` `parseWorkbookFile`: reads every sheet with `raw:false`, no nbsp cleaning, assumes header is row 0.
- `src/lib/excel-import.functions.ts`: schema caps at **20 sheets** (a 28-sheet file fails validation) and 500 rows; the AI does all the mapping (header detection, times, dates, speakers) from the first 200 rows × **20 columns** — so columns after T are never seen.
- `src/routes/import.tsx` (601 lines): `MappingReview` is mostly a read-only summary; edits are limited. `mappedEventToEventData` builds the event.
- Word import (`word-io.ts`) shares `MappedEvent`; it stays on the current path.

## Split into three jobs

### Job A — Deterministic parser + fixture + tests (no UI change visible except "no 20-sheet failure")
New `src/lib/import/`:
- `clean.ts` — strip nbsp (U+00A0) and whitespace; nbsp-only = empty; trim trailing empty columns (285 → used columns).
- `header-detect.ts` — scan first ~15 rows for a header by alias table (DAY, SPACE/ROOM, LEAD, #, SESSION TITLE/TITLE, DATE, OPEN/START, MINs/DURATION, CLOSE/END, FORMAT, SESSION DESCRIPTION, BLOCK & THEME NAME, SPEAKER 1..n, MODERATOR, MC). Returns column map + score.
- `sheet-rank.ts` — agenda-likeness score per sheet (header score, count of time-like cells, row count). Picks the agenda sheet; ranks the rest.
- `parse-values.ts` — times `HH:MM[:SS]`, Excel serial times; dates "November 29th"/"29 Nov"/ISO with year optional (returns `{month, day, year|null}`); duration = MINs, else CLOSE − OPEN (flag `derived`), else missing (flag); speaker cell "Name, Title, Org" → `{name, role}`; strip "Moderator:"/"Chair:"/"MC:" prefixes; FORMAT → session type (Panel, Fireside chat, Survey, MOU signing, Keynote, Address, Performance, else Session).
- `year.ts` — year from file name, then title rows; returns one year, or `null` when none/conflicting (review asks; never guessed).
- `agenda-parse.ts` — produces a `DraftImport` (rows with per-field provenance flags: `inferred`, `derived`, `missing`, `conflict`) plus rosters with dedupe keys.
- `fixture-master-plan.ts` (tests only) — builds an invented 28-sheet workbook in code with `xlsx`: AGENDA with title rows, 285-column used range, nbsp cells, two days, text dates without year, `HH:MM:SS`, missing MINs, multi-field speaker cells, moderator prefix, names inside titles, all row kinds listed in the brief; an "Opening ceremony" sheet at 11:00–11:30 vs AGENDA 10:30; ~20 near-empty sheets. All names invented ("Dana Example", "Northwind Health").
- Server function: raise sheet limit (accept up to e.g. 60 sheets but only *send* to AI the top 3 ranked sheets, first 120 rows, mapped/relevant columns only). New small AI prompt used only when the parser succeeds: given cleaned agenda rows (title, format, block) it returns event name, event type (exact list), and per-row classification session/break/part-candidate. If no header is found, fall back to the **current** AI mapping path unchanged (simple files don't regress).
- `parseWorkbookFile` keeps returning the same shape; cleaning is added in the new path so the existing Part-column behaviour and round-trip stay intact.

Tests (`src/lib/import/*.test.ts`): nbsp cleaning; header found below title rows; date text without year; `HH:MM:SS` and `HH:MM`; duration from CLOSE − OPEN; speaker splitting (1–3 columns, missing org); moderator prefix; FORMAT mapping; year from file name / ambiguous → null; 28-sheet fixture parses, agenda ranked first, others listed as skipped; our own Excel export re-imports through the new path; simple file falls back to old path.

### Job B — Editable review UI
Split `import.tsx` review into `src/components/import/`:
- `review-event.tsx` — name, type (shared list, "Other" fallback), start date, end date, **year field** shown and required-looking when year is unknown.
- `review-rows.tsx` — sessions and breaks: title, day, start, duration, speakers/moderators (pick from roster or add), part, type, delete, add row; badges "inferred", "from CLOSE − OPEN", "missing time", "conflict". Phone (<md): one card per row stacked; laptop: compact table.
- `review-roster.tsx` — speakers and moderators: edit name/role, merge duplicates (choose target; references are rewritten).
- `review-sheets.tsx` — skipped sheets list with a tick box "Include"; ticking re-runs mapping for that sheet (one extra AI call only when ticked).
- Review state lives in one reducer over `DraftImport`; "Create event" converts the edited draft → event via the existing conversion, so edits change the created event.
Tests: reducer edits (rename session, change start, delete/add row, merge speakers, change year) produce the expected event; year unknown + user enters year → dates correct.

### Job C — Parts and conflicts/warnings
- Part proposals: rows the AI/heuristics classify as ceremony/awards/registration become proposed parts (existing components + `partId`, via `parts-edit.ts` mutations). Review "Parts" section: accept, rename, change kind, delete (rows move to Main programme), move row via the row's Part dropdown.
- `import/warnings.ts` (pure): cross-sheet time mismatch (sub-sheet window vs agenda row with matching title/part), overlapping items in same space+day, missing start, duplicate speakers (normalized name), unknown date/year, ambiguous classification. Shown in a warnings panel with affected rows; never blocks "Create event"; nothing auto-resolved.
Tests: fixture yields the 10:30 vs 11:00 opening-ceremony conflict; overlap detection; duplicate speakers; parts proposal + rename/move changes the created event; one-part import creates no extra parts.

## Preservation
- Legacy snapshots and one-part generation AI prompt untouched (generation code not edited); snapshot tests must stay green. All 56 existing tests keep passing.
- Word import and simple Excel files keep the current path.
- Upload hint text updated only where it becomes false (the "up to 20 sheets" part) — will propose exact wording in Job A report before changing.

## Browser checks (each job)
Read-only at 390px and 1280px, signed out and owner session: upload the generated fixture file (written to /tmp, not kept as a real file), check review, edits, warnings; no saves.

## Credit estimate (honest, wide because past estimates ran low)
- Job A: 8–12
- Job B: 9–14
- Job C: 6–10
Total roughly 23–36. Each job stops and reports.

## Not in this step
- Importing the operational sheets' content (booths, gifts, podcast, awardees) beyond listing them and the ceremony time cross-check.
- Rooms/venue model population beyond the SPACE text, resources, economics, LEAD/MC as staff roles (MC kept as a note/moderator-like role only if you want — default: note).
- Word import changes, laptop lanes, readiness/Smart Review changes, saving changes, AI-generated descriptions.

## Risks
- Real file layouts may differ from the described shape (merged cells, hidden rows); mitigated by alias table + fallback to the old AI path.
- Name/role splitting is heuristic ("Name, Title, Org" with commas in titles); always editable and flagged.
- Part classification by AI may be wrong; it's a proposal only.
- Cross-sheet conflict matching depends on title similarity; low-confidence matches shown as "possible conflict".
- `import.tsx` refactor in Job B is the largest change surface.

## Technical notes
- Year-less dates stored as `{month, day}` until a year is known; event `date` written only at "Create event".
- Dedupe key: lowercase, accents/punctuation stripped, titles like "Dr." removed.
- AI payload: cleaned strings only, ≤3 sheets, ≤120 rows, only mapped columns; prompt contains no names from code.
