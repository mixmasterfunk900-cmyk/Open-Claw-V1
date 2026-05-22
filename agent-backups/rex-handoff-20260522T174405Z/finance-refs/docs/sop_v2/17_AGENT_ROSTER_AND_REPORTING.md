# 17 — Agent Roster & Reporting Ownership

This doc fixes the V2 tracker/reporting gap found during the rerun.

## Rule

The Director coordinates, but must not be the owner for every task. Each phase must have a named logical owner, and tracker updates must be handled by a Reporting/Tracker Agent so build work is not blocked by status reporting.

## Required logical agents

- Director Agent — orchestrates and makes final routing decisions.
- Reporting/Tracker Agent — owns task tracker, Sheet/local CSV/Markdown updates, and progress visibility.
- State Logger Agent — owns manifest and phase logs.
- Topic Discovery Agent — owns Phase 1 topic selection.
- Research Agent — owns research and citations.
- Title/Thumbnail Agent — owns titles and thumbnail concepts.
- Script Agent — owns script draft.
- Fact QA Agent — owns factual support checks.
- Voice Casting/TTS Agent — owns voice selection and audio generation.
- Character Lock Agent — owns Laura/John identity locks.
- Style Lock Agent — owns cartoon style lock.
- Image Beat Manifest Agent — owns timestamped beat plan.
- Image Beat Sub-Agents — own generated scene batches.
- Image QA Agent — owns visual consistency/no-reuse/script alignment checks.
- Editing Plan Agent — owns motion/transition plan.
- Renderer Agent — owns render assembly.
- Subtitle Agent — owns subtitles and subtitle QA.
- Final QA Agent — owns proof package and hard-gate pass/fail.
- Vibe/Archive Agent — owns Vibe Zone addition and Drive/local archive.

## Tracker update requirements

- Reporting/Tracker Agent creates the tracker within the first 10 minutes.
- Reporting/Tracker Agent updates tracker at every phase transition.
- Owner column must name the responsible logical agent, not always Director.
- If Google Sheet update is blocked, local CSV/Markdown must still update and be copied to Drive when possible.

## Status values

Only these values are allowed:

- `planned`
- `in_progress`
- `waiting`
- `complete`
- `blocked`

## Pass criteria

- Tracker exists.
- Tracker has accurate owners.
- Tracker has at least one non-Director owner before Phase 3.
- Reporting/Tracker Agent remains active/logical owner through final report.
