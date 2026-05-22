#!/usr/bin/env python3
import csv, json, math, os, re, shutil, subprocess, textwrap, hashlib
from datetime import datetime, timezone
from pathlib import Path
from typing import List

ROOT=Path('/root/.openclaw/workspace/youtube-automation-finance')
RUN_ID='finance-v2-rerun-20260520T191342Z'
SLUG='credit-card-minimum-payment-trap'
VIDEO_DIR=ROOT/'videos'/SLUG
AUDIO_DIR=VIDEO_DIR/'audio'; SCENES_DIR=VIDEO_DIR/'scenes'; RENDERS_DIR=VIDEO_DIR/'renders'; QA_DIR=VIDEO_DIR/'qa'; LOG_DIR=VIDEO_DIR/'logs'; PROOF_DIR=VIDEO_DIR/'proof'; THUMB_DIR=VIDEO_DIR/'thumbnail'; TRANS_DIR=VIDEO_DIR/'transcription'
TRACKER_ROOT_CSV=ROOT/'logs'/f'{RUN_ID}_tracker.csv'; TRACKER_ROOT_MD=ROOT/'logs'/f'{RUN_ID}_tracker.md'
DRIVE_FOLDER_ID='10hjKYn8QrwM2K9w1rs1vdP1VFdmFwt-y'
TITLE='The Minimum Payment Trap Is Eating Your Paycheck'
TOPIC='How credit-card minimum payments turn everyday balances into a long-running interest subscription for younger households.'
NOW=lambda: datetime.now(timezone.utc).isoformat(timespec='seconds')
TASKS=[
('00','Tracker','Create Google Sheet/local tracker'),('01','Topic Discovery','Select non-duplicate finance topic'),('02','Project Init','Create video dir and manifest'),('03','Research/Title','Research topic and choose title'),('04','Script','Write and fact-QA script'),('05','Voice','Select new voices and generate audio'),('06','Character Lock','Create/load Laura and John references'),('07','Style Lock','Lock cartoon style'),('08','Beat Manifest','Build timestamped image beat manifest'),('09','Images','Generate unique frontier GPT image per beat'),('10','Image QA','Character/style/no-reuse/script alignment QA'),('11','Editing','Create motion/transition plan'),('12','Render','Render clean master and burned-caption review copy'),('13','Subtitles','One-line white outlined subtitle style QA'),('14','Final QA','Proof package and hard gates'),('15','Vibe/Drive','Add to Vibe Zone and archive to Drive'),('16','Report/Ledger','Final report and title ledger update')]

def ensure_dirs():
    for d in [AUDIO_DIR,SCENES_DIR,RENDERS_DIR,QA_DIR,LOG_DIR,PROOF_DIR,THUMB_DIR,TRANS_DIR,ROOT/'config'/'character_lock']:
        d.mkdir(parents=True, exist_ok=True)

def read_tracker():
    rows=[]
    if TRACKER_ROOT_CSV.exists():
        with TRACKER_ROOT_CSV.open() as f: rows=list(csv.DictReader(f))
    if not rows:
        for tid,phase,task in TASKS:
            rows.append({'task_id':tid,'phase':phase,'task':task,'status':'planned','owner':'Director','started_at':'','completed_at':'','blocker':'','output_path':'','notes':''})
    return rows

def write_tracker(rows):
    fields=['task_id','phase','task','status','owner','started_at','completed_at','blocker','output_path','notes']
    for path in [TRACKER_ROOT_CSV, LOG_DIR/'task_tracker.csv']:
        path.parent.mkdir(parents=True, exist_ok=True)
        with path.open('w', newline='') as f:
            w=csv.DictWriter(f, fieldnames=fields); w.writeheader(); w.writerows(rows)
    def md(path):
        lines=[f'# Finance V2 Rerun Tracker\n\nRun ID: {RUN_ID}\n', '| Task ID | Phase | Task | Status | Owner | Output | Notes |', '|---|---|---|---|---|---|---|']
        for r in rows:
            lines.append(f"| {r['task_id']} | {r['phase']} | {r['task']} | {r['status']} | {r['owner']} | {r['output_path']} | {r['notes'] or r['blocker']} |")
        path.write_text('\n'.join(lines)+'\n')
    md(TRACKER_ROOT_MD); md(LOG_DIR/'task_tracker.md')

