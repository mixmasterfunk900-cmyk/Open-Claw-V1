# 14 — Final QA Proof Package

Final quality gate. This is more important than speed.

## Required proof files

- `${VIDEO_DIR}/proof/visual_progression_contact_sheet.jpg`
- `${VIDEO_DIR}/proof/image_contact_sheet_pre_render.jpg`
- `${VIDEO_DIR}/proof/subtitle_style_proof_sheet.jpg`
- `${VIDEO_DIR}/qa/image_uniqueness_report.json`
- `${VIDEO_DIR}/qa/character_consistency_report.md`
- `${VIDEO_DIR}/qa/style_consistency_report.md`
- `${VIDEO_DIR}/qa/script_visual_alignment_report.md`
- `${VIDEO_DIR}/qa/editing_motion_report.md`
- `${VIDEO_DIR}/qa/final_ffprobe_report.json`
- `${VIDEO_DIR}/qa/final_qa_report.md`

## Must verify

- Laura and John are visually consistent.
- One cartoon style throughout.
- Images change on beat and do not loop.
- Every beat matches the script.
- Motion/transitions are visible in actual render.
- Subtitles match required style.
- Duration, fps, resolution, codec are correct.
- Vibe Zone copy exists and plays.

## Hard fail conditions

- Missing proof file.
- Any catastrophic V1 defect repeats.
- QA report says PASS while notes contain unresolved catastrophic defects.

## Final statuses

Use explicit statuses:

- `VIDEO_READY_LOCAL=true/false`
- `VIBE_ZONE_READY=true/false`
- `DRIVE_ARCHIVE=passed/fallback_local/blocked/not_attempted`
- `SHEETS_TRACKER=passed/fallback_local/blocked/not_attempted`

If final output quality fails, status is not complete.
