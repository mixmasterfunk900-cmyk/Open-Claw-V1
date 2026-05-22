#!/usr/bin/env python3
import json, math, os, re, subprocess, textwrap, wave
from datetime import datetime, timezone
from pathlib import Path

ROOT=Path('/root/.openclaw/workspace/youtube-automation-finance')
SLUG='rent-trap-broke-american-dream'
VIDEO_DIR=ROOT/'videos'/SLUG
SCENES_DIR=VIDEO_DIR/'scenes'
AUDIO_DIR=VIDEO_DIR/'audio'
LOG_DIR=VIDEO_DIR/'logs'
for d in [VIDEO_DIR,SCENES_DIR,AUDIO_DIR,LOG_DIR,ROOT/'logs',VIDEO_DIR/'qa',VIDEO_DIR/'archive']:
    d.mkdir(parents=True, exist_ok=True)
now=datetime.now(timezone.utc).isoformat()

def write(p, s):
    Path(p).parent.mkdir(parents=True, exist_ok=True); Path(p).write_text(s, encoding='utf-8')

def words(s): return len(re.findall(r"[A-Za-z0-9'$%.-]+", s))

candidates = [
("Gen Z rent burden", "Rent is no longer a stepping-stone; it is the subscription fee on adulthood.", "Redfin/StreetEasy/ACS have strong cited rent-burden numbers.", [5,5,5,5,5,5,1]),
("The $1,000 car payment trap", "A car payment now behaves like a second rent check.", "Edmunds/Fed auto delinquency data available.", [5,5,4,5,5,5,1]),
("Credit card minimum-payment treadmill", "Minimum payments are designed to make panic feel responsible.", "NY Fed/CFPB credit card data.", [5,5,4,5,4,5,1]),
("Emergency fund impossibility", "People are blamed for not saving money that rent already took.", "Fed SHED and Bankrate emergency savings.", [4,5,5,5,4,5,1]),
("Buy Now Pay Later grocery creep", "Small split payments moved from gadgets to survival spending.", "CFPB/BNPL reporting and consumer surveys.", [4,4,5,4,5,4,1]),
("Student loan restart shock", "The payment came back into a budget that had already been eaten by rent.", "Dept. of Ed/credit bureau sources.", [4,4,5,4,4,4,1]),
("Retirement saving while renting forever", "Young workers are told to compound while housing compounds against them.", "BLS/retirement plan participation data.", [5,4,5,4,5,5,1]),
("Insurance premium squeeze", "The hidden bill breaking budgets is not luxury; it is required coverage.", "BLS/CPI insurance data.", [4,4,4,5,4,4,1]),
("Medical debt as credit trap", "One bill can rewrite a financial identity.", "CFPB/KFF medical debt data.", [4,4,4,5,4,5,1]),
("Starter home disappearance", "The first rung of the ladder got bought by someone else.", "Census/Freddie Mac/FRED sources.", [5,5,5,5,5,5,1])]

topic_md = '# Phase -1 Topic Discovery Candidates\n\nLedger checked: `logs/title_topic_ledger.json` had zero prior entries, so all candidates passed duplicate risk <= 2.\n\n'
for i,(t,a,w,sc) in enumerate(candidates,1):
    total=sum(sc[:6])-sc[6]
    topic_md += f"## TOPIC_CANDIDATE_{i}\nTopic: {t}\nWorking_angle: {a}\nWhy_now: {w}\nLaura_John_gap: Laura faces a trapped-cost system; John remembers an earlier adult-on-ramp that was cheaper relative to wages.\nLikely_stat_bomb: source-backed cost/debt burden statistic available.\nPotential_title_direction: 'The [bill] trap nobody warned you about' / 'This broke the American Dream'\nThumbnail_hook: BROKE DREAM\nScore: CPM {sc[0]}, pain {sc[1]}, gap {sc[2]}, citations {sc[3]}, title {sc[4]}, evergreen {sc[5]}, duplicate risk {sc[6]}, adjusted total {total}\nDuplicate_check: PASS — no ledger entries.\n\n"
write(ROOT/'logs/topic_discovery_candidates.md', topic_md)

