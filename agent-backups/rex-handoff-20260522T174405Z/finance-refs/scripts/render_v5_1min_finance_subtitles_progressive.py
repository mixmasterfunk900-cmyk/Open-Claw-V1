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
OUT=RENDERS/'credit-card-minimum-payment-trap_v5_chatgpt_stick_figure_1min_progressive_subs.mp4'
LOW=RENDERS/'credit-card-minimum-payment-trap_v5_chatgpt_stick_figure_1min_progressive_subs_telegram_low.mp4'
ASS=V5/'v5_1min_finance_subtitles_progressive.ass'
WORDS=json.loads((PROJECT/'transcription/word_timestamps.json').read_text())

GREEN='&H0034FF37'
YELLOW='&H0000F7FF'
WHITE='&H00FFFFFF'
BLACK='&H00000000'
TRIGGERS_YELLOW={
 'MINIMUM','PAYMENT','TRAP','EXPENSIVE','BUTTON','POLITE','RESPONSIBLE','INTEREST','LATE','MATH','FLOOR','PLAN','WARNING','PENALTY','BANK','BALANCE','DEBT','CREDIT','APR','COSTS','CARRY','SLOWLY','PROTECTS','NOT','DANGER'
}
TRIGGERS_GREEN={
 'DOLLAR','DOLLARS','MONEY','PAYCHECK','PROFIT','PROFITS','WEALTH','TRILLION','PERCENT','TWENTY','TWENTY-PLUS','MID','LOW-TO-MID'
}

def clean_word(w): return re.sub(r"[^A-Za-z0-9$%+\-']",'',w).upper()
def display_word(w):
    s=clean_word(w)
    if s == 'ANNUAL': return 'APR'
    if s == 'PERCENTAGE': return 'RATE'
    return s

def colour(raw):
    s=clean_word(raw)
    if re.search(r'\d|\$|%',s) or s in TRIGGERS_GREEN: return GREEN
    if s in TRIGGERS_YELLOW: return YELLOW
    return WHITE

def colorize(words):
    out=[]
    for raw in words:
        w=display_word(raw)
        if not w: continue
        c=colour(raw)
        out.append(r'{\c%s}%s{\c%s}'%(c,w,WHITE))
    return ' '.join(out)

def ass_ts(t):
    h=int(t//3600); m=int((t%3600)//60); s=int(t%60); cs=int(round((t-int(t))*100))
    if cs>=100: s+=1; cs-=100
    return f'{h}:{m:02d}:{s:02d}.{cs:02d}'

valid=[w for w in WORDS if float(w.get('start',999)) < 60 and w.get('word')]
# Build phrase groups: max 3 words so the built line never wraps/stacks.
phrases=[]; i=0
while i < len(valid):
    group=[valid[i]]; i+=1
    while i < len(valid) and len(group)<3:
        prev=group[-1]['word']
        if re.search(r'[.!?]$', prev): break
        if float(valid[i]['end'])-float(group[0]['start']) > 1.25: break
        group.append(valid[i]); i+=1
    phrases.append(group)

header=f"""[Script Info]
ScriptType: v4.00+
PlayResX: 1280
PlayResY: 720
ScaledBorderAndShadow: yes
WrapStyle: 2

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: FinanceBold,DejaVu Sans,50,{WHITE},{WHITE},{BLACK},&H00000000,-1,0,0,0,100,100,0,0,1,5.5,0,2,160,160,150,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
lines=[header]
for phrase in phrases:
    # Each event ends exactly as the next word arrives; no stacked overlap.
    for idx,w in enumerate(phrase):
        start=float(w['start'])
        if start >= 60: continue
        if idx+1 < len(phrase): end=float(phrase[idx+1]['start']) - 0.045
        else: end=min(60.0, float(w['end'])+0.26)
        if end <= start: end=start+0.12
        shown=[x['word'] for x in phrase[:idx+1]]
        # Exact fixed position. Slightly lower than previous pass; tiny inter-event gaps prevent same-frame overlap.
        text=r'{\an2\pos(640,590)}'+colorize(shown)
        lines.append(f"Dialogue: 0,{ass_ts(start)},{ass_ts(end)},FinanceBold,,0,0,120,,{text}")
ASS.write_text('\n'.join(lines), encoding='utf-8')

assfile=str(ASS).replace(':','\\:').replace("'","\\'")
subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','error','-i',str(CLEAN),'-vf',f"ass='{assfile}'",'-c:a','copy',str(OUT)], check=True)
subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','error','-i',str(OUT),'-vf','scale=854:480:force_original_aspect_ratio=decrease,pad=854:480:(ow-iw)/2:(oh-ih)/2,format=yuv420p','-c:v','libx264','-preset','veryfast','-crf','30','-c:a','aac','-b:a','96k','-movflags','+faststart',str(LOW)], check=True)
for t,label in [(5,'005'),(20,'020'),(35,'035'),(50,'050')]:
    subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','error','-ss',str(t),'-i',str(OUT),'-frames:v','1',str(PROOF/f'v5_progressive_subs_frame_{label}.jpg')], check=True)
for src in [OUT,LOW,ASS] + sorted(PROOF.glob('v5_progressive_subs_frame_*.jpg')):
    shutil.copy2(src,VIBE/src.name)
report=V5/'v5_progressive_subtitle_style_report.md'
report.write_text(f"""# V5 Progressive Finance Subtitle Style Report

Status: PASS candidate for Masala review.

Change applied from Masala notes:
- words build one-at-a-time into a single fixed line
- line clears/resets after each short phrase
- all captions use the same lower-middle safe-zone position
- no overlapping replacement captions
- bold all-caps, thick black outline
- emerald green for money/numbers, electric yellow for triggers/warnings

Output: `{OUT}`
Telegram low copy: `{LOW}`
""")
shutil.copy2(report,VIBE/report.name)
print(json.dumps({'phrases':len(phrases),'events':sum(len(p) for p in phrases),'output':str(OUT),'telegram_low':str(LOW)},indent=2))
