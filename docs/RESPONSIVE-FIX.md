# Web responsive layout correction

The previous alignment audit measured outer containers and missed children escaping recommendation cards. This check supersedes that audit for responsive containment.

## Changes

- Recommendation cards use shrinkable grid columns. At narrower panel widths they reflow into two rows, then one column. Badges, metadata and action buttons wrap inside their card.
- Headers, filters, material rows, summaries, step indicators, and action bars adapt to available panel width.
- Footer height is observed so scrolling content reserves enough space for wrapped confirmation controls.
- Narrow tables retain a bounded horizontal scroll area rather than widening the page.

## Validation

Production Vite preview, normal browser CSS pixels:

- Before correction, recommendation children escaped cards at 1200, 1152, 1101, 900 and 800 px. Whole-page scroll width alone did not detect the defect.
- After correction: 1920, 1440, 1366, 1280, 1200, 1152, 1101, 1100, 1024, 960, 900, 800, 760, 640, 390 and 320 px: no recommendation child escaped its card and no whole-page horizontal overflow.
- 130% recommendation text: 14 widths from 320 to 1440 px passed the same checks.
- Group details, assemble, differentiate, review, choose action, confirm, schedule and conflict: eight widths from 320 to 1280 px. Buttons and inputs remained inside cards/action bars. Raw group-table descendant measurements flag offscreen cells at narrow widths; these belong to the intentional clipped, horizontally scrollable table wrapper.
- Checked the 1280×600 short-screen navigation and mobile confirmation action bar visually.
- `pnpm test`: 23 passing; `pnpm build`: TypeScript and production build passing.

Evidence: [normal desktop](screenshots/responsive-fix/overview-1152.png), [130% text](screenshots/responsive-fix/overview-1152-large-text.png), [mobile confirmation](screenshots/responsive-fix/confirm-mobile.png). JSON measurements are in the same folder.

These are Chromium preview checks, not a claim of exhaustive testing of every browser or device.
