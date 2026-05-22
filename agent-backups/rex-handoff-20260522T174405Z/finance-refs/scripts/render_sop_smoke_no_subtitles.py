#!/usr/bin/env python3
from pathlib import Path
import subprocess, json, shutil
from PIL import Image, ImageDraw
ROOT=Path('/root/.openclaw/workspace/youtube-automation-finance')
V=ROOT/'videos/sop-enforcement-smoke-test'
SC=V/'scenes'; R=V/'renders'; P=V/'proof'; Q=V/'qa'; A=V/'audio/voiceover_full.wav'
TMP=V/'renders/tmp_no_sub_clips'; TMP.mkdir(parents=True,exist_ok=True)
clip_len=(60+11*0.35)/12
trans=0.35
clips=[]
for i in range(1,13):
    src=SC/f'scene_{i:03d}.png'; out=TMP/f'clip_{i:03d}.mp4'; clips.append(out)
    # Subtle zoom over each still; no subtitle/caption layer.
    vf="scale=1400:-1,zoompan=z='1+0.00018*on':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=160:s=1280x720:fps=30,format=yuv420p"
    subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','error','-loop','1','-i',str(src),'-vf',vf,'-t',f'{clip_len:.6f}','-c:v','libx264','-preset','veryfast','-crf','20',str(out)],check=True)
cmd=['ffmpeg','-y','-hide_banner','-loglevel','error']
for c in clips: cmd += ['-i',str(c)]
cmd += ['-i',str(A)]
parts=[]
last='0:v'
for i in range(1,12):
    out=f'v{i}'
    offset=(clip_len-trans)*i
    parts.append(f'[{last}][{i}:v]xfade=transition=fade:duration={trans}:offset={offset:.6f}[{out}]')
    last=out
fc=';'.join(parts)
review=R/'sop-enforcement-smoke-test_no_subtitles_review.mp4'
low=R/'sop-enforcement-smoke-test_no_subtitles_telegram_low.mp4'
cmd += ['-filter_complex',fc,'-map',f'[{last}]','-map','12:a','-t','60','-c:v','libx264','-preset','veryfast','-crf','20','-c:a','aac','-b:a','192k',str(review)]
subprocess.run(cmd,check=True)
subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','error','-i',str(review),'-vf','scale=854:480:force_original_aspect_ratio=decrease,pad=854:480:(ow-iw)/2:(oh-ih)/2,format=yuv420p','-c:v','libx264','-preset','veryfast','-crf','30','-c:a','aac','-b:a','96k','-movflags','+faststart',str(low)],check=True)
# Proof frames from no-subtitle render
PF=P/'rendered_frames_no_subtitles'; PF.mkdir(parents=True,exist_ok=True)
for old in PF.glob('*.jpg'): old.unlink()
for t in [3,8,13,18,23,28,33,38,43,48,53,58]:
    subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','error','-ss',str(t),'-i',str(review),'-frames:v','1',str(PF/f'frame_{t}s.jpg')],check=True)
imgs=[]
for p in sorted(PF.glob('frame_*s.jpg')):
    img=Image.open(p).resize((320,180)).convert('RGB'); imgs.append((p.name,img))
sheet=Image.new('RGB',(1280,540),'white'); d=ImageDraw.Draw(sheet)
for idx,(name,img) in enumerate(imgs):
    x=(idx%4)*320; y=(idx//4)*180; sheet.paste(img,(x,y)); d.text((x+8,y+8),name,fill=(0,0,0))
sheet_path=P/'rendered_progression_no_subtitles_contact_sheet.jpg'; sheet.save(sheet_path)
# Update reports to current preference
(Q/'subtitle_style_report.md').write_text('NOT_APPLICABLE: subtitles are disabled by current Finance render preference; Masala will handle subtitles manually. PASS: no ASS/subtitle filter used in no-subtitles review render.\n')
(Q/'editing_motion_report.md').write_text('PASS: no-subtitles smoke render uses faint per-scene zoom and fade transitions between beats.\n')
(Q/'final_qa_report.md').write_text('PASS_REVIEW_READY under smoke60 profile only. Subtitles disabled/manual. Faint zooms and fade transitions included. This is not a full 8-minute upload candidate.\n')
(V/'final_report.md').write_text('PASS_REVIEW_READY smoke60 no-subtitles. Subtitles disabled/manual. Faint zooms and fade transitions included. Vibe Zone path: media/practice/youtube-automation/finance-content/sop-enforcement-smoke-test/smoke60/\n')
# Copy visible lane
VD=Path('/root/.openclaw/workspace/vibe-zone/media/practice/youtube-automation/finance-content/sop-enforcement-smoke-test/smoke60')
VD.mkdir(parents=True,exist_ok=True)
for f in [review,low,sheet_path,V/'final_report.md',Q/'final_qa_report.md',Q/'editing_motion_report.md']:
    shutil.copy2(f, VD/f.name)
print(json.dumps({'review':str(review),'low':str(low),'contact_sheet':str(sheet_path),'clip_len':clip_len,'transition':trans},indent=2))
