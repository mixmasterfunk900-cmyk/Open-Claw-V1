#!/usr/bin/env python3
from __future__ import annotations
import json, re, subprocess, shutil, math
from pathlib import Path
import numpy as np
import soundfile as sf
from kokoro import KPipeline
from PIL import ImageFont

ROOT=Path('/root/.openclaw/workspace/youtube-automation-finance')
PROJECT=ROOT/'videos/credit-card-minimum-payment-trap'
V5=PROJECT/'v5_chatgpt_stick_figure'
RENDERS=V5/'renders'
PROOF=V5/'proof'
VIBE=Path('/root/.openclaw/workspace/vibe-zone/media/practice/youtube-automation/finance-content/credit-card-minimum-payment-trap/v5_chatgpt_stick_figure')
for d in [RENDERS,PROOF,VIBE]: d.mkdir(parents=True, exist_ok=True)

JOHN='am_michael'; LAURA='af_bella'; SR=24000
p=KPipeline(lang_code='a')
segments=json.loads((PROJECT/'audio/dialogue_segments.json').read_text())
# Include the first minute's spoken content. Trim the 4th segment text enough for sample continuity.
selected=[]
for seg in segments:
    if seg['start'] >= 60: break
    text=seg['text']
    if seg['start'] < 60 < seg['end']:
        words=text.split(); keep=max(18, int(len(words)*(60-seg['start'])/(seg['end']-seg['start'])))
        text=' '.join(words[:keep])
    selected.append({'speaker':seg['speaker'],'text':text})

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

audio_parts=[]; word_events=[]; cur=0.0
sil=np.zeros(int(SR*0.28), dtype=np.float32)
for seg in selected:
    voice=JOHN if seg['speaker']=='JOHN' else LAURA
    speed=0.88 if seg['speaker']=='JOHN' else 0.98
    arr=synth(seg['text'], voice, speed)
    start=cur; dur=len(arr)/SR; end=start+dur
    words=re.findall(r"[A-Za-z0-9$%+\-']+", seg['text'])
    if words:
        step=dur/len(words)
        for i,w in enumerate(words):
            word_events.append({'word':w,'start':start+i*step,'end':start+(i+1)*step})
    audio_parts += [arr, sil]
    cur=end+len(sil)/SR
full=np.concatenate(audio_parts) if audio_parts else np.zeros(SR,dtype=np.float32)
# hard cap/pad to 60s review sample
if len(full)/SR > 60:
    full=full[:SR*60]
elif len(full)/SR < 60:
    full=np.concatenate([full, np.zeros(int(SR*60-len(full)), dtype=np.float32)])
voice_wav=RENDERS/'v5_1min_selected_voices_am_michael_af_bella.wav'
sf.write(voice_wav, full, SR)

# Mux selected voice audio into the existing clean silent visuals by replacing audio.
silent=RENDERS/'credit-card-minimum-payment-trap_v5_chatgpt_stick_figure_1min_silent.mp4'
clean=RENDERS/'credit-card-minimum-payment-trap_v5_chatgpt_stick_figure_1min_selected_voices_clean.mp4'
subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','error','-i',str(silent),'-i',str(voice_wav),'-c:v','copy','-c:a','aac','-b:a','192k','-shortest',str(clean)], check=True)

# Dynamic slot-build subtitles from approximate timings for newly generated audio.
GREEN='&H0034FF37'; YELLOW='&H0000F7FF'; WHITE='&H00FFFFFF'; BLACK='&H00000000'
Y=650; FONT_SIZE=50; MAX_WORDS=6; MIN_GAP=18; MAX_LINE_WIDTH=980
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', FONT_SIZE)
TRIGGERS_YELLOW={'MINIMUM','PAYMENT','TRAP','EXPENSIVE','BUTTON','POLITE','RESPONSIBLE','INTEREST','LATE','MATH','FLOOR','PLAN','WARNING','PENALTY','BANK','BALANCE','DEBT','CREDIT','APR','COSTS','CARRY','SLOWLY','PROTECTS','NOT','DANGER','BUY','NOW'}
TRIGGERS_GREEN={'DOLLAR','DOLLARS','MONEY','PAYCHECK','PROFIT','PROFITS','WEALTH','TRILLION','PERCENT','TWENTY','TWENTY-PLUS','MID','LOW-TO-MID'}
def clean_word(w): return re.sub(r"[^A-Za-z0-9$%+\-']",'',w).upper()
def display_word(w):
    s=clean_word(w)
    if s=='ANNUAL': return 'APR'
    if s=='PERCENTAGE': return 'RATE'
    return s
