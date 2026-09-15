# FlowStage Operations Redesign

Rebuild FlowStage around how an event is actually executed, not how the agenda reads. The event model, the generator, the AI reasoning, and the run-of-show document all move to a room- and track-aware operational structure.

Note: the DIA Africa Access Summit agenda hasn't arrived yet. I'll build the model and a faithful multi-track sample now, and load the real agenda into the demo event as soon as you attach it.

## 1. New event model

Replace the flat session list with a structured model:

- **Venue** — venue name, then rooms with capacity, layout (theatre, classroom, boardroom, U-shape, cabaret, banquet, reception), stage configuration, seat/table counts, and room purpose (plenary, breakout, registration, green room, VIP, media, catering, exhibition).
- **Room equipment** — screens/LED, projector, confidence monitor, podium/lectern, stage, mic inventory (handheld, lapel, headset), clicker, recording, livestream, interpretation booth, lighting, free-text extras.
- **Programme items** replace "sessions": each has a type (plenary, breakout, workshop, panel, keynote, opening/closing ceremony, gala dinner, awards, receptions, sponsor presentation, exhibition, product launch, press conference, cultural), a room, a track label, a day, start/end, owner, speakers, moderators, and status.
- **Requirements** attachable at event, room, item, and person level: interpretation (Arabic/French/simultaneous + equipment), accessibility (wheelchair, hearing assistance, sign language), remote speaker, livestream, recording, teleprompter, confidence monitor, extra mics, VIP protocol, security, dietary/catering, custom.
- **Setup/reset blocks** — derived per room between items: clear, furniture reset, AV reset, catering set, tech check, staff ready.

Existing seed and demo data are migrated into this model; the old single-track shape is retired.

## 2. Concurrent tracks

The builder places items on a day × room grid, so two items at 13:00 in different rooms become Track A / Track B rather than sequential rows. Track labels are auto-derived from room but editable.

## 3. Operational run-of-show

Primary output is a dense, scannable table, not prose:

`TIME · ACTIVITY · ROOM · OWNER · SPEAKER/VIP · PRODUCTION/AV · CUE · SPECIAL REQ · STATUS`

- Sticky time and track headers; compact rows expanding to full operational detail.
- Colour/weight hierarchy separating plenary, Track A, Track B, break, meal, ceremony, sponsor, transition, setup/reset, and ops task.
- View switcher over one dataset: Full Operations, Production/AV, Room, Speaker, VIP, Catering, Registration, Executive Summary — plus all-tracks / single-track toggles.
- Print-friendly stylesheet, PDF export, and Excel export of the operational grid.

## 4. Live Event view

Event-day screen with CURRENT / NEXT / UPCOMING. The current item shows a countdown, room, speakers, moderator, production and AV status, special requirements, and live alerts. Teams set each item to Ready, In Progress, Complete, Delayed, or At Risk; status flows back into every view.

## 5. AI operational intelligence

The generator reasons over the whole event at once, receiving the venue config, room equipment, track grid, and requirements. It produces room-appropriate cues (a plenary ballroom and a workshop room get different AV) and converts each requirement into concrete tasks (e.g. interpretation → booth check, interpreter call time, receiver distribution, channel test).

A deterministic conflict engine runs before the AI and feeds it findings: speaker/moderator double-booking, same AV or interpreter in two rooms, insufficient speaker transit time, insufficient room setup/reset, catering turnover clashing with a session, sponsor activation competing for space, VIP movement clashes. Smart Review reports each as WHAT / WHY / WHAT'S AFFECTED / RECOMMENDED ACTION with severity.

## 6. Imports

Excel and Word import map into the new model, detecting identical time blocks as concurrent sessions and inferring rooms/tracks from columns or session codes (3A/3B). Missing rooms, AV, or accommodations are flagged as gaps in the mapping review and in Smart Review — never invented.

## Technical notes

- `src/components/event-context.tsx` gains the venue/room/requirement/track types; `src/lib/run-of-show.ts` and `src/lib/run-sheet-parsing.ts` are rewritten around programme items and derived setup/reset blocks.
- New `src/lib/conflicts.ts` (pure, unit-tested) runs the conflict checks; `src/lib/smart-review.functions.ts` consumes its output.
- New `src/lib/venue.ts` for room layouts and equipment presets; component logic in `src/lib/event-components.ts` extends to the full item-type list with per-type operational playbooks.
- `src/routes/generate.tsx` gains Venue Setup and a track grid editor; `src/routes/run-of-show.tsx` becomes the view-switching operational document; new `src/routes/app.live.tsx` for the live view.
- PDF export via print stylesheet; Excel export extends `src/lib/excel-io.ts`.
- The MCP `generate_run_sheet` tool and existing tests are updated to the new schema.
