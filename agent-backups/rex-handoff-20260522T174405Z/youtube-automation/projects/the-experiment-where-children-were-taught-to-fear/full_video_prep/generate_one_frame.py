#!/usr/bin/env python3
import json, subprocess, sys, time, os, pathlib
ROOT=pathlib.Path(__file__).resolve().parent
beats=json.loads((ROOT/'visual_plan_draft.json').read_text())['beats']
OUT=ROOT/'approved_frames_draft'; OUT.mkdir(exist_ok=True)
STYLE=('The Experiment Channel style only. Sparse melancholic 2D hand-drawn doodle illustration; rough pencil line art; hollow dark-circled eyes on every character; muted pale tan, warm grey, and faded blue-grey palette; near-black lines; flat lighting; wide negative space; minimal environment; no bright colours; no saturated colours; no logos; no watermarks; no readable text except a tiny date or term only if the beat explicitly requires it. Handmade sketchbook aesthetic, not photo, not 3D, not anime.')
BASE_CHAR=('Continuity: Watson is a tall severe male researcher in dark sketch lines when relevant; Rayner is a quiet adult researcher when relevant; white rat is small and harmless-looking when relevant; same line weight and palette across the whole sequence.')
ALBERT_CHAR=('If Albert appears, draw him only as a small stylized child subject with oversized hollow eyes and plain pale clothing, fully clothed, non-realistic, non-graphic, seated apart in wide negative space.')
VARS=['wide empty laboratory with the child tiny in the lower third','close-up on hollow eyes and curled posture with lots of blank background','overhead diagram-like composition using objects as symbols, no readable labels','side profile power-imbalance composition, adults large and child small','single object isolated in negative space with faint emotional echo lines','abstract association chain made from simple drawn objects and a thin line','empty institutional room with only one prop and a small figure','split composition showing before-and-after emotional meaning without text','distant hallway or doorway framing the laboratory as unsafe space','minimal desk-paper-mattress still life, emotionally cold and quiet']
def prompt_for(idx,b):
    nar=b.get('narration',''); scene=b.get('visual_description','')
    variation='sparse fast-cut composition similar to opening frames' if idx<=10 else VARS[(idx-11)%len(VARS)]+'; make this beat visually distinct from nearby frames while preserving channel style and character continuity'
    text='No readable text.'
    if any(x in nar.lower() for x in ['1920','1913','conditioned emotional reactions','behaviorist manifesto']): text='If useful, include only one tiny handwritten date or term from the narration; otherwise no readable text.'
    lower=(nar+' '+scene).lower()
    char=BASE_CHAR
    if any(w in lower for w in ['albert','child','infant','baby']):
        char += ' ' + ALBERT_CHAR
    else:
        char += ' No child, infant, or baby in this frame unless explicitly required by the narration.'
    return f'{STYLE} {char} Beat {idx:03d}. Scene: {scene}. Shot variation: {variation}. Narration context: {nar}. {text} Keep composition sparse, melancholic, non-graphic, historically suggestive, and emotionally restrained.'
idx=int(sys.argv[1]); b=beats[idx-1]; bid=b['id']; out=OUT/b.get('frame_filename',bid+'.png')
if out.exists() and out.stat().st_size>100000:
    print(f'SKIP {bid}'); sys.exit(0)
p=prompt_for(idx,b)
cmd=['openclaw','infer','image','generate','--model','openai/gpt-image-2','--prompt',p,'--aspect-ratio','16:9','--output-format','png','--background','opaque','--output',str(out),'--timeout-ms','240000','--json']
for attempt in range(1,4):
    print(f'GENERATE {bid} attempt {attempt}', flush=True)
    r=subprocess.run(cmd, text=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    print(r.stdout[-2000:], flush=True)
    if r.returncode==0 and out.exists() and out.stat().st_size>100000:
        print(f'OK {bid} {out.stat().st_size}', flush=True); sys.exit(0)
    if '429' in r.stdout or 'rate' in r.stdout.lower(): time.sleep(75*attempt)
    else: time.sleep(20*attempt)
print(f'FAILED {bid}', flush=True); sys.exit(2)
