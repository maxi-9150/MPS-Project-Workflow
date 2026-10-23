# Repeatable design-to-code workflow

1. **Choose a bounded journey.** Start with one mature F3 path. Link its frame and adjacent handoff specification in an issue. Separate unfinished Calendar/design-system work.
2. **Read source context.** Create/reuse a Figma MCP task session; inspect page metadata; retrieve high-fidelity design context with screenshots for changed frames. Inspect Code Connect and existing components when present. Do not build from metadata alone.
3. **Record requirements.** Update PRD acceptance criteria, DESIGN node mapping and an explicit list of source contradictions. Keep source facts separate from implementation choices and unfinished requirements.
4. **Implement in a branch.** Reuse tokens/components. Download every required static asset locally. Use React state for transitions, editable fields, validation and derived totals. Keep backend operations behind explicit confirmation.
5. **Run checks.** `pnpm install --frozen-lockfile`, `pnpm test`, `pnpm build`, `pnpm dev`. Walk the happy path and recovery paths. Compare changed screens with the referenced Figma screenshots at the same viewport. Verify assets load, preserve geometry and occupy their intended slots.
6. **Review and merge.** Commit source, lockfile, docs, asset provenance and verification notes together. Open a PR describing the trigger, resulting behavior, source nodes, checks and remaining gaps. CI runs build/type checking and domain tests. No deployment is automatic.
7. **Repeat after design changes.** Re-read only affected frames and adjacent state rules; update node mapping, tokens and acceptance criteria; rerun relevant tests. Never replace working interaction code wholesale with generated static JSX.

## Suggested next slices

Full evidence/error states → material preview/editor and source failures → version mapping → calendar plan configuration/conflict preview → backend/auth/submission idempotency → final rubric audit.

## Final deliverable gate

Provide a runnable interactive frontend, source repository, traceable PRD/design conventions, reproducible setup, test evidence, complete agreed journeys/error states, asset provenance and explicit limitations. Match this provisional checklist against the actual INFO5900 course rubric when supplied; that rubric has not been verified here.
