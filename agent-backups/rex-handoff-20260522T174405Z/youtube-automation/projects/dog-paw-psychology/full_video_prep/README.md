# Full Video Prep

Estimated length: 09:57
Estimated image beats: 117

## Files

- `visual_plan.json`: machine-readable beat timings, narration excerpts, frame names, and prompts.
- `image_prompt_plan.md`: human-readable prompt plan for image generation.
- `image_generation_tracker.csv`: status tracker for generation and QA.
- `approved_frames/`: only frames that passed QA go here.
- `voiceover_drop/`: put the final voiceover here as `final_voiceover.wav`.
- `scripts/stitch_dog_paw_full_video.mjs`: stitch approved frames with final VO.

## Automation Rule

Do not stitch from raw generations. Every generated frame must be inspected against the QA gate and copied into `approved_frames/` only after passing.
