# Add visible Import Excel entry points

## Problem
The Import Excel feature exists at `/import` and is linked only inside the `/app` sidebar, which is hidden on smaller viewports and not present at all on the standalone `/run-of-show` and `/generate` workflows. Users completing the generate → run-of-show flow have no visible way to reach import.

## Goal
Place clear, reachable Import Excel buttons in the two places users most expect them: the document preview page and the event builder page.

## Plan

1. **Run-of-Show toolbar**
   - Add an "Import Excel" button next to the existing "Export Excel" button in `src/routes/run-of-show.tsx`.
   - Use a `Link` to `/import` with the `FileSpreadsheet` icon.
   - Style it as a secondary/outline action so it does not compete with the primary Generate/Regenerate button.
   - Ensure the toolbar wraps gracefully on narrow viewports.

2. **Generate page**
   - Add a subtle "Import existing event" link/button near the top of `src/routes/generate.tsx` (beside the template picker or form header).
   - Link to `/import` so users can migrate an Excel plan before building a new event.

3. **Mobile reachability (optional, if time permits)**
   - Add a small "Import" item to the app-shell topbar actions on `/app/*` routes, or expose the sidebar on mobile via a hamburger sheet, so the existing sidebar link is not hidden on small screens.

## Verification
- Open `/run-of-show` and confirm an Import Excel button appears in the toolbar and navigates to `/import`.
- Open `/generate` and confirm an Import existing event entry point is visible.
- Resize to mobile width and confirm the new buttons remain accessible (wrapping or stacking).
