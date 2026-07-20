# FlowStage → AI Operating System for Professional Events

Two workstreams: (1) marketing/IA repositioning, (2) modular multi-component event model wired end-to-end through generation, review, readiness, and briefings.

## 1. Marketing & Information Architecture

### Landing page (`src/routes/index.tsx`, `src/components/landing/*`)
Rewrite hero, feature grid, and add a platform overview:
- Hero: "AI Operating System for Professional Events" with the new subheadline and CTAs ("Generate Your First Event Plan" → `/generate`, "View Interactive Demo" → `/demo`).
- Replace `feature-grid.tsx` with a **Platform Overview** organized into four pillars:
  1. Event Planning — AI Run Sheet Generator, Event Templates, Multi-Day Event Support
  2. Operational Intelligence — Smart Review, Event Readiness Score, AI Risk Detection
  3. Stakeholder Coordination — Speaker / Moderator / Sponsor / Production Team briefings
  4. Event Operations — Timeline Management, Session Coordination, Operational Alerts, Event Dashboard
- Add an **AI Event Copilot** callout band ("Ask questions, detect risks, identify missing info, generate recommendations").
- Keep `sample-preview.tsx` and update headings to reflect outcomes-first language.

### Navigation (`src/components/layout/*` + `__root.tsx`)
Marketing header items: **Product**, **Solutions** (dropdown), **Pricing**, **Resources**, **Sign In**. `Product` anchors to platform overview; `Solutions` opens dropdown with four child routes.

### New Solutions routes
Create `src/routes/solutions.tsx` (layout w/ `<Outlet/>`) plus leaf routes with their own `head()` metadata:
- `solutions.healthcare-conferences.tsx`
- `solutions.corporate-summits.tsx`
- `solutions.event-agencies.tsx`
- `solutions.executive-forums.tsx`

Each page: audience-specific hero, pain points, how FlowStage helps (mapped to the four pillars), example run-sheet excerpt, CTA to `/generate` and `/demo`. Shared component `SolutionTemplate` in `src/components/landing/solution-template.tsx` to keep them consistent.

### Resources route
`src/routes/resources.tsx` — lightweight index linking to Demo, Templates overview, Pricing, and a "What's an AI OS for events?" explainer section (no blog backend needed).

## 2. Modular Multi-Component Event Model

### Data model (`src/components/event-context.tsx`)
Extend `EventData` with:
```ts
primaryEventType: 'conference' | 'summit' | 'forum' | 'workshop' | 'exhibition' | 'annual-meeting' | 'product-launch' | 'other'
components: EventComponent[]
```
`EventComponent`:
```ts
{
  id, kind: ComponentKind, name, day, date, startTime, endTime,
  venue, expectedAttendees, hosts[], speakers[], moderators[],
  operationalRequirements: { av[], staffing[], protocol[], catering?, security? },
  aiContext: string,  // free-form prompt hints
  notes?: string
}
```
`ComponentKind` union covers the 12 listed types (Opening/Closing Ceremony, Gala Dinner, Awards, Welcome Reception, Networking Reception, VIP Dinner, Sponsor Exhibition, Product Showcase, Press Conference, Site Visit, Celebration Event) plus generic `session-block`. Existing `sessions`/`breaks` remain as the default component of type `session-block` for backward compatibility — migrate seeded events (`demo-event.ts`, GCC summit seed) into the new shape.

### Component blueprints (`src/lib/event-components.ts` — new)
For each `ComponentKind` provide: default duration, default AV requirements, default staffing, protocol reminders, and an `aiPromptSnippet` that gets injected when the model generates the run sheet. Example: Gala Dinner → stage lighting, MC handoff, VIP seating chart, entrée service cues; Press Conference → media check-in, backdrop, mult-box, embargo notes.

### Builder UI (`src/routes/generate.tsx`)
Replace the single event-type dropdown with a two-step modular builder:
1. **Primary event type** picker (cards).
2. **Components** list with an "Add component" menu grouped by category (Ceremonies, Receptions & Dining, Showcases & Media, Off-site). Each added component gets an inline editor (accordion) for its own date/time/venue/attendees/hosts/speakers/AI context/operational requirements.

Keep template picker; templates now seed both `primaryEventType` and a starter `components[]` array. Update `event-templates.ts` accordingly.

### Generation pipeline
- `src/lib/generate-run-sheet.functions.ts`: extend Zod schema to accept `components[]`, group timeline rows by `componentId`, and pass each component's `aiPromptSnippet` + `aiContext` into the prompt so the model produces per-component workflows, AV cues, protocol/staffing/contingency notes. Output timeline gets a `component` label per row and per-day headers already supported.
- `src/lib/run-sheet-parsing.ts` + tests: update deterministic fallback to iterate components in chronological order, emit "Component: X" section headers, and add tests for multi-component ordering and empty-component handling.
- `src/lib/smart-review.functions.ts`: add checks for each component kind (e.g., Gala Dinner without catering contact, Press Conference without media check-in, Awards without rehearsal, Site Visit without transport plan).
- `src/lib/readiness-score.functions.ts`: add a **Component Coverage** category and weight it into the overall score; per-component sub-scores surfaced in the breakdown.
- `src/lib/generate-briefing.functions.ts`: briefings can be scoped to a component (e.g., "Production brief — Gala Dinner"); add a component selector in the Briefing Center UI.
- `src/lib/copilot.functions.ts`: include component summaries in the context payload so the Copilot can answer questions like "who's on stage for the awards?" or "what AV do we need for the press conference?".

### Dashboard & operations (`src/routes/app.*`)
- `app.events.tsx`: event cards show component chips (e.g., `Gala`, `Awards`, `Press Con`).
- `app.run-of-show.tsx` and `src/routes/run-of-show.tsx`: timeline table gets a **Component** column and a filter/tab bar per component; group by day then component.
- `app.index.tsx`: operational alerts include per-component risks; add a "Component readiness" tile.
- `demo.tsx` + `src/lib/demo-event.ts`: expand the Helios summit to include Welcome Reception, Gala Dinner, Awards Ceremony, Press Conference, Sponsor Exhibition, Site Visit as first-class components so the demo showcases the new model.

## 3. Technical Notes
- All new routes define their own `head()` with unique title/description/og:title/og:description; no og:image on `__root.tsx`.
- `EventComponent` is stored in the same React context; no backend schema changes required (auth/OAuth for MCP untouched).
- Keep existing MCP `generate_run_sheet` tool working: extend its input schema optionally (`components?: EventComponent[]`) so legacy calls still succeed.
- Vitest coverage: add cases for component ordering, multi-day + multi-component timeline, and readiness/smart-review component checks.
- No visual overhaul — reuse existing charcoal/navy/soft-gray tokens; only hierarchy and copy change.

## 4. Rollout Order
1. Data model + templates + demo seed migration.
2. Generate page builder UI.
3. Generation / review / readiness / briefing / copilot pipelines.
4. Run-sheet timeline UI (component column, grouping).
5. Landing page rewrite + navigation + Solutions/Resources routes.
6. Tests + Vitest updates.
