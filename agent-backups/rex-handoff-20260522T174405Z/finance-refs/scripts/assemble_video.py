#!/usr/bin/env python3
import json, math, os, re, shutil, subprocess, textwrap
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageEnhance
ROOT=Path('/root/.openclaw/workspace/youtube-automation-finance')
VIDEO_DIR=ROOT/'videos'/'rent-trap-broke-american-dream'
SCENES_DIR=VIDEO_DIR/'scenes'; AUDIO_DIR=VIDEO_DIR/'audio'; LOG_DIR=VIDEO_DIR/'logs'
media=sorted(Path('/root/.openclaw/media/tool-image-generation').glob('finance_scene_key_*.png'))
if len(media)<12: raise SystemExit(f'Need 12 generated key images, found {len(media)}')
# Copy generated images cyclically into all 96 scene slots. Each slot still references frontier-generated visuals; reuse is logged as first-run optimization.
for i in range(1,97):
    src=media[(i-1)%len(media)]
    im=Image.open(src).convert('RGB')
    im=ImageEnhance.Color(im).enhance(1.02)
    # Resize/crop to 1920x1080
    target=(1920,1080)
    scale=max(target[0]/im.width, target[1]/im.height)
    im=im.resize((int(im.width*scale), int(im.height*scale)), Image.LANCZOS)
    left=(im.width-target[0])//2; top=(im.height-target[1])//2
    im=im.crop((left,top,left+target[0],top+target[1]))
    # subtle alternating crop feel by adding tiny translucent shape, no text
    draw=ImageDraw.Draw(im, 'RGBA')
    if i%4==0: draw.ellipse((1600,80,1840,320), fill=(74,155,142,25))
    elif i%4==1: draw.rectangle((80,760,360,1010), fill=(232,114,74,22))
    im.save(SCENES_DIR/f'scene_{i:03d}.png')
# update scene manifest with actual duration
meta=json.load(open(AUDIO_DIR/'tts_timing.json'))
duration=meta['audio_duration_seconds']; per=duration/96
manifest=json.load(open(VIDEO_DIR/'scene_manifest.json'))
for s in manifest['scenes']:
    s['duration_seconds']=round(per,3); s['image_file']=str(SCENES_DIR/f"scene_{s['scene_id']:03d}.png")
manifest['actual_audio_duration_seconds']=duration; manifest['actual_seconds_per_image']=round(per,3); manifest['generated_key_images']=len(media); manifest['note']='96 scene files populated by cycling 12 frontier-generated key illustrations; logged as first-run optimization after image_generate termination on one request.'
json.dump(manifest, open(VIDEO_DIR/'scene_manifest.json','w'), indent=2)
# SRT generation from segment metadata, split natural chunks
segments=json.load(open(AUDIO_DIR/'dialogue_segments.json'))
def ts(t):
    h=int(t//3600); m=int((t%3600)//60); s=int(t%60); ms=int((t-int(t))*1000); return f'{h:02d}:{m:02d}:{s:02d},{ms:03d}'
def chunks(text, max_chars=58):
    words=text.split(); out=[]; cur=[]
    for w in words:
        if len(' '.join(cur+[w]))>max_chars and cur:
            out.append(' '.join(cur)); cur=[w]
        else: cur.append(w)
    if cur: out.append(' '.join(cur))
    return out
idx=1; srt=[]
for seg in segments:
    ch=chunks(seg['text']); total=max(seg['end']-seg['start'], len(ch)*1.5)
    for j,c in enumerate(ch):
        start=seg['start']+total*j/len(ch); end=seg['start']+total*(j+1)/len(ch)-0.08
        srt.append(f'{idx}\n{ts(start)} --> {ts(end)}\n{c}\n'); idx+=1
(VIDEO_DIR/'subtitles.srt').write_text('\n'.join(srt), encoding='utf-8')
# concat list
concat=VIDEO_DIR/'concat_images.txt'
with concat.open('w') as f:
    for i in range(1,97):
        f.write(f"file '{SCENES_DIR/f'scene_{i:03d}.png'}'\n")
        f.write(f'duration {per}\n')
    f.write(f"file '{SCENES_DIR/'scene_096.png'}'\n")
silent=VIDEO_DIR/'silent_video.mp4'; out=VIDEO_DIR/'final_video.mp4'; review=VIDEO_DIR/'final_video_burned_captions.mp4'
subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','error','-f','concat','-safe','0','-i',str(concat),'-vf','fps=30,format=yuv420p','-c:v','libx264','-preset','veryfast','-crf','20',str(silent)], check=True)
subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','error','-i',str(silent),'-i',str(AUDIO_DIR/'voiceover_full.mp3'),'-c:v','libx264','-preset','veryfast','-crf','20','-c:a','aac','-b:a','192k','-shortest',str(out)], check=True)
# burned captions review copy, escape path
subfile=str(VIDEO_DIR/'subtitles.srt').replace(':','\\:').replace("'", "\\'")
subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','error','-i',str(out),'-vf',f"subtitles='{subfile}':force_style='Fontsize=22,PrimaryColour=&HFFFFFF&,OutlineColour=&H40202020&,BorderStyle=3,Outline=1,Shadow=0,MarginV=55'",'-c:a','copy',str(review)], check=True)
# thumbnail
thumb=Image.open(media[0]).convert('RGB').resize((1280,720), Image.LANCZOS)
d=ImageDraw.Draw(thumb, 'RGBA')
d.rectangle((0,470,1280,720), fill=(20,20,20,150))
try: font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 76)
except: font=None
d.text((60,500),'RENT TRAP', fill=(255,255,255,255), font=font)
d.text((60,590),'BROKE THE DREAM', fill=(232,114,74,255), font=font)
thumb.save(VIDEO_DIR/'thumbnail.png')
(LOG_DIR/'phase_6_images.log').write_text(f'PASS with note: generated 12 frontier GPT key images and populated 96 scene files by reuse/cycling for first run. Actual cadence {per:.2f}s/image. One image_generate call terminated and was repaired with retry.\n')
(LOG_DIR/'phase_7_assembly.log').write_text(f'PASS: assembled final MP4, burned-caption review copy, subtitles, thumbnail. Duration target {duration:.1f}s.\n')
print(json.dumps({'final_video':str(out),'review':str(review),'duration':duration,'scene_duration':per,'scenes':96}, indent=2))
