# FlowStage Operations Redesign — Full Implementation Plan

Rebuild FlowStage around how an event is executed, not how the agenda reads. One structured event model drives the builder, the AI, Smart Review, Readiness, and every run-of-show view. Nothing that works today is removed.

## 1. Event model

- **Event** — name, type, templates, dates (multi-day), venue, sponsors, economics, global requirements.
- **Venue & rooms** — per room: capacity, layout (theatre, classroom, boardroom, U-shape, cabaret, banquet, reception), stage configuration, seats/tables, purpose (plenary, breakout, registration, green room, VIP, media, catering, exhibition).
- **Equipment** — per room: screens/LED, projector, confidence monitor, podium/lectern, stage, handheld/lapel/headset mics, clicker, recording, livestream, interpretation booth, lighting, other.
- **Programme items** (replace sessions, breaks, and components): type (plenary, breakout, workshop, panel, keynote, opening/closing ceremony, gala, awards, receptions, sponsor presentation, exhibition, product launch, press conference, cultural, break, meal), code (e.g. 3A), day, start/end, room, track, owner, chairs, speakers, moderators, expected attendance, status.
- **Requirements** at event, room, item, and person level: interpretation (Arabic/French/simultaneous + equipment), accessibility (wheelchair, hearing assistance, sign language), remote speaker, livestream, recording, teleprompter, confidence monitor, extra mics, VIP protocol, security, dietary, custom.
- **Resources** — shared pool with quantity: AV technicians, interpreters, photographers, videographers, registration/production staff, VIP escorts, mics, cameras, other.
- **Setup/reset blocks** — per room, derived between consecutive items with tasks: clear, furniture reset, AV reset, catering set, tech check, staff ready. Editable duration.

### Four-state information

Every operational field is **Confirmed**, **Required**, **Not required**, or **Unknown / not specified**. Missing data is always Unknown — never read as Not required. Unknowns surface as "Room not specified", "Interpretation requirement not specified", "AV requirements not specified", "Speaker not specified", "Moderator not specified".

## 2. Economics model (architecture now, full UI later)

- Revenue lines: registration, sponsorship, exhibition, partnerships, other.
- Cost lines: venue, AV/production, catering, staffing, speakers, travel, accommodation, interpretation, branding, photo/video, entertainment, marketing, transport, other.
- Each line: category, budget, forecast, actual, currency, notes, optional links to programme items, rooms, resources, or sponsors.
- Derived: totals and variance (budget vs forecast vs actual) per category.
- This phase: model, seed structure (empty values for DIA — nothing invented), and a compact summary panel. No accounting or ledger features.

## 3. Dependency graph and conflict engine

One graph built from the event model. Edges: item→room, item→track, item→speaker, item→chair/moderator, item→resource, item→equipment, item→requirement, item→sponsor, item→setup/reset, item→cost, room→equipment, room→setup/reset, resource→items, person→items.

Conflict rules (deterministic, run before AI):

- Speaker or chair/moderator in concurrent items
- Shared resource or interpreter in concurrent items
- Equipment needed in two rooms at once
- Setup/reset time too short for the room change
- Speaker transition time between rooms too short
- Room capacity below expected attendance
- Required equipment missing from the room
- Requirement the room cannot support (e.g. interpretation without a booth)
- Catering setup overlapping live programming
- VIP/protocol overlapping another activity
- Missing information (Unknown fields on critical items)

Each finding shows: what conflicts, affected items, why it matters, recommended resolution, operational impact, and **Apply / Dismiss**. Apply shows the exact proposed change first; nothing changes without confirmation. The same graph later powers Impact Analysis, Copilot, institutional memory, and Economics.

## 4. Migration strategy

- The new model becomes the single source of truth. A converter maps old data forward: sessions → programme items, breaks → break/meal items, components → typed items with their requirements, free-text AV → event-level notes, `venue` strings → rooms.
- A reverse adapter produces the old shapes where existing features still read them, so nothing breaks mid-migration; features are then moved onto the new model one by one.
- Default event and Demo switch to the DIA Africa Access Summit; the GCC and Helios datasets stay available as templates/samples.
- Existing tests keep passing; new tests cover the converter, graph, and every conflict rule.

## 5. DIA Africa Access Summit — test case

Seeded from the uploaded agenda (Hilton Cairo Heliopolis, 01–03 Dec 2026):

- **02 Dec**: Opening Remarks (Mukanga, Fathallah, H.E. Dr. El-Ghamrawy) · Plenary 1 · Plenary 2 · Refreshment Break · **3A ∥ 3B** · Lunch · **4A ∥ 4B** · Refreshment Break · Session 5 Plenary & Closing Remarks
- **03 Dec**: Opening Remarks + Session 6 Plenary · Break · **7A (workshop) ∥ 7B** · Break · **8A ∥ 8B** · Lunch · Session 9 Plenary · Closing Ceremony

Rooms, chairs, speakers (other than the three named), AV, and interpretation are stored as Unknown. Smart Review and Readiness should list these gaps. Acceptance check: concurrent pairs render side by side, not as a list.

## 6. Import mapping (Excel + Word)