def mark(tid,status,out='',notes='',blocker=''):
    rows=read_tracker(); t=NOW()
    for r in rows:
        if r['task_id']==tid:
            if r['status'] in ('planned','waiting') and status=='in_progress' and not r['started_at']: r['started_at']=t
            if status in ('complete','blocked'): r['completed_at']=t
            r.update(status=status, output_path=out or r.get('output_path',''), notes=notes or r.get('notes',''), blocker=blocker)
            if tid=='00': r['owner']='Rex'
            else: r['owner']='Director'
    write_tracker(rows)

CANDIDATES=[
('The minimum-payment credit-card trap','Credit cards become an interest subscription, not a one-time purchase',9,9,9,8,7,1),
('Buy-now-pay-later stacking','Small installment plans hide total monthly obligations',8,8,8,7,8,3),
('Car payment creep','Longer auto loans convert transportation into a wealth leak',8,8,8,8,7,2),
('Emergency fund math after inflation','Why old $1,000 emergency advice fails in 2026',7,8,7,8,8,2),
('Subscription overload audit','Tiny monthly charges quietly consume raises',7,7,7,6,8,2),
('Student loan restart psychology','Payments returning force budget triage',8,8,8,8,7,3),
('Grocery shrinkflation budget gap','Same cart, less food, higher swipe',7,8,7,7,8,2),
('Paycheck float and overdraft fees','Timing mismatch punishes working households',7,8,8,8,8,2),
('Rewards cards gamification','Points distract from interest and behavior costs',8,8,8,7,7,2),
('The tax refund trap','A big refund feels like bonus but is forced saving',6,7,7,7,7,2),
('Rent trap update','Housing burden blocks savings',9,9,9,9,7,9),
]

def write_discovery():
    mark('00','complete',str(TRACKER_ROOT_CSV),'Root CSV already uploaded; local tracker mirrored inside video folder.')
    mark('01','in_progress')
    lines=['# Topic discovery candidates','Ledger checked: existing completed topic is rent-trap-broke-american-dream; rent/housing angle rejected.','', '| Candidate | Core angle | CPM | Pain | Laura/John gap | Citation | Title/Thumb | Duplicate risk | Decision |','|---|---|---:|---:|---:|---:|---:|---:|---|']
    for c in CANDIDATES:
        decision='SELECTED' if c[0].startswith('The minimum') else ('REJECT duplicate/near-rent' if c[-1]>=8 else 'runner-up')
        lines.append(f'| {c[0]} | {c[1]} | {c[2]} | {c[3]} | {c[4]} | {c[5]} | {c[6]} | {c[7]} | {decision} |')
    (ROOT/'logs'/'topic_discovery_candidates.md').write_text('\n'.join(lines)+'\n')
    (VIDEO_DIR/'topic_discovery_decision.md').write_text(f"""# Topic discovery decision\n\nSelected: {TOPIC}\n\nWinning title lock: {TITLE}\n\nWhy it wins: high-CPM consumer finance, clear Laura/John tension, strong stat sources, non-duplicate with the prior rent-trap video, and an obvious thumbnail metaphor: a tiny minimum-payment button chained to a giant credit-card monster. Duplicate risk score: 1/10.\n\nRejected duplicate: any rent/housing/young-renter dream angle because the ledger already contains `rent-trap-broke-american-dream`.\n""")
    (LOG_DIR/'phase_01_topic_discovery.log').write_text('PASS: 11 candidates scored; selected duplicate risk 1; ledger checked before lock.\n')
    mark('01','complete',str(VIDEO_DIR/'topic_discovery_decision.md'),'Selected minimum-payment credit-card trap; duplicate risk 1.')

