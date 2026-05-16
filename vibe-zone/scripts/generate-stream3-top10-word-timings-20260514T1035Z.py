#!/usr/bin/env python3
import json, subprocess, pathlib, re, sys
import whisper

root = pathlib.Path(__file__).resolve().parents[1]
source = root / 'media/downloads/Day 3 - Addicted to vibe coding LIVE.mp4'
candidates_path = root / 'media/exports/stream3-top10-short-candidates-20260514T0930Z.json'
stamp = '20260514T1035Z'
out_dir = root / 'media/transcripts/stream3-top10-word-timings-20260514T1035Z'
out_dir.mkdir(parents=True, exist_ok=True)
work_dir = root / 'media/tmp/stream3-top10-word-timings-20260514T1035Z'
work_dir.mkdir(parents=True, exist_ok=True)

def seconds(value):
    if isinstance(value, (int, float)): return float(value)
    parts = [float(p) for p in str(value).split(':')]
    if len(parts) == 3: return parts[0]*3600 + parts[1]*60 + parts[2]
    if len(parts) == 2: return parts[0]*60 + parts[1]
    return parts[0]

def slug(value):
    return re.sub(r'(^-|-$)', '', re.sub(r'[^a-z0-9]+', '-', value.lower()))

def clean_word(value):
    return re.sub(r"^[\-–—]+|[\-–—]+$", '', re.sub(r"[^\w'\-]", '', value or '', flags=re.UNICODE)).upper()

candidates = json.loads(candidates_path.read_text())['candidates'][:10]
print('loading whisper base...', flush=True)
model = whisper.load_model('base')
manifest = []
for c in candidates:
    start = seconds(c['start']); end = seconds(c['end']); duration = end - start
    safe = slug(c['id'].replace('stream3_', 'day3-'))
    audio = work_dir / f"{c['rank']:02d}-{safe}.wav"
    subprocess.run(['ffmpeg','-y','-v','error','-ss',str(start),'-t',str(duration),'-i',str(source),'-vn','-ac','1','-ar','16000','-c:a','pcm_s16le',str(audio)], check=True)
    result = model.transcribe(str(audio), language='en', fp16=False, word_timestamps=True, initial_prompt='Build-in-public livestream about AI tools, streaming platforms, clip generation, and Vibe Zone. Use proper punctuation.')
    words = []
    for seg in result.get('segments', []):
        for w in seg.get('words', []) or []:
            text = clean_word(w.get('word') or w.get('text') or '')
            if not text or text == 'AI':
                continue
            s = max(0.0, float(w.get('start', 0)))
            e = min(duration, float(w.get('end', s)))
            if e <= s:
                continue
            words.append({'start': round(s, 3), 'end': round(e, 3), 'text': text})
    out = out_dir / f"{c['rank']:02d}-{safe}.words.json"
    payload = {'candidateId': c['id'], 'rank': c['rank'], 'start': c['start'], 'end': c['end'], 'duration': duration, 'text': result.get('text','').strip(), 'words': words}
    out.write_text(json.dumps(payload, indent=2) + '\n')
    manifest.append({'rank': c['rank'], 'candidateId': c['id'], 'path': str(out.relative_to(root)), 'wordCount': len(words), 'duration': duration, 'text': payload['text']})
    print(f"{c['rank']}/10 {safe}: {len(words)} words", flush=True)
(root / 'media/transcripts/stream3-top10-word-timings-20260514T1035Z/manifest.json').write_text(json.dumps({'createdAt': stamp, 'items': manifest}, indent=2) + '\n')
print(json.dumps({'count': len(manifest), 'manifest': 'media/transcripts/stream3-top10-word-timings-20260514T1035Z/manifest.json'}, indent=2))
