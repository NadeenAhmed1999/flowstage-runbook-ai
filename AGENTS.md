# Architecture rules

- Reuse the account-menu auth state and account components for navigation; never render fixed account identities.
- Keep phone operational navigation in the root layout and tablet/laptop navigation in the app sidebar so import and document pages retain phone access.
- Event model v2: every programme item belongs to a part (`parts` on OpsModel, `partId` on items); stored v1 models are upgraded on load by `migrateOps` in `src/lib/event-parts.ts`. Why: one upgrade path keeps old saved events loading and the legacy view unchanged for one-part events (guarded by the legacy snapshot test).
