# Finance SOP Enforcement Plan — Stop Skipped Steps

Status: draft enforcement layer after 2026-05-21 Finance failures.

## Problem

The full SOP is strong, but the runner can still skip or fake steps because completion is currently based too much on narrative reports and not enough on machine-checkable evidence.

Recent failure patterns:

1. Old/pre-V5 outputs were treated as completed upload candidates.
2. A 20-frame full video was marked PASS despite violating the 4–6 second visual cadence.
3. Batch prompts such as “create 4 separate scenes/images” were used, risking contact-sheet/collage outputs.
4. Visual style/character gates were asserted instead of proven from rendered proof sheets.
5. Vibe Zone surfacing used the wrong/legacy lane.
6. Final reports said PASS even when the artifact violated known catastrophic-failure rules.

## Root cause

The SOP describes the process, but the deployed automation lacks a hard phase ledger that blocks advancement unless required evidence exists and passes. The Director can decide “close enough” because there is no required executable gate between phases.

## Principle

No phase is complete because an agent says it is complete. A phase is complete only when:

1. required files exist,
2. required manifest fields exist,
3. pass/fail gates are machine-checkable where possible,
4. subjective QA is backed by proof sheets/reports,
5. the next phase refuses to run unless previous gates are green.

## Required architecture

### 1. Canonical run state file

Every video run must maintain:

`run_state.json`

Required structure:

```json
{
  "video_slug": "...",
  "sop_version": "2.0+v5_enforcement",
  "current_phase": "08_IMAGE_BEAT_MANIFEST",
  "phase_order": ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "16", "17"],
  "phase_status": {
    "01": { "status": "complete", "evidence": ["..."], "checked_at": "..." },
    "02": { "status": "complete", "evidence": ["..."], "checked_at": "..." }
  },
  "hard_gates": {
    "runtime_gte_480": false,
    "visual_beat_cadence_4_to_6": false,
    "one_image_per_generation_request": false,
    "no_contact_sheets": false,
    "no_reused_frames": false,
    "style_lock_pass": false,
    "character_lock_pass": false,
    "subtitles_disabled_manual": true,
    "vibe_zone_correct_lane": false
  },
  "blocked_reason": null
}
```

### 2. Phase evidence contract

Each SOP phase must list required evidence. A phase cannot be marked complete without all of it.

Minimum contract:

| Phase | Required evidence | Machine gate |
|---|---|---|
| 01 Topic/Ledger | topic log, duplicate ledger result | selected topic not in completed/rejected duplicate list |
| 02 Init | production_manifest, run_state, dirs | manifest path consistency |
| 03 Research/Title | title concepts, thumbnail concept, sources | non-empty source list |
| 04 Script | script, voiceover script, fact QA | word count / structure / citations present |
| 05 Voice | audio, dialogue timings, voice lock | duration target and voice ids |
| 06 Character | character lock doc, reference sheet | prompt template includes full lock text |
| 07 Style | style bible, visual positive/negative examples | style contract id present |
| 08 Beat Manifest | image_beat_manifest, scene_tagged_script | every beat 4–6s, no missing spoken sections |
| 09 Images | one image per beat, image_generation_manifest | no missing files, no duplicate hashes, no `count>1` multi-scene prompt |
| 10 Image QA | contact sheet + visual QA reports | no contact-sheet/collage/reuse/style drift failures |
| 11 Editing | motion plan | every beat has motion/transition |
| 12 Render | clean/review mp4 | ffprobe duration/res/fps/audio |
| 13 Subtitles | disabled/manual subtitles note | no burned subtitles required; captions handled manually by Masala |
| 14 Final QA | proof package | all catastrophic-failure gates false |
| 15 Vibe/Drive | Vibe path, archive manifest | copied to Finance lane, not legacy lane |
| 16 Tracker | tracker csv/md | all phases represented |
| 17 Roster | owner map | non-Director owners present |

### 3. Advance-phase command

No automation should call the next stage directly. It must call:

```bash
python scripts/check_sop_compliance.py --video-dir VIDEO_DIR --phase CURRENT_PHASE
```

Only if this exits `0` may the runner continue.

If it exits non-zero, the runner must either:

- repair the exact failing evidence, or
- write `BLOCKER_REPORT.md`, leave final status as blocked/fail, and stop.

### 4. Hard V5 additions not optional

These override older SOP wording:

- minimum runtime: `>= 480s`
- visual beat cadence: every final visual beat `4.0s <= duration <= 6.0s`
- final frame count must match cadence, not convenience
- no generated prompt may request multiple numbered/separate scenes in one image
- image generation `count > 1` is allowed only for variations of the same single beat, never different beats
- final image files must have one unique source hash per beat unless a callback is explicitly approved
- no contact sheets / grids / 2x2 panels / collage frames
- no old legacy output can be surfaced as upload-ready
- YouTube upload docs must only be attached to the current QA-passed candidate

### 5. Human-facing status language

Allowed final statuses:

- `PASS_UPLOAD_READY`
- `PASS_REVIEW_READY`
- `FAIL_NEEDS_REBUILD`
- `BLOCKED_DEPENDENCY`
- `LEGACY_REJECTED`

Banned language unless the executable gate passes:

- “complete”
- “ready”
- “QA passed”
- “upload-ready”

### 6. Visual QA cannot be text-only

For every full video, Final QA must include:

- pre-render image contact sheet,
- rendered progression contact sheet,
- no-subtitles render proof sheet,
- random frame sample sheet,
- image uniqueness JSON,
- ffprobe JSON,
- Vibe Zone API visibility proof.

A model/agent may judge subjective style, but it must judge from these proof assets, not from filenames or manifests only.

### 7. Deployment safety

Before any Vibe Zone surfacing or upload docs are copied, the deployment script must run:

```bash
python scripts/check_sop_compliance.py --video-dir VIDEO_DIR --phase final
```

If it fails, copy only into a rejected/debug lane, never into `completed`, `approved`, `upload`, or `ready` paths.

## Recommendation

Build all future Finance production through a single orchestrator that refuses to continue unless this compliance checker passes each phase.

The Director should no longer be trusted to decide phase completion from memory or confidence. It must prove completion with files and executable checks.
