# FlowStage — Build Plan

A premium, minimal B2B SaaS app for generating professional run-of-show documents. Three pages, shared design system, all-client state (no backend yet).

## Pages & Routes

```
src/routes/
  __root.tsx          → shared shell (nav + footer)
  index.tsx           → / landing page
  generate.tsx        → /generate event input form
  run-of-show.tsx     → /run-of-show generated document output
```

Each route gets its own `head()` with unique title + meta + og tags.

## Design System (src/styles.css)

Port tokens from the chosen direction verbatim, converted to oklch:

- `--background` white, `--foreground` near-black charcoal
- `--muted` soft gray, `--border` light gray
- `--navy` muted slate navy (primary brand)
- `--accent` subtle blue (`#2563eb`-equivalent in oklch) — used sparingly
- `--surface` off-white panels

Typography: Inter (sans) + JetBrains Mono (timecodes, labels, status chips). Loaded via Google Fonts link in `__root.tsx` head.

Motion: a single `animate-in` keyframe (subtle 10px slide + fade, 0.6s). No parallax, no scroll theater.

## Page Specs

### 1. Landing (`/`)
- Sticky top nav: `FlowStage //` wordmark in mono, links (Platform, Showcase, Documentation), Sign In, primary CTA → `/generate`
- Centered hero: balanced headline "Operational clarity for high-stakes stage production.", muted subhead, two CTAs (Start Building → /generate, View Sample → /run-of-show)
- **Sample preview block (centerpiece)**: split-pane card — left column shows a compact form preview (event details, speakers), right column renders a real rendered run-of-show document (timecoded table with Time / Session / Talent / AV cues, mono timecodes, accent-colored cue chips, moderation notes footer). Not a screenshot — real HTML.
- Feature highlights: 3-column grid (Automated Timecoding, AV Orchestration, Talent Briefing) with small geometric icon tiles
- Minimal footer

### 2. Generator (`/generate`)
Form with the full field set, grouped into sections in a single scrollable page (no multi-step):
- **Event details**: name, type (select: Conference / Summit / Corporate / Panel / Hybrid), date
- **Sessions** (repeatable rows): title, start time, duration, description
- **Speakers** (repeatable chips with name + role)
- **Moderators** (repeatable chips)
- **Networking breaks** (repeatable: label + time + duration)
- **Sponsor mentions** (repeatable: sponsor + placement note)
- **AV requirements** (textarea)
- Sticky bottom bar: "Generate Run-of-Show" → stores form data and navigates to `/run-of-show`

State: a Zustand-style lightweight store in `src/lib/event-store.ts` using a plain module-level signal + `useSyncExternalStore`, or simpler: React Context provider mounted in `__root.tsx`. Default to Context — simpler, no new deps. Pre-seed with the demo event (Global Tech Summit) so direct visits to `/run-of-show` always render something.

### 3. Run-of-Show (`/run-of-show`)
Reads from the store and renders the polished document:
- Header band: "Official Document // CONFIDENTIAL" mono label, event name (large), event type + date, REV chip and start time on the right
- **Timeline table**: Time (mono, accent) / Session (title + description) / Talent (speaker + moderator) / AV & Cues (colored chips: LOOP VIDEO, GO CUE, LAV ON, CAM ISO, etc.)
  - Rows auto-built from sessions + breaks, sorted by time, with computed cue suggestions based on session type
  - Sponsor mentions inserted as their own rows at the right times
- **Moderation notes** section (italic, mono label header)
- **Backstage coordination notes** section
- **AV reminders** section
- **Operational reminders** section
- Top-right toolbar: "Back to edit" (→ /generate), "Print / Export PDF" (uses `window.print()` with print stylesheet hiding nav/footer)

## Component Structure

```
src/components/
  layout/
    site-nav.tsx
    site-footer.tsx
  landing/
    hero.tsx
    sample-preview.tsx
    feature-grid.tsx
  generator/
    event-fields.tsx
    sessions-editor.tsx
    chip-list.tsx          (reused for speakers, moderators, sponsors, breaks)
    av-fields.tsx
  document/
    document-header.tsx
    timeline-table.tsx
    notes-section.tsx
  event-context.tsx        (Context + default seed data + types)
```

## Technical Notes

- All routes use TanStack Router `createFileRoute` with per-route `head()` for SEO.
- Form state lives in `EventProvider` mounted inside `RootComponent` (inside `QueryClientProvider`).
- No backend / no Cloud needed for this build. Data is in-memory; refresh clears to the seed event.
- Strictly use semantic tokens (`bg-background`, `text-foreground`, `border-border`, `text-accent`, `bg-navy`, etc.) — no raw hex in JSX.
- Honor composition from selected direction: split-pane sample preview, mono timecodes, accent cue chips, restrained motion, minimal nav, minimal footer.
- No "Trusted by" logos, no testimonials, no pricing teaser — direction doesn't have them.

## Out of Scope (this iteration)
- Auth, persistence, real AI generation (cue suggestions are rule-based heuristics from input)
- Multi-event library, sharing, collaboration
- PDF export beyond `window.print()`
