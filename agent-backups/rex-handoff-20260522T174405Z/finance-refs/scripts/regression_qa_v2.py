#!/usr/bin/env python3
"""Finance V2/V3 historical-failure regression QA.

This gate is intentionally conservative. It must run before final render/Vibe Zone.
It fails if evidence is missing, stale, or ambiguous for prior catastrophic defects.
"""
import csv, json, subprocess, hashlib, os, re
from pathlib import Path
from PIL import Image, ImageStat

ROOT=Path('/root/.openclaw/workspace/youtube-automation-finance')
SLUG=os.environ.get('FINANCE_VIDEO_SLUG','credit-card-minimum-payment-trap')
VD=ROOT/'videos'/SLUG
QA=VD/'qa'; PROOF=VD/'proof'; SCENES=VD/'scenes'; RENDERS=VD/'renders'
QA.mkdir(parents=True,exist_ok=True)
REQUIRED_TRACKER_FIELDS={'task_id','phase','task','status','owner','started_at','completed_at','blocker','output_path','notes'}
FRONTIER={'gpt-image-2','gpt-image-1.5','gpt-image-1'}
FAIL=[]; WARN=[]; PASS=[]

def load_json(p):
    try: return json.load(open(p))
    except Exception as e:
        FAIL.append(f'Missing/unreadable JSON: {p} ({e})'); return None

