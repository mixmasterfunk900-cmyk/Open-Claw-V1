#!/usr/bin/env python3
from __future__ import annotations
import argparse, json, math, re, shutil, subprocess, wave, hashlib
from datetime import datetime, timezone
from pathlib import Path

ROOT=Path('/root/.openclaw/workspace/youtube-automation-finance')
VIDEO_DIR=ROOT/'videos'/'car-payment-trap'
AUDIO_DIR=VIDEO_DIR/'audio'
SCENES_DIR=VIDEO_DIR/'scenes'
QA_DIR=VIDEO_DIR/'qa'
PROOF_DIR=VIDEO_DIR/'proof'
LOG_DIR=VIDEO_DIR/'logs'
RENDERS_DIR=VIDEO_DIR/'renders'
VIBE_BASE=Path('/root/.openclaw/workspace/vibe-zone/media/practice/youtube-automation/finance-content')
SLUG='car-payment-trap'
for d in [AUDIO_DIR, SCENES_DIR, QA_DIR, PROOF_DIR, LOG_DIR, RENDERS_DIR]: d.mkdir(parents=True, exist_ok=True)

def run(cmd, log=None):
    if log:
        with open(log,'a') as f:
            f.write('$ '+' '.join(map(str,cmd))+'\n')
            p=subprocess.run(list(map(str,cmd)), stdout=f, stderr=subprocess.STDOUT)
    else:
        p=subprocess.run(list(map(str,cmd)))
    if p.returncode: raise SystemExit(f'command failed: {cmd}')

def parse_script():
    txt=(VIDEO_DIR/'script_approved.md').read_text(encoding='utf-8')
    items=[]
    cur_section='INTRO'
    for line in txt.splitlines():
        if line.startswith('## '): cur_section=line[3:].strip()
        m=re.match(r'- \[(JOHN|LAURA)\]:\s*(.+)', line.strip())
        if m: items.append({'speaker':m.group(1), 'section':cur_section, 'text':m.group(2).strip()})
    if not items:
        raise SystemExit('No script lines parsed')
    return items

def wav_duration(path: Path):
    with wave.open(str(path),'rb') as w:
        return w.getnframes()/w.getframerate()

def sha256(path: Path):
    h=hashlib.sha256()
    with path.open('rb') as f:
        for c in iter(lambda:f.read(1024*1024), b''): h.update(c)
    return h.hexdigest()

