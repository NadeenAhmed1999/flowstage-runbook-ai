# FlowStage roadmap

## Current: real saved Events page only
- [x] Saved list, current event state, Open/Duplicate/owner-confirmed Delete, signed-out/empty/error states
- [x] 129 tests (111 existing + 18 new), all persistence tests mocked; Open-before-navigation and owner confirmation verified
- [x] One read-only browser pass at 390/1280 signed out and owner; no overflow, page errors or event writes. Owner list was empty, so populated/Open browser verification unavailable; mocked action tests passed.
- Talent/AV/Activity, Overview, import, exports, parts and AI prompts are out of scope.

## Current: 2b-3 review fixes only
- [x] Hosts local typing draft and blur cleanup, with keystroke regression
- [x] Excel separate Part column and title roundtrip; remove duplicate Word agenda table
- [x] All 56 tests and read-only browser checks at 390/1280; no event writes or step 3 work

## Current: four-item follow-up only
- [x] Clear signup outcome message, import formats hint, singular Generate brief label
- [x] Read-only owner session checks at 390px and 1280px; no event writes or Save clicks
- [x] Existing 25 tests; changes ready for commit

## Current: remaining Step 2.3 only
- [ ] Shared empty states: run-of-show, briefings, Smart Review, readiness, import
- [ ] Empty and populated browser checks at 390px and 1280px; existing 25 tests
- [x] Signed-in My events empty-state check through owner self session at both widths
- Steps 2.4, 2.5 and Checkpoint B are out of scope.

## Current small UI job
- [x] Sample button resets to untouched sample and opens run-of-show
- [x] My events uses shared empty state and existing save action
- [x] Empty conflicts wording; no invented check timestamp
- [x] All 25 existing tests; signed-out sample reset and empty conflicts at 390px and 1280px
- [x] Signed-in My events browser check — owner self session passed at both widths

## Current: UI step 1 only
- [x] Device-specific navigation and real account controls
- [x] Remove search and notification dot; unify New event label
- [x] Verify phone and tablet navigation and signed-out sample
- [ ] Normal signed-in account check — temporary signup requires email confirmation; no password credentials available

## Verification follow-up (user-ordered; report after each step)
- [x] 1. Anonymized public pages — fictional sample summit on home page, Demo and all default pages; no real DIA names
- [ ] 2. Persistence — waiting for user OK on the proposed storage approach
- [ ] 3. Trust fixes — import accepts missing/partial dates; AI run sheet keeps parallel rows and labels suggestions; Readiness treats "not specified" as unknown, confidence shown separately
- [ ] 4. Placeholder rooms — label in every row, undo, rename screen
- [ ] Then stop and report

## Later (user decides order)
- Rooms and tracks on the import review screen
- Room and AV editing in the event builder
- Excel export of the track layout
- Live Event screen
- Budget summary (deferred)
- Dashboard / Events / Talent & AV / Activity: connect to the real event or label as examples
- [x] UI step 2.1 shared blocks + 2.2 titles/wording/one primary action (2.3–2.5 wait for approval)

## Current: step 2b (parts on screen)
- [x] 2b-1 fixture swap, part links on sessions/breaks, sync tests, AI Part: note
- [x] 2b-2 setup page parts UI; 47 tests and signed-out/owner in-memory browser checks at 390/1280 passed
- [x] 2b-3 setup review fixes, run-of-show groups/phone list, export/briefing labels; 54 tests and 390/1280 signed-out/owner read-only checks passed
- Step 3 conflicts/per-part readiness remains out of scope.

## Current: step 4 (Excel master-sheet import)
- [x] Job A plain-code agenda reader, invented 28-sheet fixture, tests, sheet limit lifted (66 tests; 390/1280 upload check)
- [x] Job B parser review fixes, single editable draft/reducer, review UI and sheet opt-in
- [x] Job B tests (79) and 390/1280 signed-out/owner in-memory browser checks; no event saves
- [x] Job C: deterministic editable part proposals, row Part selectors and non-blocking import warnings; 111 tests (91 existing + 20 new), snapshots/prompts unchanged
- [x] Job C: invented 28-sheet upload at 390/1280 signed out and owner; ceremony mismatch, move/rename/kind/accept/delete, Go to row and in-memory creation verified; no saves, writes, overflow or page errors
- Step 3 cross-part operational conflicts/readiness and Events/Talent/AV/Activity remain out of scope.

## App shell consistency
- [x] Job 1: New event (/app/new) and Import (/app/import) inside app shell; /generate and /import redirect; shared AppTopbar
- [x] Job 2: real Overview + wired exports; 91 tests (81 existing + 10 new), signed-out/owner 390/1280 sample/imported/empty checks, no saves
- [x] Job 2: read-only parts summaries, setup preservation, Excel/Word downloads and Print handler verified; Word used an in-memory invented run sheet (no AI generation)
- [ ] Later: Talent/AV/Activity still show sample data (outside this request)