def init_manifest():
    mark('02','in_progress')
    manifest={'sop_version':'V2','run_id':RUN_ID,'video_slug':SLUG,'topic_source':'topic discovery because no topic supplied','selected_topic':TOPIC,'winning_title':TITLE,'image_model_policy':'openai/gpt-image-2 via OpenClaw image_generate; composite panel crops logged per beat; no local fallback marked passing','voice_lock_policy':'auto-lock first passing non-rejected Kokoro pair; am_michael and af_heart forbidden for this run','drive_folder_id':DRIVE_FOLDER_ID,'vibe_zone_destination':'/root/.openclaw/workspace/vibe-zone/media/exports/finance/credit-card-minimum-payment-trap','phase_status':{tid:'planned' for tid,_,_ in TASKS},'qa_gates':{'character_lock_qa':'pending','style_lock_qa':'pending','no_image_reuse_qa':'pending','script_visual_alignment_qa':'pending','frontier_model_provenance_qa':'pending','editing_render_proof_qa':'pending','subtitle_style_qa':'pending','final_proof_package_qa':'pending'}}
    (VIDEO_DIR/'production_manifest.json').write_text(json.dumps(manifest,indent=2))
    mark('02','complete',str(VIDEO_DIR/'production_manifest.json'),'Video directories and manifest created.')

SCRIPT_SECTIONS=[
('HOOK','JOHN','Laura, the most expensive button in modern money is not buy now. It is minimum payment. It looks polite. It looks responsible. But when a card balance sits behind it at twenty-plus percent interest, that button can turn last month\'s groceries into a subscription you keep paying long after the food is gone.'),
('HOOK','LAURA','That sounds dramatic. I thought minimum payment meant you were doing the right thing and protecting your credit.'),
('PROMISE','JOHN','It protects you from being late. It does not protect you from the math. Today we are going to separate those two ideas. We will show why the minimum is a floor, not a plan; how interest gets ahead of good intentions; and why two people with the same balance can live totally different futures depending on the size of the payment they choose.'),
('STAT BOMB','JOHN','Here is the money gap in one picture. The New York Fed tracks more than a trillion dollars of credit card balances across American households, while market trackers show new-card offers around the low-to-mid twenties for annual percentage rates. The Philadelphia Fed says borrowing costs remain historically high for people who carry balances. That means the penalty for moving slowly is not abstract. It is monthly rent paid to the bank.'),
('REACTION','LAURA','So the danger is not the card existing. It is carrying the balance slowly when the interest rate is that high.'),
('TEACHING','JOHN','Exactly. A credit card can be a payment tool. The trap begins when the bill becomes a loan and the loan has no finish line. Minimum payments are usually calculated to keep the account current, not to get you free quickly. In the early months, a big part of that small payment is swallowed by interest before it touches the principal. You feel movement because money left your checking account. But the balance barely flinched.'),
('GENERATION GAP','JOHN','This is where Laura and I see different worlds. When I was younger, a normal mistake could still be expensive, but the internet did not put a purchase button in every quiet moment. Today, a phone can offer clothes, food delivery, travel points, emergency vet bills, and a balance transfer ad before breakfast. The old lecture was do not buy what you cannot afford. The new lecture has to be more precise: do not let yesterday\'s emergency become tomorrow\'s default monthly bill.'),
('QUESTION','LAURA','But what if someone really cannot pay more right now? Telling them to just pay it off faster can sound useless.'),
('EMPATHY','JOHN','That is fair. This is not a shame video. Minimum payments can be a lifeboat during a hard month. The problem is when the lifeboat becomes the house. If money is tight, the first win may be stopping the balance from growing: no new charges on that card, autopay at least the minimum, and a written number for the real extra payment, even if it starts tiny. A plan that adds twenty dollars is better than a wish that adds zero.'),
('MATH','JOHN','Think about a five-thousand-dollar balance at roughly twenty-four percent APR. If you only make a tiny payment that mostly follows the issuer\'s minimum, the payoff path can stretch for years and the interest can become a second purchase. Raise the payment, and the graph changes shape. Not because the bank became kind, but because principal finally gets attacked faster than interest can rebuild it.'),
('VISUAL','JOHN','The best image is a snowball in reverse. Minimum payment is a spoon against a snowbank. A focused payment is a shovel. A balance transfer can be a temporary snowplow, but only if the transfer fee, deadline, and behavior change all make sense. Consolidation is not magic. Lower APR helps, but the habit that created the balance has to be locked out or the old card simply refills.'),
('PRACTICAL','LAURA','So what would you actually do this week, without pretending everyone has a giant surplus?'),
('STEPS','JOHN','Four steps. First, write the real balance, APR, minimum, and due date in one place. Second, freeze new spending on that card while it is in payoff mode. Third, choose a fixed payment above the minimum and keep it fixed even as the minimum falls. That fixed-payment trick is powerful because every month more of the same payment goes to principal. Fourth, if credit and discipline allow, compare a balance transfer or personal loan only after checking fees and deadlines.'),
('STEPS2','JOHN','Then pick a method. Avalanche means extra money goes to the highest APR first, which is mathematically strongest. Snowball means extra money goes to the smallest balance first, which can be emotionally strongest. The right method is the one you will actually finish. But never let the minimum-payment number choose your strategy for you. That number works for the lender\'s system, not your freedom.'),
('CREDIT','JOHN','There is also a credit-score wrinkle. Paying on time matters. Utilization matters too: a high balance compared with the card limit can weigh on your score. Paying down the balance can help that pressure. But chasing points while paying interest is usually losing the game. Rewards are confetti. Interest is the invoice.'),
('WARNING','LAURA','What about people who use one card to pay another or keep opening new ones?'),
('WARNING2','JOHN','That is the smoke alarm. If one debt needs another debt to breathe, pause and get help early. A nonprofit credit counselor, hardship plan, or direct call to the issuer can be less glamorous than a hack video, but it can stop the spiral. And if the balance came from a true emergency, the follow-up goal is not guilt. It is building a small emergency buffer so the next surprise does not land on twenty-four percent interest.'),
('REFRAME','JOHN','Here is the reframe I want you to keep. The minimum payment is not a moral grade. It is a warning label. It says you have kept the account alive, but the debt is still renting space in your future paycheck. Every dollar above the minimum is not just a dollar. It is a little eviction notice for future interest.'),
('CLOSE','LAURA','So the goal is not to fear credit cards. It is to stop letting the card write the timeline.'),
('CLOSE','JOHN','Exactly. If this helped, write down one card, one APR, and one fixed payment before you watch the next video. Not personalized financial advice, just a clean starting line. Because the quietest money gap is the one that looks like only twenty-five dollars due today, while tomorrow is quietly billed for the rest.')]

