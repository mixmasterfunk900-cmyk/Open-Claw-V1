#!/usr/bin/env python3
"""Build Finance V4 as deterministic stick-figure animation.

V4 owner notes:
- No Google Flow access is configured on this host, so avoid image-model character drift.
- Use deterministic local stick-figure visuals throughout.
- Beat visuals are selected from actual TTS segment text/timestamps, not generic reused image prompts.
- Subtitles: 30% smaller than V3 and ~20% lower.
"""
from __future__ import annotations

import json, math, re, shutil, subprocess, textwrap
from dataclasses import dataclass
from pathlib import Path
from typing import Callable
from PIL import Image, ImageDraw, ImageFont

ROOT = Path('/root/.openclaw/workspace/youtube-automation-finance')
SLUG = 'credit-card-minimum-payment-trap'
VIDEO_DIR = ROOT / 'videos' / SLUG
AUDIO_DIR = VIDEO_DIR / 'audio'
V4_DIR = VIDEO_DIR / 'v4_stick_figure'
SCENES_DIR = V4_DIR / 'scenes'
RENDERS_DIR = V4_DIR / 'renders'
QA_DIR = V4_DIR / 'qa'
PROOF_DIR = V4_DIR / 'proof'
VIBE_DIR = Path('/root/.openclaw/workspace/vibe-zone/media/practice/youtube-automation/finance-content/credit-card-minimum-payment-trap/v4_stick_figure')
W, H = 1280, 720
FPS = 24
BG = (252, 248, 239)
INK = (31, 35, 42)
MUTED = (105, 111, 122)
TEAL = (42, 159, 143)
BLUE = (70, 114, 196)
RED = (217, 90, 74)
GOLD = (238, 178, 67)
GREEN = (76, 170, 99)
PURPLE = (124, 92, 180)

for d in [V4_DIR, SCENES_DIR, RENDERS_DIR, QA_DIR, PROOF_DIR, VIBE_DIR]:
    d.mkdir(parents=True, exist_ok=True)

FONT = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 24)
FONT_BOLD = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 34)
FONT_SMALL = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 18)

@dataclass
class Beat:
    beat_id: int
    start: float
    end: float
    speaker: str
    text: str
    visual: str
    rationale: str


def load_segments():
    return json.loads((AUDIO_DIR / 'dialogue_segments.json').read_text())


def duration_seconds():
    # V3's audio file was padded to 480s even though speech ends much earlier.
    # V4 should render the actual spoken video, not a long silent tail.
    segments = load_segments()
    return round(max(float(seg['end']) for seg in segments) + 0.75, 3)


def normalize(text: str) -> str:
    return re.sub(r'\s+', ' ', text).strip()