def colour(w):
    s=clean_word(w)
    if re.search(r'\d|\$|%',s) or s in TRIGGERS_GREEN: return GREEN
    if s in TRIGGERS_YELLOW: return YELLOW
    return WHITE
def ass_ts(t):
    h=int(t//3600); m=int((t%3600)//60); s=int(t%60); cs=int(round((t-int(t))*100))
    if cs>=100: s+=1; cs-=100
    return f'{h}:{m:02d}:{s:02d}.{cs:02d}'
def text_width(w):
    b=font.getbbox(w); return b[2]-b[0]
def group_width(group):
    widths=[text_width(display_word(x['word'])) for x in group if display_word(x['word'])]
    return sum(widths)+MIN_GAP*(len(widths)-1) if widths else 0
valid=[w for w in word_events if w['start']<60]
phrases=[]; i=0
while i<len(valid):
    group=[valid[i]]; i+=1
    while i<len(valid) and len(group)<MAX_WORDS:
        prev=group[-1]['word']; cand=group+[valid[i]]
        if re.search(r'[.!?]$', prev): break
        if valid[i]['end']-group[0]['start']>1.9: break
        if group_width(cand)>MAX_LINE_WIDTH: break
        group.append(valid[i]); i+=1
    phrases.append(group)
ass=V5/'v5_1min_selected_voices_slot_build.ass'
header=f"""[Script Info]
ScriptType: v4.00+
PlayResX: 1280
PlayResY: 720
ScaledBorderAndShadow: yes
WrapStyle: 2

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: FinanceBold,DejaVu Sans,{FONT_SIZE},{WHITE},{WHITE},{BLACK},&H00000000,-1,0,0,0,100,100,0,0,1,5.5,0,5,0,0,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
lines=[header]
for pi,phrase in enumerate(phrases):
    words=[display_word(x['word']) for x in phrase]
    widths=[text_width(w) for w in words]
    total=sum(widths)+MIN_GAP*(len(words)-1)
    left=(1280-total)/2
    phrase_end=min(60.0, phrase[-1]['end']+0.34)
    if pi+1<len(phrases): phrase_end=min(phrase_end, phrases[pi+1][0]['start']-0.07)
    cursor=left
    for item,word,wid in zip(phrase,words,widths):
        if not word: continue
        start=item['start']; end=phrase_end
        if end<=start: end=start+0.16
        x=cursor+wid/2; cursor += wid+MIN_GAP
        text=r'{\an5\pos(%d,%d)\c%s}%s{\c%s}'%(round(x),Y,colour(item['word']),word,WHITE)
        lines.append(f'Dialogue: 0,{ass_ts(start)},{ass_ts(end)},FinanceBold,,0,0,0,,{text}')
ass.write_text('\n'.join(lines), encoding='utf-8')
review=RENDERS/'credit-card-minimum-payment-trap_v5_chatgpt_stick_figure_1min_selected_voices_review.mp4'
assfile=str(ass).replace(':','\\:').replace("'","\\'")
subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','error','-i',str(clean),'-vf',f"ass='{assfile}'",'-c:a','copy',str(review)], check=True)
low=RENDERS/'credit-card-minimum-payment-trap_v5_chatgpt_stick_figure_1min_selected_voices_telegram_low.mp4'
subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','error','-i',str(review),'-vf','scale=854:480:force_original_aspect_ratio=decrease,pad=854:480:(ow-iw)/2:(oh-ih)/2,format=yuv420p','-c:v','libx264','-preset','veryfast','-crf','30','-c:a','aac','-b:a','96k','-movflags','+faststart',str(low)], check=True)
for t,label in [(5,'005'),(20,'020'),(35,'035'),(50,'050')]:
    subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','error','-ss',str(t),'-i',str(review),'-frames:v','1',str(PROOF/f'v5_selected_voices_frame_{label}.jpg')], check=True)
manifest={'status':'selected_voice_review_sample','john_voice':JOHN,'laura_voice':LAURA,'review_video':str(review),'telegram_low':str(low),'duration_seconds':60,'subtitle_phrases':len(phrases)}
(V5/'v5_selected_voice_sample_manifest.json').write_text(json.dumps(manifest, indent=2))
for src in [review,low,ass,V5/'v5_selected_voice_sample_manifest.json'] + sorted(PROOF.glob('v5_selected_voices_frame_*.jpg')):
    shutil.copy2(src,VIBE/src.name)
print(json.dumps(manifest, indent=2))
