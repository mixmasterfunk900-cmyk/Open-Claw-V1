# OpenClaw Handoff: Dog Paw Psychology Video

## Current State

- Project root: `C:\Users\ry_bo\Documents\New project`
- Video folder: `C:\Users\ry_bo\Documents\New project\output\dog-paw-psychology`
- Full video prep folder: `C:\Users\ry_bo\Documents\New project\output\dog-paw-psychology\full_video_prep`
- Total visual beats: `117`
- Approved/generated frames currently present: `23`
- Next frame to generate: `beat_024.png`
- Next beat timestamp: `01:52-01:58`
- Next narration: `In another, the person used verbal contact only. In the third, the person ignored the dog.`
- Voiceover: `C:\Users\ry_bo\Documents\New project\output\dog-paw-psychology\full_video_prep\voiceover_drop\final_voiceover.wav.wav`
- Voiceover duration: about `10:32.35`

## Key Files

- Full script: `C:\Users\ry_bo\Documents\New project\output\dog-paw-psychology\script.md`
- Beat/timing plan: `C:\Users\ry_bo\Documents\New project\output\dog-paw-psychology\full_video_prep\visual_plan.json`
- Human-readable prompt plan: `C:\Users\ry_bo\Documents\New project\output\dog-paw-psychology\full_video_prep\image_prompt_plan.md`
- Approved frames folder: `C:\Users\ry_bo\Documents\New project\output\dog-paw-psychology\full_video_prep\approved_frames`
- Missing-frame tracker: `C:\Users\ry_bo\Documents\New project\output\dog-paw-psychology\full_video_prep\missing_frames_remaining.csv`
- QA contact sheet folder: `C:\Users\ry_bo\Documents\New project\output\dog-paw-psychology\full_video_prep\qa_contact_sheets`
- Stitch script: `C:\Users\ry_bo\Documents\New project\scripts\stitch_dog_paw_full_video.mjs`
- Thumbnail options: `C:\Users\ry_bo\Documents\New project\output\dog-paw-psychology\thumbnails\final`

## Creative Direction

Use the approved ChatGPT-generated frames as the visual target, especially:

- `approved_frames\beat_017.png`
- `approved_frames\beat_020.png`
- `approved_frames\beat_021.png`
- `approved_frames\beat_023.png`

Style:

- Original premium hand-drawn educational explainer.
- Warm cream paper texture.
- Confident charcoal linework.
- Soft watercolor grain.
- Gentle warm domestic or research lighting.
- Emotionally warm, clean, high-quality YouTube explainer look.

Palette:

- Golden dog fur.
- Warm cream background.
- Charcoal ink.
- Dusty coral/terracotta owner sweater.
- Amber highlights.
- Soft rose accents.
- Avoid dominant sage/olive/green clothing.

Continuity:

- Home scenes: same golden medium-sized dog, same black-haired owner wearing dusty coral/terracotta sweater.
- Research scenes: clean warm test-room visuals with beagles/researchers, same art direction, no university logos.

Do not directly copy the user's reference images. They were style-quality references only.

## QA Gate

Only put a frame in `approved_frames` if it passes:

- Directly matches the narration beat and timestamp.
- No readable generated text, numbers, logos, or watermarks.
- No large arrows or clutter.
- No copied reference composition.
- Human anatomy: no duplicate hands, no extra fingers, no broken wrists. Exactly two hands per visible human unless cropping naturally hides one.
- Dog anatomy: no extra paws/legs, no warped muzzle, no duplicated ears.
- Paw/contact logic must match the beat.
- Avoid childish scribbles or crude clipart.
- Keep scene variety so it does not feel like the same image with text changed.

If a frame fails, regenerate it before continuing.

## How To Continue

1. Open `visual_plan.json`.
2. Start at `beat_024`.
3. For each missing beat:
   - Generate a custom 16:9 image prompt from the beat narration and overall video logic.
   - Do not blindly trust the existing `image_prompt` for research/science beats; some auto-prompts are too generic and should be overridden.
   - Save the accepted image as:
     `C:\Users\ry_bo\Documents\New project\output\dog-paw-psychology\full_video_prep\approved_frames\beat_024.png`
     then `beat_025.png`, etc.
