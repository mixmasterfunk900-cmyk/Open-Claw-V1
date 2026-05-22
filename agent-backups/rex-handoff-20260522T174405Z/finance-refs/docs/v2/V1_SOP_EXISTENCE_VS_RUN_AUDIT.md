# V1 SOP Existence vs First-Run Audit

Date: 2026-05-20
Project audited: `videos/rent-trap-broke-american-dream`

## Short verdict

Most of the requested protections existed in V1 in some form, but they were too soft and/or were skipped by the first run. The first run should not have passed QA.

## 1. Character lock / character consistency

### Exists in V1?
Yes, partially.

Evidence in SOP:
- Character Bible is marked non-negotiable.
- SOP says every image prompt must include exact character data.
- Visual Consistency QA Agent exists.
- QA Visual checks Laura/John clothing consistency in same section.

### Was it skipped?
Effectively yes.

The first-run prompts did **not** include the full exact Laura/John character bible. They used shortened forms like `Laura: Laura anxious` and `John: John serious`. There was no generated reference sheet, no character lock asset, and no objective character consistency report.

### V2 fix
Convert Character Bible from prompt guidance into a hard `CHARACTER_LOCK_QA_PASS` gate with reference sheets and fail/repair behavior.

## 2. Overall visual style consistency

### Exists in V1?
Yes, partially.

Evidence in SOP:
- Shared visual rules specify clean illustrated environments and palette.
- Base style is repeated in prompts.
- Visual Consistency QA Agent checks style consistency.
- QA Visual checks ChatGPT Images output follows 2D editorial style.

### Was it skipped?
Effectively yes.

The SOP wording was not strict enough for the desired cartoon style. It allowed “modern editorial illustration” and “slightly stylised,” which can drift toward drawn realism. No style reference sheet or style proof package was required.

### V2 fix
Add `STYLE_LOCK_QA_PASS`: one cartoon explainer style only, with no realism/portrait/editorial drift.

## 3. Image generation follows script / changes on beat / no looping

### Exists in V1?
Partially.

Evidence in SOP:
- Scene Extraction Logic creates beat manifest from script/audio.
- Image Beat Sub-Agents generate images for assigned beat ranges.
- Phase 6 PASS says every scene has a prompt and image file.

### Was it skipped?
Yes. This is the clearest catastrophic skip.

First-run `phase_6_images.log` says:
> generated 12 frontier GPT key images and populated 96 scene files by reuse/cycling for first run

The QA report repeated this and still marked PASS. That violates the intended SOP behavior. V1 did not have a strong enough no-reuse/hash gate, so the run treated cyclic reuse as acceptable.

### V2 fix
Add `NO_IMAGE_REUSE_PASS`, per-beat image hashes, model provenance per beat, and automatic FAIL if looping/reuse is detected.

## 4. Top-tier GPT/ChatGPT model usage

### Exists in V1?
Yes.

Evidence in SOP and decision lock:
- `IMAGE_MODEL: ChatGPT Images 2.0`
- Decision lock says use the GPT/frontier image model linked to OpenClaw and do not silently downgrade.

### Was it skipped?
Partially.

The manifest says `ChatGPT Images 2.0 via OpenClaw frontier GPT image generation path`, and the log says 12 frontier GPT key images were generated. But because only 12 key images were generated and then cycled into 96 scenes, the model requirement was not satisfied for every beat.

### V2 fix
`FRONTIER_MODEL_PROVENANCE_PASS` per beat, not per project. Every scene must log actual provider/model or fail.

## 5. Editing / transitions / faint zoom

### Exists in V1?
Yes.

Evidence in SOP:
- Master order includes assigning motion effects, transitions, and pacing.
- Scene tags include `EFFECT=` and `TRANS=`.
- Phase 7 contains motion and transition rules.
- QA Motion checks motion/transition constraints.

### Was it skipped?
Likely yes.

The scene tags contain motion/transition metadata, but the assembly log only says final MP4 was assembled. There is no render proof that zoom/drift/transitions were actually applied. The final output review indicates no editing. V1 allowed metadata to count as completion without proving rendered motion.

### V2 fix
Add `EDITING_RENDER_PROOF_PASS`: the rendered video must prove motion/transitions, not just have tags in manifests.

## 6. Subtitle style

### Exists in V1?
Yes.

Evidence in SOP:
- Phase 7d says one line at a time.
- Subtitle style says white text with thin black outline.
- QA Subtitles checks white with visible black outline.

### Was it skipped?
Yes.

The produced subtitles were too large and had a black highlighted/background box. That contradicts V1. V1 did not include a hard “no background box” check and did not require subtitle proof frames before pass.

### V2 fix
Add `SUBTITLE_STYLE_LOCK_PASS`: one line only, white, thin black outline, transparent background, no box, proof-sheet required.

## 7. Proof package before complete

### Exists in V1?
No, not strongly enough.

V1 had QA concepts, but not a required visual proof package with contact sheets, duplicate hash report, character/style audits, subtitle proof, and motion proof.

### V2 fix
Add mandatory proof package. Missing proof package means `BLOCKED_QA_NOT_COMPLETE`.
