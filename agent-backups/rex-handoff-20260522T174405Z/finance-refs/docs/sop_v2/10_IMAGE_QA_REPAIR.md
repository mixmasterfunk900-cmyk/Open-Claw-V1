# 10 — Image QA & Repair

## Must do

Run QA before render. Repair failed scenes only.

## QA categories

- Character identity consistency.
- Cartoon style consistency.
- Script/visual alignment.
- No duplicate/reused images.
- No corrupted/black frames.
- No text rendered directly in AI images unless explicitly allowed.
- No watermarks/logos/artifacts.

## Required files

- `${VIDEO_DIR}/qa/image_uniqueness_report.json`
- `${VIDEO_DIR}/qa/script_visual_alignment_report.md`
- `${VIDEO_DIR}/qa/character_consistency_report.md`
- `${VIDEO_DIR}/qa/style_consistency_report.md`
- `${VIDEO_DIR}/proof/image_contact_sheet_pre_render.jpg`

## Hard fail conditions

- Any duplicated/cycled image.
- Character drift.
- Style drift.
- Generic image that does not match the beat.

## Pass criteria

All image QA categories pass before editing/render.