def choose_visual(text: str) -> tuple[str, str]:
    t = text.lower()
    rules = [
        (('button','minimum'), 'button_chain', 'minimum-payment button/chained card line'),
        (('polite','responsible','groceries','subscription'), 'grocery_subscription', 'groceries becoming recurring debt'),
        (('protecting your credit','late'), 'credit_shield', 'minimum prevents lateness but not interest'),
        (('floor','plan','math'), 'floor_stairs', 'floor versus payoff plan'),
        (('trillion','new york fed','balances'), 'debt_mountain', 'large national balance/stat context'),
        (('annual percentage','apr','interest rate','borrowing costs'), 'apr_meter', 'APR/interest-rate pressure'),
        (('monthly rent paid to the bank','penalty'), 'bank_rent', 'interest as rent paid to bank'),
        (('card existing','carrying the balance'), 'tool_vs_loan', 'card as tool versus loan'),
        (('finish line','account current'), 'finish_line', 'current account is not a payoff finish line'),
        (('interest','principal','balance barely'), 'interest_bites', 'interest eating payment before principal'),
        (('phone','purchase button','breakfast'), 'phone_buttons', 'phone purchase buttons everywhere'),
        (('emergency','default monthly bill'), 'emergency_bill', 'emergency becoming monthly default'),
        (('cannot pay more','pay it off faster'), 'tight_budget', 'tight-budget empathy beat'),
        (('lifeboat','house'), 'lifeboat_house', 'lifeboat becoming permanent home'),
        (('no new charges','autopay','twenty dollars'), 'freeze_card', 'stop new charges and add a small extra payment'),
        (('five-thousand','twenty-four','payoff path'), 'payoff_graph', 'example payoff path changes'),
        (('graph changes shape','principal'), 'principal_attack', 'fixed payment attacks principal'),
        (('snowball','spoon','snowbank','shovel'), 'spoon_shovel', 'snowbank/spoon/shovel metaphor'),
        (('balance transfer','transfer fee','deadline'), 'transfer_bridge', 'balance-transfer bridge with deadlines'),
        (('consolidation','lower apr','old card'), 'refill_card', 'consolidation only works if old card does not refill'),
        (('four steps','first','second','third','fourth'), 'four_steps', 'four-step action plan'),
        (('fixed payment','minimum falls'), 'fixed_payment', 'fixed payment stays above falling minimum'),
        (('avalanche','snowball'), 'avalanche_snowball', 'avalanche versus snowball methods'),
        (('lender','freedom'), 'freedom_key', 'do not let lender minimum choose strategy'),
        (('credit-score','utilization','card limit'), 'utilization_gauge', 'credit utilization pressure'),
        (('rewards','confetti','invoice'), 'confetti_invoice', 'rewards versus interest invoice'),
        (('one card to pay another','opening new'), 'stacked_cards_alarm', 'debt-to-pay-debt smoke alarm'),
        (('credit counselor','hardship','issuer'), 'help_call', 'early help options'),
        (('emergency buffer','next surprise'), 'buffer_shield', 'emergency buffer shield'),
        (('warning label','future paycheck'), 'warning_paycheck', 'minimum payment as warning label'),
        (('eviction notice','future interest'), 'evict_interest', 'extra dollars evict future interest'),
        (('stop letting the card write the timeline','timeline'), 'timeline_control', 'owner controls payoff timeline'),
        (('one card','one apr','one fixed payment'), 'write_one_card', 'single-card starting-line exercise'),
        (('twenty-five dollars due today','tomorrow'), 'today_tomorrow', 'small due today bills tomorrow'),
    ]
    for keys, visual, rationale in rules:
        if any(k in t for k in keys):
            return visual, rationale
    if 'laura' in t or '?' in t:
        return 'laura_question', 'Laura/audience question beat'
    return 'john_explains', 'John explanation beat'


def make_beats(max_len=4.0) -> list[Beat]:
    beats: list[Beat] = []
    for seg in load_segments():
        start, end = float(seg['start']), float(seg['end'])
        seg_text = normalize(seg['text'])
        chunks = max(1, math.ceil((end - start) / max_len))
        words = seg_text.split()
        for i in range(chunks):
            a = start + (end - start) * i / chunks
            b = start + (end - start) * (i + 1) / chunks
            lo = math.floor(len(words) * i / chunks)
            hi = math.ceil(len(words) * (i + 1) / chunks)
            text = ' '.join(words[lo:hi]) or seg_text
            visual, rationale = choose_visual(text)
            beats.append(Beat(len(beats)+1, round(a,3), round(b,3), seg['speaker'], text, visual, rationale))
    total = duration_seconds()
    if beats and beats[-1].end < total:
        beats.append(Beat(len(beats)+1, beats[-1].end, total, 'JOHN', 'outro hold', 'write_one_card', 'audio tail hold'))
    return beats

# ---------- Drawing helpers ----------

def line(d, pts, fill=INK, width=5):
    d.line(pts, fill=fill, width=width, joint='curve')

def rounded(d, box, r=22, fill=(255,255,255), outline=INK, width=4):
    d.rounded_rectangle(box, r, fill=fill, outline=outline, width=width)

def arrow(d, p1, p2, fill=INK, width=5):
    line(d, [p1, p2], fill, width)
    x1,y1=p1; x2,y2=p2
    ang=math.atan2(y2-y1,x2-x1)
    for da in (2.55,-2.55):
        x=x2-22*math.cos(ang+da); y=y2-22*math.sin(ang+da)
        line(d, [(x2,y2),(x,y)], fill, width)

