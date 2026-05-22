#!/usr/bin/env python3
import json, subprocess, sys, time, os, pathlib, datetime, hashlib

ROOT=pathlib.Path(__file__).resolve().parent
PLAN=ROOT/'visual_plan_draft.json'
OUT=ROOT/'approved_frames_draft'
MANIFEST=ROOT/'frame_generation_manifest.json'
OUT.mkdir(parents=True, exist_ok=True)

data=json.loads(PLAN.read_text())
beats=data['beats']
STYLE=(
    'The Experiment Channel style only. Sparse melancholic 2D hand-drawn doodle illustration; rough pencil line art; '
    'hollow dark-circled eyes on every character; muted pale tan, warm grey, and faded blue-grey palette; near-black lines; '
    'flat lighting; wide negative space; minimal environment; no bright colours; no saturated colours; no logos; no watermarks; '
    'no readable text except a tiny date or term only if the beat explicitly requires it. Handmade sketchbook aesthetic, not photo, not 3D, not anime.'
)
CHAR=(
    'Continuity: infant Albert is a very small vulnerable child with oversized hollow eyes, simple one-piece pale clothing; '
    'Watson is a tall severe male researcher in dark sketch lines; Rayner is a quiet adult researcher; white rat is small and harmless-looking; '
    'same line weight and palette as the first frame.'
)
SHOT_VARIATIONS=[
    'wide empty laboratory with the child tiny in the lower third',
    'close-up on hollow eyes and curled posture with lots of blank background',
    'overhead diagram-like composition using objects as symbols, no readable labels',
    'side profile power-imbalance composition, adults large and child small',
    'single object isolated in negative space with faint emotional echo lines',
    'abstract association chain made from simple drawn objects and a thin line',
    'empty institutional room with only one prop and a small figure',
    'split composition showing before-and-after emotional meaning without text',
]

def prompt_for(idx,b):
    narration=b.get('narration','')
    scene=b.get('visual_description','')
    variation='sparse fast-cut composition similar to opening frames' if idx<=10 else SHOT_VARIATIONS[(idx-11)%len(SHOT_VARIATIONS)]
    if idx>10:
        variation += '; make this beat visually distinct from nearby frames while preserving channel style and character continuity'
    text_rule='No readable text.'
    low=narration.lower()
    if any(x in low for x in ['1920','1913','conditioned emotional reactions','behaviorist manifesto']):
        text_rule='If useful, include only one tiny handwritten date or term from the narration; otherwise no readable text.'
    return f"{STYLE} {CHAR} Beat {idx:03d}. Scene: {scene}. Shot variation: {variation}. Narration context: {narration}. {text_rule} Keep composition sparse, melancholic, non-graphic, historically suggestive, and emotionally restrained."

def load_manifest():
    if MANIFEST.exists():
        try: return json.loads(MANIFEST.read_text())
        except Exception: pass
    return {'project': data.get('project'), 'source_plan': str(PLAN.name), 'model':'openai/gpt-image-2', 'generated_at_utc': None, 'frames': []}

def save_manifest(m):
    m['generated_at_utc']=datetime.datetime.utcnow().isoformat(timespec='seconds')+'Z'
    MANIFEST.write_text(json.dumps(m, indent=2))

def sha(path):
    h=hashlib.sha256(); h.update(path.read_bytes()); return h.hexdigest()

def existing_ids(m):
    return {f.get('id') for f in m.get('frames',[]) if f.get('status')=='generated' and (ROOT/f.get('path','')).exists()}

m=load_manifest(); done=existing_ids(m)
# ensure beat_001 is recorded if present
b1=OUT/'beat_001.png'
if b1.exists() and 'beat_001' not in done:
    b=beats[0]
    m['frames'].append({'id':'beat_001','filename':'beat_001.png','path':'approved_frames_draft/beat_001.png','status':'generated','model':'openai/gpt-image-2','prompt':prompt_for(1,b),'sha256':sha(b1),'generated_at_utc':datetime.datetime.utcnow().isoformat(timespec='seconds')+'Z','note':'Generated via OpenClaw image_generate tool before batch CLI run.'})
    save_manifest(m); done.add('beat_001')

start=int(os.environ.get('START','1')); end=int(os.environ.get('END',str(len(beats))))
for idx,b in enumerate(beats, start=1):
    if idx<start or idx>end: continue
    bid=b['id']; fn=b.get('frame_filename',f'{bid}.png'); out=OUT/fn
    if bid in done and out.exists():
        print(f'SKIP {bid}', flush=True); continue
    p=prompt_for(idx,b)
    cmd=['openclaw','infer','image','generate','--model','openai/gpt-image-2','--prompt',p,'--aspect-ratio','16:9','--output-format','png','--background','opaque','--output',str(out),'--timeout-ms','180000','--json']
    ok=False; last=''
    for attempt in range(1,4):
        print(f'GENERATE {bid} attempt {attempt}', flush=True)
        r=subprocess.run(cmd, text=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
        last=r.stdout[-4000:]
        print(last, flush=True)
        if r.returncode==0 and out.exists() and out.stat().st_size>100000:
            rec={'id':bid,'filename':fn,'path':f'approved_frames_draft/{fn}','status':'generated','model':'openai/gpt-image-2','prompt':p,'sha256':sha(out),'bytes':out.stat().st_size,'generated_at_utc':datetime.datetime.utcnow().isoformat(timespec='seconds')+'Z'}
            m['frames']=[x for x in m.get('frames',[]) if x.get('id')!=bid]
            m['frames'].append(rec); m['frames'].sort(key=lambda x:x.get('id',''))
            save_manifest(m); ok=True; break
        sleep=20*attempt
        if '429' in last or 'rate' in last.lower(): sleep=60*attempt
        time.sleep(sleep)
    if not ok:
        m['frames']=[x for x in m.get('frames',[]) if x.get('id')!=bid]
        m['frames'].append({'id':bid,'filename':fn,'path':f'approved_frames_draft/{fn}','status':'failed','model':'openai/gpt-image-2','prompt':p,'last_error':last,'generated_at_utc':datetime.datetime.utcnow().isoformat(timespec='seconds')+'Z'})
        save_manifest(m)
        print(f'FAILED {bid}', flush=True)
        sys.exit(2)
print('DONE', flush=True)
