#!/usr/bin/env python3
import json, math, os, pathlib, random, re, shutil, struct, zlib
from difflib import SequenceMatcher

ROOT = pathlib.Path('/root/.openclaw/workspace')
INBOX = ROOT/'youtube-automation/inbox/dog-content-audio-20260519'
ALIGN = INBOX/'alignment'
DOG = ROOT/'vibe-zone/media/practice/youtube-automation/dog-content'
PROJECTS = ROOT/'youtube-automation/projects'
SLUGS = ['why-dogs-follow-you-everywhere','why-dogs-get-zoomies','why-dogs-look-guilty']
STYLE = ('Premium original hand-drawn educational YouTube explainer frame, 16:9 landscape. '
         'Warm cream paper texture, confident charcoal linework, soft watercolor grain, golden dog/beagle, '
         'terracotta/coral owner sweater, no readable generated text/logos/watermarks/arrows. ')
W,H = 1920,1080

def norm(text): return re.findall(r"[a-z0-9']+", (text or '').lower())
def load_words(alignment):
    words=[]
    for seg in alignment.get('segments',[]):
        for w in seg.get('words') or []:
            token = (w.get('word') or '').strip()
            toks = norm(token)
            if toks and isinstance(w.get('start'), (int,float)) and isinstance(w.get('end'), (int,float)):
                words.append({'word': token, 'token': toks[0], 'start': float(w['start']), 'end': float(w['end'])})
    return words

def similarity(a,b):
    a=' '.join(norm(a)[:280]); b=' '.join(norm(b)[:280])
    return SequenceMatcher(None,a,b).ratio()

def map_audio_to_slugs():
    scripts={s:(DOG/s/'transcripts'/f'{s}-script-v1-voiceover-only.txt').read_text() for s in SLUGS}
    used=set(); mapping={}
    for jp in sorted(ALIGN.glob('drive-*.json')):
        txt=json.loads(jp.read_text()).get('text','')
        scores=sorted(((similarity(txt,st),slug) for slug,st in scripts.items() if slug not in used), reverse=True)
        score,slug=scores[0]
        if score < 0.55:
            raise SystemExit(f'Could not confidently map {jp.name}; best {slug} score {score:.3f}')
        mapping[jp.stem]=slug; used.add(slug)
    if set(mapping.values()) != set(SLUGS):
        raise SystemExit(f'Missing mappings. Got {mapping}')
    return mapping

def chunk_words(words):
    beats=[]; i=0; n=len(words)
    while i<n:
        start=words[i]['start']; j=i
        # Prefer sentence/phrase end after 4.3s, hard cap around 6.2s.
        best=None
        while j<n:
            dur=words[j]['end']-start
            if dur>=4.2 and re.search(r'[.!?]$', words[j]['word']):
                best=j+1; break
            if dur>=5.2 and re.search(r'[,;:]$', words[j]['word']):
                best=j+1; break
            if dur>=5.7:
                best=j+1; break
            j+=1
        if best is None: best=n
        # Avoid a tiny final beat.
        if n-best < 8 and beats:
            best=n
        beats.append(words[i:best]); i=best
    return beats

def make_prompt(slug, idx, narration):
    variants = {
      'why-dogs-follow-you-everywhere':['sofa-to-kitchen follow moment','bathroom door betrayal with patient dog outside','secure-base owner/dog room scene','dog checking owner face before moving','calm shadowing in warm hallway','owner practicing short separation with treat mat'],
      'why-dogs-get-zoomies':['quiet dog becoming sofa race-car blur','post-bath towel rocket in bathroom','puppy evening witching-hour with tired owner','energy release visual as glowing household rhythm, no labels','loose joyful sprint in safe yard','calm redirect to toy before bedtime'],
      'why-dogs-look-guilty':['shredded tissue scene with soft dog body','owner enters room and dog lowers head','dog reading owner expression, not courtroom guilt','bin tipped over in warm kitchen','gentle cleanup and management scene','trust-repair moment with calm owner']
    }[slug]
    scene = variants[(idx-1)%len(variants)]
    if idx <= 8: scene = variants[idx-1 if idx-1 < len(variants) else (idx-1)%len(variants)] + ', dynamic hook composition'
    return STYLE + f'Scene: {scene}. Visual should match narration: "{narration[:220]}".'

