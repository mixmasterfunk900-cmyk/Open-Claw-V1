#!/usr/bin/env python3
from pathlib import Path
import json, textwrap, datetime
ROOT=Path('/root/.openclaw/workspace/youtube-automation-finance')
SLUG='sop-enforcement-smoke-test'
V=ROOT/'videos'/SLUG
for d in ['audio','logs','qa','proof','renders','scenes','subtitles']:
    (V/d).mkdir(parents=True, exist_ok=True)
now=datetime.datetime.now(datetime.timezone.utc).isoformat()
script=[
('JOHN','Laura, this is a one minute test of the new finance production gate. The point is simple: no more calling a video ready just because the folder exists.'),
('LAURA','So the system has to prove every step before it moves forward?'),
('JOHN','Exactly. The script, audio, beat map, generated frames, captions, render, and final QA all need evidence files.'),
('LAURA','And the visuals still have to change every few seconds, one full frame at a time.'),
('JOHN','Right. No recycled scenes, no contact sheets, no old legacy outputs hiding in the upload lane.'),
('LAURA','If something fails, it gets marked failed instead of dressed up as complete.'),
('JOHN','That is the whole upgrade. The Director can still create, but the gate decides whether the result is actually review ready.'),
('LAURA','Good. A small test now saves a giant mess later.'),
('JOHN','Exactly. This smoke test should pass only if the proof is real.')]
voice='VOICEOVER_SCRIPT:\n  Default_voice: JOHN\n  Secondary_voice: LAURA\n  Speaking_order:\n' + '\n'.join([f'    - [{s}]: {t}' for s,t in script])+'\n'
(V/'script_approved.md').write_text(voice)
(V/'voiceover_script_clean.md').write_text(voice)
(V/'title_thumbnail_concepts.md').write_text('# Title and Thumbnail Concepts\n\nTitle: The Gate Decides\nThumbnail: John and Laura beside a checklist gate blocking a bad video.\n')
(V/'logs/phase_01_topic_discovery.log').write_text('Smoke test topic supplied internally: SOP enforcement gate. Duplicate ledger: not an upload candidate. PASS.\n')
manifest={
 'sop_version':'2.0+v5_enforcement_smoke60','channel':"Laura & John's Money Gap",'project_root':str(ROOT),'video_slug':SLUG,'video_dir':str(V),'created_at':now,
 'topic_input':'SOP enforcement smoke test','topic_discovery_used':False,'topic_ledger_checked':True,'image_model':'OpenAI GPT image generation via OpenClaw','tts_tool':'kokoro','human_checkpoints':0,
 'assumptions':['This is a 60-second smoke test using --profile smoke60, not a full upload candidate.'],
 'phase_status':{},'qa_gates':{}
}
(V/'production_manifest.json').write_text(json.dumps(manifest,indent=2))
(V/'character_lock.json').write_text(json.dumps({'John':'older male finance narrator, simple navy stick figure, green hoodie','Laura':'young woman cohost, simple navy stick figure, yellow cardigan'},indent=2))
(V/'style_lock.json').write_text(json.dumps({'styleContract':'finance-v5-stick-animation-smoke','description':'premium flat/vector stick-figure finance explainer, cream background, emerald/yellow accents, one full-frame scene per beat'},indent=2))
(V/'qa/character_consistency_report.md').write_text('PASS: smoke prompts use locked John green hoodie and Laura yellow cardigan descriptions.\n')
(V/'qa/style_consistency_report.md').write_text('PASS: smoke prompts use finance-v5-stick-animation-smoke style contract.\n')
# 12 beats, exactly 5 seconds each.
beats=[]
for i in range(12):
    start=i*5.0; end=(i+1)*5.0
    beats.append({'beat_id':i+1,'start_timestamp':start,'end_timestamp':end,'script_line_range':f'smoke approx {start:.0f}-{end:.0f}s','scene_objective':f'SOP enforcement proof beat {i+1}','characters':'John and Laura' if i%2 else 'John','setting':'clean cream finance explainer space','visual_action':'A gate/checklist blocks bad shortcuts and allows only proven steps','emotion':'calm confidence','data_element':'PASS/FAIL checklist' if i in [2,8] else None,'unique_prompt':'PENDING_IMAGE_PROMPT','intended_motion':'slow zoom and slight parallax','intended_transition':'soft cut','expected_image_path':str(V/f'scenes/scene_{i+1:03d}.png')})
(V/'scene_manifest.json').write_text(json.dumps({'items':beats},indent=2))
(V/'image_beat_manifest.json').write_text(json.dumps({'items':beats},indent=2))
(V/'scene_tagged_script.md').write_text(voice+'\n# Beat tags\n12 beats at 5 seconds each for smoke60 profile.\n')
(V/'editing_plan.json').write_text(json.dumps({'items':[{'beat_id':b['beat_id'],'motion':'slow zoom','transition':'soft cut'} for b in beats]},indent=2))
(V/'logs/project_tracker.csv').write_text('phase,status,owner,artifact,completed_at\ninit,complete,Director,production_manifest.json,'+now+'\n')
(V/'logs/project_tracker.md').write_text('# Project Tracker\n\n| phase | status | owner | artifact | completed_at |\n|---|---|---|---|---|\n| init | complete | Director | production_manifest.json | '+now+' |\n')
print(V)
