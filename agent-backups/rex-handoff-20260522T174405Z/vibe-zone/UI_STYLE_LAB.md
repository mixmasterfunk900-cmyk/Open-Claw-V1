# UI Style Lab — Vibe Zone

Goal: make the app easier to compare visually while preserving every current control, endpoint, and data path.

## Style directions applied

- **Rex Live Roadmap — animated command mascot**: kept the current Rex live-state stage, with restrained high-signal motion for stream-safe status reading.
- **Dashboard — operations control room**: clean logistics-dashboard cards, glassy panels, clear readiness blockers, and blue/green operational accents.
- **Media Pipeline — control-room console**: darker production-bay treatment, stronger drop zone/progress affordances, and tool buttons that feel like queue controls.
- **Clip Factory — cinema/editor**: film-slate dark cards, warm amber highlights, stronger preview framing, and editor-style review rows.
- **Thumbnail Lab — gallery wall**: brighter gallery surface, punchy concept tiles, larger thumbnail mock emphasis, and like/dislike states that remain easy to scan.
- **YouTube Scanner + Viral Hunter — radar/research desks**: signal/radar accents with sharper rows for source discovery and lead scoring.
- **Social Dashboard — dispatch board**: manual-upload queue styled like a shipment board; keeps the “draft-only/no external posting” safety model visible.
- **Live Chat Co-Pilot — terminal chat**: preserves the existing private-chat terminal energy and keeps controls high contrast.
- **Rex Jobs — jobs console**: terminal/log-console styling for persisted activity, media queue, and scan runs.
- **Settings — local-first safe room**: calmer local configuration cards with green safety accents.

## Implementation notes

- First pass is intentionally CSS-heavy plus one small React class hook: `main-panel` now gets `page-${activePage}`.
- No functionality was removed; controls, endpoints, state, and data structures are untouched.
- Page-specific styles are centralized at the end of `src/App.css` so future experiments can be compared and reverted easily.
- Stream safety: kept private/error copy abstract, did not expose secrets, and maintained manual-review language for dispatch/publishing.

## Next experiment ideas

1. Add a tiny “Style Lab” dev-only toggle for `classic / dark / neon / studio` themes.
2. Give each nav item a color chip matching its page theme.
3. Capture screenshots for a side-by-side board once the dev server is running safely.