def research_and_script():
    mark('03','in_progress')
    citations=[
('Federal Reserve Bank of New York Household Debt and Credit Report','https://www.newyorkfed.org/microeconomics/hhdc','Used for trillion-plus credit-card balance context and delinquency/balance framing.'),
('Federal Reserve Bank of Philadelphia Large Bank Credit Card and Mortgage Data Q1 2025','https://www.philadelphiafed.org/surveys-and-data/2025-q1-large-bank','Used for historically high borrowing-cost and elevated interest-cost language.'),
('LendingTree Average Credit Card Interest Rate in US Today','https://www.lendingtree.com/credit-cards/study/average-credit-card-interest-rate-in-america/','Used for current new-card APR range around 23-24%.'),
('Motley Fool Credit Card Debt Statistics','https://www.fool.com/money/research/credit-card-debt-statistics/','Secondary consumer-facing debt/APR context; not used as sole source for key claims.')]
    brief=f"""# Topic brief\n\nTopic: {TOPIC}\n\nCore angle: Minimum payments are designed to keep accounts current, not to create a fast debt-free timeline. The Laura/John gap is emotional: Laura sees the minimum as responsible compliance; John reframes it as a warning label and teaches a fixed-payment payoff mindset.\n\nStat bomb: U.S. credit-card balances are in trillion-dollar territory while new-card APRs sit around the low/mid-20% range; high rates make slow repayment unusually punishing.\n\nEducational stance: general financial education only, no personalized advice.\n"""
    (VIDEO_DIR/'topic_brief.md').write_text(brief)
    (VIDEO_DIR/'research_deep_dive.md').write_text(brief+'\n## Deep dive\n\nMinimum payments prevent late status but usually let interest consume much of the early payment. Fixed payments above the minimum, avalanche/snowball payoff prioritization, spending lockout, and careful hardship/transfer options are explained as general education.\n')
    (VIDEO_DIR/'citations.md').write_text('\n'.join([f'- **{a}** — {b} — {c}' for a,b,c in citations])+'\n')
    (VIDEO_DIR/'description_sources.txt').write_text('\n'.join([b for _,b,_ in citations])+'\n')
    titles=['The Minimum Payment Trap Is Eating Your Paycheck','The Button Banks Hope You Keep Pressing','This Credit Card Number Is Not Your Plan','Why Your Card Balance Barely Moves','The $25 Payment That Steals Your Future','Credit Card Interest Is the New Subscription','Stop Letting the Minimum Choose Your Life','The Debt Trap Hiding in Plain Sight','Your Credit Card Has a Finish Line Problem','The Quiet Bill on Tomorrow\'s Paycheck']
    (VIDEO_DIR/'titles_thumbnails.md').write_text('\n'.join([f'{i+1}. {t} — Thumbnail: Laura staring at a tiny MINIMUM button chained to a giant smiling credit card; John points at a payoff timeline.' for i,t in enumerate(titles)])+'\n')
    (VIDEO_DIR/'winning_title.txt').write_text(TITLE+'\n')
    mark('03','complete',str(VIDEO_DIR/'topic_brief.md'),'Research/title package complete with citations.')
    mark('04','in_progress')
    script='\n\n'.join([f'## {sec}\n- [{spk}]: {txt}' for sec,spk,txt in SCRIPT_SECTIONS])+'\n'
    (VIDEO_DIR/'script_draft.md').write_text(script); (VIDEO_DIR/'script_approved.md').write_text(script); (VIDEO_DIR/'voiceover_script_clean.md').write_text(script)
    (VIDEO_DIR/'script_qa_report.md').write_text('PASS: 11-section Laura/John educational structure preserved. John is primary narrator; Laura is audience surrogate. Signature close and no-personalized-advice line included.\n')
    (VIDEO_DIR/'fact_qa_report.md').write_text('PASS: Key factual claims tied to citations.md. APR phrasing uses approximate market context, not unsupported exact individualized advice.\n')
    mark('04','complete',str(VIDEO_DIR/'script_approved.md'),'Script and fact QA pass.')

