# Design UI Polish Queue — Vibe Zone

Owner: Design Bot + Rex
Status: active / durable
Goal: polish the Vibe Zone website UI into a cohesive midnight, glossy, futuristic product interface without cheap neon clutter.

## Non-negotiable direction
- Midnight colour scheme: deep navy/black base, controlled luminous accents.
- Glossy and futuristic, but premium — no cheap rainbow gradients or noisy AI slop.
- Information should be well organised with clear hierarchy.
- Menus should be clean, easy, and dimensional.
- Styling should match throughout the website.
- Media Pipeline = WIP concept lab / generated-scene experiments / rough review.
- Clip Factory = approved or nearly approved ready-to-ship media.
- Preserve Confirmed Template #1 and Template #2 docs/workflows.

## Operating rules
- Work continuously from this queue until empty or explicitly paused by Masala.
- Keep changes small, inspectable, and build-verified.
- Never hide important blockers; surface them as queue items.
- Avoid breaking local API/frontend.
- Do not post externally.

## Current sprint
- [x] Establish unified midnight design tokens in `src/App.css`.
- [x] Polish shell/nav: cleaner menu, active states, depth, readable labels.
- [x] Standardize cards, notices, buttons, badges, forms.
- [x] Improve Media Pipeline concept lab organization and visual clarity.
- [x] Clarify Clip Factory as the ready-to-ship lane.
- [x] Improve render/media grids so review assets feel curated.
- [x] Verify with `npm run build`.
- [x] Refresh graph with `graphify update .` after code changes.

## Backlog
- [ ] Add a dedicated design-system section or comments for future contributors.
- [ ] Add compact/comfortable density toggle if needed.
- [ ] Add better empty states for concept lab, thumbnail lab, dispatch queue.
- [ ] Add a visible “Concept / Candidate / Approved / Shipped” status language across pages.
- [ ] Review accessibility contrast after the midnight theme pass.

## Design audit — 2026-05-15 polish pass
- Shell/nav: previous base still leaned light and mixed per-page treatments; now unified behind a midnight glass shell with stronger active nav depth.
- Color system: consolidated around deep navy surfaces, controlled cyan/mint/orange/rose accents, darker cards/forms/notices, and restrained glow.
- Hierarchy: added workflow rails so Media Pipeline reads as concept/WIP and Clip Factory reads as shipment/review.
- Components: buttons, cards, notices, badges, tags, validation states, forms, render rows, and upload drop zones now share the same glossy material language.
- Remaining risk: visual QA in-browser is still recommended because this was build-verified, not screenshot-reviewed.

## Remaining tasks
- [ ] Browser/screenshot pass on Dashboard, Media Pipeline, Clip Factory, Social Hub, Live Chat, and mobile widths.
- [ ] Accessibility contrast check for secondary muted text on the darkest panels.
- [ ] Consider moving recurring tokens into a shorter design-system block once the theme stabilizes.

## Activity log
- 2026-05-15: Design Bot added midnight/gloss CSS polish, Media Pipeline and Clip Factory workflow rails, ran `npm run build` successfully, and ran `graphify update .`.
- 2026-05-15: Queue created from Masala request: “midnight colour scheme, glossy and futuristic without feeling cheap, well organised, matching throughout, clean easy menus with depth.”
- 2026-05-15: Rex applied first midnight premium polish pass in `src/App.css`: dark/gloss tokens, sidebar/nav depth, glass cards, buttons/forms/notices/render cards. Build passed; graph refreshed.
