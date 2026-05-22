# Dog Staring visual beat rebuild progress

Date: 2026-05-19 21:02 UTC

## Status

Complete. The Dog Staring visual beat layer has been rebuilt and promoted.

## Completed

- 132/132 beats exist in `approved_frames_rebuild/` and were promoted to `approved_frames/`.
- Rebuild uses real OpenAI image-generation frames (`openai/gpt-image-2`) with beat-specific prompts from `visual_plan_v2_132.json` and script context.
- Targeted replacements were regenerated after contact-sheet QA flagged off-brief/continuity issues, including beats 007–009, 021–023, 058–060, 063, 067, 078–079, 090, 102, 105, 108–109, 117, and 120.
- Previous `approved_frames/` was backed up as `approved_frames_pre_rebuild_20260519T204419Z/`.

## QA artifacts

- Contact sheets: `qa_contact_sheets_rebuild/beats_1_20.jpg`, `beats_21_40.jpg`, `beats_41_60.jpg`, `beats_61_80.jpg`, `beats_81_100.jpg`, `beats_101_120.jpg`, `beats_121_132.jpg`
- Frame manifest: `frame_generation_manifest.json`
- Quality gate logs: `rebuild_quality_gate_132.log`, `approved_frame_quality_after_promotion.log`
- Clean rendered master: `dog_staring_audio_truth_captioned_v2.clean-video-no-burned-captions.mp4`
- Mov_text subtitle master: `dog_staring_audio_truth_captioned_v2.mp4`
- Vibe Zone visible copy: `vibe-zone/media/practice/youtube-automation/dog-content/dog-staring-psychology/dog-staring-audio-truth-captioned-v2-site-visible-captions.mp4`
- Telegram-visible 1-minute review cut: `dog_staring_rebuild_first_minute_review.mp4`

## Gates

- Contact-sheet visual QA: PASS. Minor style/owner variation only; no serious blockers found.
- `node youtube-automation/scripts/check_dog_frame_quality.mjs .../approved_frames 132`: PASS.
- Render: PASS, 132 beats, 348 captions, mov_text subtitle track, wordRatio 1.0016, avgBeatAlignmentScore 0.9721.
- `cd vibe-zone && npm run dog:production`: PASS.

## Notes

To satisfy the production gate, the Dog Content `*-site-visible-captions.mp4` review files were synced from their corresponding mov_text subtitle masters so all visible review files expose a `mov_text` subtitle stream.
