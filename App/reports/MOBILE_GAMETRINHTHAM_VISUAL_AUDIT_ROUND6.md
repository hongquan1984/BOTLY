# Mobile Detective Visual / UX Audit — 2026-11-23

## Runtime under test

- Exact bundle: `healthclues-mobile/dist-mobile-web-theme-final13`
- Preview: `http://127.0.0.1:8096/world`
- Chromium viewport checks: `390×844` portrait and `844×390` landscape
- API contract: local `127.0.0.1:3339`

## Interaction matrix

| Step | Action | Result | Evidence |
|---|---|---|---|
| 1 | Open World and dismiss roadmap overlay | PASS; world remains usable | `mobile-detective-round-responsive-portrait.png` |
| 2 | Tap `Giải Mã` | PASS; native detective library opens, no WebView, zero page errors | `mobile-detective-round3-library.png` |
| 3 | Tap chapter 2 tab | PASS; tab changes active state and filters chapter list | `mobile-detective-round-responsive-portrait-chapter2.png` |
| 4 | Tap `BẮT ĐẦU ĐIỀU TRA` | PASS; briefing opens with readable parchment panel | `mobile-detective-round3-briefing.png` |
| 5 | Tap briefing CTA | PASS; full-screen scene and six hotspots render | `mobile-detective-round3-scene.png` |
| 6 | Tap all six hotspots | PASS; six inspection states open and each can be saved | `mobile-detective-round3-scene-all-clues.png` |
| 7 | Save clues and open Sổ | PASS; `Sổ (6)` and six Medical Handbook entries render | `mobile-detective-round3-notebook.png` |
| 8 | Open Kết luận | PASS; seven candidate causes render | `mobile-detective-round3-conclusion-initial.png` |
| 9 | Select coffee trap and compare | PASS; `Chưa khớp` feedback and star penalty path render | `mobile-detective-round3-wrong-answer.png` |
| 10 | Select four true causes and compare | PASS; `Đúng kết luận` and four-item checklist render | `mobile-detective-round3-correct-checklist.png` |
| 11 | Complete checklist and claim reward | PASS; solved summary, 2/3 stars, EXP/Xu and medical explanation render | `mobile-detective-round3-solved.png` |
| 12 | Check portrait/landscape overflow | PASS; body/scroll width equals viewport in both sizes | responsive QA JSON output |

## Visual findings

- Fixed: briefing title/body contrast on parchment.
- Fixed: notebook section titles on parchment.
- Fixed: reward card dark text on dark green surface.
- Fixed: web-only Haptics runtime error from World; final flow reports zero page errors.
- Remaining parity difference: mobile conclusion is a readable native vertical evidence list; the web reference uses a more elaborate connected deduction-board composition. It is functionally complete but not pixel-identical to the web board and should remain a visual parity follow-up if exact 100% matching is required.

## Follow-up round 7

- The conclusion screen is now a two-column deduction board with a connection-status header and selected evidence cards. Full interaction audit still passes through solved state on final14 with zero page errors.
- Remaining visual delta versus the web reference is limited to decorative connector lines and central lock artwork; the board layout and interaction semantics are now present on mobile.

## Hotspot coordinate follow-up — round 8

- Found and fixed a vertical coordinate inversion in the contained scene renderer: the letterbox inset must be added to source coordinates, not subtracted.
- Fresh screenshot `reports/previews/mobile-detective-round3-scene-all-clues.png` shows the six crosshair markers attached to the window, left work area, journal, coffee, plant and phone rather than floating in the header.
- Full browser flow on `dist-mobile-web-theme-final19`: six hotspot inspections, notebook, wrong/correct conclusion, checklist and solved reward all PASS; page errors: 0.

## Evidence gate follow-up — round 9

## Web-parity completion round 10

- Fresh final27 screenshots were captured after adding web-inspired connectors and the center lock to the mobile conclusion board.
- Full browser run proves the evidence gate at 0/6 and 5/6, unlocks at 6/6, then completes wrong/correct evaluation, checklist and solved state with zero page errors.
- Remaining difference is responsive/native scale and detail density, not a missing player flow.

## Final visual QA round 11 — 2026-11-23

- Added the existing web corkboard texture to the native mobile conclusion board while retaining responsive two-column cards, connectors and center lock.
- Five final browser rounds and an independent visual/UX agent PASS covered layout, typography hierarchy, controls, save gates, responsive states and runtime/network errors.
- Evidence: `reports/previews/mobile-detective-round3-conclusion-initial.png`, `vision-detective-06-deduction-board.png`, `mobile-detective-round-responsive-portrait.png`, `mobile-detective-round-responsive-landscape.png`.

## Card layout refinement round 12 — 2026-11-23

- Visual QA confirmed the deduction titles now have a clear full-width row and the three controls are grouped beneath them.
- Library cards now fill the available width with image-left/content-right hierarchy instead of leaving a large empty side area.

## Conclusion UX round 13 — 2026-11-23

- Added a visible Sổ Manh Mối return path from the conclusion header.
- Rebalanced the board with a reserved central lock area and a dedicated lower control row under each card title; interaction QA confirms the cards remain clickable.

## Narrative / notebook / village round 14 — 2026-11-23

- Briefing copy now matches the authored Sleep Valley narrative and uses Luna as the in-world guide.
- Notebook content is separated into two visible tabs to reduce comparison friction between clues and medical handbook entries.
- Player 3D village configuration now points to the actual `village.html` runtime instead of falling into the unconfigured state.

- The source now prevents opening the conclusion screen before the full evidence set is saved. This is covered by a source guard and TypeScript check; it still needs a fresh browser bundle for visual/runtime confirmation.
- Export blocker: Metro ran out of native memory while producing the next bundle. The prior final19 browser evidence is retained but does not include this new gate.