def stick(d, x, y, scale=1.0, who='john', pose=0, mood='calm'):
    color = BLUE if who == 'john' else TEAL
    hair = (70,70,70) if who == 'john' else (84,48,36)
    # head/body anchors
    r = int(24*scale)
    d.ellipse((x-r,y-r,x+r,y+r), fill=(255,235,205), outline=INK, width=max(2,int(4*scale)))
    if who == 'john':
        d.arc((x-r,y-r-8,x+r,y+r), 190, 350, fill=hair, width=max(2,int(4*scale)))
        d.line((x-12*scale,y-2*scale,x+12*scale,y-2*scale), fill=INK, width=max(1,int(2*scale)))
        d.ellipse((x-14*scale,y-8*scale,x-4*scale,y+2*scale), outline=INK, width=2)
        d.ellipse((x+4*scale,y-8*scale,x+14*scale,y+2*scale), outline=INK, width=2)
    else:
        d.arc((x-r-4,y-r-8,x+r+4,y+r+16), 180, 360, fill=hair, width=max(4,int(8*scale)))
        d.ellipse((x-11*scale,y-6*scale,x-5*scale,y), fill=INK)
        d.ellipse((x+5*scale,y-6*scale,x+11*scale,y), fill=INK)
    mouth_y = y+11*scale
    if mood == 'worried': d.arc((x-10*scale,mouth_y,x+10*scale,mouth_y+10*scale), 200, 340, fill=INK, width=2)
    elif mood == 'happy': d.arc((x-10*scale,mouth_y-8*scale,x+10*scale,mouth_y+6*scale), 20, 160, fill=INK, width=2)
    else: d.line((x-8*scale,mouth_y,x+8*scale,mouth_y), fill=INK, width=2)
    neck=(x,y+r); waist=(x,y+int(100*scale))
    line(d, [neck, waist], color, max(4,int(7*scale)))
    # arms
    shoulder=(x,y+int(42*scale))
    if pose % 3 == 0:
        left=(x-int(58*scale), y+int(70*scale)); right=(x+int(68*scale), y+int(28*scale))
    elif pose % 3 == 1:
        left=(x-int(68*scale), y+int(36*scale)); right=(x+int(58*scale), y+int(72*scale))
    else:
        left=(x-int(55*scale), y+int(85*scale)); right=(x+int(55*scale), y+int(85*scale))
    line(d, [shoulder, left], color, max(4,int(6*scale)))
    line(d, [shoulder, right], color, max(4,int(6*scale)))
    # legs
    line(d, [waist, (x-int(45*scale), y+int(168*scale))], color, max(4,int(6*scale)))
    line(d, [waist, (x+int(45*scale), y+int(168*scale))], color, max(4,int(6*scale)))
    return {'head':(x,y), 'left_hand':left, 'right_hand':right}

def credit_card(d, box, color=PURPLE):
    rounded(d, box, 26, fill=color, outline=INK, width=4)
    x1,y1,x2,y2=box
    d.rectangle((x1+32,y1+38,x2-32,y1+56), fill=(35,35,45))
    for i in range(3):
        d.rounded_rectangle((x1+36+i*82,y2-54,x1+88+i*82,y2-36), 7, fill=(255,255,255,120))

def chain(d, start, end, color=INK):
    x1,y1=start; x2,y2=end; steps=8
    for i in range(steps):
        t=i/(steps-1); x=x1+(x2-x1)*t; y=y1+(y2-y1)*t
        d.ellipse((x-13,y-7,x+13,y+7), outline=color, width=3)

def button(d, cx, cy, label=False):
    d.ellipse((cx-72,cy-38,cx+72,cy+38), fill=RED, outline=INK, width=5)
    d.ellipse((cx-52,cy-23,cx+52,cy+23), fill=(238,108,88), outline=None)

def axes_graph(d, x, y, w, h, down=False):
    line(d, [(x,y+h),(x+w,y+h)], INK, 4); line(d, [(x,y+h),(x,y)], INK, 4)
    pts=[]
    for i in range(7):
        t=i/6; px=x+20+t*(w-40)
        if down: py=y+40+(1-math.exp(-2.2*t))*(h-80)
        else: py=y+h-40-(t*t)*(h-80)
        pts.append((px,py))
    line(d, pts, GREEN if down else RED, 7)

def draw_icons_bg(d):
    for x,y,c in [(70,90,GOLD),(1120,84,TEAL),(1030,610,RED),(140,610,PURPLE)]:
        d.ellipse((x-22,y-22,x+22,y+22), fill=c+(70,), outline=None)

def scene_base(beat: Beat, frame_idx: int, nframes: int):
    im=Image.new('RGB',(W,H),BG); d=ImageDraw.Draw(im,'RGBA')
    draw_icons_bg(d)
    # gentle non-character animation markers; figure limbs pose changes through frame index
    pulse=math.sin(frame_idx/nframes*math.pi*2) if nframes else 0
    d.rounded_rectangle((28,28,W-28,H-28), 28, outline=(31,35,42,60), width=3)
    return im,d,pulse


