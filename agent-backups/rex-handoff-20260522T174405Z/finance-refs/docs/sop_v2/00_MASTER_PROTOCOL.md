# SOP V2 — Master Protocol

Channel: Laura & John's Money Gap
Priority: **final output quality above everything else**

V2 is split into phase docs so the Director cannot skim one giant SOP and skip gates. Each phase doc is mandatory. A phase is not complete until its required files exist and its PASS criteria are met.

## Absolute rule

Do not call a video complete if the final MP4 fails visual consistency, beat image uniqueness, motion/editing, subtitle style, or Vibe Zone review readiness. A blocked/failing local package is better than a bad “complete” output.

## Execution order

1. `01_TOPIC_DISCOVERY_AND_LEDGER.md`
2. `02_PROJECT_INITIALISATION.md`
3. `03_RESEARCH_TITLE_THUMBNAIL.md`
4. `04_SCRIPTING_AND_FACT_QA.md`
5. `05_VOICE_AUDIO_TIMING.md`
6. `06_CHARACTER_LOCK.md`
7. `07_STYLE_LOCK.md`
8. `08_IMAGE_BEAT_MANIFEST.md`
9. `09_FRONTIER_IMAGE_GENERATION.md`
10. `10_IMAGE_QA_REPAIR.md`
11. `11_EDITING_PLAN.md`
12. `12_RENDER_ASSEMBLY.md`
13. `13_SUBTITLES.md`
14. `14_FINAL_QA_PROOF_PACKAGE.md`
15. `15_VIBE_ZONE_DRIVE_REPORTING.md`
16. `16_TASK_TRACKER.md`
17. `17_AGENT_ROSTER_AND_REPORTING.md`

## Agent ownership rule

The Director coordinates; specialist logical agents own phases. A separate Reporting/Tracker Agent owns Sheet/local tracker updates and must not block build work. See `17_AGENT_ROSTER_AND_REPORTING.md`.

## Required stop conditions

Stop and repair before proceeding if any of these occur:

- Laura or John identity drift.
- Overall art style drift.
- Images repeat/loop/cycle unintentionally.
- Any beat lacks a unique generated image.
- Image generation did not use the linked frontier GPT image model and no approved debug fallback exists.
- Render lacks visible motion/transitions.
- Subtitles use black box/background, are too large, or wrap into multiple lines.
- Proof package is missing.

## Final output definition

A video is complete only when all are true:

```json
{
  "VIDEO_READY_LOCAL": true,
  "VIBE_ZONE_READY": true,
  "CHARACTER_LOCK_QA": "pass",
  "STYLE_LOCK_QA": "pass",
  "NO_IMAGE_REUSE_QA": "pass",
  "SCRIPT_VISUAL_ALIGNMENT_QA": "pass",
  "EDITING_RENDER_PROOF_QA": "pass",
  "SUBTITLE_STYLE_QA": "pass",
  "PROOF_PACKAGE_QA": "pass"
}
```

If Drive or Sheets fail, video completion can still be true only if local + Vibe Zone output passes and the archive failure is logged.

## V1 protection

V1 is frozen in `docs/versions/`. Do not edit V1 snapshots. V2 changes live only under `docs/sop_v2/` and active docs.