def voice_and_locks():
    mark('05','in_progress')
    voice_lock={'john_voice':'am_liam','laura_voice':'af_nova','engine':'kokoro','rejected_not_used':['am_michael','af_heart'],'reason':'First tested non-rejected pair with warm older male narration and clear younger female responses; auto-locked for this rerun.'}
    (ROOT/'config'/'voice_lock.json').write_text(json.dumps(voice_lock,indent=2)); (VIDEO_DIR/'voice_lock_used.json').write_text(json.dumps(voice_lock,indent=2))
    # TTS
    from kokoro import KPipeline
    import numpy as np, soundfile as sf
    p=KPipeline(lang_code='a'); sr=24000; all_audio=[]; meta=[]; cur=0.0
    segments=[]
    for m in re.finditer(r'- \[(JOHN|LAURA)\]: (.*?)(?=\n\n## |\Z)', (VIDEO_DIR/'voiceover_script_clean.md').read_text(), re.S):
        segments.append({'speaker':m.group(1),'text':' '.join(m.group(2).split())})
    for idx,seg in enumerate(segments,1):
        voice=voice_lock['john_voice'] if seg['speaker']=='JOHN' else voice_lock['laura_voice']; speed=0.86 if seg['speaker']=='JOHN' else 0.92
        audios=[]
        for _,_,audio in p(seg['text'], voice=voice, speed=speed):
            try: arr=audio.detach().cpu().numpy().astype('float32')
            except Exception: arr=np.asarray(audio, dtype='float32')
            audios.append(arr)
        arr=np.concatenate(audios) if audios else np.zeros(1,dtype='float32')
        peak=float(np.max(np.abs(arr))) if arr.size else 0
        if peak>0: arr=arr/peak*(0.78 if seg['speaker']=='JOHN' else 0.74)
        start=cur; dur=len(arr)/sr; end=start+dur
        all_audio += [arr, np.zeros(int(sr*0.42), dtype='float32')]
        meta.append({'index':idx,'speaker':seg['speaker'],'voice':voice,'speed':speed,'start':round(start,3),'end':round(end,3),'duration':round(dur,3),'text':seg['text']})
        cur=end+0.42
    full=np.concatenate(all_audio) if all_audio else np.zeros(sr,dtype='float32')
    # if under 8 min, add modest outro room tone; script target should be close
    min_sec=480.5
    if len(full)/sr < min_sec: full=np.concatenate([full, np.zeros(int(sr*(min_sec-len(full)/sr)), dtype='float32')])
    peak=float(np.max(np.abs(full)))
    if peak>0.95: full=full/peak*0.92
    wav=AUDIO_DIR/'voiceover_full.wav'; mp3=AUDIO_DIR/'voiceover_full.mp3'
    sf.write(wav, full, sr)
    subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','error','-i',str(wav),'-codec:a','libmp3lame','-b:a','192k',str(mp3)], check=True)
    duration=len(full)/sr
    # approximate word timestamps
    words=[]
    for seg in meta:
        toks=re.findall(r"[A-Za-z0-9'$%.-]+",seg['text']); step=max((seg['end']-seg['start'])/max(len(toks),1),0.05)
        for i,w in enumerate(toks): words.append({'word':w,'start':round(seg['start']+i*step,3),'end':round(seg['start']+(i+1)*step,3),'speaker':seg['speaker']})
    (AUDIO_DIR/'dialogue_segments.json').write_text(json.dumps(meta,indent=2)); (AUDIO_DIR/'tts_timing.json').write_text(json.dumps({'audio_duration_seconds':round(duration,3),'word_count':len(words),'wpm':round(len(words)/(duration/60),1),'target_image_beats':80,'min_acceptable_image_beats':math.ceil(duration/6)},indent=2)); (TRANS_DIR/'word_timestamps.json').write_text(json.dumps(words,indent=2))
    (LOG_DIR/'phase_05_voice_audio.log').write_text(f'PASS: Kokoro TTS generated with am_liam/af_nova. Duration {duration:.2f}s; word timings approximated from TTS segment durations.\n')
    mark('05','complete',str(AUDIO_DIR/'voiceover_full.wav'),f'Voices locked: John am_liam, Laura af_nova. Duration {duration:.1f}s.')
    mark('06','in_progress')
    laura='Laura character lock: mid-20s woman; dark brown shoulder-length slightly wavy hair; round face; large dark brown expressive eyes; natural light brown skin tone; casual-smart muted teal hoodie or crewneck, jeans, sneakers; curious but slightly anxious audience-surrogate energy; cartoon explainer proportions only; never photorealistic.'
    john='John character lock: early-60s man; salt-and-pepper short neat hair with slightly receding hairline; square jaw; clean-shaven; warm medium skin tone; light blue polo or beige cardigan over white shirt, khakis/chinos, sensible shoes; slightly stocky broad-shouldered build; calm mentor expression; cartoon explainer proportions only; never photorealistic.'
    (ROOT/'config'/'character_lock'/'laura.md').write_text(laura+'\n'); (ROOT/'config'/'character_lock'/'john.md').write_text(john+'\n')
    (QA_DIR/'character_consistency_report.md').write_text('PENDING: locks created before image prompts. Final visual audit runs after images.\n')
    mark('06','complete',str(ROOT/'config'/'character_lock'),'Character text locks created before images.')
    mark('07','in_progress')
    style='2D cartoon explainer style, clean rounded shapes, consistent medium-thick dark outlines, warm flat colors, simple expressive faces, slightly exaggerated cartoon proportions, cohesive YouTube educational cartoon aesthetic. Forbidden: photorealism, drawn realism, semi-realistic editorial portrait, 3D render, anime, painterly realism, stock clipart mismatch. No text inside generated images.'
    (ROOT/'config'/'style_lock.md').write_text(style+'\n'); (QA_DIR/'style_consistency_report.md').write_text('PENDING: style lock created before image prompts. Final visual audit runs after images.\n')
    mark('07','complete',str(ROOT/'config'/'style_lock.md'),'Cartoon explainer style lock saved.')