4. Refresh `missing_frames_remaining.csv` periodically.
5. Create batch contact sheets in `qa_contact_sheets` so progress is visible.
6. When all `beat_001.png` through `beat_117.png` exist, run:
   `node scripts\stitch_dog_paw_full_video.mjs`
7. Final video output defaults to:
   `C:\Users\ry_bo\Documents\New project\output\dog-paw-psychology\full_video_prep\dog_paw_full_preview.mp4`

## Useful Progress Commands

Count approved/missing frames:

```powershell
node -e "const fs=require('fs'),p=require('path'); const plan=JSON.parse(fs.readFileSync('output/dog-paw-psychology/full_video_prep/visual_plan.json','utf8')); const dir='output/dog-paw-psychology/full_video_prep/approved_frames'; const missing=plan.beats.filter(b=>!fs.existsSync(p.join(dir,b.frame_filename))); console.log(JSON.stringify({total:plan.beats.length,approved:plan.beats.length-missing.length,missing:missing.length,next:missing[0]?.id,nextNarration:missing[0]?.narration,nextStart:missing[0]?.start,nextEnd:missing[0]?.end},null,2));"
```

Update missing-frame CSV:

```powershell
node -e "const fs=require('fs'),p=require('path'); const prep='output/dog-paw-psychology/full_video_prep'; const plan=JSON.parse(fs.readFileSync(p.join(prep,'visual_plan.json'),'utf8')); const dir=p.join(prep,'approved_frames'); const missing=plan.beats.filter(b=>!fs.existsSync(p.join(dir,b.frame_filename))); fs.writeFileSync(p.join(prep,'missing_frames_remaining.csv'), ['id,start,end,frame_filename,narration', ...missing.map(b=>[b.id,b.start,b.end,b.frame_filename,JSON.stringify(b.narration)].join(','))].join('\n')); console.log(JSON.stringify({approved:plan.beats.length-missing.length,missing:missing.length,next:missing[0]?.id},null,2));"
```

## Continuation Prompt For OpenClaw

You are taking over production of a dog psychology YouTube video. Continue exactly where Codex left off.

Start in:

`C:\Users\ry_bo\Documents\New project`

The full beat plan is:

`output\dog-paw-psychology\full_video_prep\visual_plan.json`

Approved frames are in:

`output\dog-paw-psychology\full_video_prep\approved_frames`

Frames `beat_001.png` through `beat_023.png` already exist. Do not overwrite them unless a human asks. Continue from `beat_024.png`.

Generate 16:9 polished hand-drawn educational explainer images for each remaining beat. Use the approved frames as the quality/style target. Save each accepted frame using the exact `frame_filename` from the plan in the `approved_frames` folder.

Important: the existing auto-generated image prompts are helpful but not always correct. For research/science beats, make a custom scene that matches the narration rather than using a generic living-room prompt.

Visual direction:

- Premium original hand-drawn editorial explainer.
- Warm cream paper texture, charcoal linework, soft watercolor grain.
- Golden dog, terracotta/coral owner sweater, amber highlights, soft rose accents.
- Avoid dominant green/sage palette.
- No generated text, numbers, labels, logos, or watermarks.
- No arrows.
- No copied composition from references.
- Avoid extra hands, extra fingers, extra paws, warped dog faces, childish scribbles.
- Keep scenes varied and timestamp-faithful.

QA every generated frame before accepting it. If it fails anatomy, scene match, or text/logo rules, regenerate it. Create periodic contact sheets in:

`output\dog-paw-psychology\full_video_prep\qa_contact_sheets`

When all 117 frames exist, stitch with:

`node scripts\stitch_dog_paw_full_video.mjs`

Use the existing voiceover:

`output\dog-paw-psychology\full_video_prep\voiceover_drop\final_voiceover.wav.wav`

Final output should be:

`output\dog-paw-psychology\full_video_prep\dog_paw_full_preview.mp4`