# Tiny pure-python RGB PNG writer + rough hand-drawn primitives.
def png_write(path, rgb):
    raw = bytearray()
    stride=W*3
    for y in range(H):
        raw.append(0); raw.extend(rgb[y*stride:(y+1)*stride])
    def chunk(t,d): return struct.pack('>I',len(d))+t+d+struct.pack('>I', zlib.crc32(t+d)&0xffffffff)
    data = b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB',W,H,8,2,0,0,0)) + chunk(b'IDAT', zlib.compress(bytes(raw), 5)) + chunk(b'IEND', b'')
    path.write_bytes(data)

def setp(buf,x,y,c):
    if 0<=x<W and 0<=y<H:
        k=(y*W+x)*3; buf[k:k+3]=bytes(c)
def rect(buf,x0,y0,x1,y1,c):
    x0=max(0,int(x0)); x1=min(W,int(x1)); y0=max(0,int(y0)); y1=min(H,int(y1))
    row=bytes(c)*(x1-x0)
    for y in range(y0,y1):
        k=(y*W+x0)*3; buf[k:k+len(row)]=row
def circle(buf,cx,cy,r,c,fill=True,th=4):
    cx=int(cx); cy=int(cy); r=int(r); rr=r*r
    inner=max(0,r-th); ii=inner*inner
    for y in range(cy-r,cy+r+1):
        dy=(y-cy)*(y-cy)
        for x in range(cx-r,cx+r+1):
            d=(x-cx)*(x-cx)+dy
            if (fill and d<=rr) or ((not fill) and ii<=d<=rr): setp(buf,x,y,c)
