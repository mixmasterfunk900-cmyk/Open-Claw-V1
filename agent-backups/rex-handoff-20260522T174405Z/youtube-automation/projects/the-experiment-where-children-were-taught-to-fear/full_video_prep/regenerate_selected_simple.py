#!/usr/bin/env python3
import subprocess, pathlib, json, sys, time
ROOT=pathlib.Path.cwd(); OUT=ROOT/'approved_frames_draft'; plan=json.loads((ROOT/'visual_plan_draft.json').read_text())['beats']
selected={3:'minimal steel bar at far edge, tiny seated child and tiny white rat separated by blank floor; only three simple elements, no detail',14:'empty lab room, small white rat alone near a thin floor line, faint child silhouette far away; very sparse',24:'single pale doorway and one small curled child shape in lower corner; no extra props, no diagrams',44:'Watson as one tall dark outline beside a tiny paper on empty desk, child only a distant dot; very sparse manifesto mood',72:'simple brain/amygdala symbol floating above an empty room; no child close-up, no labels, no arrows with words',94:'one small rat silhouette and one faded sound-wave line in wide empty tan space; no busy diagram',114:'empty pale room with tiny adult researcher silhouette and a small closed notebook; no crowded objects'}
base='Sparse melancholic 2D hand-drawn doodle illustration, rough pencil line art, hollow dark-circled eyes only on any visible people, muted pale tan/warm grey/faded blue-grey palette, near-black lines, flat lighting, very wide negative space, maximum two or three simple objects, no bright colours, no logos, no watermarks, no readable text, not realistic, not 3D, not anime. Fully clothed stylized figures only if present, non-graphic and emotionally restrained.'
for idx,scene in selected.items():
    b=plan[idx-1]; out=OUT/f'beat_{idx:03d}.png'
    prompt=f'{base} Beat {idx:03d} replacement. Scene: {scene}. Narration context: {b.get("narration","")}. Make it simpler and emptier than the previous frame, with the same channel style.'
    cmd=['openclaw','infer','image','generate','--model','openai/gpt-image-2','--prompt',prompt,'--aspect-ratio','16:9','--output-format','png','--background','opaque','--output',str(out),'--timeout-ms','240000','--json']
    print('regen',idx,flush=True)
    r=subprocess.run(cmd,text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT)
    print(r.stdout[-1000:],flush=True)
    if r.returncode!=0 or not out.exists() or out.stat().st_size<100000:
        sys.exit(2)
