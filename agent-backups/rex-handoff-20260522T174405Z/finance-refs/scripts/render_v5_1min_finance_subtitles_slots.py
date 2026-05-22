#!/usr/bin/env python3
from __future__ import annotations
import json, re, subprocess, shutil
from pathlib import Path
from PIL import ImageFont

ROOT=Path('/root/.openclaw/workspace/youtube-automation-finance')
PROJECT=ROOT/'videos/credit-card-minimum-payment-trap'
V5=PROJECT/'v5_chatgpt_stick_figure'
RENDERS=V5/'renders'
PROOF=V5/'proof'
VIBE=Path('/root/.openclaw/workspace/vibe-zone/media/practice/youtube-automation/finance-content/credit-card-minimum-payment-trap/v5_chatgpt_stick_figure')
for d in [PROOF,VIBE]: d.mkdir(parents=True, exist_ok=True)

CLEAN=RENDERS/'credit-card-minimum-payment-trap_v5_chatgpt_stick_figure_1min_clean.mp4'
OUT=RENDERS/'credit-card-minimum-payment-trap_v5_chatgpt_stick_figure_1min_slot_build_subs.mp4'
LOW=RENDERS/'credit-card-minimum-payment-trap_v5_chatgpt_stick_figure_1min_slot_build_subs_telegram_low.mp4'
ASS=V5/'v5_1min_finance_subtitles_slot_build.ass'
WORDS=json.loads((PROJECT/'transcription/word_timestamps.json').read_text())

GREEN='&H0034FF37'
YELLOW='&H0000F7FF'
WHITE='&H00FFFFFF'
BLACK='&H00000000'
Y=590
FONT_SIZE=50
MAX_WORDS=6
MIN_GAP=18
MAX_LINE_WIDTH=980
FONT_PATH='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
font=ImageFont.truetype(FONT_PATH,FONT_SIZE)
TRIGGERS_YELLOW={
 'MINIMUM','PAYMENT','TRAP','EXPENSIVE','BUTTON','POLITE','RESPONSIBLE','INTEREST','LATE','MATH','FLOOR','PLAN','WARNING','PENALTY','BANK','BALANCE','DEBT','CREDIT','APR','COSTS','CARRY','SLOWLY','PROTECTS','NOT','DANGER','BUY','NOW'
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

def ass_ts(t):
    h=int(t//3600); m=int((t%3600)//60); s=int(t%60); cs=int(round((t-int(t))*100))
    if cs>=100: s+=1; cs-=100
    return f'{h}:{m:02d}:{s:02d}.{cs:02d}'

def text_width(word):
    box=font.getbbox(word)
    return box[2]-box[0]

valid=[w for w in WORDS if float(w.get('start',999)) < 60 and w.get('word')]
def group_width(group):
    words=[display_word(x['word']) for x in group]
    widths=[text_width(w) for w in words if w]
    if not widths: return 0
    return sum(widths) + MIN_GAP*(len(widths)-1)

# Build natural subtitle lines. Add more than 3 words when they fit; split on punctuation, width, or timing.
phrases=[]; i=0
while i < len(valid):
    group=[valid[i]]; i+=1
    while i < len(valid) and len(group)<MAX_WORDS:
        prev=group[-1]['word']
        candidate=group+[valid[i]]
        if re.search(r'[.!?]$', prev): break
        if float(valid[i]['end'])-float(group[0]['start']) > 1.9: break
        if group_width(candidate) > MAX_LINE_WIDTH: break
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
Style: FinanceBold,DejaVu Sans,{FONT_SIZE},{WHITE},{WHITE},{BLACK},&H00000000,-1,0,0,0,100,100,0,0,1,5.5,0,5,0,0,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
lines=[header]
for p_idx,phrase in enumerate(phrases):
    words=[display_word(x['word']) for x in phrase]
    widths=[text_width(w) for w in words]
    gap=MIN_GAP
    total=sum(widths)+gap*(len(words)-1)
    left=(1280-total)/2
    phrase_end=min(60.0, float(phrase[-1]['end'])+0.34)
    # Ensure previous line clears before next line starts, avoiding overlap between phrase lines.
    if p_idx+1 < len(phrases):
        next_start=float(phrases[p_idx+1][0]['start'])
        phrase_end=min(phrase_end,next_start-0.07)
    cursor=left
    for item,word,wid in zip(phrase,words,widths):
        if not word: continue
        start=float(item['start'])
        end=phrase_end
        if end <= start: end=start+0.16
        x=cursor + wid/2
        cursor += wid + gap
        c=colour(item['word'])
        # One word per ASS event. It appears in its own horizontal slot and stays until line clears.
        text=r'{\an5\pos(%d,%d)\c%s}%s{\c%s}'%(round(x),Y,c,word,WHITE)
        lines.append(f"Dialogue: 0,{ass_ts(start)},{ass_ts(end)},FinanceBold,,0,0,0,,{text}")
ASS.write_text('\n'.join(lines),encoding='utf-8')

assfile=str(ASS).replace(':','\\:').replace("'","\\'")
subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','error','-i',str(CLEAN),'-vf',f"ass='{assfile}'",'-c:a','copy',str(OUT)],check=True)
subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','error','-i',str(OUT),'-vf','scale=854:480:force_original_aspect_ratio=decrease,pad=854:480:(ow-iw)/2:(oh-ih)/2,format=yuv420p','-c:v','libx264','-preset','veryfast','-crf','30','-c:a','aac','-b:a','96k','-movflags','+faststart',str(LOW)],check=True)
for t,label in [(5,'005'),(20,'020'),(35,'035'),(50,'050')]:
    subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','error','-ss',str(t),'-i',str(OUT),'-frames:v','1',str(PROOF/f'v5_slot_build_subs_frame_{label}.jpg')],check=True)
for src in [OUT,LOW,ASS] + sorted(PROOF.glob('v5_slot_build_subs_frame_*.jpg')):
    shutil.copy2(src,VIBE/src.name)
report=V5/'v5_slot_build_subtitle_style_report.md'
report.write_text(f"""# V5 Slot-Build Finance Subtitle Style Report

Status: PASS candidate for Masala review.

Applied latest correction:
- one word appears at a time from left to right
- previous words remain in their natural measured positions until the phrase completes
- phrase length is dynamic: more than 3 words allowed when the line fits cleanly
- spacing is measured from actual word widths with compact natural gaps
- when the final word is down, the entire line clears
- next phrase starts fresh at the left edge of the newly centered line
- exact y-position: {Y}
- no cumulative replacement text, preventing same-position overlap
- bold all-caps with thick black outline and finance color triggers

Output: `{OUT}`
Telegram low copy: `{LOW}`
""")
shutil.copy2(report,VIBE/report.name)
print(json.dumps({'phrases':len(phrases),'word_events':sum(len(p) for p in phrases),'output':str(OUT),'telegram_low':str(LOW)},indent=2))