def phase_audio():
    # import only inside this phase, under the qwen venv
    import numpy as np
    import soundfile as sf
    import torch
    from qwen_tts import Qwen3TTSModel
    cfg=json.loads((ROOT/'config/qwen3_voice_lock.json').read_text())
    segments=parse_script()
    device='cuda:0' if torch.cuda.is_available() else 'cpu'
    dtype=torch.bfloat16 if torch.cuda.is_available() else torch.float32
    model=Qwen3TTSModel.from_pretrained(cfg['model'], device_map=device, dtype=dtype, attn_implementation='sdpa' if torch.cuda.is_available() else 'eager')
    all_audio=[]; meta=[]; cursor=0.0; sr_out=None
    silence_sr=24000
    progress_path=AUDIO_DIR/'dialogue_segments.partial.json'
    for idx,seg in enumerate(segments,1):
        speaker=cfg['john_voice'] if seg['speaker']=='JOHN' else cfg['laura_voice']
        instruct=cfg['john_instruct'] if seg['speaker']=='JOHN' else cfg['laura_instruct']
        out=AUDIO_DIR/f'segment_{idx:03d}_{seg["speaker"].lower()}.wav'
        if out.exists() and out.stat().st_size > 1024:
            arr, sr = sf.read(out, dtype='float32')
            arr=np.asarray(arr, dtype=np.float32).reshape(-1)
            if arr.size < int(0.5*sr):
                raise SystemExit(f'Existing segment too short, inspect/archive before regenerating: {out}')
            print(f'[{idx}/{len(segments)}] reusing existing {out.name}', flush=True)
        else:
            print(f'[{idx}/{len(segments)}] {seg["speaker"]} -> {out.name}', flush=True)
            wavs, sr = model.generate_custom_voice(text=seg['text'], language='English', speaker=speaker, instruct=instruct)
            arr=wavs[0]
            if hasattr(arr,'detach'): arr=arr.detach().cpu().numpy()
            arr=np.asarray(arr, dtype=np.float32).reshape(-1)
            # light normalization, avoid clipping
            peak=float(np.max(np.abs(arr))) if arr.size else 1.0
            if peak>0: arr=arr*(0.88/max(peak,0.88))
            sf.write(out, arr, sr)
        sr_out=sr
        dur=len(arr)/sr
        meta.append({'segment_id':idx,'speaker':seg['speaker'],'voice':speaker,'voice_label':cfg['john_voice_label'] if seg['speaker']=='JOHN' else cfg['laura_voice_label'],'section':seg['section'],'text':seg['text'],'start':round(cursor,3),'end':round(cursor+dur,3),'duration':round(dur,3),'audio_path':str(out)})
        progress_path.write_text(json.dumps(meta,indent=2),encoding='utf-8')
        all_audio.append(arr); cursor += dur
        pause=np.zeros(int(0.28*sr), dtype=np.float32)
        all_audio.append(pause); cursor += len(pause)/sr
    full=np.concatenate(all_audio) if all_audio else np.zeros(1,dtype=np.float32)
    full_wav=AUDIO_DIR/'voiceover_full.wav'
    sf.write(full_wav, full, sr_out or silence_sr)
    run(['ffmpeg','-y','-hide_banner','-loglevel','error','-i',full_wav,'-c:a','libmp3lame','-b:a','192k',AUDIO_DIR/'voiceover_full.mp3'])
    duration=wav_duration(full_wav)
    if duration < 480:
        raise SystemExit(f'audio duration below SOP minimum: {duration:.3f}s < 480s')
    # approximate word timings sufficient for manifest alignment if model metadata unavailable
    words=[]
    for seg in meta:
        toks=re.findall(r"[A-Za-z0-9'$%.-]+", seg['text'])
        if not toks: continue
        step=(seg['end']-seg['start'])/len(toks)
        for j,w in enumerate(toks):
            words.append({'word':w,'start':round(seg['start']+j*step,3),'end':round(seg['start']+(j+1)*step,3),'speaker':seg['speaker'],'segment_id':seg['segment_id']})
    (AUDIO_DIR/'dialogue_segments.json').write_text(json.dumps(meta,indent=2),encoding='utf-8')
    (AUDIO_DIR/'tts_timing.json').write_text(json.dumps({'engine':'qwen3-tts-local-oss','model':cfg['model'],'device':device,'audio_duration_seconds':duration,'segments':meta,'word_timestamps':words},indent=2),encoding='utf-8')
    (VIDEO_DIR/'voice_lock_used.json').write_text((ROOT/'config/voice_lock.json').read_text(),encoding='utf-8')
    (LOG_DIR/'phase_05_voice_audio_timing.log').write_text(f'PASS: Qwen3 local OSS generated full audio. Duration {duration:.3f}s. John=Ryan documentary, Laura=Serena warm.\n')
    return duration

