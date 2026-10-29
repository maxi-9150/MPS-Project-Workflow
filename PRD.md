# Current implementation · 29 Oct 2026

See [v4 implementation and coverage](docs/V4-IMPLEMENTATION.md) for the current baseline, runnable path and remaining source-access blocker. The notes below describe the historical 22 Oct prototype and are superseded where the v4 document differs.

# F3 PRD · provisional development baseline

Baseline: 22 Oct 2026. Derived from INFO5900 Internal Design Files, **mid-fidelity v3**, F3 handoff specifications. This is a newly authored requirements synthesis, not a recovered original PRD. Final course rubric and production API contracts are not yet provided.

## Product outcome

A teacher identifies a shared learning need, verifies the underlying evidence and uncertainty, assembles suitable material, adjusts individual support, reviews the draft, chooses an action, and explicitly confirms it. Recommendations remain starting points rather than diagnoses. Evidence never triggers automatic assignment.

## Confirmed design requirements

| Journey | Source section | Required behavior |
|---|---|---|
| Discover and verify | 169:833 | Source, recency, affected students and evidence limitations; filters; student evidence selection separate from learning status |
| Assemble material | 169:1685 | Search and content-type filtering; select/preview content; preserve selected material when results are empty |
| Differentiate | 169:2547 | Shared goal with editable per-student support; insufficient individual evidence remains explicit |
| Review draft | 169:3167 | Inspect material, support and duration; edit without silently submitting |
| Choose/configure action | 169:3496 | Assign practice or add to Curriculum plan; recipients and dates validated before confirmation |
| Confirm and complete | 169:4326 | Explicit review confirmation; success/failure feedback; distinguish completed action from lifecycle and learning statuses |

## First executable slice

Finding equivalent fractions, with three sample students. Overview filters, evidence table, material search/type selection, dynamic totals, editable support and note, review, two local action destinations, dates, confirmation gate, save/restore draft and simulated submission failure. Other recommendations provide bounded information messages rather than fabricated records.

## Acceptance criteria

1. Teacher can complete the fractions path without using Figma or editing code.
2. No selection and no recipients both block progression/submission; due date before start is rejected.
3. Actual selected material determines duration on every screen (default 15 minutes).
4. Saving a draft and refreshing restores its material, recipients, dates and support; teacher confirmation is reset.
5. Submission requires a checked review acknowledgement. Simulated failure preserves the draft and permits retry.
6. Success shows the chosen action, Not started lifecycle status and local-only scope; destination displays the submitted snapshot.
7. Insufficient evidence never becomes a diagnosis, and aggregate item coverage never becomes individual coverage.

## Production completion still required

Full frame/state coverage; real source availability and permissions; complete student-level evidence; real calendar conflict preview and recalculation; authentication; server persistence; authoritative validation; idempotent submissions; integration/API tests; accessibility audit; approved responsive layouts; final stakeholder/course rubric signoff. No real calendar synchronization is implemented.
