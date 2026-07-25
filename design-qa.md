# 理境 MVP · Design QA

## Comparison target

- Source visual truth: `/Users/zhangxian/Documents/格调高的设计风格001/lijing-mvp/public/assets/kakeya-study.png`
- Source pixels: `1003 × 1568`
- Additional chapter sources:
  - `/Users/zhangxian/Documents/格调高的设计风格001/lijing-mvp/public/assets/riemann.png`
  - `/Users/zhangxian/Documents/格调高的设计风格001/lijing-mvp/public/assets/godel.png`
  - `/Users/zhangxian/Documents/格调高的设计风格001/lijing-mvp/public/assets/mandelbrot.png`
  - `/Users/zhangxian/Documents/格调高的设计风格001/lijing-mvp/public/assets/poincare.png`
  - `/Users/zhangxian/Documents/格调高的设计风格001/lijing-mvp/public/assets/p-vs-np.png`
- Final home implementation: `/Users/zhangxian/Documents/格调高的设计风格001/lijing-mvp/qa/home-desktop-final.png`
- Expanded home implementation: `/Users/zhangxian/Documents/格调高的设计风格001/lijing-mvp/qa/home-all-theories-final.png`
- Final explorer implementation: `/Users/zhangxian/Documents/格调高的设计风格001/lijing-mvp/qa/explorer-desktop-final.png`
- Expanded explorer evidence:
  - `/Users/zhangxian/Documents/格调高的设计风格001/lijing-mvp/qa/riemann-explorer-final.png`
  - `/Users/zhangxian/Documents/格调高的设计风格001/lijing-mvp/qa/godel-explorer-final.png`
  - `/Users/zhangxian/Documents/格调高的设计风格001/lijing-mvp/qa/mandelbrot-explorer-final.png`
  - `/Users/zhangxian/Documents/格调高的设计风格001/lijing-mvp/qa/poincare-explorer-final.png`
  - `/Users/zhangxian/Documents/格调高的设计风格001/lijing-mvp/qa/pnp-explorer-final.png`
  - `/Users/zhangxian/Documents/格调高的设计风格001/lijing-mvp/qa/theory-explorers-contact-sheet.png`
- Mobile evidence:
  - `/Users/zhangxian/Documents/格调高的设计风格001/lijing-mvp/qa/home-mobile-final.png`
  - `/Users/zhangxian/Documents/格调高的设计风格001/lijing-mvp/qa/explorer-mobile-final.png`
  - `/Users/zhangxian/Documents/格调高的设计风格001/lijing-mvp/qa/pnp-mobile-final.png`
- Side-by-side evidence:
  - `/Users/zhangxian/Documents/格调高的设计风格001/lijing-mvp/qa/compare-reference-home-final.png`
  - `/Users/zhangxian/Documents/格调高的设计风格001/lijing-mvp/qa/compare-reference-explorer-final.png`
- Desktop viewport requested: `1440 × 900` CSS px
- Desktop captured bitmap: `1390 × 900` px, browser-provided capture density
- Mobile viewport and captured bitmap: `390 × 844` CSS px / `390 × 844` px
- State: Kakeya home hero and explorer step 01, default `δ = 0.034`
- Expanded states: Riemann step 03 at `t = 30.4`; Gödel step 03 at `n = 6`; Mandelbrot at `N = 80`; Poincaré step 04 at `τ = 0.82`; P versus NP step 03 at `n = 11`.
- Density normalization: source and implementation were resized to the same 900 px comparison height and appended into a single image. The source is a vertical art plate rather than a web mock, so visual-language fidelity is compared directly; responsive product layout is evaluated from the implementation evidence.

## Full-view comparison

The final home and explorers preserve the source's warm paper field, deep indigo dominant panel, restrained faded blue and dusty rose accents, large negative space, and sparse marginal notation. Each new chapter uses the same archival research-page hierarchy but receives a distinct mathematical field: critical-line zeros, recursive self-reference, escape-time coast, curvature flow, or certificate-search maze.

## Focused comparison

The Kakeya visual center was inspected in both combined comparison images. The implementation uses actual Three.js lines and translucent instanced tubes, a small warm center point, a sparse direction field, and source-derived indigo grain. This matches the source concept while keeping individual directions legible during rotation. Typography, controls, formula rendering, and study-note density were readable at both desktop and mobile sizes, so no additional detail crop was required.

## Required fidelity surfaces

