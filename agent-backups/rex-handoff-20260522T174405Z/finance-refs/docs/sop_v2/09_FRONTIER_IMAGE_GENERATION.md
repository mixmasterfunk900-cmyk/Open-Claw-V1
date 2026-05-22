# 09 — Frontier Image Generation

This gate fixes V1's catastrophic image looping/reuse failure.

## Must do

- Generate a unique image for every beat using the linked top-tier GPT/frontier image model.
- Log provider/model for every beat.
- Save every image as `scene_NNN.png`.
- Record image hash and file size.
- Retry failed beats individually.
- Prompt for exactly one final scene asset per generation request. If requesting multiple variations with `count`, the prompt must still describe one scene only; never ask the model to create multiple numbered scenes inside one image prompt.
- Run a grid/collage/contact-sheet check immediately after each generated asset lands, before the render phase.

## Must not do

- Do not generate 12 key images and cycle them across 96 scenes.
- Do not duplicate/copy prior scene images unless marked as an intentional callback and approved in manifest.
- Do not silently downgrade image model.
- Do not use a prompt like “create 4 separate images/scenes” inside one image-generation request; GPT image models may return visible 2x2 panels/contact sheets, which is a hard V3 failure.

## Required files

- `${VIDEO_DIR}/image_prompt_manifest.json`
- `${VIDEO_DIR}/image_generation_manifest.json`
- `${SCENES_DIR}/scene_001.png` through `${SCENES_DIR}/scene_NNN.png`

## Per-beat manifest fields

```json
{
  "beat_id": 1,
  "prompt": "...",
  "provider": "...",
  "model": "...",
  "image_path": "...",
  "sha256": "...",
  "reused": false,
  "fallback_used": false,
  "attempts": 1
}
```

## Hard fail conditions

- Repeated hash without intentional callback.
- Missing provider/model.
- Lower-tier fallback without Debug Agent report.
- Any missing scene image.

## Pass criteria

`FRONTIER_MODEL_PROVENANCE_PASS` and `NO_IMAGE_REUSE_PASS` must be true before render.
