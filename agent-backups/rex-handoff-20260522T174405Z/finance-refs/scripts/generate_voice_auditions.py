#!/usr/bin/env python3
from __future__ import annotations
import json, subprocess
from pathlib import Path
import numpy as np
import soundfile as sf
from kokoro import KPipeline

ROOT=Path('/root/.openclaw/workspace/youtube-automation-finance')
OUT=ROOT/'voice_auditions'/'finance_v5'
OUT.mkdir(parents=True, exist_ok=True)
SR=24000
p=KPipeline(lang_code='a')

samples={
 'john_am_liam': {
  'voice':'am_liam','speed':0.90,'role':'John older male option',
  'text':"Laura, the most expensive button in modern money is not buy now. It is minimum payment. It looks polite, but the math is not polite."
 },
 'john_am_michael': {
  'voice':'am_michael','speed':0.88,'role':'John older male option',
  'text':"The minimum payment protects you from being late. It does not protect you from the interest. That is the part most people miss."
 },
 'john_am_adam': {
  'voice':'am_adam','speed':0.90,'role':'John older male option',
  'text':"A credit card can be a payment tool. The trap begins when the bill becomes a loan with no finish line."
 },
 'john_am_santa': {
  'voice':'am_santa','speed':0.92,'role':'John older male option',
  'text':"Every dollar above the minimum is not just a dollar. It is a little eviction notice for future interest."
 },
 'laura_af_nova': {
  'voice':'af_nova','speed':0.96,'role':'Laura young woman option',
  'text':"That sounds dramatic. I thought minimum payment meant you were doing the right thing and protecting your credit."
 },
 'laura_af_bella': {
  'voice':'af_bella','speed':0.98,'role':'Laura young woman option',
  'text':"So the danger is not the card existing. It is carrying the balance slowly when the interest rate is that high."
 },
 'laura_af_heart': {
  'voice':'af_heart','speed':0.98,'role':'Laura young woman option',
  'text':"But what if someone really cannot pay more right now? Telling them to just pay it off faster can sound useless."
 },
}

def synth(text, voice, speed):
    parts=[]
    for _,_,audio in p(text, voice=voice, speed=speed):
        try: arr=audio.detach().cpu().numpy().astype(np.float32)
        except AttributeError: arr=np.asarray(audio, dtype=np.float32)
        parts.append(arr)
    arr=np.concatenate(parts) if parts else np.zeros(1,dtype=np.float32)
    peak=float(np.max(np.abs(arr))) if arr.size else 0
    if peak>0: arr=arr/peak*0.86
    return arr

manifest=[]
for name,cfg in samples.items():
    arr=synth(cfg['text'], cfg['voice'], cfg['speed'])
    wav=OUT/f'{name}.wav'; ogg=OUT/f'{name}.ogg'; mp3=OUT/f'{name}.mp3'
    sf.write(wav, arr, SR)
    subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','error','-i',str(wav),'-c:a','libopus','-b:a','48k',str(ogg)], check=True)
    subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','error','-i',str(wav),'-codec:a','libmp3lame','-b:a','96k',str(mp3)], check=True)
    manifest.append({**cfg,'name':name,'wav':str(wav),'ogg':str(ogg),'mp3':str(mp3),'duration_seconds':round(len(arr)/SR,2)})
(OUT/'manifest.json').write_text(json.dumps(manifest, indent=2))
print(json.dumps(manifest, indent=2))