def line(buf,x0,y0,x1,y1,c,th=5):
    x0=int(x0); y0=int(y0); x1=int(x1); y1=int(y1)
    dx=abs(x1-x0); dy=-abs(y1-y0); sx=1 if x0<x1 else -1; sy=1 if y0<y1 else -1; err=dx+dy
    while True:
        rect(buf,x0-th//2,y0-th//2,x0+th//2+1,y0+th//2+1,c)
        if x0==x1 and y0==y1: break
        e2=2*err
        if e2>=dy: err+=dy; x0+=sx
        if e2<=dx: err+=dx; y0+=sy

def draw_frame(path, slug, idx, total):
    random.seed(f'{slug}-{idx}')
    bg=(244,235,213); buf=bytearray(bg*(W*H))
    # paper grain
    for _ in range(26000):
        x=random.randrange(W); y=random.randrange(H); delta=random.choice([-9,-6,-3,4,6])
        k=(y*W+x)*3
        for m in range(3): buf[k+m]=max(0,min(255,buf[k+m]+delta))
    # soft color blocks
    rect(buf,0,760,W,H,(222,198,166)); rect(buf,0,0,W,90,(250,241,221))
    charcoal=(64,55,46); gold=(197,139,61); gold2=(226,181,104); coral=(184,91,73); blue=(105,137,151)
    phase=idx%6; dogx=[520,700,860,1050,1180,640][phase]; dogy=[660,650,640,665,650,690][phase]
    ownerx=[1250,1120,1380,450,1320,1180][phase]
    # simple room props, no text
    rect(buf,260,640,760,705,(190,127,92)); rect(buf,300,520,710,650,(216,153,111))
    circle(buf,1510,250,95,(238,202,118),True); circle(buf,1510,250,100,charcoal,False,5)
    if 'zoomies' in slug:
        for t in range(4): line(buf,dogx-280-t*35,dogy-40+t*20,dogx-40,dogy-20+t*12,(210,155,96),th=7)
    if 'guilty' in slug:
        for t in range(6): rect(buf,300+t*55,790+random.randrange(-15,15),340+t*55,815+random.randrange(-5,25),(247,247,236))
    if 'follow' in slug:
        for t in range(6): circle(buf,420+t*115,835+((t%2)*28),22,(112,93,72),True)
    # owner
    circle(buf,ownerx,390,64,(110,69,48),True); circle(buf,ownerx,335,54,(84,56,42),True)
    rect(buf,ownerx-78,450,ownerx+78,675,coral); line(buf,ownerx-70,500,ownerx-190,610,charcoal,8); line(buf,ownerx+70,500,ownerx+170,610,charcoal,8)
    line(buf,ownerx-40,675,ownerx-95,820,charcoal,9); line(buf,ownerx+40,675,ownerx+100,820,charcoal,9)
    # dog body
    circle(buf,dogx,dogy,105,gold,True); circle(buf,dogx+115,dogy-75,75,gold2,True)
    circle(buf,dogx+85,dogy-125,34,gold,True); circle(buf,dogx+155,dogy-125,34,gold,True)
    circle(buf,dogx+92,dogy-88,10,charcoal,True); circle(buf,dogx+138,dogy-88,10,charcoal,True); circle(buf,dogx+118,dogy-58,14,charcoal,True)
    line(buf,dogx-90,dogy+70,dogx-125,dogy+190,charcoal,10); line(buf,dogx-25,dogy+92,dogx-45,dogy+205,charcoal,10)
    line(buf,dogx+52,dogy+86,dogx+70,dogy+198,charcoal,10); line(buf,dogx+120,dogy+50,dogx+155,dogy+180,charcoal,10)
    # tail and outlines
    line(buf,dogx-105,dogy-15,dogx-210,dogy-95,charcoal,8); line(buf,dogx-210,dogy-95,dogx-250,dogy-50,charcoal,8)
    circle(buf,dogx,dogy,108,charcoal,False,6); circle(buf,dogx+115,dogy-75,78,charcoal,False,6)
    # watercolor accent + progress motif (not readable text)
    for r in range(0,140,18): circle(buf,1600,820,r,(230,190,140),False,3)
    png_write(path, buf)

def prepare():
    mapping=map_audio_to_slugs()
    rows=[]
    for audio_stem,slug in mapping.items():
        prep=PROJECTS/slug/'full_video_prep'
        approved=prep/'approved_frames'; voice=prep/'voiceover_drop'; align=prep/'alignment'
        for d in [approved,voice,align]: d.mkdir(parents=True, exist_ok=True)
        src_audio=INBOX/audio_stem
        dst_audio=voice/f'{slug}-final-voiceover.wav'
        shutil.copy2(src_audio,dst_audio)
        src_align=ALIGN/f'{audio_stem}.json'; dst_align=align/f'{slug}-final-voiceover.json'
        shutil.copy2(src_align,dst_align)
        data=json.loads(src_align.read_text()); words=load_words(data)
        chunks=chunk_words(words)
        beats=[]
        for i,ch in enumerate(chunks,1):
            narration=' '.join(w['word'] for w in ch).replace(' ,', ',').replace(' .','.').replace(' ?','?').replace(' !','!')
            beats.append({'id':f'beat_{i:03d}','start_audio_est':round(ch[0]['start'],3),'end_audio_est':round(ch[-1]['end'],3),'duration_audio_est':round(ch[-1]['end']-ch[0]['start'],3),'frame_filename':f'beat_{i:03d}.png','narration':narration,'image_prompt':make_prompt(slug,i,narration)})
        plan={'script':slug.replace('-',' ').title(),'audio_file':str(dst_audio.relative_to(prep)),'alignment_file':str(dst_align.relative_to(prep)),'target_frame_count':len(beats),'audio_duration_seconds':round(max(w['end'] for w in words),3),'beat_duration_goal_seconds':5.0,'beats':beats}
        (prep/'visual_plan_audio_truth.json').write_text(json.dumps(plan,indent=2))
        # markdown copy for auditability
        (prep/'visual_plan_audio_truth.md').write_text('\n'.join([f'# {slug} audio-truth visual plan',f'beats: {len(beats)}','']+[f"- {b['id']} `{b['frame_filename']}` {b['narration']}" for b in beats]))
        for i,b in enumerate(beats,1):
            out=approved/b['frame_filename']
            if not out.exists() or out.stat().st_size < 1000: draw_frame(out,slug,i,len(beats))
        rows.append({'slug':slug,'audio_stem':audio_stem,'beats':len(beats),'audio':str(dst_audio),'alignment':str(dst_align),'plan':str(prep/'visual_plan_audio_truth.json')})
    print(json.dumps(rows,indent=2))
if __name__=='__main__': prepare()