- Parse to rows, then AI maps columns/blocks to the new model fields with confidence scores; the review screen now includes room, track, type, requirements, and resources.
- Concurrency detection: same day + same time window, or shared session number with A/B suffix → concurrent items on separate tracks. Word tables with side-by-side cells (like the DIA agenda) map to parallel tracks.
- Item type inferred from titles (plenary, workshop, lunch, break, ceremony).
- Anything absent is set to Unknown and listed as a gap on the review screen — never invented.

## 7. AI prompt and data architecture

- A single **event context builder** serializes the full model plus graph and conflict findings into a compact structured brief: venue/rooms/equipment, programme grouped by day and time slot with parallel tracks, people with their item links, requirements, resources, setup/reset windows, sponsors, economics summary, and explicit Unknown lists.
- Generator, Smart Review, Readiness, Copilot, and Briefing Center all consume this same brief, so they reason across the whole event.
- Prompt rules: cues must match the room's actual layout/equipment; each requirement becomes concrete tasks and cues; never fill Unknowns — flag them; reference items by id so output maps back onto the table.
- Output: structured per-item operational rows (room, owner, production/AV, cue, special requirements) plus setup/reset and transition rows. Deterministic fallback builds the same rows without AI if generation fails.
- Smart Review merges deterministic conflicts with AI findings in the WHAT / WHY / AFFECTED / ACTION format; Readiness scores missing information and unresolved conflicts.

## 8. Run-of-show UX

- **Operational table**: TIME · ACTIVITY · ROOM · OWNER · SPEAKER/VIP · PRODUCTION/AV · CUE · SPECIAL REQ · STATUS. Compact rows, expandable details, sticky day/time headers.
- **Parallel tracks**: concurrent items grouped under one time band with Track A / Track B lanes; single-track filter.
- **Visual hierarchy**: distinct styles for plenary, tracks, break, meal, ceremony, sponsor, transition, setup/reset, ops task; Unknown fields shown in a muted "not specified" style.
- **Views** (same data): Full Operations, Production/AV, Room, Speaker, VIP, Catering, Registration, Executive Summary.
- **Live Event view**: CURRENT / NEXT / UPCOMING, countdown, room, talent, production/AV status, requirements, alerts; status buttons Ready, In Progress, Complete, Delayed, At Risk.
- **Builder**: Venue Setup (rooms + equipment), day × room programme grid with drag-and-drop (existing drag/arrows kept), requirement and resource assignment per item, conflict badges inline.
- **Exports**: print/PDF stylesheet, Excel (operational grid + tracks + gaps sheets), Word retained.

## 9. Preserving existing features

| Feature | How it is preserved |
| --- | --- |
| AI Run Sheet | Reads the new context brief; fallback kept |
| Event Templates | Templates now pre-fill rooms, item types, requirements |
| Component builder + drag-and-drop | Becomes the programme grid; controls kept |
| Smart Review | Adds conflict engine findings + Apply/Dismiss |
| Readiness Score | Adds gap and conflict inputs; same categories |
| Copilot, Briefing Center | Use the shared brief |
| Dashboard / app pages | Read via adapter, then new model |
| Excel/Word import & export | Extended mappings; same entry points |
| Multi-day, pricing, demo, MCP tool | Kept; MCP schema accepts new fields, old input still works |

## 10. Delivery order and acceptance gate

**Phase 1 — model and run-of-show correctness (this implementation)**
1. Event model, four-state fields, economics and resource structures, dependency graph, conflict engine, migration adapters.
2. DIA seed and the operational run-of-show (table, parallel tracks, rooms, requirements, resources, setup/reset rows, Unknown styling), wired to existing AI, Smart Review, and Readiness.
3. Existing features moved onto the model via adapters; no new visual features beyond what the run-of-show needs.

**Acceptance gate (DIA Africa Access Summit)** — must pass before any further feature work:
- All 3A/3B, 4A/4B, 7A/7B, 8A/8B pairs render as concurrent tracks
- Venue/room structure shows, with unassigned rooms as "Room not specified"
- Requirements, resources, and setup/reset blocks appear on the right rows
- Unknown fields display as not specified and appear in Smart Review and Readiness
- Conflict engine produces findings with Apply/Dismiss, nothing auto-applied
- Regression pass: AI Run Sheet, templates, Smart Review, Readiness, Copilot, Briefings, dashboard, Excel/Word import and export, multi-day, pricing, demo, MCP — verified in the browser and by tests

**Phase 2 (after the gate passes)** — Live Event view polish, additional role views, fuller builder grid, economics UI.

## Technical notes

- New modules: `event-model.ts` (types + four-state helper), `event-migrate.ts` (forward/reverse adapters), `venue.ts`, `resources.ts`, `economics.ts`, `dependencies.ts`, `conflicts.ts`, `event-brief.server.ts`, `dia-summit-event.ts`.
- `event-context.tsx` stores the new model; exposes the adapter for legacy readers during transition.
- `run-of-show.ts` / `run-sheet-parsing.ts` rewritten around items, tracks, setup/reset; Vitest suite extended (converter, graph, each conflict rule, DIA concurrency).
- AI server functions updated to use the shared brief; any AI call edited in this work moves to the current default model with streamed output.
- New `app.live.tsx` route; `run-of-show.tsx` becomes the view-switching document; `generate.tsx` gains Venue Setup and the grid.
- State stays in the browser as today (no database change this phase).
