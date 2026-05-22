# Visual QA Notes

Updated: 2026-05-20T17:06:26Z

## Scope

- Project: `the-experiment-where-children-were-taught-to-fear`
- Source script: `scripts/script_v1.md`
- Source visual plan: `full_video_prep/visual_plan_draft.json` — corrected 2000+ word / 129-beat plan.
- Beat count checked: 129 / 129
- Frame directory: `full_video_prep/approved_frames_draft/`
- Model/tooling: real OpenAI image generation via OpenClaw (`openai/gpt-image-2`).
- SOP used: `youtube-automation-niche-flow-repo/niches/the-experiment-where/sop/ExperimentChannel_Visual_SOP.md` only. Dog SOPs were not used.

## Status

PASS for draft visual frame production.

- All 129 current beat IDs have generated PNG frames.
- Verification found 129 valid PNGs, all 2048×1152.
- All 129 frames have unique SHA-256 hashes.
- `missing_frames.txt` is empty.
- `frame_generation_manifest.json` refreshed at `2026-05-20T17:06:26Z` with per-frame bytes, sha256, dimensions, generation log availability, and `last_verified_at_utc`.
- Contact sheets are present/current from `approved_frames_draft` (5 / 5). The final 121–129 sheet is a compact 3×3 grid.
- Old 40-beat draft frames are archived under `full_video_prep/approved_frames_obsolete_40beat_2026-05-19T1916Z/` and are not counted.
- No final render was produced by this keepalive. Final render remains blocked until the explicit final-audio/Whisper timestamp gate is confirmed.

## Contact sheets

- `contact_sheets/contact_sheet_beats_001_030.png`
- `contact_sheets/contact_sheet_beats_031_060.png`
- `contact_sheets/contact_sheet_beats_061_090.png`
- `contact_sheets/contact_sheet_beats_091_120.png`
- `contact_sheets/contact_sheet_beats_121_129.png`

## QA findings

- Filesystem verification at `2026-05-20T17:06:26Z`: PASS — 129 expected beat PNGs, 0 missing, 0 extra, 0 invalid, 129 unique SHA-256 hashes, and 5 contact sheets present.
- Contact-sheet image QA at `2026-05-20T17:06:26Z`: PASS — panels appear to be finished generated illustrations, not placeholders/black/error images; no obvious logos, watermarks, or accidental readable text beyond contact-sheet beat labels.
- Visual style: PASS — sparse melancholic pencil/doodle look, muted tan/grey/blue palette, flat minimal environments, empty institutional rooms, hollow-eyed child/animal/scientist motifs consistent with the Experiment Channel Visual SOP.
- Variation after the first 30 beats: PASS for draft use. Later sheets add closeups, wide rooms, overhead layouts, corridor views, diagram-like compositions, beds, animals, masks, doors, varied subject spacing, and symbolic object/table compositions while staying cohesive.
- Minor watchlist: some frames are extremely sparse or faint/low contrast and may read weakly if held too long, especially beats 14, 72, 77, 114, and 125.
- Minor watchlist: repeated room/corridor staging appears often; cohesive, but may feel monotonous without motion/edit rhythm.
- Minor watchlist: a few post-30 conceptual/diagram frames are busier or more symbolic than the surrounding minimal scenes, especially beats 33, 45, 78, 83, 93, 113, and 123.

## QA cleanup already performed

- `beat_003.png`
- `beat_010.png`
- `beat_014.png`
- `beat_015.png`
- `beat_017.png`
- `beat_018.png`
- `beat_024.png`
- `beat_028.png`
- `beat_030.png`
- `beat_044.png`
- `beat_072.png`
- `beat_094.png`
- `beat_114.png`

## Blockers / next gate

- Final render is intentionally blocked until final audio/Whisper timestamps are explicitly provided/confirmed.
