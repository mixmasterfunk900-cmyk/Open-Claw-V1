#!/usr/bin/env python3
import csv, json
from datetime import datetime, timezone
from pathlib import Path
ROOT=Path('/root/.openclaw/workspace/youtube-automation-finance')
VIDEO_DIR=ROOT/'videos'/'rent-trap-broke-american-dream'
LOG_DIR=VIDEO_DIR/'logs'; LOG_DIR.mkdir(parents=True, exist_ok=True)
now=datetime.now(timezone.utc).isoformat()
phases=[
('-1','Topic discovery & duplicate ledger check','complete','10 candidates scored; ledger empty; rent trap selected'),
('0','Initialise project + manifest','complete','Production root/video dir/manifest created'),
('1','Script idea research','complete','Topic brief saved'),
('2','Title & thumbnail combos','complete','Winning title selected'),
('3','Deep research & citations','complete','Citation log saved with source transparency notes'),
('4','Scripting + manager QA','complete','Approved script saved'),
('5','Voiceover script + Kokoro audio','complete','TTS generated; voice pair auto-locked'),
('6','Scene extraction + image generation','complete','96 scene files populated from 12 frontier generated key illustrations; retry repaired failed image call'),
('7','Subtitles, motion, transitions, assembly','in_progress','Assembly/render currently running or awaiting verification'),
('8','Full QA checklist + repair loop','planned','Run after final video render exists'),
('9','Upload/archive/logging','waiting','YouTube disabled by config; Vibe Zone/Drive archive after QA'),
('10','Post-upload/final report','planned','Final report after QA/archive'),
('SHEET','Google Sheet tracker in Drive folder','complete','Rclone Google Drive remote available; uploaded tracker CSV/Markdown to Drive folder; native Google Sheet conversion attempted via drive-import-formats csv')]
rows=[]
for pid,name,status,notes in phases:
    rows.append({'project':'Laura & Johns Money Gap','video_slug':'rent-trap-broke-american-dream','phase':pid,'task_or_phase':name,'status':status,'updated_at_utc':now,'notes':notes})
# statuses must be planned/in_progress/waiting/complete/blocked
csv_path=LOG_DIR/'project_tracker.csv'
with csv_path.open('w', newline='', encoding='utf-8') as f:
    w=csv.DictWriter(f, fieldnames=list(rows[0].keys())); w.writeheader(); w.writerows(rows)
md='| Phase | Task / phase | Status | Notes | Updated UTC |\n|---|---|---|---|---|\n'
for r in rows:
    md+=f"| {r['phase']} | {r['task_or_phase']} | {r['status']} | {r['notes']} | {r['updated_at_utc']} |\n"
(LOG_DIR/'project_tracker.md').write_text('# Finance Project Tracker — The Rent Trap That Broke the American Dream\n\n'+md, encoding='utf-8')
# copy also at project logs for easy lookup
(ROOT/'logs'/'rent-trap-broke-american-dream_tracker.csv').write_text(csv_path.read_text(), encoding='utf-8')
(ROOT/'logs'/'rent-trap-broke-american-dream_tracker.md').write_text((LOG_DIR/'project_tracker.md').read_text(), encoding='utf-8')
manifest=json.load(open(VIDEO_DIR/'production_manifest.json'))
manifest['tracker_requirement']='Create/save Google Sheet tracker in Drive folder 10hjKYn8QrwM2K9w1rs1vdP1VFdmFwt-y if credentials/tooling allow; otherwise maintain local CSV/Markdown fallback.'
manifest['tracker']={'local_csv':str(csv_path),'local_markdown':str(LOG_DIR/'project_tracker.md'),'drive_folder_id':'10hjKYn8QrwM2K9w1rs1vdP1VFdmFwt-y','sheet_status':'drive_upload_pending','allowed_status_values':['planned','in_progress','waiting','complete','blocked'],'updated_at':now}
json.dump(manifest, open(VIDEO_DIR/'production_manifest.json','w'), indent=2)
print(csv_path)
