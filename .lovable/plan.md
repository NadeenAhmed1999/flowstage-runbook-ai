# App shell consistency — plan

## What I checked
- `/generate` and `/import` are top-level routes; `__root.tsx` shows SiteNav/SiteFooter for every non-`/app` path and the phone MobileNav for `/app*`, `/generate`, `/import` and `/run-of-show`. So phones already get bottom tabs there; laptops/tablets get the marketing bar and no sidebar (confirms problem A for md+).
- `app.index.tsx` imports everything from `dashboard-data.ts`; the export buttons have no `onClick` (confirms B).
- `app.events.tsx`, `app.talent.tsx`, `app.av.tsx` and `app.activity.tsx` also read `dashboard-data.ts` (fake). Only `app.run-of-show.tsx` uses the real event.
- Readiness is an AI call (`readiness-score.functions.ts`) run on demand; the current event context does not store a result. So Overview will **leave readiness out** rather than trigger an AI call.
- Working exports already exist: `exportEventToExcel(event)`, `exportEventToWord(event, runSheet)` and `window.print()` (used on `/run-of-show`).
- Links to `/generate` / `/import` exist in about 14 places (landing hero, pricing, resources, solution template, site nav, sidebar, topbar, mobile nav, run-of-show pages, ops-run-of-show).

## Route approach (safest)
Move the pages under the app layout as `/app/new` and `/app/import`, and turn `/generate` and `/import` into small redirect routes.
- New files: `src/routes/app.new.tsx` and `src/routes/app.import.tsx` hold the existing page bodies, moved unchanged apart from the header.
- `generate.tsx` / `import.tsx` become `beforeLoad: () => throw redirect({ to: "/app/new" | "/app/import", replace: true })`, keeping any search params. Bookmarks, marketing CTAs and old links keep working.
- Update the in-app links (sidebar, topbar, mobile nav, app.run-of-show, ops-run-of-show, run-of-show, generate→import link) to point at the new paths directly. Marketing links (hero, pricing, resources, solution template, site nav) can stay on `/generate`; they redirect.
- `__root.tsx`: change the phone-nav list from `/import`, `/generate` to the new paths (they fall under `isApp` automatically); keep `/run-of-show`.
- Signed out: `/app` has no auth guard today, so the new pages stay usable signed out. The sidebar already shows the same items to everyone, with "Sign in" in the account area. No change needed.
- Leave `/run-of-show` (the full document page) where it is in this job.

What could break:
- routeTree regenerates automatically; any `Link to="/generate"` with typed search must still type-check against the redirect route (search validator kept on both).
- head/og: each new route gets its own head() copied from the old one; redirect routes need no head. The `/app` layout head stays.
- Layout: inside the shell, the pages lose SiteFooter and gain a sidebar. Content width is narrower at 768–1279px, so the editable import review tables need a 1280/768 check.
- SSR redirect is a 307; acceptable (site not published yet).
- Tests: none of the 79 reference these paths (search found no matches), so the risk is low.

## Overview with the real event
Rewrite `app.index.tsx` against `useEvent()` + `useSavedEvent()`:
- Header: event name, date range formatted with `Intl.DateTimeFormat(undefined, …)` (browser locale, no time zone), day count, and counts for sessions, speakers+moderators and parts (`ops.parts.length`; shown only when >1).
- Actions: Open run-of-show (`/app/run-of-show`), Edit setup (`/app/new` without reset), Import (`/app/import`).
- Example mode: when the current event is the built-in Meridian sample (no `savedId` and the event still equals the seed), show the existing ExampleDataBanner labelled "Example data". It uses the same real-event layout with sample values, not the old fake KPIs.
- Empty state (event has no sessions and no components): shared EmptyState with "Set up your event" and "Import existing event".
- Delete the fake KPI strip, alerts, timeline, sponsors, speaker progress, system tiles and the "T-minus"/PT clock.
- Readiness: omitted (see above).

## Export buttons
Wire the three header buttons in a few lines to the existing helpers: Excel → `exportEventToExcel`, Word → `exportEventToWord`, Print briefing → `window.print()`. Replace the old "Export PDF/CSV" labels with "Export Excel", "Export Word" and "Print". Remove the per-section "Export" buttons along with their sections.

## One header pattern
Use **AppTopbar** everywhere inside `/app`, because it already carries Save controls, the account menu and New event. On New event and Import, swap PageHeader for AppTopbar (title and subtitle text unchanged; `primary="none"` on New event). Keep PageHeader for marketing pages only. No colour or font changes.

## Jobs
**Job 1 — routes + header (est. 14–22 credits)**
Files: `app.new.tsx`, `app.import.tsx` (new), `generate.tsx`, `import.tsx` (redirects), `__root.tsx`, `sidebar.tsx`, `mobile-nav.tsx`, `topbar.tsx`, `app.run-of-show.tsx`, `run-of-show.tsx`, `ops-run-of-show.tsx`, AGENTS.md, roadmap.md.
Tests: add `app-routes.test.ts`, which checks that the redirect target maps `/generate`→`/app/new` and `/import`→`/app/import` (target constants exported). All 79 existing tests still pass.

**Job 2 — real Overview + exports (est. 14–22 credits)**
Files: `app.index.tsx`, a small pure `src/lib/overview-summary.ts` (counts, day count, date range, isExample), plus a test for it.
Tests: one-part event counts, multi-day day count, parts count, empty detection and example detection, with invented data only.

Browser checks (both jobs): 390px and 1280px, signed out and as owner (read-only), old URLs redirect, sidebar/bottom tabs visible, delayed typing in import review still works, export buttons download, no saves, no horizontal scroll.

Total honest estimate: **28–44 credits** (past jobs ran over, mostly on browser checks and fixes).

## Pages still showing fake data (for a later plan)
- Events (`app.events.tsx`): sample event list, not My events.
- Talent (`app.talent.tsx`): sample people.
- AV checklist (`app.av.tsx`): sample checklist.
- Activity (`app.activity.tsx`): sample feed.
These stay untouched, keep their ExampleDataBanner, and keep working.

## Will NOT do
- No rebuild of Events/Talent/AV/Activity, no readiness AI call, no moving `/run-of-show`.
- No changes to colours, fonts, parts model, import parser, AI prompts or one-part snapshots.
- No data saves or deletes in checks; no Job C (parts/conflicts in import).
