# Architecture rules

- Reuse the account-menu auth state and account components for navigation; never render fixed account identities.
- Keep phone operational navigation in the root layout and tablet/laptop navigation in the app sidebar so import and document pages retain phone access.
- Event model v2: every programme item belongs to a part (`parts` on OpsModel, `partId` on items); stored v1 models are upgraded on load by `migrateOps` in `src/lib/event-parts.ts`. Why: one upgrade path keeps old saved events loading and the legacy view unchanged for one-part events (guarded by the legacy snapshot test).
- Setup parts use legacy components and item part links as the editable source, with Main programme settings retained in ops.parts; shared pure mutations live in parts-edit. Why: existing consumers stay synchronized without a second editable schedule.
- Part grouping and export/briefing labels are presentation adapters in part-presentation; AI rows get a part only for an unambiguous title/time match. Why: one-part legacy data stays unchanged and labels are never guessed across days.
- HostsInput keeps a local text draft and commits normalized names on blur; Excel keeps Part metadata separate and ignores it during mapping. Why: commas remain typeable and re-import cannot contaminate agenda titles.
- Excel import runs the deterministic agenda reader in src/lib/import first; AI only names/types the event and flags break rows, and files with no agenda header use the original AI mapping. Why: real master sheets are too wide and messy for AI-only mapping, while simple files must not regress.
