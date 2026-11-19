# Step 2b: nested parts on screen

Split into three sub-steps. I stop and report after each one.

## 1. Keeping parts and existing features in sync (the core decision)

**Single source of truth: the existing component list plus a part link on sessions and breaks.**
- Every part except "Main programme" is stored as a component, as today. Components already have name, kind, day, start/end, venue, hosts, notes and the AV/staffing/protocol checklists. Add two optional fields to a component: `track`, and kind "other" for parts that aren't a ceremony, dinner and so on.
- Add an optional `partId` to sessions and breaks. Leaving it empty means "Main programme".
- The operational model's `parts` and each item's part link stay **derived** from this, through the existing `withParts` and `legacyToOps`. That's the same one-way flow as today, so the run sheet, Smart Review, readiness, briefings and exports keep reading what they read now.

**Why this is the smallest safe option:** there's no second copy to keep in step. The parts list on screen is just the component list plus "Main programme". A one-part event has no new fields filled in, so its output stays identical to the recorded snapshot, and the existing snapshot test guards that.

**What could still drift, and how I'd guard it:**
- **Deleted part:** a session could point to a part that no longer exists. On load it falls back to Main programme, which `withParts` already does, with a test.
- **Item settings:** rooms, status and AV set on the run-of-show for an item are kept by item id, as today. Moving an item to another part must keep them, with a test.
- **What the AI sees:** the run-sheet prompt today lists components as blocks, but doesn't know which sessions belong to which part. I'd add a "Part: …" note per session only when it isn't in Main programme. For one-part events nothing changes. I'll state this in the report; there are no other changes to what the AI is told.

## 2. Setup page (/generate): parts

- The "Event Components" section becomes **"Parts of this event"**. "Main programme" is always first, can be renamed but not deleted, and shows the event's sessions and breaks.
- **Add a part:** the existing "+ Add component" menu, relabelled "+ Add part", plus an "Other part" choice.
- **Edit a part:** name, kind, day, start/end, track, venue, hosts and notes. Reorder by dragging or with the up/down arrows, which already exist for components.
- **Each part shows its own:**
  - sessions and breaks: each has a "Part" dropdown, and new ones are added to the part you're in;
  - the speakers used in those sessions, read from the one shared people list;
  - its checklists.
- **Deleting a part that has sessions or breaks asks first:** "This part has N sessions and M breaks. Move them to Main programme, or delete them too?" Buttons: Move to Main programme / Delete them / Cancel. An empty part is deleted without asking.
- **Empty states:** "No sessions in this part yet. Add a session or move one here from another part."
- Starting points still replace parts after the existing confirmation.

## 3. Run-of-show: grouped by part

- **Laptop:** each part is a titled group (name, day, time range, track), with its items in the existing layout underneath. One-part events look exactly as today, with no group heading.
- **Phone:** one list sorted by day and time across all parts. Each row has a small part label, plus the track when one is set. No side-by-side columns.
- Lanes on laptop are not in this step.

## 4. Test fixture

Replace the copy of the private DIA agenda in `src/lib/__fixtures__/legacy-snapshot-v1.json`. Instead, a tiny anonymous fixture with made-up titles and names ("Sample Forum", "Session 1A", "Speaker A"):
- 2 days, one pair of sessions running at the same time, a break, a meal, one component;
- one person in two sessions, one unknown room.

The snapshot is re-recorded from the current code before any parts change. It still covers the sample and the tiny fixture, so the test keeps proving one-part output is unchanged. The DIA-agenda checks that only count items move to an in-memory check without a stored copy.

## Out of scope
Cross-part conflict checks, readiness per part, import changes, visual restyle, laptop lanes.

## Sub-steps and honest credit estimate
My last estimate was low (said 3–4, actual 6.8), so these ranges are wider.

| Sub-step | Contents | Credits |
|---|---|---|
| 2b-1 | Fixture swap, part links on sessions/breaks, sync tests, the AI note | 4–7 |
| 2b-2 | Setup page parts section, part dropdowns, delete confirmation, empty states | 7–12 |
| 2b-3 | Run-of-show grouping on laptop, one list on phone | 4–7 |
| **Total** | | **15–26** |

## Technical details

**Files expected**
- 2b-1: `src/components/event-context.tsx` (Session/Break/EventComponent types), `src/lib/event-migrate.ts`, `src/lib/event-parts.ts`, `src/lib/generate-run-sheet.functions.ts`, `src/lib/run-sheet-parsing.ts` (input schema), `src/lib/__fixtures__/*`, `src/lib/event-parts.test.ts`, a new `src/lib/tiny-fixture.ts`.
- 2b-2: `src/routes/generate.tsx` (likely split into a new `src/components/generate/parts-section.tsx` because the file is about 1,170 lines).
- 2b-3: `src/components/document/ops-run-of-show.tsx`, `src/lib/ops-schedule.ts` if grouping needs a helper.

**Tests to add**
- A session's part link becomes the item's part link. A missing part falls back to Main programme.
- Moving a session to another part keeps its room, status and AV settings.
- Deleting a part with "move": its items end up in Main programme. With "delete": they're removed, and the counts match.
- An extra part's sessions still appear in the run sheet, exports and briefings, labelled with the part name.
- The one-part snapshot equals the stored one (sample and tiny fixture).
- The AI prompt for a one-part event is unchanged character for character. A multi-part one gets "Part:" notes.
- Phone list ordering: day, then time, across parts.

**Browser checks (read-only: nothing saved, no real data deleted)**
- 390px and 1280px, signed out and with your account.
- On the setup page, in memory only:
  - add an "Other part" and rename it;
  - move a session into it;
  - delete it and see the confirmation text with both choices;
  - check empty-state hints.
- Run-of-show: the sample shows no group headings (one part). With a two-part event built in memory, laptop shows groups and phone shows one list with part labels. Page width fits the screen.
- My events still shows its empty state.
