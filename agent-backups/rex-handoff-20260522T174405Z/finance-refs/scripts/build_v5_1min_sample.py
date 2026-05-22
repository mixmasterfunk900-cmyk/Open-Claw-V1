#!/usr/bin/env python3
from __future__ import annotations
import json, math, subprocess, textwrap, shutil
from pathlib import Path

ROOT=Path('/root/.openclaw/workspace/youtube-automation-finance')
SLUG='credit-card-minimum-payment-trap'
PROJECT=ROOT/'videos'/SLUG
V5=PROJECT/'v5_chatgpt_stick_figure'
FRAMES=V5/'frames'
RENDERS=V5/'renders'
PROOF=V5/'proof'
VIBE=Path('/root/.openclaw/workspace/vibe-zone/media/practice/youtube-automation/finance-content/credit-card-minimum-payment-trap/v5_chatgpt_stick_figure')
for d in [RENDERS, PROOF, VIBE]: d.mkdir(parents=True, exist_ok=True)

beats=[
  ('frame_01_button_chain.png',0.0,7.5,'button chained to credit card: minimum-payment trap hook'),
  ('frame_02_groceries_subscription.png',7.5,15.0,'groceries become a recurring debt subscription'),
  ('frame_03_laura_laptop_credit.png',15.0,24.8,'Laura thinks minimum payment protects credit'),
  ('frame_04_late_vs_math.png',24.8,32.6,'late protection versus interest math'),
  ('frame_05_floor_not_plan.png',32.6,40.5,'minimum is a floor, not a plan'),
  ('frame_06_two_futures.png',40.5,47.8,'same balance, different payment futures'),
  ('frame_07_money_gap.png',47.8,55.0,'money gap in one picture'),
  ('frame_08_apr_bank_rent.png',55.0,60.0,'APR pressure and rent paid to bank'),
]

# First-minute audio.
audio=RENDERS/'v5_1min_audio.wav'
subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','error','-i',str(PROJECT/'audio/voiceover_full.wav'),'-t','60','-c:a','pcm_s16le',str(audio)], check=True)

# Make per-beat motion clips using subtle zoom/pan. Scale/crop source to 16:9 HD.
parts=[]
for idx,(name,start,end,desc) in enumerate(beats,1):
    dur=end-start
    frames=max(1,round(dur*30))
    src=FRAMES/name
    out=RENDERS/f'part_{idx:02d}.mp4'
    zoom_expr="min(zoom+0.00065,1.075)" if idx%2 else "max(1.075-on/{}*0.075,1.0)".format(frames)
    x_expr="iw/2-(iw/zoom/2)+sin(on/35)*12"
    y_expr="ih/2-(ih/zoom/2)+cos(on/40)*8"
    vf=(
      "scale=1280:720:force_original_aspect_ratio=increase,"
      "crop=1280:720,"
      f"zoompan=z='{zoom_expr}':x='{x_expr}':y='{y_expr}':d={frames}:s=1280x720:fps=30,"
      "format=yuv420p"
    )
    subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','error','-loop','1','-i',str(src),'-vf',vf,'-t',f'{dur:.3f}','-an','-c:v','libx264','-preset','veryfast','-crf','18',str(out)], check=True)
    parts.append(out)

concat=RENDERS/'concat_parts.txt'
concat.write_text('\n'.join(f"file '{p}'" for p in parts)+'\n')
silent=RENDERS/'credit-card-minimum-payment-trap_v5_chatgpt_stick_figure_1min_silent.mp4'
subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','error','-f','concat','-safe','0','-i',str(concat),'-c','copy',str(silent)], check=True)
clean=RENDERS/'credit-card-minimum-payment-trap_v5_chatgpt_stick_figure_1min_clean.mp4'
subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','error','-i',str(silent),'-i',str(audio),'-c:v','copy','-c:a','aac','-b:a','192k','-shortest',str(clean)], check=True)

# First-minute subtitles from dialogue segments, wrapped shorter/lower/smaller.
def ts(t):
    h=int(t//3600); m=int((t%3600)//60); s=int(t%60); ms=int(round((t-int(t))*1000))
    if ms>=1000: s+=1; ms-=1000
    return f'{h:02d}:{m:02d}:{s:02d},{ms:03d}'
segments=json.loads((PROJECT/'audio/dialogue_segments.json').read_text())
subs=[]; n=1
for seg in segments:
    if seg['start']>=60: continue
    start=max(0,float(seg['start'])); end=min(60,float(seg['end']))
    words=seg['text'].split(); chunks=[]; cur=[]
    for w in words:
        if len(' '.join(cur+[w]))>48 and cur:
            chunks.append(' '.join(cur)); cur=[w]
        else: cur.append(w)
    if cur: chunks.append(' '.join(cur))
    total=end-start
    for i,c in enumerate(chunks):
        a=start+total*i/len(chunks); b=start+total*(i+1)/len(chunks)-0.04
        if a>=60: continue
        subs.append(f'{n}\n{ts(a)} --> {ts(min(b,60))}\n{c}\n'); n+=1
srt=V5/'v5_1min_subtitles.srt'; srt.write_text('\n'.join(subs))
review=RENDERS/'credit-card-minimum-payment-trap_v5_chatgpt_stick_figure_1min_review.mp4'
subfile=str(srt).replace(':','\\:').replace("'","\\'")
# Keep subtitles smaller than V3, but not slammed into the bottom edge on busy frames.
style="Fontsize=15,PrimaryColour=&HFFFFFF&,OutlineColour=&HA0000000&,BorderStyle=1,Outline=1.8,Shadow=0,MarginV=46,Alignment=2"
subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','error','-i',str(clean),'-vf',f"subtitles='{subfile}':force_style='{style}'",'-c:a','copy',str(review)], check=True)

# Proof contact sheet and metadata.
for t,label in [(5,'005'),(20,'020'),(35,'035'),(50,'050')]:
    subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','error','-ss',str(t),'-i',str(review),'-frames:v','1',str(PROOF/f'v5_1min_frame_{label}.jpg')], check=True)
manifest={
  'status':'one_minute_review_sample_not_final',
  'style':'ChatGPT/OpenAI generated premium stick-figure explainer frames',
  'runtime_seconds':60,
  'source_audio':'first 60 seconds of real finance voiceover',
  'review_video':str(review),
  'clean_video':str(clean),
  'beats':[{'image':n,'start':s,'end':e,'rationale':d} for n,s,e,d in beats],
  'notes':'Made for Masala change notes before committing to full 8+ minute V5 generation.'
}
(V5/'v5_1min_manifest.json').write_text(json.dumps(manifest, indent=2))
# Copy to Vibe lane and media path.
for src in [review, clean, srt, V5/'v5_1min_manifest.json'] + sorted(PROOF.glob('v5_1min_frame_*.jpg')):
    shutil.copy2(src, VIBE/src.name)
print(json.dumps(manifest, indent=2))