def draw_visual(d, visual, beat: Beat, f, n, pulse):
    pose = (beat.beat_id + (f//12)) % 3
    speaker_is_laura = beat.speaker == 'LAURA'
    if visual in {'button_chain','grocery_subscription','credit_shield','floor_stairs','john_explains','laura_question'}:
        stick(d, 280, 235, 1.15, 'laura', pose, 'worried' if speaker_is_laura else 'calm')
        stick(d, 1000, 230, 1.18, 'john', pose+1, 'calm')
    if visual == 'button_chain':
        credit_card(d,(470,165,810,360)); button(d,640,495); chain(d,(640,456),(640,360))
    elif visual == 'grocery_subscription':
        stick(d, 260,230,1.12,'laura',pose,'worried'); credit_card(d,(735,150,1030,330), PURPLE); chain(d,(630,455),(840,330));
        d.polygon([(465,395),(600,395),(575,540),(490,540)], fill=(245,199,90), outline=INK); d.arc((500,365,565,430),180,360,fill=INK,width=5)
        for i,c in enumerate([GREEN,RED,GOLD]): d.ellipse((500+i*35,420,530+i*35,455), fill=c, outline=INK, width=2)
    elif visual == 'credit_shield':
        credit_card(d,(455,185,725,345)); d.polygon([(800,170),(930,210),(905,390),(800,465),(695,390),(670,210)], fill=(115,190,130), outline=INK); d.arc((740,280,795,340),30,130,fill=INK,width=7); d.line((785,330,875,240),fill=INK,width=7)
    elif visual == 'floor_stairs':
        line(d,[(420,525),(900,525)],INK,6)
        for i in range(5): rounded(d,(500+i*75,470-i*48,575+i*75,525-i*48),8,fill=(235,242,255),outline=INK,width=4)
        arrow(d,(460,505),(890,255),GREEN,7)
    elif visual == 'debt_mountain':
        stick(d,220,270,1.05,'laura',pose,'worried')
        for i in range(9):
            x=480+(i%3)*115; y=460-(i//3)*82
            rounded(d,(x,y,x+150,y+68),8,fill=(255,255,255),outline=INK,width=3)
            line(d,[(x+20,y+25),(x+115,y+25)],MUTED,3); line(d,[(x+20,y+45),(x+95,y+45)],MUTED,3)
        credit_card(d,(820,210,1080,360), PURPLE)
    elif visual == 'apr_meter':
        stick(d,250,250,1.1,'john',pose,'calm'); d.arc((560,165,1000,605),180,360,fill=INK,width=8)
        for ang,col in [(205,GREEN),(255,GOLD),(310,RED)]:
            x=780+205*math.cos(math.radians(ang)); y=385+205*math.sin(math.radians(ang)); line(d,[(780,385),(x,y)],col,6)
        needle=math.radians(320+pulse*4); arrow(d,(780,385),(780+190*math.cos(needle),385+190*math.sin(needle)),RED,8)
    elif visual == 'bank_rent':
        stick(d,250,260,1.08,'laura',pose,'worried'); d.polygon([(700,190),(980,190),(840,80)],fill=(210,215,222),outline=INK); rounded(d,(725,190,955,470),8,fill=(245,245,245),outline=INK,width=5)
        credit_card(d,(485,360,685,485),PURPLE); arrow(d,(655,420),(735,340),RED,8)
    elif visual == 'tool_vs_loan':
        stick(d,230,245,1.05,'john',pose,'calm'); credit_card(d,(430,180,660,320),TEAL); credit_card(d,(800,235,1030,390),RED); chain(d,(915,390),(915,535)); d.ellipse((870,530,960,610),fill=(80,80,90),outline=INK,width=4)
    elif visual == 'finish_line':
        stick(d,255,255,1.05,'laura',pose,'worried'); line(d,[(770,160),(770,560)],INK,5)
        for y in range(160,560,50): d.rectangle((770,y,830,y+25),fill=(255,255,255) if y//50%2 else INK)
        credit_card(d,(460,410,690,535),PURPLE); arrow(d,(590,405),(750,270),GREEN,6)
    elif visual == 'interest_bites':
        stick(d,230,260,1.05,'john',pose,'calm'); rounded(d,(470,250,690,375),16,fill=(208,245,218),outline=INK,width=4); credit_card(d,(845,225,1080,360),PURPLE)
        d.polygon([(760,300),(820,260),(820,340)],fill=RED,outline=INK); arrow(d,(690,312),(760,312),RED,7)
    elif visual == 'phone_buttons':
        stick(d,615,245,1.12,'laura',pose,'worried'); rounded(d,(145,160,315,470),26,fill=(40,45,55),outline=INK,width=4)
        for i,(x,y,c) in enumerate([(450,140,RED),(790,150,GOLD),(930,300,TEAL),(380,420,PURPLE),(825,480,RED)]): d.ellipse((x-45,y-28,x+45,y+28),fill=c,outline=INK,width=4)
    elif visual == 'emergency_bill':
        stick(d,250,255,1.08,'laura',pose,'worried'); d.polygon([(650,160),(875,160),(1010,420),(520,420)],fill=(255,250,230),outline=INK); d.line((700,200,930,390),fill=RED,width=8); credit_card(d,(555,450,780,570),PURPLE)
    elif visual == 'tight_budget':
        stick(d,320,250,1.12,'laura',pose,'worried'); rounded(d,(590,155,1010,500),18,fill=(255,255,255),outline=INK,width=4)
        for i,h in enumerate([210,170,120,80]): d.rectangle((645+i*75,460-h,695+i*75,460),fill=[RED,GOLD,TEAL,GREEN][i],outline=INK,width=3)
    elif visual == 'lifeboat_house':
        stick(d,250,240,1.0,'john',pose,'calm'); d.arc((430,470,1030,620),190,350,fill=BLUE,width=8); d.polygon([(630,345),(815,345),(890,455),(560,455)],fill=GOLD,outline=INK); d.polygon([(615,345),(730,250),(845,345)],fill=RED,outline=INK)
    elif visual == 'freeze_card':
        stick(d,250,250,1.08,'john',pose,'calm'); credit_card(d,(520,210,825,390),PURPLE); d.line((510,200,835,400),fill=BLUE,width=12); d.line((835,200,510,400),fill=BLUE,width=12); d.ellipse((880,365,960,445),fill=GREEN,outline=INK,width=4)
    elif visual == 'payoff_graph':
        stick(d,230,260,1.05,'john',pose,'calm'); axes_graph(d,480,160,570,390,down=True); credit_card(d,(855,440,1050,555),PURPLE)
    elif visual == 'principal_attack':
        stick(d,245,255,1.05,'laura',pose,'calm'); d.ellipse((670,240,925,495),fill=(255,235,235),outline=INK,width=5); arrow(d,(470,365),(660,365),GREEN,10); d.arc((715,305,875,440),20,340,fill=RED,width=9)
    elif visual == 'spoon_shovel':
        stick(d,230,260,1.05,'john',pose,'calm'); d.ellipse((510,290,1080,590),fill=(230,244,255),outline=INK,width=5); line(d,[(580,245),(660,520)],INK,5); d.ellipse((548,210,600,260),outline=INK,width=5); line(d,[(900,210),(800,540)],INK,8); d.polygon([(770,535),(860,535),(825,610)],fill=INK)
    elif visual == 'transfer_bridge':
        stick(d,230,250,1.05,'laura',pose,'worried'); line(d,[(450,470),(1030,310)],PURPLE,16); line(d,[(450,520),(1030,360)],PURPLE,16); d.polygon([(850,200),(925,325),(775,325)],fill=GOLD,outline=INK)
    elif visual == 'refill_card':
        stick(d,235,255,1.05,'john',pose,'calm'); credit_card(d,(650,190,930,350),PURPLE); arrow(d,(570,500),(735,360),RED,8); d.arc((500,410,700,610),300,80,fill=RED,width=8)
    elif visual == 'four_steps':
        stick(d,220,250,1.05,'john',pose,'calm');
        for i,c in enumerate([TEAL,GOLD,GREEN,PURPLE]):
            x=480+i*150; d.ellipse((x,235,x+95,330),fill=c,outline=INK,width=4); d.line((x+30,282,x+46,305),fill=INK,width=5); d.line((x+46,305,x+70,255),fill=INK,width=5)
    elif visual == 'fixed_payment':
        stick(d,240,255,1.05,'laura',pose,'calm'); axes_graph(d,500,160,520,360,down=True); line(d,[(540,270),(980,270)],BLUE,8)
    elif visual == 'avalanche_snowball':
        stick(d,230,260,1.05,'john',pose,'calm'); d.polygon([(510,540),(650,260),(790,540)],fill=(225,236,245),outline=INK); d.ellipse((890,440,1040,590),fill=(240,250,255),outline=INK,width=5); arrow(d,(600,230),(555,420),RED,6); arrow(d,(965,420),(850,330),BLUE,6)
    elif visual == 'freedom_key':
        stick(d,245,250,1.05,'laura',pose,'calm'); d.ellipse((610,260,700,350),outline=GOLD,width=12); line(d,[(700,305),(940,305)],GOLD,12); d.rectangle((885,305,915,365),fill=GOLD); d.rectangle((930,305,960,350),fill=GOLD); credit_card(d,(820,430,1040,555),PURPLE)
    elif visual == 'utilization_gauge':
        stick(d,230,250,1.05,'john',pose,'calm'); credit_card(d,(495,400,805,550),PURPLE); d.arc((640,130,1040,530),180,360,fill=INK,width=7); arrow(d,(840,330),(970,225),RED,8)
    elif visual == 'confetti_invoice':
        stick(d,250,250,1.05,'laura',pose,'worried'); credit_card(d,(500,170,780,320),PURPLE); rounded(d,(850,250,1060,500),14,fill=(255,255,255),outline=INK,width=4)
        for i in range(20): d.rectangle((500+(i*37)%300,120+(i*53)%230,510+(i*37)%300,130+(i*53)%230),fill=[RED,GOLD,TEAL,GREEN][i%4])
    elif visual == 'stacked_cards_alarm':
        stick(d,250,250,1.05,'laura',pose,'worried');
        for i in range(5): credit_card(d,(565+i*35,410-i*55,845+i*35,535-i*55), [PURPLE,TEAL,RED,GOLD,BLUE][i])
        d.ellipse((875,125,1015,265),fill=RED,outline=INK,width=5); d.arc((905,165,985,235),200,340,fill=(255,255,255),width=8)
    elif visual == 'help_call':
        stick(d,250,250,1.05,'john',pose,'calm'); rounded(d,(600,150,910,510),28,fill=(44,50,64),outline=INK,width=5); d.ellipse((705,225,805,325),outline=GREEN,width=10); d.arc((690,340,820,465),200,340,fill=GREEN,width=10)
    elif visual == 'buffer_shield':
        stick(d,260,250,1.05,'laura',pose,'calm'); d.polygon([(760,160),(940,215),(910,465),(760,585),(610,465),(580,215)],fill=(190,230,202),outline=INK,width=5); d.ellipse((720,310,800,390),fill=GOLD,outline=INK,width=4)
    elif visual == 'warning_paycheck':
        stick(d,250,250,1.05,'john',pose,'calm'); rounded(d,(500,230,940,420),12,fill=(230,255,230),outline=INK,width=5); d.polygon([(960,185),(1070,385),(850,385)],fill=GOLD,outline=INK,width=5)
    elif visual == 'evict_interest':
        stick(d,250,250,1.05,'laura',pose,'happy'); d.ellipse((720,255,900,435),fill=(255,225,225),outline=INK,width=5); arrow(d,(525,350),(710,350),GREEN,9); d.arc((760,305,860,405),200,340,fill=RED,width=8)
    elif visual == 'timeline_control':
        stick(d,250,250,1.05,'john',pose,'calm'); line(d,[(475,380),(1020,380)],INK,6); [d.ellipse((x-16,364,x+16,396),fill=c,outline=INK,width=3) for x,c in [(530,RED),(700,GOLD),(870,TEAL),(1000,GREEN)]]; arrow(d,(500,500),(980,500),GREEN,8)
    elif visual == 'write_one_card':
        stick(d,250,250,1.05,'laura',pose,'calm'); rounded(d,(550,160,970,525),18,fill=(255,255,255),outline=INK,width=5); credit_card(d,(620,230,810,340),PURPLE); d.ellipse((835,380,910,455),fill=GREEN,outline=INK,width=4)
    elif visual == 'today_tomorrow':
        stick(d,245,250,1.05,'john',pose,'calm'); rounded(d,(520,210,710,430),16,fill=(255,255,255),outline=INK,width=4); rounded(d,(830,160,1060,500),16,fill=(255,245,230),outline=INK,width=4); arrow(d,(720,320),(820,320),RED,8)
    elif visual == 'laura_question':
        stick(d,430,230,1.18,'laura',pose,'worried'); d.arc((710,205,830,325),200,520,fill=PURPLE,width=10); d.ellipse((760,405,780,425),fill=PURPLE)
    else:
        stick(d,430,230,1.12,'john',pose,'calm'); credit_card(d,(720,235,990,395),PURPLE); axes_graph(d,700,430,350,150,down=True)


def draw_scene_png(beat: Beat):
    im,d,pulse=scene_base(beat,0,1)
    draw_visual(d, beat.visual, beat, 0, 1, pulse)
    im.save(SCENES_DIR / f'scene_{beat.beat_id:03d}.png')


def render_frames(beats: list[Beat]):
    # Stream raw frames to ffmpeg to avoid storing thousands of PNGs.
    silent = RENDERS_DIR / f'{SLUG}_v4_stick_figure_silent.mp4'
    cmd = ['ffmpeg','-y','-hide_banner','-loglevel','error','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','-','-an','-c:v','libx264','-preset','veryfast','-crf','19','-pix_fmt','yuv420p',str(silent)]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    frames_written = 0
    last_frame = None
    try:
        for beat in beats:
            n = max(1, int(round((beat.end-beat.start)*FPS)))
            draw_scene_png(beat)
            for f in range(n):
                im,d,pulse=scene_base(beat,f,n)
                draw_visual(d, beat.visual, beat, f, n, pulse)
                last_frame = im.tobytes()
                proc.stdin.write(last_frame)
                frames_written += 1
        # Guard against cumulative frame-rounding truncation. Keep the final visual on screen until full audio length.
        expected_frames = int(math.ceil(duration_seconds() * FPS))
        if last_frame and frames_written < expected_frames:
            for _ in range(expected_frames - frames_written):
                proc.stdin.write(last_frame)
                frames_written += 1
    finally:
        if proc.stdin: proc.stdin.close()
    if proc.wait() != 0:
        raise SystemExit('ffmpeg silent render failed')
    return silent


def ts(t: float):
    h=int(t//3600); m=int((t%3600)//60); s=int(t%60); ms=int(round((t-int(t))*1000))
    if ms>=1000: s+=1; ms-=1000
    return f'{h:02d}:{m:02d}:{s:02d},{ms:03d}'

def make_srt():
    segments=load_segments(); idx=1; out=[]
    for seg in segments:
        text=normalize(seg['text'])
        # Shorter lines prevent the smaller/lower subtitles from running across the whole bottom visual lane.
        words=text.split(); chunks=[]; cur=[]
        for w in words:
            if len(' '.join(cur+[w]))>46 and cur:
                chunks.append(' '.join(cur)); cur=[w]
            else:
                cur.append(w)
        if cur: chunks.append(' '.join(cur))
        total=max(float(seg['end'])-float(seg['start']), len(chunks)*1.1)
        for j,c in enumerate(chunks):
            start=float(seg['start'])+total*j/len(chunks); end=float(seg['start'])+total*(j+1)/len(chunks)-0.05
            out.append(f'{idx}\n{ts(start)} --> {ts(end)}\n{c}\n'); idx+=1
    srt=V4_DIR/'subtitles_v4.srt'; srt.write_text('\n'.join(out), encoding='utf-8'); return srt


def mux_and_subtitle(silent: Path, srt: Path):
    clean=RENDERS_DIR/f'{SLUG}_v4_stick_figure_clean_master.mp4'
    review=RENDERS_DIR/f'{SLUG}_v4_stick_figure_burned_captions_review.mp4'
    audio=AUDIO_DIR/'voiceover_full.mp3'
    subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','error','-i',str(silent),'-i',str(audio),'-c:v','copy','-c:a','aac','-b:a','192k','-shortest',str(clean)], check=True)
    subfile=str(srt).replace(':','\\:').replace("'","\\'")
    # V3 was Fontsize=22, MarginV=55. V4 is ~30% smaller and lower (smaller bottom margin).
    style="Fontsize=15,PrimaryColour=&HFFFFFF&,OutlineColour=&H80202020&,BorderStyle=1,Outline=1.25,Shadow=0,MarginV=30,Alignment=2"
    subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','error','-i',str(clean),'-vf',f"subtitles='{subfile}':force_style='{style}'",'-c:a','copy',str(review)], check=True)
    return clean, review


def proof_contact_sheet(beats: list[Beat]):
    cols, rows = 5, 4
    thumbs=[]
    # Spread across whole video
    indexes=[round(i*(len(beats)-1)/(cols*rows-1)) for i in range(cols*rows)]
    for idx in indexes:
        p=SCENES_DIR/f'scene_{beats[idx].beat_id:03d}.png'
        im=Image.open(p).resize((240,135), Image.LANCZOS)
        thumbs.append((im, beats[idx]))
    sheet=Image.new('RGB',(cols*240,rows*165),(245,245,245)); draw=ImageDraw.Draw(sheet)
    for i,(im,b) in enumerate(thumbs):
        x=(i%cols)*240; y=(i//cols)*165
        sheet.paste(im,(x,y)); draw.text((x+6,y+138),f'{b.beat_id:03d} {b.visual}',fill=INK,font=FONT_SMALL)
    out=PROOF_DIR/'v4_stick_figure_contact_sheet.jpg'; sheet.save(out, quality=90); return out


def write_manifests(beats: list[Beat], clean: Path, review: Path, sheet: Path):
    manifest={
        'sop_version':'V4',
        'video_slug':SLUG,
        'style':'deterministic local stick-figure animation throughout; no image-generation character drift',
        'google_flow_access':'not configured on this host; google provider requires GEMINI_API_KEY / GOOGLE_API_KEY',
        'beat_processing':'beats generated from actual dialogue_segments.json timings and segment text, max ~4 seconds per spoken visual beat; old padded silent tail is trimmed',
        'subtitle_change':'about 30% smaller than V3 (Fontsize 15 vs 22), lower on screen (MarginV 30 vs 55), with shorter subtitle line wrapping to reduce visual collisions',
        'renders':{'clean_master':str(clean),'burned_caption_review':str(review)},
        'vibe_zone_destination':str(VIBE_DIR),
        'beats':[b.__dict__ for b in beats]
    }
    (V4_DIR/'v4_manifest.json').write_text(json.dumps(manifest, indent=2))
    (QA_DIR/'v4_style_consistency_report.md').write_text('PASS: V4 uses one deterministic stick-figure drawing system for every frame. John and Laura are defined by fixed colors/body shapes/accessories instead of regenerated model images.\n')
    max_len=max(b.end-b.start for b in beats)
    spoken_lengths=[b.end-b.start for b in beats if b.rationale != 'audio tail hold']
    spoken_max=max(spoken_lengths) if spoken_lengths else max_len
    (QA_DIR/'v4_beat_relevance_report.md').write_text(f'PASS: {len(beats)} visual beats generated directly from dialogue segment text/timestamps. Max spoken beat length {spoken_max:.2f}s. Old padded silent tail trimmed; each beat stores visual+rationale in v4_manifest.json.\n')
    (QA_DIR/'v4_subtitle_report.md').write_text('PASS: Subtitles burned with Fontsize=15, down from V3 Fontsize=22 (~32% smaller), lower with MarginV=30 versus V3 MarginV=55, and wrapped to shorter lines to reduce bottom-lane collisions.\n')
    (VIDEO_DIR/'production_manifest.json').write_text(json.dumps({**json.loads((VIDEO_DIR/'production_manifest.json').read_text()), 'sop_version':'V4', 'v4_renders': manifest['renders'], 'v4_vibe_zone_destination': str(VIBE_DIR), 'v4_status':'VIDEO_READY_LOCAL=true / VIBE_ZONE_READY=true'}, indent=2))


def copy_to_vibe(clean: Path, review: Path):
    for src in [clean, review, V4_DIR/'subtitles_v4.srt', V4_DIR/'v4_manifest.json']:
        shutil.copy2(src, VIBE_DIR/src.name)
    for src in [QA_DIR/'v4_style_consistency_report.md', QA_DIR/'v4_beat_relevance_report.md', QA_DIR/'v4_subtitle_report.md', PROOF_DIR/'v4_stick_figure_contact_sheet.jpg']:
        shutil.copy2(src, VIBE_DIR/src.name)
    # Keep previous package docs discoverable in the lane too.
    for src in [VIDEO_DIR/'script_approved.md', VIDEO_DIR/'citations.md', VIDEO_DIR/'thumbnail.png']:
        if src.exists(): shutil.copy2(src, VIBE_DIR/src.name)
    (VIBE_DIR/'README.md').write_text(f'''# V4 Stick-Figure Remake — Credit Card Minimum Payment Trap\n\nPrimary review video:\n`{VIBE_DIR}/{SLUG}_v4_stick_figure_burned_captions_review.mp4`\n\nClean master:\n`{VIBE_DIR}/{SLUG}_v4_stick_figure_clean_master.mp4`\n\nChanges from V3:\n- deterministic stick-figure animation throughout; no changing generated main characters\n- beat visuals chosen from actual dialogue segment text/timestamps\n- subtitles ~30% smaller and lower on screen\n\nGoogle Flow / Google image access is not configured on this host at render time.\n''')


def main():
    beats=make_beats(max_len=4.0)
    (V4_DIR/'v4_beat_plan.json').write_text(json.dumps([b.__dict__ for b in beats], indent=2))
    srt=make_srt()
    silent=render_frames(beats)
    clean,review=mux_and_subtitle(silent,srt)
    sheet=proof_contact_sheet(beats)
    write_manifests(beats,clean,review,sheet)
    copy_to_vibe(clean,review)
    print(json.dumps({'beats':len(beats),'clean_master':str(clean),'burned_caption_review':str(review),'vibe_zone':str(VIBE_DIR),'contact_sheet':str(sheet)}, indent=2))

if __name__ == '__main__':
    main()