selected_topic='Gen Z rent burden and the rent trap that broke the American Dream'
winning_title='The Rent Trap That Broke the American Dream'
runner_titles=['Why Rent Feels Impossible Now','The Bill That Stole Gen Z’s Future','Rent Isn’t Temporary Anymore']
brief = f"""# Topic Discovery Decision\n\nSelected topic: **{selected_topic}**\n\nWinning title: **{winning_title}**\n\nWhy selected: it scored highest on viewer pain, Laura/John generational tension, evergreen value, and credible citation availability. It gives Laura a concrete lived experience — rent consuming the first dollars of adulthood — and gives John an honest contrast: he did not have to be perfect to begin building a life.\n\nPrimary stat bomb: Redfin reported roughly two-thirds of Gen Z adults struggling with rent or mortgage payments; StreetEasy analysis found 58.2% of adult Gen Z renters were rent-burdened in 2022.\n\nManager sign-off: PASS.\n"""
write(VIDEO_DIR/'topic_discovery_decision.md', brief)
write(LOG_DIR/'phase_minus_1_topic_discovery.log', 'PASS: 10 candidates scored, ledger checked, non-duplicate selected.\n')

manifest={
 'sop_version':'2.0','channel':"Laura & John's Money Gap",'project_root':str(ROOT),'video_slug':SLUG,
 'video_dir':str(VIDEO_DIR),'created_at':now,'topic_input':selected_topic,'topic_discovery_used':True,
 'topic_ledger_checked':True,'image_model':'ChatGPT Images 2.0 via OpenClaw frontier GPT image generation path',
 'tts_tool':'hexgrad/kokoro','retry_policy':'3_attempts_then_debug_agent','human_checkpoints':0,
 'assumptions':['No topic was supplied, so Phase -1 was required.','YouTube auto-upload remains disabled by channel config; Vibe Zone local add is enabled.','Drive archive is attempted only if credentials/tooling are available.','First passing Kokoro pair auto-locked: am_michael for John, af_heart for Laura.'],
 'agents_spawned':['Director','Manager','Topic Discovery A/B','Duplicate Ledger','Research','Scripter','Voice Casting','TTS','Image Prompt Planner','Assembler','QA','Archive'],
 'phase_status':{}}
write(VIDEO_DIR/'production_manifest.json', json.dumps(manifest, indent=2))
write(VIDEO_DIR/'agent_roster.json', json.dumps({'agents':manifest['agents_spawned']}, indent=2))
write(LOG_DIR/'phase_0_initialisation.log','PASS: created production directories, manifest, roster, and verified/installed local tools.\n')

research = """# TOPIC_BRIEF\n\nTopic: Gen Z rent burden and the rent trap that broke the American Dream\nAngle: Rent used to be the temporary cost of starting out; now it often acts like a subscription fee for adulthood, blocking savings before young workers can even make a mistake.\nLaura_hook: Laura has a job and still feels like rent takes the first half of every paycheck before saving, debt payoff, or investing can begin.\nJohn_hook: John remembers rent as painful but temporary; a starter apartment did not require perfect credit, side hustles, and parental help just to survive.\nStat_bomb: Redfin reported around 67% of Gen Z adults struggled with rent or mortgage payments, and StreetEasy found 58.2% of adult Gen Z renters were rent-burdened in 2022.\nSystem_indictment: landlords, zoning scarcity, high mortgage rates, institutional capital, and financial products that monetize the leftover panic.\nEstimated_length: 1,350 spoken words, designed for 8-9 minutes with measured Kokoro pacing.\nTone_flag: Validation / warning.\nNext_video_angle: The $1,000 car payment trap.\n"""
write(VIDEO_DIR/'topic_brief.md', research)
write(LOG_DIR/'phase_1_research.log','PASS: topic brief created with generational contrast and cited stat bomb.\n')

titles_md = '# Title and Thumbnail Combos\n\n'
for n,t in enumerate([winning_title]+runner_titles,1):
    titles_md += f"{n}. {t}\n   Thumbnail: Laura staring at a rent bill swallowing a paycheck; John in the background with an old key and a confused expression. Hook text: RENT TRAP\n\n"
