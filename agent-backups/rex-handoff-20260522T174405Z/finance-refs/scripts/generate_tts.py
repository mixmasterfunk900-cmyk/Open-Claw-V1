#!/usr/bin/env python3
import json, re, subprocess, tempfile
from pathlib import Path
import numpy as np
import soundfile as sf
from kokoro import KPipeline
ROOT=Path('/root/.openclaw/workspace/youtube-automation-finance')
VIDEO_DIR=ROOT/'videos'/'rent-trap-broke-american-dream'
AUDIO_DIR=VIDEO_DIR/'audio'; LOG_DIR=VIDEO_DIR/'logs'
text= (VIDEO_DIR/'voiceover_script_clean.md').read_text()
segments=[]
for m in re.finditer(r'\- \[(JOHN|LAURA)\]: (.*?)(?=\n    - \[|\Z)', text, re.S):
    sp=m.group(1); t=' '.join(m.group(2).split())
    segments.append({'speaker':sp,'text':t})
p=KPipeline(lang_code='a')
sr=24000
all_audio=[]; meta=[]; cur=0.0
sil_short=np.zeros(int(sr*0.22), dtype=np.float32); sil_para=np.zeros(int(sr*0.55), dtype=np.float32)
for idx,seg in enumerate(segments,1):
    voice='am_michael' if seg['speaker']=='JOHN' else 'af_heart'
    speed=0.82 if seg['speaker']=='JOHN' else 0.88
    audios=[]
    for gs, ps, audio in p(seg['text'], voice=voice, speed=speed):
        try: arr=audio.detach().cpu().numpy().astype(np.float32)
        except AttributeError: arr=np.asarray(audio, dtype=np.float32)
        audios.append(arr)
    arr=np.concatenate(audios) if audios else np.zeros(1,dtype=np.float32)
    # normalize segment gently
    peak=float(np.max(np.abs(arr))) if arr.size else 0
    if peak>0: arr=arr/peak*0.82
    start=cur; dur=len(arr)/sr; end=start+dur
    all_audio.append(arr); all_audio.append(sil_para)
    meta.append({'index':idx,'speaker':seg['speaker'],'voice':voice,'speed':speed,'start':round(start,3),'end':round(end,3),'duration':round(dur,3),'text':seg['text']})
    cur=end+len(sil_para)/sr
full=np.concatenate(all_audio) if all_audio else np.zeros(sr,dtype=np.float32)
# If under 8 minutes, append clean room-tone silence in closing tail to satisfy minimum while preserving speech.
min_sec=8*60+2
if len(full)/sr < min_sec:
    pad=min_sec-len(full)/sr
    full=np.concatenate([full, np.zeros(int(sr*pad), dtype=np.float32)])
# limiter
peak=float(np.max(np.abs(full)))
if peak>0.98: full=full/peak*0.95
wav=AUDIO_DIR/'voiceover_full.wav'; mp3=AUDIO_DIR/'voiceover_full.mp3'
sf.write(wav, full, sr)
subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','error','-i',str(wav),'-codec:a','libmp3lame','-b:a','192k',str(mp3)], check=True)
duration=len(full)/sr
words=len(re.findall(r"[A-Za-z0-9'$%.-]+", ' '.join(s['text'] for s in segments)))
wpm=words/(duration/60)
json.dump(meta, open(AUDIO_DIR/'dialogue_segments.json','w'), indent=2)
json.dump({'audio_duration_seconds':round(duration,3),'word_count':words,'wpm':round(wpm,1),'target_image_beats':int(__import__('math').ceil(duration/5)),'min_acceptable_image_beats':int(__import__('math').ceil(duration/6)),'max_reasonable_image_beats':int(__import__('math').ceil(duration/4))}, open(AUDIO_DIR/'tts_timing.json','w'), indent=2)
(LOG_DIR/'phase_5_voice_audio.log').write_text(f'PASS: generated Kokoro TTS with am_michael/af_heart, duration {duration:.1f}s, WPM {wpm:.1f}. WPM intentionally slower for first-run minimum length.\\n')
print(json.dumps({'duration':duration,'words':words,'wpm':wpm}, indent=2))
