# UI step 2 — First-run guidance and learnability

Goal: a new event team member understands what to do in under a minute, on phone or laptop, without any existing feature being removed. Uses existing design tokens only. Nothing invented: every count, tick and message comes from real state.

## 1. "Start here" checklist

**What it is:** a compact card with 4 steps, each ticked only from real state:

1. **Choose your event** — "Use the sample" or "Import Excel / Word". Ticked when an event other than the untouched sample is loaded, or the user explicitly chose to continue with the sample.
2. **Review conflicts** — opens the conflicts panel on the run-of-show. Ticked when the user has opened it (and shows the real open-conflict count from the conflict engine).
3. **Generate briefings** — opens the Briefing Center. Ticked when at least one brief exists for this event.
4. **Save your event** — Save button. Ticked when the event has a saved ID. Signed out: shows "Sign in to save" instead; the other three steps still work without signing in.

**Where it appears:**
- Laptop/tablet: top of Overview (`/app`) and a slim collapsible strip at the top of the run-of-show.
- Phone: same card at the top of Overview, full width; strip on run-of-show collapses to one line ("Start here · 2 of 4").

**Dismiss / bring back:** "Hide" link on the card. Brought back from a "Start here" item in the account menu (and in the phone "More" sheet). Progress and hidden state stored in the browser (per device), keyed per event, so no sign-in needed. Auto-hides once all 4 are done, with a single "All set" line that can be closed.

## 2. Empty states

One shared empty-state block: icon, one sentence on what this page is for, one primary button, optional secondary text link.

| Page | When empty | Primary button |
|---|---|---|
| Run-of-show | No programme items | Import agenda (secondary: Use the sample) |
| Conflicts panel | No conflicts found | none — states "No conflicts found" with the time it was checked |
| Briefing Center | No briefs yet | Generate briefings |
| Smart Review | Not run yet | Run Smart Review |
| Readiness score | Not calculated | Calculate readiness |
| Copilot | No messages | existing suggested questions stay |
| My events menu | Signed in, none saved | Save current event |
| My events menu | Signed out | Sign in to save |
| Import | No file chosen | Choose file (accepts .xlsx / .docx) |
| Rooms / requirements / resources sections | None in event | Add room / Add requirement / Add resource (only where an add action already exists; otherwise text only) |

Example-data pages (Dashboard, Events, Talent & AV, Activity) keep the existing "Example data" banner; no empty state added since they show labelled examples.

## 3. Page titles and one primary action

Pattern: Title (what it is) · one-line subtitle from real data · one filled primary button; everything else secondary/outline or in an overflow menu.

| Page | Title | Primary action |
|---|---|---|
| Overview `/app` | Overview | New event |
| Run-of-show | Run-of-show | Save (signed out: Sign in to save) |
| Generate | New event | Generate run-of-show |
| Import | Import an event | Choose file |
| Events | Events | New event |
| Talent | Talent | none (example data) |
| AV | AV checklist | none (example data) |
| Activity | Activity | none (example data) |
| Demo | Sample event | Open in run-of-show |

Wording rules: sentence case, verbs first, same word everywhere ("Run-of-show", "Briefings", "Smart Review", "Readiness", "New event", "Import"). Fix current mismatches ("Talent Roster" vs "Talent", "Production overview" vs "Overview", "Run-Of-Show" casing).

## 4. Polish (no redesign)

- Spacing: one page padding scale (phone 16px, tablet 24px, laptop 32px); consistent gap between panels.
- Type: page title / section title / body / meta — 4 levels only, applied via existing tokens.
- Loading: skeleton rows for run-of-show, briefs, readiness, Smart Review; buttons show spinner + "Generating…" and are disabled while running.
- Errors: one inline error block with plain message and "Try again"; AI rate/credit errors explained in plain words. No silent failures.
- Saving: existing Saved / Unsaved indicator unchanged (Checkpoint B owns it).
- Phone: primary action reachable without horizontal scroll; tables become stacked cards where they currently overflow.

## 5. Steps (each small and testable)

**Step 2.1 — Shared building blocks.** Empty-state, inline-error, skeleton, page-header components.
Files: `src/components/ui/empty-state.tsx` (new), `src/components/ui/inline-error.tsx` (new), `src/components/app-shell/topbar.tsx`.
Test: typecheck + one page renders each.

**Step 2.2 — Titles, wording, one primary action.**
Files: `src/routes/app.index.tsx`, `app.run-of-show.tsx`, `app.events.tsx`, `app.talent.tsx`, `app.av.tsx`, `app.activity.tsx`, `generate.tsx`, `import.tsx`, `run-of-show.tsx`, `demo.tsx`, `src/components/app-shell/sidebar.tsx`, `mobile-nav.tsx`.
Test: browser at 390px and 1280px, screenshot each header.

**Step 2.3 — Empty states.**
Files: run-of-show/conflicts/briefing/smart-review/readiness/copilot components (located under `src/components/`), `save-controls.tsx`, `import.tsx`.
Test: load an empty event and signed-out My events; screenshot each.

**Step 2.4 — Start here checklist.**
Files: `src/hooks/use-onboarding.ts` (new, browser storage), `src/components/onboarding/start-here.tsx` (new), `app.index.tsx`, `run-of-show.tsx`, `account-menu.tsx`, `mobile-nav.tsx`, small unit test `src/lib/onboarding.test.ts` for tick rules.
Test: signed out — tick steps 1–3, hide, bring back via menu, reload keeps state; phone + laptop.

**Step 2.5 — Loading/error and spacing polish.**
Files: AI feature components (run sheet, briefs, readiness, Smart Review, Copilot), `src/styles.css` (spacing/type tokens only if missing).
Test: force an AI error in browser, confirm message + retry; skeletons visible; existing 25 tests pass.

After each step: stop and report what changed and what was tested.

## Assumptions to confirm
- Checklist progress is per device (browser storage), not synced to the account. Syncing could come later.
- "Review conflicts" counts as done when opened, not when all conflicts are resolved.
- Checkpoint B (JSON export/restore, snapshots, organisation/VIP protection) stays separate and is not part of this.
