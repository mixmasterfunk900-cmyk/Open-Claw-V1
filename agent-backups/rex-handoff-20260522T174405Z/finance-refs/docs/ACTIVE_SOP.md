# Active SOP

Current active Finance SOP: `docs/sop_v2/00_MASTER_PROTOCOL.md` plus V3 extensions in `docs/sop_v3/`.

## Enforcement layer

Finance runs must now use the anti-skip enforcement layer before anything is called review-ready, upload-ready, or complete:

- Enforcement plan: `docs/SOP_ENFORCEMENT_PLAN.md`
- Executable gate: `scripts/check_sop_compliance.py`

Required final gate:

```bash
python3 scripts/check_sop_compliance.py --video-dir videos/<slug> --phase final
```

If this fails, the output must be marked `FAIL_NEEDS_REBUILD`, `BLOCKED_DEPENDENCY`, or `LEGACY_REJECTED`; it must not be copied into a completed/approved/upload-ready Vibe Zone lane.

## Current Finance render preferences

- Burned subtitles/caption layers are disabled. Masala will handle subtitles manually.
- Motion still matters: every render should include faint zoom/parallax and visible transitions/cuts between beats.
- Final QA must verify no accidental subtitle layer is burned into the review video.

V1 snapshot is preserved in `docs/versions/` and must not be edited.
