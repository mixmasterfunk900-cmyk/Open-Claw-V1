# 07 — Style Lock

This gate fixes V1's style drift failure.

## Required style

2D cartoon explainer style, clean rounded shapes, consistent medium-thick outlines, warm flat colors, simple expressive faces, slightly exaggerated cartoon proportions, YouTube educational cartoon aesthetic.

## Forbidden style

- Photorealism.
- Drawn realism.
- Semi-realistic editorial portrait.
- 3D render.
- Anime.
- Painterly realism.
- Mixed art generations between scenes.
- Stock illustration/clipart mismatch.

## Must do

- Save `config/style_lock.md`.
- Include the style lock in every image prompt.
- Audit generated images for style consistency.

## Required files

- `config/style_lock.md`
- `${VIDEO_DIR}/qa/style_consistency_report.md`

## Pass criteria

`STYLE_LOCK_QA_PASS` must be true before rendering.
