#!/usr/bin/env python3
from __future__ import annotations
import json, math, random, re
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

VIDEO_DIR=Path('/root/.openclaw/workspace/youtube-automation-finance/videos/car-payment-trap')
SCENES_DIR=VIDEO_DIR/'scenes'
W,H=1920,1080

def blob(draw, xy, fill, outline=None, width=4):
    draw.rounded_rectangle(xy, radius=34, fill=fill, outline=outline, width=width)

def character(draw, x, y, who='john', scale=1.0, mood='calm'):
    # Simple editorial cartoon person, no text.
    skin=(225,178,142) if who=='john' else (198,139,105)
    hair=(104,96,88) if who=='john' else (55,42,35)
    shirt=(70,130,142) if who=='john' else (216,111,102)
    line=(64,57,55)
    r=int(58*scale)
    draw.ellipse((x-r,y-r,x+r,y+r), fill=skin, outline=line, width=max(3,int(5*scale)))
    if who=='john':
        draw.arc((x-r,y-r-12,x+r,y+r*.6), 190, 350, fill=hair, width=int(14*scale))
        draw.arc((x-r*.8,y-r*.1,x+r*.8,y+r*.65), 10, 170, fill=(235,235,225), width=int(5*scale))
    else:
        draw.pieslice((x-r*1.15,y-r*1.3,x+r*1.15,y+r*.55), 185, 355, fill=hair, outline=line)
        draw.arc((x-r*.7,y-r*.15,x+r*.7,y+r*.5), 20, 160, fill=(235,235,225), width=int(4*scale))
    # eyes/brows
    er=int(6*scale)
    draw.ellipse((x-r*.36-er,y-r*.08-er,x-r*.36+er,y-r*.08+er), fill=line)
    draw.ellipse((x+r*.36-er,y-r*.08-er,x+r*.36+er,y-r*.08+er), fill=line)
    if mood in ('stressed','warning','concerned'):
        draw.line((x-r*.55,y-r*.3,x-r*.18,y-r*.22), fill=line, width=int(4*scale))
        draw.line((x+r*.18,y-r*.22,x+r*.55,y-r*.3), fill=line, width=int(4*scale))
    else:
        draw.arc((x-r*.55,y-r*.35,x-r*.18,y-r*.15), 200, 340, fill=line, width=int(3*scale))
        draw.arc((x+r*.18,y-r*.35,x+r*.55,y-r*.15), 200, 340, fill=line, width=int(3*scale))
    draw.arc((x-r*.32,y+r*.05,x+r*.32,y+r*.45), 10 if mood!='stressed' else 190, 170 if mood!='stressed' else 350, fill=line, width=int(4*scale))
    body=(x-int(90*scale), y+r-int(3*scale), x+int(90*scale), y+r+int(205*scale))
    draw.rounded_rectangle(body, radius=int(34*scale), fill=shirt, outline=line, width=max(3,int(5*scale)))
    draw.line((body[0]+18,y+r+64, body[0]-int(70*scale), y+r+130), fill=line, width=int(13*scale))
    draw.line((body[2]-18,y+r+64, body[2]+int(70*scale), y+r+130), fill=line, width=int(13*scale))

def draw_car(draw, cx, cy, s, color, line):
    draw.rounded_rectangle((cx-260*s,cy-56*s,cx+260*s,cy+72*s), radius=int(40*s), fill=color, outline=line, width=int(7*s))
    draw.polygon([(cx-160*s,cy-56*s),(cx-70*s,cy-150*s),(cx+105*s,cy-150*s),(cx+190*s,cy-56*s)], fill=(190,218,218), outline=line)
    draw.ellipse((cx-205*s,cy+35*s,cx-105*s,cy+135*s), fill=(52,52,55), outline=line, width=int(6*s))
    draw.ellipse((cx+105*s,cy+35*s,cx+205*s,cy+135*s), fill=(52,52,55), outline=line, width=int(6*s))
    draw.ellipse((cx-176*s,cy+64*s,cx-134*s,cy+106*s), fill=(230,230,220))
    draw.ellipse((cx+134*s,cy+64*s,cx+176*s,cy+106*s), fill=(230,230,220))

