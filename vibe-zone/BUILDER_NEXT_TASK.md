# Builder Next Task — Vibe Zone

Generated: 2026-05-13 15:59 UTC

## Objective
Close Dispatch Queue reconciliation: when a blocked export has a successful replacement render/bundle, make the dashboard show the blocked item as superseded/replaced instead of leaving Masala with stale red work.

## Current verification
- Git workspace has many in-progress Vibe Zone edits/untracked local tools; do not reset or overwrite unrelated work.
- Local API is running on `127.0.0.1:8787`; `/api/health` is `ok: true` with blockers `[]`.
- Health counts: 59 clips, 80 media jobs, 0 active media jobs, 0 failed media jobs, 95 renders.
- Latest Day 3 source validates complete through ~1:21:35 with transcript/captions present.
- Dispatch Queue API returns 42 local items: 40 `approved_manual_upload`, 2 `blocked`.
- Blocked items now visible in the Social Dashboard with human rework hints and local-only render/proof/upload-card links.
- Stale blocker case: `No Sleep Shipping Constantly` still has an older blocked dispatch item from `20260513T1417Z`, but a later ready rerender exists: `media/renders/day3-no-sleep-shipping-live-safe-caption-rerender-20260513T1512Z.mp4` with bundle `media/exports/clip_day3_no_sleep_shipping_20260513T1512Z-ship-live-fix-later/`.
- Remaining older blocked case: `Stop overbuilding and ship the workflow` is blocked because proof frame(s) are missing.

## Why this is next
The dashboard now explains blocked work, but it still lets stale blockers linger after a successful local fix. The leanest product win is making Dispatch Queue reflect reality: ready replacement exports should clear or downgrade old blockers, while true blockers should get one obvious local fix. This improves the livestream-to-clips/product dashboard and local-safe automation without expanding into posting, OAuth, public services, or speculative Content HQ scope.

## Builder slice
1. Add a local-only `superseded`/`replaced_by` reconciliation path for dispatch items, or reuse existing statuses with explicit `replacedByRenderPath`/`replacedByBundlePath` metadata if adding a status is too invasive.
2. Detect/link the `No Sleep Shipping Constantly` older blocked item to the ready `20260513T1512Z` rerender/bundle so it no longer reads like unresolved work.
3. Keep `Stop overbuilding and ship the workflow` blocked, but add the concrete fix path: regenerate proof frames for its existing render/bundle or mark the specific proof asset missing.
4. Surface replacement/fix state in Social Dashboard cards: old blocked item → “Replaced by ready rerender”; real blocked item → “Generate missing proof frames”.
5. Smoke-test with the stale `No Sleep Shipping Constantly` blocked item, the ready `No Sleep` rerender, the `Stop overbuilding` proof-missing item, and one approved item.
6. Keep scope UI/API/data-only unless a tiny deterministic metadata migration is necessary. Do not run external posting, login browsers, OAuth, or public exposure.
7. Verify with `npm run build`, `npm run lint`, and `/api/health`.

## Constraints
- Keep all work local, deterministic, and stream-safe.
- Do not post externally or automate logged-in browsers.
- Do not expand into full Content HQ modules, calendars, scheduling, analytics imports, or platform integrations in this pass.
- Strategy notes should become backlog only if they are not directly needed for this dispatch-reconciliation loop.