def image_grid_suspicion(path:Path):
    """Heuristic: visible grid/composite/contact-sheet assets often have long vertical/horizontal gutter lines.
    This does not replace vision QA; it catches obvious repeats automatically.
    """
    try:
        im=Image.open(path).convert('RGB').resize((640,360))
    except Exception as e:
        return True, f'unreadable image: {e}'
    # detect high-contrast near-center divider lines
    pixels=im.load(); w,h=im.size
    suspicious=[]
    for x in [w//2-2,w//2-1,w//2,w//2+1,w//2+2]:
        col=[pixels[x,y] for y in range(h)]
        stat=sum(max(c)-min(c) for c in col)/len(col)
        if stat<18: # uniform vertical gutter/line
            suspicious.append('vertical_center_gutter')
            break
    for y in [h//2-2,h//2-1,h//2,h//2+1,h//2+2]:
        row=[pixels[x,y] for x in range(w)]
        stat=sum(max(c)-min(c) for c in row)/len(row)
        if stat<18:
            suspicious.append('horizontal_center_gutter')
            break
    if len(suspicious)>=2:
        return True, 'possible 2x2/composite/contact-sheet grid: '+','.join(suspicious)
    return False, ''

def check_tracker():
    p=VD/'logs/task_tracker.csv'
    if not p.exists(): FAIL.append('Tracker missing inside video logs'); return
    rows=list(csv.DictReader(open(p)))
    if not rows: FAIL.append('Tracker CSV empty'); return
    if set(rows[0].keys()) != REQUIRED_TRACKER_FIELDS: FAIL.append('Tracker columns do not match required schema')
    if all(r.get('status')=='planned' for r in rows): FAIL.append('Tracker stale/planned-only')
    if all(r.get('owner')=='Director' for r in rows): FAIL.append('Tracker rows all owned by Director')
    director=[r['task_id'] for r in rows if r.get('owner')=='Director']
    if director: FAIL.append(f'Tracker still has Director-owned rows: {director}')
    PASS.append('Tracker ownership/status regression checks passed')

def check_images():
    beat=load_json(VD/'image_beat_manifest.json'); gen=load_json(VD/'image_generation_manifest.json')
    if not beat or not gen: return
    beats=beat.get('beats') or beat.get('scenes') or []
    items=gen.get('items') or gen.get('images') or []
    if len(items) < len(beats): FAIL.append(f'Missing one-full-frame-image-per-beat: {len(items)} generated for {len(beats)} beats')
    byid={i.get('beat_id'):i for i in items}
    hashes={}
    for b in beats:
        bid=b.get('beat_id') or b.get('scene_id')
        item=byid.get(bid)
        if not item:
            FAIL.append(f'Missing image generation manifest item for beat {bid}'); continue
        if item.get('model') not in FRONTIER or item.get('provider')!='openai': FAIL.append(f'Non-frontier/missing GPT provenance for beat {bid}: {item.get("provider")}/{item.get("model")}')
        if item.get('fallback_used'): FAIL.append(f'Fallback image used for beat {bid}')
        if item.get('reused'): FAIL.append(f'Image marked reused for beat {bid}')
        p=Path(item.get('image_path',''))
        if not p.exists(): FAIL.append(f'Missing scene image file for beat {bid}: {p}'); continue
        try:
            im=Image.open(p); w,h=im.size
            if abs((w/h)-(16/9))>0.03: FAIL.append(f'Scene {bid} is not 16:9 full-frame: {w}x{h}')
        except Exception as e: FAIL.append(f'Scene {bid} unreadable: {e}')
        sha=item.get('sha256') or hashlib.sha256(p.read_bytes()).hexdigest()
        if sha in hashes: FAIL.append(f'Repeated/looped/cycled image hash: beat {bid} repeats beat {hashes[sha]}')
        hashes[sha]=bid
        sus,why=image_grid_suspicion(p)
        if sus: FAIL.append(f'Scene {bid} possible grid/composite/collage/contact-sheet visible: {why}')
    PASS.append('Image uniqueness/provenance/full-frame regression checks executed')

def check_reports():
    required=[
        QA/'character_consistency_report.md', QA/'style_consistency_report.md', QA/'image_uniqueness_report.json', QA/'script_visual_alignment_report.md',
        QA/'editing_motion_report.md', QA/'subtitle_style_report.md', QA/'final_ffprobe_report.json', QA/'final_qa_report.md',
        PROOF/'visual_progression_contact_sheet.jpg', PROOF/'image_contact_sheet_pre_render.jpg', PROOF/'subtitle_style_proof_sheet.jpg']
    for p in required:
        if not p.exists(): FAIL.append(f'Missing proof/QA package file: {p}')
    # explicit report keyword checks, conservative
    for p, terms in [(QA/'character_consistency_report.md',['race','age','identity','PASS']), (QA/'style_consistency_report.md',['cartoon','style','PASS']), (QA/'subtitle_style_report.md',['one-line','white','outline','no box','PASS'])]:
        if p.exists():
            txt=p.read_text(errors='ignore').lower()
            for term in terms:
                if term.lower() not in txt: FAIL.append(f'{p.name} does not explicitly mention required regression term: {term}')
    PASS.append('Proof package presence checks executed')

def check_render_if_exists():
    clean=RENDERS/f'{SLUG}_clean_master.mp4'
    review=RENDERS/f'{SLUG}_burned_captions_review.mp4'
    if not clean.exists() or not review.exists():
        WARN.append('Render files not present yet; regression QA cannot pass final until render/subtitle checks run')
        return
    try:
        out=subprocess.check_output(['ffprobe','-v','error','-print_format','json','-show_streams','-show_format',str(clean)],text=True)
        data=json.loads(out); (QA/'final_ffprobe_report.json').write_text(json.dumps(data,indent=2))
        v=next((s for s in data['streams'] if s.get('codec_type')=='video'),{})
        if v.get('width')!=1920 or v.get('height')!=1080: FAIL.append('Final render wrong resolution')
        if v.get('codec_name')!='h264': FAIL.append('Final render codec not H.264')
    except Exception as e: FAIL.append(f'ffprobe failed: {e}')
    # motion proof is external/visual but require explicit report
    em=QA/'editing_motion_report.md'
    if em.exists():
        txt=em.read_text(errors='ignore').lower()
        for term in ['motion','transition','zoom','pass']:
            if term not in txt: FAIL.append(f'editing_motion_report missing term: {term}')
    PASS.append('Render regression checks executed where files exist')

def main():
    check_tracker(); check_images(); check_reports(); check_render_if_exists()
    result={'REGRESSION_QA_PASS': not FAIL, 'failures': FAIL, 'warnings': WARN, 'passes': PASS}
    (QA/'regression_qa_report.json').write_text(json.dumps(result,indent=2))
    md=['# Regression QA Report','',f'REGRESSION_QA_PASS={str(not FAIL).lower()}','']
    if FAIL: md += ['## Failures']+[f'- {x}' for x in FAIL]+['']
    if WARN: md += ['## Warnings']+[f'- {x}' for x in WARN]+['']
    md += ['## Checks covered','- character race/age/style drift via required report terms','- overall art style drift','- visible 2x2/grid/composite/collage/contact-sheet scene assets','- repeated/looped/cycled image hashes','- missing one-full-frame-image-per-beat','- frontier GPT model provenance per beat','- render motion/transition proof requirement','- subtitle box/background/size/line/off-beat proof requirement','- proof package presence','- tracker stale/planned-only and Director ownership regressions']
    (QA/'regression_qa_report.md').write_text('\n'.join(md)+'\n')
    print(json.dumps(result,indent=2))
    raise SystemExit(0 if not FAIL else 2)
if __name__=='__main__': main()