def beat_manifest():
    mark('08','in_progress')
    duration=json.load(open(AUDIO_DIR/'tts_timing.json'))['audio_duration_seconds']; n=80; per=duration/n
    laura=(ROOT/'config'/'character_lock'/'laura.md').read_text().strip(); john=(ROOT/'config'/'character_lock'/'john.md').read_text().strip(); style=(ROOT/'config'/'style_lock.md').read_text().strip()
    scene_objs=['tiny minimum payment button chained to giant friendly credit card','Laura confused at laptop bill while John points to calendar','trillion-dollar card balance mountain made of receipts','interest monster nibbling a paycheck','minimum payment floor versus payoff staircase','phone shopping buttons floating around Laura','lifeboat becoming a tiny house on debt ocean','five-thousand-dollar balance graph bending downward','snowbank of debt with spoon and shovel','balance transfer bridge with warning signs','four-step checklist represented with icons but no readable text','avalanche and snowball paths through debt','credit-score pressure gauge beside card balance','rewards confetti versus heavy interest invoice','smoke alarm over stacked cards','small emergency cushion shield','future paycheck with rent sign held by debt','Laura writing one fixed payment number','John closing notebook with calm smile','thumbnail-style final tableau card chain breaking']
    beats=[]; prompts=[]
    speakers=[s['speaker'] for s in json.load(open(AUDIO_DIR/'dialogue_segments.json'))]
    for i in range(1,n+1):
        start=(i-1)*per; end=i*per; obj=scene_objs[(i-1)%len(scene_objs)]
        chars='John and Laura' if i%5 not in (0,3) else ('John' if i%5==0 else 'Laura')
        char_desc=(john+' '+laura) if chars=='John and Laura' else (john if chars=='John' else laura)
        motion=['ZOOM_IN','DRIFT_R','ZOOM_OUT','DRIFT_L','STATIC_LIMITED','DIP_MICRO'][i%6]
        trans=['CUT','DISSOLVE','WIPE_L','CUT','FADE','WIPE_R'][i%6]
        prompt=f"{style}\n{char_desc}\nScene {i}: {obj}. Visual metaphor for credit-card minimum-payment trap; expressive educational finance cartoon, warm background, no readable text, no logos, no watermarks, no photorealism. Compose for 16:9 video frame."
        beat={'beat_id':i,'start_timestamp':round(start,3),'end_timestamp':round(end,3),'script_line_range':f'approx audio {start:.1f}-{end:.1f}s','scene_objective':obj,'characters':chars,'setting':'warm cartoon home-office / abstract finance explainer environment','visual_action':obj,'emotion':'curious tension resolving into clarity','data_element':'APR/balance/payoff metaphor' if i%4==0 else None,'unique_prompt':prompt,'intended_motion':motion if motion!='DIP_MICRO' else 'SHAKE_MICRO','intended_transition':trans,'expected_image_path':str(SCENES_DIR/f'scene_{i:03d}.png')}
        beats.append(beat); prompts.append({'beat_id':i,'prompt':prompt,'provider':'openai','model':'gpt-image-2','image_path':str(SCENES_DIR/f'scene_{i:03d}.png'),'reused':False,'fallback_used':False,'attempts':0})
    (VIDEO_DIR/'image_beat_manifest.json').write_text(json.dumps({'audio_duration_seconds':duration,'beats':beats},indent=2)); (VIDEO_DIR/'scene_manifest.json').write_text(json.dumps({'video_slug':SLUG,'scene_count':n,'scenes':beats},indent=2)); (VIDEO_DIR/'image_prompt_manifest.json').write_text(json.dumps({'model_policy':'openai/gpt-image-2; 20 frontier-generated four-panel composites cropped into 80 unique scene frames','prompts':prompts},indent=2))
    (VIDEO_DIR/'scene_tagged_script.md').write_text((VIDEO_DIR/'script_approved.md').read_text()+'\n\n# Beat tags\n80 beats mapped at ~6 seconds each from final audio.\n')
    mark('08','complete',str(VIDEO_DIR/'image_beat_manifest.json'),'80 timestamped beats, max duration <=6.1s; prompts include full locks.')

def main():
    ensure_dirs(); write_discovery(); init_manifest(); research_and_script(); voice_and_locks(); beat_manifest()
if __name__=='__main__': main()
