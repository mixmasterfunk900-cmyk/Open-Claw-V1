#!/usr/bin/env python3
import json, math, subprocess, os, sys
from pathlib import Path

base = Path(__file__).resolve().parent
frames = base / 'frames'
renders = base / 'renders'
segments = renders / 'segments_v5_rerender'
qa = base / 'qa'
proof = base / 'proof'
audio = base.parent / 'audio' / 'voiceover_full.mp3'
manifest = json.loads((base / 'beat_manifest.json').read_text())
renders.mkdir(exist_ok=True)
segments.mkdir(exist_ok=True)
qa.mkdir(exist_ok=True)
proof.mkdir(exist_ok=True)

beats = manifest['beats']
fps=30
seg_paths=[]
for idx,b in enumerate(beats,1):
    fid=b['frame_id']
    img=frames / f'{fid}.png'
    if not img.exists() or img.stat().st_size == 0:
        raise SystemExit(f'Missing/empty frame: {img}')
    dur=float(b['duration'])
    n=max(1, int(round(dur*fps)))
    out=segments / f'{fid}.mp4'
    # Alternate subtle direction by frame number while preserving approved stills.
    if idx % 2:
        x="iw/2-(iw/zoom/2)+sin(on/45)*6"
        y="ih/2-(ih/zoom/2)+cos(on/60)*4"
    else:
        x="iw/2-(iw/zoom/2)-sin(on/50)*6"
        y="ih/2-(ih/zoom/2)-cos(on/65)*4"
    vf=(
        "scale=1400:788:force_original_aspect_ratio=increase,"
        "crop=1400:788,"
        f"zoompan=z='1+0.035*on/{max(n-1,1)}':x='{x}':y='{y}':d={n}:s=1280x720:fps={fps},"
        "format=yuv420p"
    )
    cmd=['ffmpeg','-hide_banner','-loglevel','error','-y','-loop','1','-i',str(img),'-vf',vf,'-frames:v',str(n),'-an','-c:v','libx264','-preset','veryfast','-crf','19','-pix_fmt','yuv420p',str(out)]
    subprocess.run(cmd, check=True)
    seg_paths.append(out)
    if idx % 10 == 0:
        print(f'rendered {idx}/{len(beats)}', flush=True)

concat = renders / 'concat_segments.txt'
concat.write_text(''.join(f"file '{p.resolve()}'\n" for p in seg_paths))
silent = renders / 'car-payment-trap_v5_stick_full_silent_720p.mp4'
review = renders / 'car-payment-trap_v5_stick_full_review_720p.mp4'
telegram = renders / 'car-payment-trap_v5_stick_full_telegram_480p.mp4'
subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',str(concat),'-c','copy',str(silent)], check=True)
subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(silent),'-i',str(audio),'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','128k','-shortest',str(review)], check=True)
subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(review),'-vf','scale=854:480:force_original_aspect_ratio=decrease,pad=854:480:(ow-iw)/2:(oh-ih)/2,format=yuv420p','-c:v','libx264','-preset','veryfast','-crf','24','-c:a','aac','-b:a','96k','-movflags','+faststart',str(telegram)], check=True)

# Contact sheets: sampled frames and video stills.
sample_frames=[1,7,13,22,31,42,53,62,73,83,99,111,120,129,137]
thumbs=[]
for i in sample_frames:
    src=frames / f'frame_{i:03d}.png'
    t=proof / f'_thumb_frame_{i:03d}.jpg'
    subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(src),'-vf','scale=320:180',str(t)], check=True)
    thumbs.append(t)
listfile=proof / '_thumbs.txt'
listfile.write_text(''.join(f"file '{p.resolve()}'\n" for p in thumbs))
contact=proof / 'v5_full_rerender_sample_contact_sheet.jpg'
# use tile from concat of images as video stream
subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-pattern_type','glob','-i',str(proof / '_thumb_frame_*.jpg'),'-vf','tile=5x3:padding=8:margin=8:color=white', '-frames:v','1',str(contact)], check=True)

# QA probes
for name,path in [('final_ffprobe_report.json',review),('telegram_ffprobe_report.json',telegram)]:
    res=subprocess.run(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(path)], check=True, capture_output=True, text=True)
    (qa/name).write_text(res.stdout)
subprocess.run(['ffmpeg','-hide_banner','-nostats','-i',str(review),'-vf','blackdetect=d=0.1:pic_th=0.98','-an','-f','null','-'], stderr=(qa/'blackdetect.log').open('w'), stdout=subprocess.DEVNULL)
subprocess.run(['ffmpeg','-hide_banner','-nostats','-i',str(review),'-af','silencedetect=n=-45dB:d=2','-f','null','-'], stderr=(qa/'silencedetect.log').open('w'), stdout=subprocess.DEVNULL)
print('DONE')
print(review)
print(telegram)