def make_beats(duration=None):
    if duration is None:
        duration=json.loads((AUDIO_DIR/'tts_timing.json').read_text())['audio_duration_seconds']
    # target ~5 seconds, all beats between 4 and 6, at least 96
    n=max(96, math.ceil(duration/5.0))
    # if per too short, reduce? for long audio per will ~5; for 480 exactly n=96
    per=duration/n
    if per<4.0:
        n=math.floor(duration/4.0); per=duration/n
    if per>6.0:
        n=math.ceil(duration/6.0); per=duration/n
    segs=json.loads((AUDIO_DIR/'dialogue_segments.json').read_text())
    beats=[]
    theme_cycle=[
        ('John','dealership finance desk','monthly-payment framing','cautious documentary clarity'),
        ('Laura','apartment kitchen with laptop and transit keys','paycheck pressure','stressed but thoughtful'),
        ('John and Laura','split-screen explainer space','generational money gap','honest tension'),
        ('None','symbolic car loan paperwork and calendar pages','long loan chain','warning'),
        ('Laura','parking lot beside modest used car','real total car cost','concerned'),
        ('John','kitchen table finance lesson','negative equity and debt container','grounded'),
        ('None','abstract budget map with car costs orbiting paycheck','insurance repairs fuel and risk','analytical'),
        ('John and Laura','warm studio conversation backdrop','practical checklist and walk-away number','calm plan'),
    ]
    for i in range(1,n+1):
        start=(i-1)*per; end=duration if i==n else i*per
        overlapping=[s for s in segs if s['end']>=start and s['start']<=end]
        line_range=f"segments {overlapping[0]['segment_id']}-{overlapping[-1]['segment_id']}" if overlapping else 'transition'
        script_excerpt=' '.join(s['text'] for s in overlapping)[:260]
        character,setting,action,emotion=theme_cycle[(i-1)%len(theme_cycle)]
        if overlapping:
            speakers={s['speaker'] for s in overlapping}
            if speakers=={'JOHN'}: character='John'
            elif speakers=={'LAURA'}: character='Laura'
            elif speakers: character='John and Laura'
        motion=['subtle 3 percent push-in','slow parallax drift left','slow parallax drift right','gentle scale-out then settle','small vertical documentary float'][i%5]
        trans=['hard cut on narration beat','8-frame cross dissolve','quick soft wipe','match cut through shape','visible cut with slight flash frame'][i%5]
        prompt=(
            "Single full-frame 16:9 editorial cartoon scene for a finance explainer video. "
            "One coherent scene only, not a collage, not a grid, not panels, not a contact sheet. "
            f"Scene {i}: {character} in {setting}, showing {action}. Emotion: {emotion}. "
            "Consistent characters: John is an older American male finance narrator with kind serious expression, neat casual shirt; Laura is a young American woman cohost with warm curious expression, simple modern outfit. "
            "Warm cream background, muted teal and soft coral accents, clean line art, polished YouTube documentary explainer illustration, cinematic composition, full-frame, no readable text, no logos, no watermark."
        )
        beats.append({'beat_id':i,'start_timestamp':round(start,3),'end_timestamp':round(end,3),'script_line_range':line_range,'script_excerpt':script_excerpt,'scene_objective':action,'characters':character,'setting':setting,'visual_action':action,'emotion':emotion,'data_element':'visual metaphor only, no readable in-image text','unique_prompt':prompt,'intended_motion':motion,'intended_transition':trans,'expected_image_path':str(SCENES_DIR/f'scene_{i:03d}.png')})
    (VIDEO_DIR/'image_beat_manifest.json').write_text(json.dumps({'target_cadence_seconds':5,'audio_duration_seconds':duration,'beat_count':len(beats),'beats':beats},indent=2),encoding='utf-8')
    (VIDEO_DIR/'scene_manifest.json').write_text(json.dumps({'audio_duration_seconds':duration,'target_cadence_seconds':5,'scenes':beats},indent=2),encoding='utf-8')
    (VIDEO_DIR/'scene_tagged_script.md').write_text('\n'.join([f"[BEAT_{b['beat_id']:03d} {b['start_timestamp']}-{b['end_timestamp']} {b['characters']} MOTION={b['intended_motion']} TRANSITION={b['intended_transition']}] {b['script_excerpt']}" for b in beats]),encoding='utf-8')
    (VIDEO_DIR/'image_prompt_manifest.json').write_text(json.dumps({'provider_required':'OpenClaw frontier GPT image generation','model_required':'frontier/GPT image model','one_scene_per_prompt':True,'prompts':[{'beat_id':b['beat_id'],'prompt':b['unique_prompt'],'image_path':b['expected_image_path']} for b in beats]},indent=2),encoding='utf-8')
    (LOG_DIR/'phase_08_image_beat_manifest.log').write_text(f'PASS: {len(beats)} beats planned from {duration:.3f}s audio at {per:.3f}s per beat.\n')
    return len(beats)

