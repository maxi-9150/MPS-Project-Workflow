# Implementation conventions

Newly authored for this repo. No original AGENTS.md was provided or found in the starting workspace.

- Read PRD.md, DESIGN.md and docs/WORKFLOW.md before changing scope.
- Figma mid-fid v4 / CURRENT BASELINE · Teacher Walkthru.2 · 27 Oct 2026 is the current baseline. Read docs/V4-IMPLEMENTATION.md for verified coverage and unavailable frames. Record exact source node IDs for changes.
- Read high-fidelity design context and screenshots before implementing affected frames. Reuse applicable existing components and locally stored assets.
- Keep tokens in src/style.css; use React + TypeScript and plain CSS. Do not introduce Tailwind by default.
- Separate evidence, teacher action, and lifecycle states. Never infer individual evidence from aggregate coverage.
- Reset teacher confirmation after material/support/recipient/schedule changes. Never submit automatically.
- Keep all prototype data synthetic. No credentials or real student records in source control.
- Calendar and design-system work remain provisional. Document discrepancies instead of silently declaring new design rules final.
- Run pnpm test and pnpm build. Verify the changed interactive path in a browser. Update docs/TESTING.md with actual results, not intended results.