- Fonts and typography: Noto Serif SC provides the restrained editorial Chinese serif tone; IBM Plex Mono carries research metadata; KaTeX renders formulas deterministically. Heading weight, line height, wrapping, and small-label hierarchy are consistent. Passed.
- Spacing and layout rhythm: home uses a quiet two-column field with broad margins; explorer uses a stable rail / canvas / note composition. No horizontal overflow at `1440 × 900` or `390 × 844`. Passed.
- Colors and visual tokens: paper, indigo, mist blue, dusty rose, and pale apricot remain within the reference palette. Contrast is sufficient without becoming neon or glossy. Passed.
- Image quality and asset fidelity: all reference images are real supplied/generated bitmap assets. The Kakeya scene is genuine Three.js geometry rather than placeholder div art. Source-derived paper and indigo textures add tactile grain. Passed.
- Copy and content: Chinese explanatory copy, theorem status, authorship, formulas, and the distinction between full dimension and positive volume are present and consistent. Passed.

## Interaction and runtime verification

- Entered Kakeya from the primary home CTA.
- Entered from the active Kakeya atlas card.
- Switched to direction-sphere step 02 and conclusion step 04.
- Changed the scale control from `0.034` to `0.060`; output updated.
- Paused the rotation and verified the control changed to “继续旋转”.
- Opened and closed the research-plate modal.
- Used the star-map anchor and returned to the entrance.
- Entered all six atlas cards and verified each opens the correct chapter title, five-step structure where applicable, formula, manuscript image, and chapter-specific control.
- Changed Riemann virtual height, Gödel self-reference depth, Mandelbrot iteration depth, Poincaré flow time, and P versus NP problem size; each output and scene updated.
- Verified the P versus NP chapter at `390 × 844`: all five step tabs remain on one row, canvas stays readable, and horizontal overflow remains zero.
- Verified desktop and mobile layouts with no horizontal overflow.
- Checked browser console: no application errors. A Three.js dependency deprecation warning for `THREE.Clock` remains non-blocking.
- Production build and Sites worker tests passed.

## Comparison history

### Iteration 1

- [P2] Hero title wrapped awkwardly and the short desktop viewport clipped too much of the visual field.
  - Fix: kept the first title line intact, reduced responsive display size, and added a short-height layout rule.
  - Post-fix evidence: `qa/home-desktop-v2.png`.
- [P2] The initial translucent tube field was too faint to communicate directional density.
  - Fix: increased pigment opacity and added actual Three.js centerlines over the instanced tube neighborhoods.
  - Post-fix evidence: `qa/explorer-desktop-v3.png`.

### Iteration 2

- [P2] The first web pass looked cleaner than the tactile source.
  - Fix: added source-derived paper texture and an indigo grain overlay while preserving text contrast.
  - Post-fix evidence: `qa/home-desktop-final.png` and `qa/explorer-desktop-final.png`.
- [P2] The controlled `δ` input did not reliably update through automated input events.
  - Fix: handled the native input event in addition to change.
  - Post-fix evidence: browser state showed slider `0.06` and output `0.060`.

### Iteration 3

- [P1] At the reported desktop width and browser scaling, the forced single-line hero title crossed under the Three.js panel.
  - Fix: removed forced no-wrap behavior, allowed both title rows to become independent blocks, used a copy-column container query for display sizing, and changed both grid tracks to shrink safely.
  - Post-fix evidence: `qa/compare-text-fit.png`; measured title-to-stage gap is `97.30 px` at `1390 × 900`, and horizontal overflow is zero across `1660`, `1366`, `1180`, `1024`, and `900` CSS-pixel checks.
- [P1] Five atlas cards were visually present but marked unavailable and had no detailed learning journey.
  - Fix: unlocked every card, added chapter-specific four/five-step explanations and formulas, connected each manuscript plate, and built five distinct Three.js fields with meaningful controls.
  - Post-fix evidence: `qa/theory-explorers-contact-sheet.png` and `qa/home-all-theories-final.png`.
- [P2] The mobile rail originally assumed four steps, which would wrap the five-step chapters inconsistently.
  - Fix: switched to an auto-fitting minimum-width grid and simplified the mobile stage heading.
  - Post-fix evidence: `qa/pnp-mobile-final.png`; five step tabs fit in one row with zero horizontal overflow.

## Findings

No actionable P0, P1, or P2 differences remain.

## Follow-up polish

- [P3] The live tube centerlines are necessarily cleaner than hand-drawn pastel marks so that rotation remains understandable. A later custom shader can introduce more per-line pigment breakup without changing the interaction model.
- [P3] The current prototype loads the full interactive scene eagerly; route-level code splitting can reduce the first JavaScript payload before production.

## Final result

final result: passed
