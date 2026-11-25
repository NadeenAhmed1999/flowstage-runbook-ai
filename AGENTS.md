# Architecture rules

- Reuse the account-menu auth state and account components for navigation; never render fixed account identities.
- Keep phone operational navigation in the root layout and tablet/laptop navigation in the app sidebar so import and document pages retain phone access.
- Event model v2: every programme item belongs to a part (`parts` on OpsModel, `partId` on items); stored v1 models are upgraded on load by `migrateOps` in `src/lib/event-parts.ts`. Why: one upgrade path keeps old saved events loading and the legacy view unchanged for one-part events (guarded by the legacy snapshot test).
- Setup parts use legacy components and item part links as the editable source, with Main programme settings retained in ops.parts; shared pure mutations live in parts-edit. Why: existing consumers stay synchronized without a second editable schedule.
- Part grouping and export/briefing labels are presentation adapters in part-presentation; AI rows get a part only for an unambiguous title/time match. Why: one-part legacy data stays unchanged and labels are never guessed across days.
- HostsInput keeps a local text draft and commits normalized names on blur; Excel keeps Part metadata separate and ignores it during mapping. Why: commas remain typeable and re-import cannot contaminate agenda titles.
- Excel import runs the deterministic agenda reader in src/lib/import first; AI only names/types the event and flags break rows, and files with no agenda header use the original AI mapping. Why: real master sheets are too wide and messy for AI-only mapping, while simple files must not regress.

- Excel and Word share one editable review reducer and convert only edited values; skipped sheets map on explicit opt-in and cache their result; AI-mapped missing dates default to empty and remain advisory. Why: edits reach creation without duplicate AI requests or blocking undated agendas.
- Excel import part proposals and warnings run deterministically in the editable review, with source row/day/space metadata; accepted groups convert via parts-edit helpers. Why: source discrepancies stay advisory and row assignments remain user-controlled without changing operational conflict/readiness rules.
- App pages (including New event at /app/new and Import at /app/import) live under the /app layout and use AppTopbar; old /generate and /import are redirect-only routes driven by src/lib/app-routes. Why: every app page keeps sidebar/phone nav and old links keep working.
- Overview derives summaries from the current event through overview-summary; example detection requires the original unchanged seed reference and no saved ID. Why: imported copies and personal edits must never be presented as example data.
- Events uses account-keyed saved-list queries and event-list-summary adapters; duplication inserts a fresh ID without the source owner. Why: account changes cannot show cached lists from another account and copies belong to their creator.
- Account menu items (app pages, New event with resetSavedEvent, Back to website, Sign out) live in one AccountMenuItems shared by the site nav avatar and sidebar account block; the in-app logo links to /app. Why: one menu keeps signed-in navigation consistent everywhere.

- Talent and AV are read-only current-event adapters in talent-summary and av-summary; no activity feed is simulated, and /app/activity redirects to Overview. Why: operational pages must not invent people, equipment, statuses or history.
- Marketing copy must only state what the code actually does; verify claims against the implementation before writing them.
- AI fallback validates mixed session person shapes before normalizing assignments and merging embedded roles through session-people; deterministic Excel stays separate. Why: malformed AI name objects must not fail imports or lose roles.
- AI fallback requires day on every session/break/component (retries), and only after the final retry falls back to Day 1 with dayMissing and a review warning; session assignment UI (setup and import review) shares AssignedPeople/assignments helpers. Why: omitted days must never silently land on Day 1, and one picker pattern scales to large rosters.

- Device draft autosave/restore, unsaved-changes warning, sign-in keeps draft, truthful save check and JSON backup live in event-draft + DraftGuard (root layout). Why: in-progress work survives reloads and sign-in redirects without new database fields.