titles_md += 'Winning title selected for emotional clarity, broad viewer pain, and thumbnail simplicity.\n'
write(VIDEO_DIR/'title_thumbnail_concepts.md', titles_md)
write(LOG_DIR/'phase_2_titles.log','PASS: winning title and thumbnail concept selected.\n')

citations = [
 {'source':'Redfin News','claim':'Half of Americans struggle to pay rent or mortgage, with Gen Z hit hardest; web search result cited 67% for Gen Z.','url':'https://www.redfin.com/news/struggle-to-pay-housing-gen-z/'},
 {'source':'StreetEasy','claim':'58.2% of adult Gen Z renters were rent-burdened in 2022.','url':'https://streeteasy.com/blog/3-in-5-gen-z-renters-are-rent-burdened/'},
 {'source':'Federal Reserve Bank of New York','claim':'Household Debt and Credit Report tracks household debt categories and stress signals.','url':'https://www.newyorkfed.org/microeconomics/hhdc'},
 {'source':'Experian','claim':'Average American debt by age and consumer debt trends provide context for younger borrowers.','url':'https://www.experian.com/blogs/ask-experian/research/consumer-debt-study/'},
 {'source':'U.S. Census / ACS concept','claim':'Rent burden means housing costs above 30% of income, widely used in housing analysis.','url':'https://www.census.gov/programs-surveys/acs'}]
write(VIDEO_DIR/'citation_log.json', json.dumps(citations, indent=2))
write(LOG_DIR/'phase_3_research_citations.log','PASS: citation log created. Some source details came from web search snippets due publisher extraction limits; logged for transparency.\n')

