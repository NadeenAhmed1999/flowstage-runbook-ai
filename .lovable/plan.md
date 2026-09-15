# FlowStage Operations Redesign

Rebuild FlowStage around how an event is actually executed, not how the agenda reads. The event model, the generator, the AI reasoning, and the run-of-show document all move to a room-, track-, and resource-aware operational structure. Everything that works today keeps working.

## 1. New event model

- **Venue** — venue name, then rooms with capacity, layout (theatre, classroom, boardroom, U-shape, cabaret, banquet, reception), stage configuration, seat/table counts, and room purpose (plenary, breakout, registration, green room, VIP, media, catering, exhibition).
- **Room equipment** — screens/LED, projector, confidence monitor, podium/lectern, stage, mic inventory (handheld, lapel, headset), clicker, recording, livestream, interpretation booth, lighting, free-text extras.
- **Programme items** replace flat sessions: type (plenary, breakout, workshop, panel, keynote, opening/closing ceremony, gala dinner, awards, receptions, sponsor presentation, exhibition, product launch, press conference, cultural), room, track label, day, start/end, owner, chairs, speakers, moderators, status.
- **Requirements** at event, room, item, and person level: interpretation (Arabic/French/simultaneous + equipment), accessibility (wheelchair, hearing assistance, sign language), remote speaker, livestream, recording, teleprompter, confidence monitor, extra mics, VIP protocol, security, dietary/catering, custom.
- **Resources** — a shared pool (AV technicians, interpreters, photographers, videographers, registration and production staff, VIP escorts, mics, cameras, other kit) assignable to programme items, with quantities.
- **Setup/reset blocks** derived per room between items: clear, furniture reset, AV reset, catering set, tech check, staff ready.
- **Economics layer** (data + minimal UI now, full UI later): revenue lines (registration, sponsorship, exhibition, partnerships, other) and cost lines (venue, AV/production, catering, staffing, speakers, travel, accommodation, interpretation, branding, photo/video, entertainment, marketing, transport, other), each with budget, forecast, actual, category, notes, and an optional link to a programme item.
- **Dependencies** modelled explicitly — speaker→item, item→room, item→AV, item→interpreter, item→moderator, item→sponsor, room→setup, room→reset, resource→many items, item→cost — so future impact analysis reads structured data.

## 2. Unknown vs not required

Every optional field is tri-state: specified, **not specified**, or explicitly not required. Imports and AI never fill a gap silently — a missing room becomes "Room not specified", missing interpretation becomes "Interpretation requirement not specified", and the same for AV, speakers, and moderators. These surface as missing information in Smart Review and Readiness.

## 3. Concurrent tracks

The builder places items on a day × room grid, so two items at 13:00 in different rooms are Track A / Track B rather than sequential rows. Track labels derive from room or session code (3A/3B) and stay editable.

## 4. Operational run-of-show

Primary output is a dense, scannable table, not prose:

`TIME · ACTIVITY · ROOM · OWNER · SPEAKER/VIP · PRODUCTION/AV · CUE · SPECIAL REQ · STATUS`

- Sticky time and track headers; compact rows expanding to full operational detail.
- Visual hierarchy separating plenary, Track A, Track B, break, meal, ceremony, sponsor, transition, setup/reset, ops task.
- View switcher over one dataset: Full Operations, Production/AV, Room, Speaker, VIP, Catering, Registration, Executive Summary — plus all-tracks / single-track toggles.
- Print-friendly stylesheet, PDF export, and Excel export of the operational grid; existing Word export is retained.

## 5. Live Event view

Event-day screen with CURRENT / NEXT / UPCOMING. The current item shows countdown, room, speakers, moderator, production and AV status, special requirements, and alerts. Teams mark Ready, In Progress, Complete, Delayed, At Risk; status flows into every view.

## 6. AI operational intelligence

The generator reasons over the whole structured event — venue, rooms, programme, tracks, people, requirements, resources, setup/reset, sponsors, economics — rather than item by item. Cues become room-appropriate (a plenary ballroom and a workshop room get different AV), and each requirement turns into concrete tasks (interpretation → booth check, interpreter call time, receiver distribution, channel test).

A deterministic conflict engine runs first and feeds the AI: speaker/moderator double-booking, a shared resource or interpreter needed in two rooms at once, insufficient speaker transit time, insufficient setup/reset, catering turnover clashing with a session, sponsor activation competing for space, VIP movement clashes, missing required information. Smart Review reports each as WHAT / WHY / WHAT'S AFFECTED / RECOMMENDED ACTION with severity.

## 7. DIA Africa Access Summit as the live test case

The uploaded agenda becomes the seeded demo event: DIA Africa Access Summit 2026, 01–03 December, Hilton Cairo Heliopolis — 02 December (Opening Remarks; Plenary 1; Plenary 2; refreshment break; 3A + 3B concurrent; lunch; 4A + 4B concurrent; refreshment break; Session 5 Plenary & Closing Remarks) and 03 December (Opening Remarks + Session 6 Plenary; break; 7A workshop + 7B concurrent; break; 8A + 8B concurrent; lunch; Session 9 Plenary; Closing Ceremony). Named speakers from the agenda are captured; every unfilled chair, speaker, room, and AV field is stored as "not specified" so Smart Review and Readiness show the real gaps. No invented content.

## 8. Preserved functionality

AI Run Sheet, Event Templates, Smart Review, Readiness Score, Copilot, Briefing Center, dashboard, Excel and Word import, Excel/Word export, pricing, multi-day support, and the MCP tool all continue to work, migrated onto the new model.

## 9. Imports

Excel and Word import map into the new model, detecting identical time blocks and A/B session codes as concurrent sessions and inferring rooms/tracks where columns allow. Gaps are flagged, never invented.

## Technical notes

- `src/components/event-context.tsx` gains venue, room, requirement, track, resource, economics, and dependency types plus a tri-state `Unspecified` helper; a migration maps existing seed/demo data forward.
- New modules: `src/lib/venue.ts` (layouts, equipment presets), `src/lib/resources.ts`, `src/lib/economics.ts`, `src/lib/conflicts.ts` (pure, unit-tested).
- `src/lib/run-of-show.ts` and `src/lib/run-sheet-parsing.ts` rewritten around programme items, tracks, and derived setup/reset blocks; existing Vitest suite extended.
- `src/lib/smart-review.functions.ts` and `src/lib/readiness-score.functions.ts` consume conflict-engine output and missing-information flags.
- `src/routes/generate.tsx` gains Venue Setup, a track grid editor, and requirement/resource assignment; `src/routes/run-of-show.tsx` becomes the view-switching operational document; new `src/routes/app.live.tsx`.
- New DIA seed in `src/lib/dia-summit-event.ts` used by the demo and default event.
- PDF export via print stylesheet; Excel export extends `src/lib/excel-io.ts`; MCP `generate_run_sheet` schema updated.
- Economics ships as model, seed structure, and a compact summary panel only — no financial dashboard this phase.
