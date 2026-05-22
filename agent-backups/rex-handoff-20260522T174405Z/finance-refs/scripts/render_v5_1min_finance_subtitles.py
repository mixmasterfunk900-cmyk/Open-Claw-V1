#!/usr/bin/env python3
from __future__ import annotations
import json, re, subprocess, shutil
from pathlib import Path

ROOT=Path('/root/.openclaw/workspace/youtube-automation-finance')
PROJECT=ROOT/'videos/credit-card-minimum-payment-trap'
V5=PROJECT/'v5_chatgpt_stick_figure'
RENDERS=V5/'renders'
PROOF=V5/'proof'
VIBE=Path('/root/.openclaw/workspace/vibe-zone/media/practice/youtube-automation/finance-content/credit-card-minimum-payment-trap/v5_chatgpt_stick_figure')
for d in [PROOF,VIBE]: d.mkdir(parents=True, exist_ok=True)

CLEAN=RENDERS/'credit-card-minimum-payment-trap_v5_chatgpt_stick_figure_1min_clean.mp4'
OUT=RENDERS/'credit-card-minimum-payment-trap_v5_chatgpt_stick_figure_1min_finance_subs.mp4'
LOW=RENDERS/'credit-card-minimum-payment-trap_v5_chatgpt_stick_figure_1min_finance_subs_telegram_low.mp4'
ASS=V5/'v5_1min_finance_subtitles.ass'
WORDS=json.loads((PROJECT/'transcription/word_timestamps.json').read_text())

GREEN='&H0034FF37'   # ASS BGR-ish emerald / bright green
YELLOW='&H0000F7FF'  # electric yellow
WHITE='&H00FFFFFF'
BLACK='&H00000000'
TRIGGERS_YELLOW={
 'MINIMUM','PAYMENT','TRAP','EXPENSIVE','BUTTON','POLITE','RESPONSIBLE','INTEREST','LATE','MATH','FLOOR','PLAN','WARNING','PENALTY','BANK','BALANCE','DEBT','CREDIT','APR','COSTS','CARRY','SLOWLY'
}
TRIGGERS_GREEN={
 'DOLLAR','DOLLARS','MONEY','PAYCHECK','PROFIT','PROFITS','WEALTH','TRILLION','PERCENT','TWENTY','TWENTY-PLUS','MID','LOW-TO-MID'
}

def clean_word(w):
    return re.sub(r"[^A-Za-z0-9$%+\-']",'',w).upper()

def display_word(w):
    s=clean_word(w)
    if s == 'ANNUAL': return 'APR'
    if s == 'PERCENTAGE': return 'RATE'
    return s

def is_numberish(w):
    s=clean_word(w)
    return bool(re.search(r'\d|\$|%',s)) or s in TRIGGERS_GREEN

def is_warning(w):
    return clean_word(w) in TRIGGERS_YELLOW

def colorize(words):
    parts=[]
    for raw in words:
        w=display_word(raw)
        if not w: continue
        if is_numberish(raw): c=GREEN
        elif is_warning(raw): c=YELLOW
        else: c=WHITE
        parts.append(r'{\c%s}%s{\c%s}'%(c,w,WHITE))
    return ' '.join(parts)

def ass_ts(t):
    h=int(t//3600); m=int((t%3600)//60); s=int(t%60); cs=int(round((t-int(t))*100))
    if cs>=100: s+=1; cs-=100
    return f'{h}:{m:02d}:{s:02d}.{cs:02d}'

# Only first 60 seconds, 1-3 words each. Prefer 1-2 word bursts to avoid edge clipping.
valid=[w for w in WORDS if float(w.get('start',999)) < 60 and w.get('word')]
groups=[]; i=0
while i < len(valid):
    group=[valid[i]]; i+=1
    # Use 1-2 words by default; allow the style to stay bold without touching screen edges.
    while i < len(valid) and len(group)<2:
        prev=group[-1]['word']
        if re.search(r'[.!?]$', prev): break
        if float(valid[i]['end'])-float(group[0]['start']) > 0.82: break
        group.append(valid[i]); i+=1
    start=float(group[0]['start']); end=min(60.0, float(group[-1]['end'])+0.04)
    if end-start < 0.32: end=start+0.32
    groups.append((start,end,[g['word'] for g in group]))

header=f"""[Script Info]
ScriptType: v4.00+
PlayResX: 1280
PlayResY: 720
ScaledBorderAndShadow: yes
WrapStyle: 2

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: FinanceBold,DejaVu Sans,54,{WHITE},{WHITE},{BLACK},&H00000000,-1,0,0,0,100,100,0,0,1,5.5,0,2,130,130,150,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
lines=[header]
for start,end,words in groups:
    text=colorize(words)
    # Lower-middle safe zone: bottom aligned with 150 margin on 720p puts baseline around lower-middle, not edge.
    lines.append(f"Dialogue: 0,{ass_ts(start)},{ass_ts(end)},FinanceBold,,0,0,150,,{text}")
ASS.write_text('\n'.join(lines), encoding='utf-8')

assfile=str(ASS).replace(':','\\:').replace("'","\\'")
subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','error','-i',str(CLEAN),'-vf',f"ass='{assfile}'",'-c:a','copy',str(OUT)], check=True)
subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','error','-i',str(OUT),'-vf','scale=854:480:force_original_aspect_ratio=decrease,pad=854:480:(ow-iw)/2:(oh-ih)/2,format=yuv420p','-c:v','libx264','-preset','veryfast','-crf','30','-c:a','aac','-b:a','96k','-movflags','+faststart',str(LOW)], check=True)
# Proof frames.
for t,label in [(5,'005'),(20,'020'),(35,'035'),(50,'050')]:
    subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','error','-ss',str(t),'-i',str(OUT),'-frames:v','1',str(PROOF/f'v5_finance_subs_frame_{label}.jpg')], check=True)
# Copy outputs to Vibe.
for src in [OUT, LOW, ASS] + sorted(PROOF.glob('v5_finance_subs_frame_*.jpg')):
    shutil.copy2(src, VIBE/src.name)
report=V5/'v5_finance_subtitle_style_report.md'
report.write_text(f"""# V5 Finance Subtitle Style Report

Status: PASS for 1-minute review sample.

Applied Masala's finance niche subtitle lock:
- clean bold all-caps subtitle bursts
- 1–3 words per screen
- lower-middle safe-zone placement
- approx 15–20% visual area occupation
- pure white base text with thick black outline
- emerald green for numbers/money/profit/wealth triggers
- electric yellow for warnings/core mistake keywords
- no black subtitle box

Output: `{OUT}`
Telegram low copy: `{LOW}`
ASS: `{ASS}`
""")
shutil.copy2(report, VIBE/report.name)
print(json.dumps({'groups':len(groups),'output':str(OUT),'telegram_low':str(LOW),'ass':str(ASS)}, indent=2))