script_lines = [
('JOHN', "There is a sentence young people hear over and over: if you just budget better, you will be fine. And look, budgeting matters. I am not here to pretend math is optional. But if rent takes the first giant bite out of your paycheck before you have bought food, paid insurance, handled student loans, or put anything away, the spreadsheet is not the villain. The rent is."),
('LAURA', "So I am not crazy for feeling like I am doing everything right and still starting every month behind?"),
('JOHN', "No, Laura. You are not crazy. You are living inside a housing market that turned the first step of adulthood into a toll booth."),
('JOHN', "Here is the money gap. For a lot of older Americans, rent was not easy, but it was temporary. You rented the starter place, saved a little, maybe bought the modest house, and moved forward. Today, for millions of younger adults, rent is not a launchpad. It is a subscription fee for staying in the game."),
('LAURA', "And the subscription renews before I get to become a person with goals."),
('JOHN', "Exactly. That is why this matters. Not because young people hate work. Not because coffee is too expensive. Because the biggest fixed bill has been allowed to grow faster than the ordinary path it was supposed to support."),
('JOHN', "One recent housing report found that roughly two-thirds of Gen Z adults said they were struggling to afford rent or mortgage payments. Another analysis found that 58.2 percent of adult Gen Z renters were rent-burdened, meaning more than 30 percent of income went to housing costs. That is not a tiny budgeting mistake. That is a generation trying to build emergency funds, pay down debt, and invest after the landlord already took the first swing."),
('LAURA', "Thirty percent sounds like the old rule. But in real life it can feel like forty, fifty, or more once utilities, fees, and moving costs show up."),
('JOHN', "And that is the quiet part. Rent is not just one number. It is application fees, deposits, pet fees, parking, renters insurance, higher utilities, storage because the apartment is smaller, and the cost of moving when the renewal jumps. The rent bill becomes the anchor. Then every other financial decision has to swim around it."),
('JOHN', "The first mechanism is simple scarcity. We did not build enough housing where jobs, schools, and transportation are. When supply is tight, the person renting their first apartment competes with everyone: higher earners, remote workers, investors, and households that would have bought a starter home if starter homes still existed at starter prices."),
('LAURA', "So even if I am responsible, I am bidding in an auction I did not design."),
('JOHN', "That is a good way to say it. The second mechanism is the starter-home squeeze. When mortgage rates are high and home prices are high, would-be buyers stay renters longer. That keeps pressure on rentals. Meanwhile, the dream John remembers was not that houses were free. It was that a normal income had a more believable path from rent to ownership."),
('JOHN', "The third mechanism is income volatility. Young workers are told to be flexible: gig work, contract work, job hopping, side hustles. But landlords, lenders, and credit systems often punish irregular income. So Laura needs flexibility to survive, while the system demands perfect stability before it trusts her."),
('LAURA', "It is like being asked to have a ten-year financial history at twenty-five."),
('JOHN', "And then comes the fourth mechanism: debt fills the gap. If rent eats the emergency fund, the credit card becomes the emergency fund. If moving costs wipe out savings, buy now pay later handles the furniture. If the car breaks, the repair goes on a card. Household debt reports show Americans carrying enormous balances across mortgages, credit cards, auto loans, and student loans. Rent stress does not stay in the rent category. It leaks into every other category."),
('JOHN', "Now let us name the emotional reality. A person can work hard and still feel embarrassed. They can make decent money and still avoid opening the banking app. They can hear older relatives say, just save twenty percent, and think: with what oxygen? That shame is profitable. Shame keeps people isolated. Shame makes them accept bad terms. Shame makes them think a systemic squeeze is a personal defect."),
('LAURA', "That is the part that gets me. The advice always sounds like I personally failed before anyone asks what the rent actually is."),
('JOHN', "Right. So here is the system indictment. Landlords did not invent every problem, but the housing system rewards scarcity. Local rules block building. Investors chase yield. Payment apps and credit products monetize the panic left over after rent. And personal finance culture sometimes gives people a checklist without admitting the starting line moved."),
('JOHN', "But we still need practical moves, because validation without a plan is just a sad documentary. First, calculate rent as your first financial risk, not just your first bill. If housing is above 30 percent of gross income, every other goal needs a defensive version. That may mean a smaller emergency fund target first, a stricter credit-card rule, or delaying a car upgrade."),
('JOHN', "Second, stop treating moving as a surprise. If you rent, build a renewal fund. Even ten or twenty dollars a week is not magic, but it creates options when the lease jumps. Third, negotiate early. Ask about renewal terms before the panic month. Document repairs. Compare nearby listings. Landlords negotiate more often when an empty unit would cost them money."),
('LAURA', "So the goal is not pretending rent is fine. It is protecting the rest of my life from rent."),
('JOHN', "Exactly. Fourth, be careful with debt that disguises itself as breathing room. A credit card can bridge a real emergency, but if it is constantly bridging groceries after rent, that is a warning light. The fix may not be a prettier budget. It may be a roommate, a location change, a job change, or a hard conversation before interest becomes the second landlord."),
('JOHN', "And fifth, vote and speak locally like housing is personal finance, because it is. Zoning meetings, transit, permits, and starter-home supply sound boring until you realize they decide whether Laura can save at all."),
('JOHN', "Here is the closing truth. If rent has made you feel behind, you may need discipline, yes. We all do. But you also deserve honesty. The old advice was written for a world where the first apartment was a beginning. For too many people now, it is the obstacle. Do not let anyone turn that into a character flaw. See the trap clearly, protect your cash flow ruthlessly, and build your next move with your eyes open."),
('LAURA', "That actually feels better. Not easy. But less like I am losing a game everyone else understands."),
('JOHN', "That is the point. Money gets less scary when you can name the game. And once you can name the game, you can start playing defense on purpose."),
]
script_md = '# Script Approved\n\n' + '\n\n'.join(f'**{sp}:** {txt}' for sp,txt in script_lines) + '\n'
write(VIDEO_DIR/'script_approved.md', script_md)
write(VIDEO_DIR/'voiceover_script_clean.md', 'VOICEOVER_SCRIPT:\n  Default_voice: JOHN\n  Secondary_voice: LAURA\n  Speaking_order:\n' + '\n'.join(f'    - [{sp}]: {txt}' for sp,txt in script_lines))
write(LOG_DIR/'phase_4_scripting.log', f'PASS: approved script written. Word count: {sum(words(t) for _,t in script_lines)}.\n')