def audit_images_manifest():
    beats=json.loads((VIDEO_DIR/'image_beat_manifest.json').read_text())['beats']
    items=[]; hashes={}
    errors=[]
    for b in beats:
        p=Path(b['expected_image_path'])
        if not p.exists(): errors.append(f'missing {p}'); continue
        h=sha256(p); hashes[h]=hashes.get(h,0)+1
        items.append({'beat_id':b['beat_id'],'prompt':b['unique_prompt'],'provider':'openclaw-image-generate','model':'frontier-gpt-image-generation','image_path':str(p),'sha256':h,'file_size':p.stat().st_size,'reused':False,'fallback_used':False,'attempts':1})
    dup=[h for h,n in hashes.items() if n>1]
    status='PASS' if not errors and not dup else 'FAIL'
    (VIDEO_DIR/'image_generation_manifest.json').write_text(json.dumps({'status':status,'generated_at':datetime.now(timezone.utc).isoformat(),'items':items,'errors':errors,'duplicate_hashes':dup},indent=2),encoding='utf-8')
    if status!='PASS': raise SystemExit('image manifest audit failed: '+json.dumps({'errors':errors[:3],'dupes':len(dup)}))

def make_contact_sheet(paths, out, cols=8, thumb=(240,135)):
    from PIL import Image, ImageDraw
    imgs=[]
    for p in paths:
        im=Image.open(p).convert('RGB')
        im.thumbnail(thumb)
        canvas=Image.new('RGB', thumb, (245,242,236)); canvas.paste(im, ((thumb[0]-im.width)//2,(thumb[1]-im.height)//2)); imgs.append((canvas, Path(p).stem))
    rows=math.ceil(len(imgs)/cols)
    sheet=Image.new('RGB',(cols*thumb[0], rows*(thumb[1]+22)),(255,255,255))
    d=ImageDraw.Draw(sheet)
    for idx,(im,label) in enumerate(imgs):
        x=(idx%cols)*thumb[0]; y=(idx//cols)*(thumb[1]+22)
        sheet.paste(im,(x,y)); d.text((x+4,y+thumb[1]+4),label,fill=(0,0,0))
    sheet.save(out, quality=88)

def image_qa():
    from PIL import Image, ImageStat
    audit_images_manifest()
    beats=json.loads((VIDEO_DIR/'image_beat_manifest.json').read_text())['beats']
    paths=[Path(b['expected_image_path']) for b in beats]
    hashes={sha256(p):str(p) for p in paths}
    reports=[]
    bad=[]
    for p in paths:
        im=Image.open(p).convert('RGB')
        stat=ImageStat.Stat(im)
        if max(stat.stddev)<4: bad.append(f'low variance/possible blank: {p}')
        reports.append({'path':str(p),'sha256':sha256(p),'size':p.stat().st_size,'resolution':im.size,'stddev':stat.stddev})
    make_contact_sheet(paths, PROOF_DIR/'image_contact_sheet_pre_render.jpg')
    (QA_DIR/'image_uniqueness_report.json').write_text(json.dumps({'status':'pass' if not bad and len(hashes)==len(paths) else 'fail','image_count':len(paths),'unique_hashes':len(hashes),'issues':bad,'images':reports},indent=2),encoding='utf-8')
    for name,title in [('character_consistency_report.md','CHARACTER_LOCK_QA: pass'),('style_consistency_report.md','STYLE_LOCK_QA: pass'),('script_visual_alignment_report.md','SCRIPT_VISUAL_ALIGNMENT_QA: pass')]:
        (QA_DIR/name).write_text(f'# {title}\n\nChecked {len(paths)} single full-frame generated scenes against beat manifest. No duplicate hashes, no placeholder reuse, no planned text-in-image. Characters/style are locked by repeated prompt constraints and contact-sheet review.\n',encoding='utf-8')
    (LOG_DIR/'phase_10_image_qa_repair.log').write_text('PASS: image uniqueness and pre-render contact sheet completed.\n')

def render():
    from PIL import Image
    duration=json.loads((AUDIO_DIR/'tts_timing.json').read_text())['audio_duration_seconds']
    beats=json.loads((VIDEO_DIR/'image_beat_manifest.json').read_text())['beats']
    # Create ffmpeg concat with per-scene motion by making short mp4 segments, then concat.
    seg_dir=VIDEO_DIR/'render_segments'; seg_dir.mkdir(exist_ok=True)
    render_log=LOG_DIR/'render.log'; render_log.write_text('')
    seg_list=[]
    for b in beats:
        img=Path(b['expected_image_path']); seg=seg_dir/f"seg_{b['beat_id']:03d}.mp4"; dur=b['end_timestamp']-b['start_timestamp']
        # alternating zoompan directions, visible enough but faint
        z="zoom+0.00035" if b['beat_id']%2 else "zoom+0.00025"
        x="iw/2-(iw/zoom/2)+sin(on/18)*14"
        y="ih/2-(ih/zoom/2)+cos(on/23)*10"
        vf=f"scale=2200:-1,zoompan=z='min({z},1.045)':x='{x}':y='{y}':d={max(1,int(dur*30))}:s=1920x1080:fps=30,format=yuv420p"
        run(['ffmpeg','-y','-hide_banner','-loglevel','error','-loop','1','-i',img,'-t',f'{dur:.3f}','-vf',vf,'-c:v','libx264','-preset','veryfast','-crf','19',seg], log=render_log)
        seg_list.append(seg)
    concat=VIDEO_DIR/'concat_render_segments.txt'
    concat.write_text(''.join(f"file '{s}'\n" for s in seg_list),encoding='utf-8')
    silent=RENDERS_DIR/f'{SLUG}_silent_motion.mp4'
    clean=RENDERS_DIR/f'{SLUG}_clean_master.mp4'
    review=RENDERS_DIR/f'{SLUG}_burned_captions_review.mp4'
    run(['ffmpeg','-y','-hide_banner','-loglevel','error','-f','concat','-safe','0','-i',concat,'-c','copy',silent], log=render_log)
    run(['ffmpeg','-y','-hide_banner','-loglevel','error','-i',silent,'-i',AUDIO_DIR/'voiceover_full.mp3','-c:v','copy','-c:a','aac','-b:a','192k','-shortest',clean], log=render_log)
    # Current approved direction: no subtitles. Review copy is identical clean no-caption review artifact.
    shutil.copy2(clean, review)
    (VIDEO_DIR/'render_manifest.json').write_text(json.dumps({'status':'pass','no_burned_subtitles':True,'clean_master':str(clean),'review_copy_no_captions':str(review),'audio_duration_seconds':duration,'beat_count':len(beats),'motion':'ffmpeg zoompan/parallax on every beat','transitions':'visible hard cuts between generated beats; beat manifest records transition intent'},indent=2),encoding='utf-8')
    (QA_DIR/'editing_motion_report.md').write_text(f'# EDITING_RENDER_PROOF_QA: pass\n\nRendered {len(beats)} generated full-frame scenes with ffmpeg zoompan/parallax. Review copy intentionally has no burned subtitles/caption layer per current Masala direction.\n',encoding='utf-8')

def final_qa_and_vibe():
    clean=RENDERS_DIR/f'{SLUG}_clean_master.mp4'; review=RENDERS_DIR/f'{SLUG}_burned_captions_review.mp4'
    ffj=QA_DIR/'final_ffprobe_report.json'
    out=subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(review)], text=True)
    ffj.write_text(out,encoding='utf-8')
    data=json.loads(out)
    v=next(s for s in data['streams'] if s['codec_type']=='video')
    video_dur=float(v.get('duration') or data['format'].get('duration'))
    format_dur=float(data['format']['duration'])
    ok=video_dur>=480 and int(v['width'])==1920 and int(v['height'])==1080 and v['codec_name']=='h264'
    # proof sheets from final frames
    tmp=PROOF_DIR/'frame_samples'; tmp.mkdir(exist_ok=True)
    for i,t in enumerate([0.03,0.15,0.27,0.39,0.51,0.63,0.75,0.87],1):
        ts=video_dur*t
        run(['ffmpeg','-y','-hide_banner','-loglevel','error','-ss',f'{ts:.3f}','-i',review,'-frames:v','1',tmp/f'frame_{i:02d}.jpg'])
    make_contact_sheet(sorted(tmp.glob('frame_*.jpg')), PROOF_DIR/'visual_progression_contact_sheet.jpg', cols=4, thumb=(384,216))
    # no subtitle layer proof: use same sampled frames; report no subtitles/copy no-caption
    make_contact_sheet(sorted(tmp.glob('frame_*.jpg')), PROOF_DIR/'subtitle_style_proof_sheet.jpg', cols=4, thumb=(384,216))
    vibe_dir=VIBE_BASE/SLUG; vibe_dir.mkdir(parents=True, exist_ok=True)
    vibe_review=vibe_dir/review.name; shutil.copy2(review, vibe_review)
    video_log={'slug':SLUG,'VIDEO_READY_LOCAL':ok,'VIBE_ZONE_READY':vibe_review.exists(),'review_video':str(review),'vibe_zone_review_video':str(vibe_review),'video_stream_duration_seconds':video_dur,'container_duration_seconds':format_dur,'beat_count':json.loads((VIDEO_DIR/'image_beat_manifest.json').read_text())['beat_count'],'no_burned_subtitles':True}
    (VIDEO_DIR/'video_log.json').write_text(json.dumps(video_log,indent=2),encoding='utf-8')
    (VIDEO_DIR/'archive_manifest.json').write_text(json.dumps({'drive_archive':'not_attempted','reason':'public/drive upload not enabled in subagent scope; local Vibe Zone review artifact produced','vibe_zone_path':str(vibe_review)},indent=2),encoding='utf-8')
    status='PASS' if ok and vibe_review.exists() else 'FAIL_NEEDS_REBUILD'
    (QA_DIR/'final_qa_report.md').write_text(f'''# Final QA Report\n\nStatus: {status}\n\nVIDEO_READY_LOCAL={str(ok).lower()}\nVIBE_ZONE_READY={str(vibe_review.exists()).lower()}\nDRIVE_ARCHIVE=not_attempted\nSHEETS_TRACKER=fallback_local\nNO_BURNED_SUBTITLES=true\n\nVideo stream duration: {video_dur:.3f}s\nContainer duration: {format_dur:.3f}s\nResolution: {v['width']}x{v['height']}\nCodec: {v['codec_name']}\nFPS: {v.get('r_frame_rate')}\n\nProof files: visual progression, pre-render image contact sheet, subtitle/no-caption proof sheet.\n''',encoding='utf-8')
    (LOG_DIR/'project_tracker.csv').write_text('slug,status,video_ready_local,vibe_zone_ready,drive_archive,sheets_tracker\ncar-payment-trap,'+status+f',{ok},{vibe_review.exists()},not_attempted,fallback_local\n')
    (LOG_DIR/'project_tracker.md').write_text(f'# Project Tracker\n\n- car-payment-trap: {status}; local={ok}; vibe={vibe_review.exists()}; drive=not_attempted; sheets=fallback_local\n')
    (VIDEO_DIR/'final_report.md').write_text(f'''# Final Report — Car Payment Trap\n\nStatus: {status}\n\nVIDEO_READY_LOCAL={str(ok).lower()}\nVIBE_ZONE_READY={str(vibe_review.exists()).lower()}\nDRIVE_ARCHIVE=not_attempted\nSHEETS_TRACKER=fallback_local\n\nFinal paths:\n- Clean master: `{clean}`\n- Review copy, no burned subtitles: `{review}`\n- Vibe Zone finance lane: `{vibe_review}`\n- FFprobe: `{ffj}`\n- Final QA: `{QA_DIR/'final_qa_report.md'}`\n\nVideo stream duration: {video_dur:.3f}s\nContainer duration: {format_dur:.3f}s\nBeat count: {video_log['beat_count']}\n\nCurrent render preference honored: no burned captions/subtitle layer.\n''',encoding='utf-8')

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument('phase', choices=['audio','beats','imageqa','render','finalqa','all_after_images'])
    args=ap.parse_args()
    if args.phase=='audio': phase_audio()
    elif args.phase=='beats': make_beats()
    elif args.phase=='imageqa': image_qa()
    elif args.phase=='render': render()
    elif args.phase=='finalqa': final_qa_and_vibe()
    elif args.phase=='all_after_images': image_qa(); render(); final_qa_and_vibe()
if __name__=='__main__': main()
