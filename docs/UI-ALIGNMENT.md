# High-fidelity v3 UI alignment · 15 Nov 2026

The active frontend was reviewed across the implemented recommendation, review, material-library, assignment, planning, calendar and follow-up journeys, including overlays, recovery states and responsive references. The baseline remains section `1699:14238` in INFO5900 Internal Design Files. This replaces the earlier statement that desktop visual review was entirely outstanding.

## What changed

- Matched the common 1280×800 shell: 256px sidebar, Group header, class card, four tabs, 548px panel, independently scrolling body and fixed action bar. Status messages no longer precede and displace the shared flow header.
- Placed all recommendation badges under the title. Restored the bordered evidence summary, compact student table, inline assessment evidence and in-body “Why these students?” accordion.
- Moved the five-step indicator below the title/subtitle. Matched indicator sizes, active/done states, connector spacing and inline title badges.
- Restored horizontal material rows, compact review summaries and the 654/280px material/summary split. The default summary rail measures 412px high, matching its source frame. Teacher resources and assignable exercises remain separate.
- Combined Review draft sections into one card. Restored the 634/300px confirmation and schedule columns, compact recipient rows, editable assignment fields and confirmation checkbox beside the final action buttons.
- Matched material-library context/search/filter regions, grouped 64px result/selection rows, replacement labels, stale-material blocking, error variants and retry controls. Cancellation still leaves the underlying review unchanged.
- Matched student-picker search, five source students, Suggested tags and footer count. Added the source-style material preview canvas, details and footer. Preserved native dialog focus/Escape behavior.
- Rebuilt the 14-day calendar as four outlined lanes, correctly aligned day headers, linked events and a 66px Undo banner. The calendar heading measures `(293,33,950,88)` and its timeline `(293,219,950,562)` at 1280×800, matching `1699:18001`.
- Restored standalone Assigned tests, progress/evidence dialogs, follow-up decision card and created/failed/recovered status cards.
- Matched all eight 1024px reference categories with the source's 72px icon rail. Retained a usable single-column 390px layout; no 390px Figma reference was present. Fixed a narrow-dialog close button wrapping beneath its title.
- Replaced the two static-weight font declarations with the official variable DM Sans font so regular, medium, semibold and bold are distinct. Corrected source icon slots for edit, QR code, arrows, search, select chevrons, check and Undo. Prototype scenario controls are available at `?testing=1` and do not appear in the default client preview.

## Verification

- **45 saved captures** cover pages, overlays, responsive layouts and adjacent states. These are captures, not 45 independent product pages.
- **194 source-derived container-anchor comparisons passed** (maximum allowed difference 1px), with no failures. These compare the common shell and calendar anchors at 1280×800 and 1024×800; they are not a claim of zero difference for every rendered pixel.
- All visible `<img>` assets in those captures loaded successfully. New static assets are local, non-empty and preserve their root dimensions at their callsites; background search/chevron SVGs are bundled locally by Vite.
- Actual browser acceptance covered both explicit-confirmation branches, conflict consent, planned-date shifts, Undo preserving unrelated assignments, submission recovery without duplication, stale-material blocking, library errors, support-save failure and responsive dialogs.
- Changing an assignment date cleared the previous teacher consent and disabled the submit button. Default start/end values remain visible in the confirmation rail.
- All **23 domain tests** passed. TypeScript and the Vite production build passed; `git diff --check` passed.

[Machine-readable audit](../design/ui-alignment-audit.json) lists captures, viewport sizes, asset checks, source/actual anchor bounds and results. Per-capture geometry and screenshots are in `docs/screenshots/ui-audit/`.

| Area | Representative Figma source | Evidence |
|---|---|---|
| Overview and detail | 1699:14239, 1699:14352 | [Overview](screenshots/ui-audit/overview.png), [detail](screenshots/ui-audit/detail.png) |
| Material and optional support | 1699:14472, 1699:17266, 1699:17319 | [Assemble](screenshots/ui-audit/assemble.png), [support](screenshots/ui-audit/support-editor.png) |
| Review and assignment confirmation | 1699:14579, 1699:15073 | [Review](screenshots/ui-audit/review.png), [confirm](screenshots/ui-audit/confirm-assignment.png) |
| Library and recovery | 1699:16257, 1699:16589, 1699:17143, 1699:17204 | [Library](screenshots/ui-audit/library.png), [stale](screenshots/ui-audit/library-stale.png) |
| Calendar planning | 1699:17719, 1699:17789, 1699:17834, 1699:18001 | [Schedule](screenshots/ui-audit/schedule.png), [calendar](screenshots/ui-audit/calendar.png) |
| 1024px reference layouts | 1819:29433 through 1819:31691 | [Icon rail and material](screenshots/ui-audit/responsive-1024-assemble.png), [calendar](screenshots/ui-audit/responsive-1024-calendar.png) |
| Narrow-screen adaptation | No mobile Figma frame supplied | [Mobile preview dialog](screenshots/ui-audit/mobile-preview.png) |

## Scope of the result

The 107-frame source inventory also contains handoff notes, walkthrough guides, unconnected references and repeated state/menu variations. The audit maps shared components and implemented interactive states to those designs; it does not claim 107 separate application pages or zero-pixel equivalence of every source frame. Month/Day reference-only behavior, synthetic browser-local data and unconnected production services remain as documented in HI-V3-IMPLEMENTATION.md. A full assistive-technology audit is still separate work.

## Asset provenance

Existing local Figma navigation/logo assets are reused. New edit/QR/search/chevron/arrow/check/Undo SVGs came from the saved Figma context asset URLs; they are stored locally, with no expiring URLs in application code. The material preview uses the canonical 24px Lucide FileText icon matching the source's Icon / FileText geometry; see `public/assets/LUCIDE-LICENSE.txt`. The variable DM Sans font comes from the official google/fonts `ofl/dmsans` source, under the included SIL Open Font License. Figma itself was not edited.
