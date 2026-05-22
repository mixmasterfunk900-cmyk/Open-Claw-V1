# 11 — Editing Plan

This gate fixes V1's missing editing/motion failure.

## Must do

Every beat must have:

- motion effect
- transition type
- transition duration
- motion intensity
- narrative reason if `STATIC` or `HOLD`

## Motion effects

- `ZOOM_IN`
- `ZOOM_OUT`
- `DRIFT_L`
- `DRIFT_R`
- `SHAKE_MICRO`
- `STATIC_LIMITED`

## Transition types

- `CUT`
- `DISSOLVE`
- `FADE`
- `WIPE_L`
- `WIPE_R`
- `DIP_WHITE`

## Rules

- Subtle motion on nearly every scene.
- Static <= 10% of scenes.
- No same motion more than twice in a row.
- No same transition more than twice in any 5-scene block.
- SHAKE only for stat/punchline/shock beats; never consecutive.

## Required files

- `${VIDEO_DIR}/editing_plan.json`
- `${VIDEO_DIR}/qa/editing_plan_qa.md`

## Pass criteria

Editing plan passes before render begins.