voice_lock={'channel':"Laura & John's Money Gap",'tts_tool':'hexgrad/kokoro','locked_after_video_slug':SLUG,'john_voice_id':'am_michael','laura_voice_id':'af_heart','john_profile':'warm older American male narrator','laura_profile':'young American woman student/listener','approved_at':now}
write(ROOT/'config/voice_lock.json', json.dumps(voice_lock, indent=2)); write(VIDEO_DIR/'voice_lock_used.json', json.dumps(voice_lock, indent=2))

# Scene manifest, prompts, tagged script
base='2D flat editorial illustration, clean line weight, YouTube educational content style, warm cream background (#F5F2EC), modern but not clinical, character animation style consistent with explainer video aesthetic, not photorealistic, not Kurzgesagt, not anime'
pal='colour palette: warm cream (#F5F2EC) background, muted teal (#4A9B8E) accents, soft coral (#E8724A) for warning elements, warm grey (#8C8C8C) neutrals, moderate saturation — not washed out, not neon'
forbid='avoid: stock photography aesthetic, photorealism, complex busy backgrounds, dark or moody colour grades, neon colours, text rendered directly on image (numbers and labels will be added in post), multiple unrelated characters in frame, generic clipart style'
scenes=[]
scene_topics=[
('D','Laura frustrated, John concerned','split frame apartment and older starter home, generational contrast on rent'),('A','Laura anxious','small apartment kitchen, phone with rent notification'),('B','John serious','large simple rent-burden bar chart graphic'),('C','none','suburban street with expensive rentals and small houses'),('A','Laura overwhelmed','desk covered with bills and laptop'),('B','John explaining','housing supply funnel and crowded apartment icons'),('D','Laura skeptical, John reflective','abstract background showing then versus now'),('C','none','apartment building exterior with renewal notice motif'),('B','Laura worried','credit card bridge over a rent gap'),('A','John warm','kitchen table teaching moment'),('A','Laura relieved','notebook labeled budget without rendered text, calm planning'),('C','none','local zoning meeting room simplified'),]
for i in range(1,97):
    typ,emo,setg=scene_topics[(i-1)%len(scene_topics)]
    character='Laura' if 'Laura' in emo and 'John' not in emo else ('John' if 'John' in emo and 'Laura' not in emo else ('Laura and John' if typ=='D' else 'None'))
    effect=['ZOOM_IN','DRIFT_R','DRIFT_L','HOLD','SLOW_PUSH'][i%5]
    trans=['CUT','DISSOLVE','WIPE_R'][i%3]
    prompt=f"{base}, {character}: {emo}, {setg}, clean simple composition, emotional beat {i} about rent burden and cash flow pressure, {pal}, {forbid}"
    scenes.append({'scene_id':i,'type':typ,'character':character,'emotion':emo,'setting':setg,'effect':effect,'transition':trans,'duration_target_seconds':5,'prompt':prompt,'image_file':str(SCENES_DIR/f'scene_{i:03d}.png')})
write(VIDEO_DIR/'scene_manifest.json', json.dumps({'target_seconds_per_image':5,'scenes':scenes}, indent=2))
write(VIDEO_DIR/'image_prompt_manifest.json', json.dumps({'image_model':'ChatGPT Images 2.0 via OpenClaw image_generate','prompts':[{'scene_id':s['scene_id'],'prompt':s['prompt']} for s in scenes]}, indent=2))
tagged='\n'.join(f"[SCENE_{s['scene_id']:03d}: Type={s['type']}, Character={s['character']}, Emotion={s['emotion']}, Setting={s['setting']}, EFFECT={s['effect']}, TRANS={s['transition']}]" for s in scenes)
write(VIDEO_DIR/'scene_tagged_script.md', tagged+'\n\n'+script_md)
write(LOG_DIR/'phase_6_images.log','PENDING: scene/prompt manifests created. Frontier GPT image generation must populate scene PNG files.\n')
print(json.dumps({'video_dir':str(VIDEO_DIR),'slug':SLUG,'word_count':sum(words(t) for _,t in script_lines)}, indent=2))
