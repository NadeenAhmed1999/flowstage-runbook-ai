# Event setup clean-up and nested parts

## What I checked before writing this
- `event-model.ts`: each programme item (`ProgrammeItem`) already has `day`, `start`, `end`, `room` and an optional free-text `track`, plus `origin.kind` set to "session", "break" or "component". `OpsModel` already has one shared `people` list. There's no part or partId yet.
- `/generate` Type dropdown has 5 fixed values: Conference, Summit, Corporate Event, Panel, Hybrid Panel.
- The sample event's default type is "Healthcare Conference", which isn't in that dropdown. That's how the dropdown can show the wrong type.
- Import: the file picker accepts only .xlsx/.xls/.csv/.docx, but drag-and-drop has no check.
- **"Up to 20 sheets" is true.** The server rejects a workbook with more than 20 sheets. It also only reads the first 200 rows and 20 columns of each sheet, and the hint doesn't say so.
- **"Handled securely" can't be backed up as written.** The file is read in your browser, but its contents are sent to the AI service to map the columns. I recommend replacing it with: "Contents are sent to our AI to map columns".
- Tests: 25 in `ops-model.test.ts` and `run-sheet-parsing.test.ts`.

Credit estimates are rough ranges from similar jobs so far.

## Step 5 first: phone run-of-show (independent)
This only changes how the page looks, not the event data, so it can go first. At 390px the timeline becomes one list sorted by time, with the room or track shown on each row. The top bar stops being cut off.
- Estimate: 2–4 credits. Risk: low. It's the same component the parts work changes later, so it may need a small touch-up after step 2.

## Step 1: one event-type list everywhere
- One shared list of event types: Conference, Summit, Corporate event, Panel, Hybrid panel, Gala / dinner, Awards, Product launch, Investor forum, Workshop / training, Executive summit.
- That list is used by: the `/generate` Type dropdown, a new type dropdown on the import review (replacing the free-text box), the import AI instructions ("pick one value from this list, or Unknown"), and each template's type.
- Remove the hidden `primaryEventType`. It becomes an alias of the visible type, so the screen and the saved value can't disagree. A stored type that isn't on the list shows as "Other: <value>", never as a different type.
- Templates are relabelled "Starting point". Choosing one shows a confirmation ("This replaces your name, sessions and components") whenever there is work to lose.
- Import files: drag-and-drop gets the same check as the picker. A .doc file gets a plain message: "Save it as .docx and try again". The hint gets the honest wording above.
- Estimate: 4–7 credits. Risk: low to medium. Old saved types that aren't on the list need the "Other" fallback.

## Step 2: nested parts (data model)
**Answer: yes, programme items just get a part link, without a new nested structure.** Add:
- `parts: Part[]` on `OpsModel`. Each part has: id, name, kind (from today's component types), day, start, end, track, notes, and its checklists (AV, staffing, protocol, moved from today's components).
- `partId` on each programme item. The existing `track` stays and comes from its part unless set on the item.
- People stay in the one shared list. A speaker in two parts is linked from items in both.

Migrating old events and the sample (nothing gets deleted):
- Bump the saved model version from 1 to 2. On load, a version-1 event becomes one part called "Main programme", covering all its items. Each old component becomes its own part. Old fields are kept.
- The sample and the private test agenda are migrated by the same code, with tests checking the item, people and room counts are unchanged.
- Your account has no saved events yet. Saved events are upgraded when opened and stored as version 2 only on the next Save.
- Estimate: 8–12 credits. Risk: **the highest of all steps**. It touches the shared event data that the run sheet, Smart Review, readiness, briefings, the Excel/Word export and saving all read. Any one of them could silently ignore parts. A one-part event must look exactly as it does today, which I'll check against the current output.

## Step 3: conflicts across parts and readiness per part
- Conflict checks: the existing person, room and transit-gap checks already compare all items. They'll show which part each item belongs to, and add a "no travel gap between parts" rule using the existing minimum transit time.
- Readiness: one score per part, plus an event score that shows the weakest part and names it.
- AI calls: today 1 per readiness run. With parts, 1 per part (3 parts = 3 calls). Only parts that changed are re-scored: each part keeps a fingerprint of its content, and unchanged parts reuse their stored score.
- Estimate: 6–9 credits. Risk: medium. The AI's scores vary between runs, so the weakest part can change without any edits. The screen will say when each part was scored.

## Step 4: import with parts and editable review
- The AI mapper returns parts only when the document clearly has separate blocks (for example, a gala evening after conference days). Otherwise it returns one part. It also picks a type from the shared list.
- The review screen lets you edit rows (title, time, room, part) and choose the type before importing.
- Estimate: 6–10 credits. Risk: medium. The AI may group parts wrongly, so the review screen is the safeguard. I'll test it with the anonymised agenda.

## Recommended order and total
5 → 1 → 2 → 3 → 4. About 26–42 credits in total. I'll stop and report after each step.

## What I'd do differently
- Remove `primaryEventType` instead of starting to fill it in. Two type fields are what caused the mismatch.
- Leave out the laptop lane view of parts side by side until steps 2 and 3 are stable. The existing parallel-session display already covers sessions running at the same time.

## Files I expect to read or touch
- Step 5: `src/components/document/ops-run-of-show.tsx`, `src/routes/app.run-of-show.tsx`, `src/components/app-shell/topbar.tsx`
- Step 1: `src/routes/generate.tsx`, `src/routes/import.tsx`, `src/lib/excel-import.functions.ts`, `src/components/event-context.tsx`, the template definitions file (located during the step)
- Step 2: `src/lib/event-model.ts`, `event-migrate.ts`, `event-persist.ts`, `ops-schedule.ts`, `src/lib/ops-model.test.ts`
- Step 3: `src/lib/conflicts.ts`, `dependencies.ts`, the readiness function
- Step 4: `excel-import.functions.ts`, `word-io.ts`, `src/routes/import.tsx`
