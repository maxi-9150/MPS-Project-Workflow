# Design baseline and implementation mapping

[Source file](https://www.figma.com/design/evA3w2TOuO6N1AXL5Oldnv/INFO5900-Internal-Design-Files?node-id=98-6048). Read on 22 Oct 2026 through Figma MCP. Figma itself was not edited.

## Pages

| Page | Node | Treatment |
|---|---|---|
| exploration v1 | 0:1 | Historical exploration, not implementation baseline |
| mid-fidelity v2 | 21:2 | Historical iteration |
| mid-fidelity v3 | 98:6048 | F3 implementation baseline |
| Calendar | 234:4259 | User says unfinished; integration deferred |
| Design System · Foundations & Components | 184:97 | User says design unfinished; snapshot tokens remain revisable |

## Read implementation references

| Frame | Node | Prototype |
|---|---|---|
| Recommendation overview | 169:840 | Overview |
| Recommendation detail | 169:971 | Evidence |
| Assemble material | 169:1692 | Material step |
| Differentiation overview | 169:2554 | Support step |
| Review draft | 169:3174 | Review step |
| Choose action | 169:3503 | Action step |
| Assignment configuration | 169:3689 | Settings step |
| Confirm assignment | 169:4333 | Confirmation |
| Assignment submission outcome | 169:4464 | Success |

High-fidelity design-context code and screenshots were read for these frames before implementation. Generated static JSX was translated to React state and plain CSS. No existing component package or frontend existed in the starting directory. No Code Connect mapping was supplied in the retrieved design context. SVGs are downloaded locally; design screenshots are reference targets, never runtime page images.

## Tokens

DM Sans; text #201f1d; secondary #5d5951; canvas #faf9f7; sidebar #f8f8f6; border #dbd8d2; primary #074dc6; selection #eaf6ff; warning #fff4d9. Teacher navigation 256 px at desktop; workspace padding 32 px. Cards use 12–16 px radii. Mobile is a provisional code adaptation, pending approved design.

## Open decisions and known differences

- Material selection is 5+4+6 = 15 minutes, while later static review frames describe a different 5+8+3 = 16-minute sequence. This implementation consistently derives minutes from the selected materials. Product/design must approve a single canonical sequence.
- Differentiation frame includes both individual support and level-mapping variants. First slice uses individual support; Threshold/Satisfactory/Basic/Higher version mapping remains unimplemented.
- Dates in reference screens are 19–23 Oct 2026. Prototype defaults to 23–30 Oct to support testing; editable, not live scheduling.
- By lesson currently changes the grouping heading only; genuine lesson grouping is pending.
- Detailed evidence is available only for Amelia. Noah/Sofia item responses are explicitly unavailable; aggregate evidence is not expanded into invented student data.
- Material Preview uses a simple shared sample question, not a real content bank renderer.
- Dialogs and destination views are simplified for workflow tests. Modal focus trapping and full keyboard/screen-reader audit remain outstanding.
- Calendar action is a local simulation; timetable conflict/recalculation, network loading, stale evidence, disputed marking, source-unavailable and permission-state designs need later implementation.
- Additional navigation items show a scope message. This first slice is not a complete portal or a pixel-perfect implementation of every F3 frame.
