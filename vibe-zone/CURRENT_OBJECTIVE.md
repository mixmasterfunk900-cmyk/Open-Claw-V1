# Current Objective

Turn the successful local ingest/transcribe/render proof into a repeatable review workflow inside Vibe Zone.

## Active acceptance target
Masala should be able to open Vibe Zone through the tunnel and see:
1. Uploaded source media.
2. Transcript/subtitle artifacts.
3. Generated clip candidates.
4. Rendered MP4 outputs with preview/download links.
5. Job history that explains what happened and what is blocked.
6. Clip status controls for idea → draft → reviewed → exported.

## Current blocker
The VPS/local copy of `dejKxLu_iM0.mp4` is partial: MP4 metadata reports 1:30:09, but packet scan decodes only to 25:27. The Media Pipeline now surfaces this as a source validation badge. YouTube extraction from the VPS is still blocked by HTTP 429/bot-check safeguards, so higher-scoring ~51-minute moments need a complete local/residential download import before rendering.

## Do next
1. Import a complete copy of Masala’s newest stream only (`dejKxLu_iM0`) via the local companion/upload path.
2. Re-run `npm run pipeline:finish-upload -- dejKxLu_iM0` to pick diverse, playable clips.
3. Add richer Render Lab styles/true facecam overlay inputs now that selected clip rendering and preset selection work.


## Orchestrator instruction from Masala
Keep looping after task completion: audit, compare against successful platforms, create new tasks, and continue improving. Maintain 30-minute recurring checks so work does not stall.


## Full-product UX redesign
Masala clarified that the current makeover is only a small slice of the expectation. Treat UX as a core workstream: workflow architecture, review/approval loops, render presets, dispatch/export paths, and clear next-action states. See `UX_REDESIGN_BRIEF.md`.

## Content HQ expansion
Masala added the bigger end goal: Vibe Zone should become a fully automated creator-content operating system. One stream should produce clips, long-form, written content, audio/podcast assets, social posts, community prompts, audience funnels, archive entries, and analytics-driven winner reinforcement. This expands the destination without replacing the current immediate blocker: complete stream ingest and reliable clip/render review. See `CONTENT_HQ_MASTER_PLAN.md`.