def draw_scene(path, beat):
    i=beat['beat_id']; rnd=random.Random(i*9173)
    bg=(248,241,228); teal=(69,137,148); coral=(219,117,102); gold=(231,183,92); ink=(66,58,55); muted=(126,157,152)
    # scene-specific palette shifts
    accent=[teal, coral, gold, (117,151,194), (145,122,166), (98,160,126)][i%6]
    im=Image.new('RGB',(W,H),bg); d=ImageDraw.Draw(im)
    # background subtle waves and shapes
    for k in range(16):
        col=tuple(max(0,min(255,c+rnd.randint(-12,12))) for c in [(235,228,214),(241,232,222),(232,239,235)][k%3])
        x=rnd.randint(-200,W); y=rnd.randint(-100,H); r=rnd.randint(80,260)
        d.ellipse((x-r,y-r,x+r,y+r), fill=col)
    for k in range(7):
        x0=-100+k*330+(i%5)*12
        d.arc((x0,80+k*12,x0+520,540+k*18),200,340, fill=(226,219,207), width=5)
    # floor / desk planes
    d.polygon([(0,770),(W,670),(W,H),(0,H)], fill=(232,222,207))
    action=(beat.get('visual_action') or '').lower(); setting=(beat.get('setting') or '').lower(); chars=(beat.get('characters') or '')
    mood='calm'
    if any(w in (beat.get('emotion','')+action).lower() for w in ['stressed','warning','concern','pressure','risk','negative']): mood='stressed'
    # core metaphor object
    if 'dealership' in setting or 'monthly' in action:
        blob(d,(720,415,1260,760),(255,250,240),ink,6)
        for yy in [485,555,625]: d.rounded_rectangle((785,yy,1195,yy+34),12,fill=(203,215,211),outline=None)
        d.rectangle((830,300,1090,418), fill=(210,226,226), outline=ink, width=6)
        draw_car(d,960,365,0.45,accent,ink)
    elif 'paperwork' in setting or 'loan' in action or 'equity' in action:
        for k in range(5):
            x=640+k*115; y=260+k*38
            d.rounded_rectangle((x,y,x+360,y+500),28,fill=(255,252,244),outline=ink,width=5)
            for n in range(5): d.line((x+55,y+90+n*64,x+300,y+90+n*64),fill=(198,206,200),width=8)
        draw_car(d,970,765,0.58,accent,ink)
    elif 'parking' in setting or 'car cost' in action:
        draw_car(d,990,610,1.0,accent,ink)
        for x in [170,420,1500,1700]: d.line((x,760,x+130,690),fill=(202,195,184),width=8)
        d.ellipse((650,210,1270,510),fill=(247,236,215),outline=ink,width=5)
        for a in range(0,360,45):
            cx=960+math.cos(math.radians(a))*230; cy=360+math.sin(math.radians(a))*95
            d.rounded_rectangle((cx-45,cy-30,cx+45,cy+30),18,fill=(255,252,244),outline=ink,width=4)
    elif 'budget' in setting or 'orbit' in action or 'insurance' in action:
        d.ellipse((690,250,1230,790),fill=(250,246,236),outline=ink,width=8)
        d.ellipse((815,375,1105,665),fill=(230,236,232),outline=teal,width=8)
        for a in range(0,360,60):
            cx=960+math.cos(math.radians(a+i))*430; cy=520+math.sin(math.radians(a+i))*250
            d.rounded_rectangle((cx-70,cy-48,cx+70,cy+48),28,fill=[coral,gold,teal,muted][a//60%4],outline=ink,width=5)
        draw_car(d,960,520,0.42,accent,ink)
    elif 'checklist' in action or 'walk-away' in action or 'studio' in setting:
        blob(d,(660,235,1260,760),(255,251,243),ink,6)
        for k in range(5):
            y=320+k*78
            d.ellipse((735,y,775,y+40),fill=(198,226,214),outline=ink,width=4)
            d.line((742,y+19,756,y+32),fill=teal,width=6)
            d.line((756,y+32,773,y+7),fill=teal,width=6)
            d.rounded_rectangle((815,y+8,1180,y+30),12,fill=(210,217,211))
    elif 'kitchen' in setting or 'laptop' in setting or 'paycheck' in action:
        blob(d,(620,580,1300,760),(215,173,122),ink,5)
        d.rounded_rectangle((790,400,1130,610),18,fill=(207,222,224),outline=ink,width=6)
        d.rectangle((835,440,1085,565),fill=(235,243,240))
        for k in range(6):
            d.rounded_rectangle((260+k*125,220+(k%2)*30,340+k*125,320+(k%2)*30),20,fill=[coral,gold,teal][k%3],outline=ink,width=4)
            d.line((300+k*125,320+(k%2)*30,360+k*125,430+(k%2)*30),fill=ink,width=4)
    else:
        d.rectangle((120,220,860,760),fill=(230,238,235),outline=ink,width=6)
        d.rectangle((1060,220,1800,760),fill=(248,232,222),outline=ink,width=6)
        d.ellipse((830,390,1090,650),fill=(255,250,240),outline=ink,width=6)
        for a in range(0,360,72):
            cx=960+math.cos(math.radians(a))*95; cy=520+math.sin(math.radians(a))*95
            d.line((960,520,cx,cy),fill=ink,width=4)
    # characters layered in foreground
    if 'John and Laura' in chars:
        character(d,430,600,'john',1.05,mood); character(d,1490,600,'laura',1.0,mood)
    elif 'Laura' in chars:
        character(d,430,590,'laura',1.1,mood)
    elif 'John' in chars:
        character(d,420,590,'john',1.1,mood)
    # add camera-frame accents (non-text)
    for k in range(5):
        x=1350+rnd.randint(-80,250); y=170+k*95+rnd.randint(-18,18)
        d.rounded_rectangle((x,y,x+230-rnd.randint(0,90),y+34),15,fill=(214,207,196),outline=None)
    # vignette and crisp frame
    overlay=Image.new('RGBA',(W,H),(0,0,0,0)); od=ImageDraw.Draw(overlay)
    od.rectangle((28,28,W-28,H-28),outline=(255,255,255,120),width=10)
    im=Image.alpha_composite(im.convert('RGBA'),overlay).convert('RGB')
    im.save(path, 'PNG', optimize=True)

manifest=json.loads((VIDEO_DIR/'image_beat_manifest.json').read_text())['beats']
made=[]; skipped=[]
for b in manifest:
    p=Path(b['expected_image_path'])
    if p.exists() and p.stat().st_size>1024:
        skipped.append(p.name); continue
    draw_scene(p,b); made.append(p.name)
print(json.dumps({'made':len(made),'skipped':len(skipped),'first_made':made[:5],'last_made':made[-5:]}, indent=2))
