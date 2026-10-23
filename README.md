# INFO5900 · Figma development workflow

Private F3 usability-test prototype. React + TypeScript + Vite + plain CSS. Sample data only; no real assignments, student records or calendar writes.

## Run

Node 22.12+ and pnpm 10+:

```sh
pnpm install
pnpm dev
pnpm test
pnpm build
```

Open http://127.0.0.1:5173. Start with **Finding equivalent fractions → View evidence → Start review**. Select material, edit student support, review the calculated duration, select Assign practice or Curriculum plan, configure dates, tick the teacher-review checkbox, then confirm. The result links to a local destination view.

Save draft stores the draft in this browser's localStorage. Navigation and successful submission are in memory; refreshing returns to recommendations. No backend is connected. Test failure can be enabled on the confirmation screen; the draft remains available for retry.

## Sources and deliverables

- [Figma source](https://www.figma.com/design/evA3w2TOuO6N1AXL5Oldnv/INFO5900-Internal-Design-Files?node-id=98-6048): mid-fidelity v3, F3 journeys and handoff specifications.
- [PRD.md](PRD.md): requirements extracted from those specs, scope and acceptance criteria.
- [DESIGN.md](DESIGN.md): design decisions, node mapping, discrepancies and unfinished areas.
- [AGENTS.md](AGENTS.md): newly authored implementation conventions; no pre-existing AGENTS.md was found in the starting workspace.
- [docs/WORKFLOW.md](docs/WORKFLOW.md): repeatable Figma → requirements → interactive implementation → verification → GitHub workflow.
- [docs/TESTING.md](docs/TESTING.md): test scenarios and verification evidence.

F3 is the first functional slice. Decimal and percentage recommendations are visible but do not have full preparation flows. Calendar, the design system, additional evidence states, scheduling conflicts, server idempotency and real submissions remain future work. This is not a claim that all F3 frames or the final course deliverables are complete. A separate course rubric / final-delivery specification was not supplied.

## Repository structure

`src/` application and state rules; `public/assets/` local Figma SVGs and DM Sans fonts; `design/` source mapping; `tests/` domain checks; `.github/workflows/ci.yml` type-check/build/test on pushes and pull requests.

Fonts: DM Sans from Google Fonts, licensed under SIL Open Font License; see `public/assets/OFL.txt`. Figma assets belong to the source design and are included for this internal test.
