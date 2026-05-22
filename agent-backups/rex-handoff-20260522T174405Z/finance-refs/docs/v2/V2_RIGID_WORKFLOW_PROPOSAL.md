# Finance SOP V2 — Rigid Workflow Proposal

This proposal converts the first-run failures into mandatory gates for the Finance SOP V2. Nothing here replaces V1 yet; it is the proposed change set for approval.

## 1. Character Bible Upgrade: locked identities, not prompt suggestions

### Problem
Laura and John changed race, age, style, and appearance across scenes.

### SOP change
Add a **Character Lock Phase** before image generation:

1. Generate or choose approved master reference sheets for Laura and John.
2. Store them under `config/character_lock/`.
3. Every scene prompt must reference the lock.
4. Scene QA must compare every generated image against the lock.
5. Any scene where age/race/style/face/hair/clothing drifts is automatic FAIL and must regenerate.

### Hard gate
`CHARACTER_LOCK_QA_PASS` requires:
- Laura remains mid-20s, same skin tone, face shape, hair, clothing family.
- John remains early-60s, same skin tone, hairline, build, clothing family.
- Both stay in the same cartoon visual universe.
- No accidental race/age swaps.

## 2. Style Bible Upgrade: cartoon show style only

### Problem
The output switched between cartoon, editorial illustration, and drawn realism.

### SOP change
Replace loose style language with a **single locked visual style card**:

> 2D cartoon explainer style, clean rounded shapes, consistent medium-thick outlines, warm flat colors, simple expressive faces, slightly exaggerated cartoon proportions, not photorealistic, not painterly realism, not semi-realistic editorial portrait, not 3D, not anime.

Create `config/style_lock.md` and require it in every image prompt.

### Hard gate
`STYLE_LOCK_QA_PASS` requires:
- Same cartoon style across all scenes.
- No drawn realism / portrait realism.
- No mixed generations of art style.
- No photorealistic lighting or textures.

## 3. Image Beat Manifest: no loops, no reuse, every image follows script

### Problem
Images looped/repeated and did not change on beat.

### SOP change
Add a deterministic **Image Beat Manifest Gate**:

For every audio/script beat, create:
- beat number
- exact script line/sentence range
- timestamp start/end
- scene objective
- character(s)
- setting
- visual action
- unique prompt
- generated image path
- image hash
- reuse status

### Hard gates
1. `NO_IMAGE_REUSE_PASS`
   - Every beat must have a unique image file unless explicitly marked as an intentional callback.
   - Repeated hashes or duplicated filenames are automatic catastrophic FAIL.

2. `SCRIPT_VISUAL_ALIGNMENT_PASS`
   - Every image must visually match the beat's script meaning.
   - Generic filler scenes fail.

3. `FRONTIER_MODEL_PROVENANCE_PASS`
   - Every generated scene logs the actual model/provider.
   - If the top-tier GPT image model was not used, the beat is marked failed unless a Debug Agent approved and logged the fallback.

4. `BEAT_CHANGE_PASS`
   - Render proof must show image changes across the full timeline.
   - No image may remain onscreen longer than the allowed beat duration unless intentionally marked HOLD.

## 4. Editing Pass: transitions and subtle motion are mandatory

### Problem
No editing, no transitions, no faint zoom.

### SOP change
Add a separate **Editing Plan + Render Motion Gate** after images and before final render.

For every scene/beat, manifest must include:
- motion effect: `ZOOM_IN`, `ZOOM_OUT`, `DRIFT_L`, `DRIFT_R`, `STATIC_LIMITED`, or `SHAKE_MICRO`
- transition: `CUT`, `DISSOLVE`, `FADE`, `WIPE_L`, `WIPE_R`, `DIP_WHITE`
- effect intensity
- transition duration

### Hard gate
`EDITING_QA_PASS` requires:
- Subtle motion on nearly every scene.
- `STATIC` limited to <= 10% of scenes.
- No missing transition metadata.
- No more than two identical motion effects in a row.
- Render proof confirms motion/transitions actually exist, not just manifest text.

## 5. Subtitle Style Lock: one line, white text, thin black outline

### Problem
Subtitles were huge and had a black highlighted background.

### SOP change
Add a **Subtitle Style Lock**:

Required subtitle style:
- one line only
- white text
- thin black outline/stroke
- no black box/background/highlight
- smaller readable long-form size
- fixed safe position
- timed to words/phrases, not paragraph blocks

Recommended starting ASS style at 1920x1080:
- Font: Arial Black or Montserrat ExtraBold
- Font size: 42–48, not 56+ unless QA proves it fits
- Primary colour: white
- Outline: 2–3px black
- BackColour alpha: fully transparent
- BorderStyle: outline only, never box
- Max one line

### Hard gate
`SUBTITLE_STYLE_QA_PASS` requires:
- No subtitle background box.
- No two-line subtitle blocks.
- No oversized text covering visuals.
- Subtitle timing matches spoken beat.
- Sample frames across the video confirm style.

## 6. Visual Proof Sheet Before Final Approval

### Problem
The failure was visible, but the workflow still advanced.

### SOP change
No video can be called complete until a proof package exists:

Required proof files:
- `visual_progression_contact_sheet.jpg` — sampled every 15–30 seconds.
- `scene_uniqueness_report.json` — hashes and duplicate/reuse checks.
- `character_consistency_report.md` — Laura/John lock audit.
- `style_consistency_report.md` — cartoon style audit.
- `subtitle_style_proof_sheet.jpg` — frames proving subtitle style.
- `editing_motion_report.md` — motion/transition confirmation.

### Hard gate
If proof package is missing, final status must be `BLOCKED_QA_NOT_COMPLETE`, not ready.

## 7. Proposed V2 phase insertion

Insert these gates into the existing SOP:

1. Phase 5.5 — Character + Style Lock Creation/Load
2. Phase 6.0 — Beat Manifest from script/audio timestamps
3. Phase 6.1 — Frontier Image Generation with provenance
4. Phase 6.2 — Character/Style/Uniqueness QA and repair
5. Phase 7.0 — Editing Plan Manifest
6. Phase 7.1 — Render with actual motion/transitions
7. Phase 8.0 — Proof Package QA before Vibe Zone

## 8. Recommendation

Make V2 stricter than V1: if a run loops images, mixes character identity, uses wrong subtitle style, or renders without motion, it should stop as QA failed and repair automatically. It should never silently ship to Vibe Zone as “complete.”
