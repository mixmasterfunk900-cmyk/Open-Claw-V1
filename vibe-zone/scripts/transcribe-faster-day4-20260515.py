#!/usr/bin/env python3
import json
from pathlib import Path
from faster_whisper import WhisperModel

root = Path(__file__).resolve().parents[1]
input_path = root / 'media/downloads/_R2pPID8N-o.mp4'
out_base = root / 'media/transcripts/_R2pPID8N-o'
out_base.parent.mkdir(parents=True, exist_ok=True)

model = WhisperModel('small', device='cpu', compute_type='int8')
segments_iter, info = model.transcribe(
    str(input_path),
    language='en',
    beam_size=5,
    vad_filter=True,
    word_timestamps=True,
    initial_prompt='Livestream about Vibe Zone, AI agents, OpenClaw, short-form clips, thumbnails, creator workflows, building a billion-dollar company. Use punctuation and paragraph breaks.',
)
segments = []
words = []
for idx, seg in enumerate(segments_iter):
    item = {
        'id': idx,
        'start': float(seg.start),
        'end': float(seg.end),
        'text': seg.text,
        'avg_logprob': getattr(seg, 'avg_logprob', None),
        'no_speech_prob': getattr(seg, 'no_speech_prob', None),
        'words': [],
    }
    for w in seg.words or []:
        word = {'start': float(w.start), 'end': float(w.end), 'word': w.word, 'probability': getattr(w, 'probability', None)}
        item['words'].append(word)
        words.append(word)
    segments.append(item)

text = ''.join(seg['text'] for seg in segments).strip()
payload = {'text': text, 'segments': segments, 'language': info.language, 'duration': info.duration, 'words': words}
(out_base.with_suffix('.json')).write_text(json.dumps(payload, ensure_ascii=False, indent=2) + '\n')
(out_base.with_suffix('.txt')).write_text(text + '\n')

def ts(sec):
    ms = int(round(sec * 1000))
    h, rem = divmod(ms, 3600000)
    m, rem = divmod(rem, 60000)
    s, milli = divmod(rem, 1000)
    return f'{h:02d}:{m:02d}:{s:02d},{milli:03d}'

def vtt_ts(sec):
    return ts(sec).replace(',', '.')

srt = []
vtt = ['WEBVTT', '']
for i, seg in enumerate(segments, 1):
    clean = ' '.join(seg['text'].split())
    srt.extend([str(i), f"{ts(seg['start'])} --> {ts(seg['end'])}", clean, ''])
    vtt.extend([f"{vtt_ts(seg['start'])} --> {vtt_ts(seg['end'])}", clean, ''])
(out_base.with_suffix('.srt')).write_text('\n'.join(srt))
(out_base.with_suffix('.vtt')).write_text('\n'.join(vtt))
(out_base.with_suffix('.words.json')).write_text(json.dumps({'words': words}, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'ok': True, 'segments': len(segments), 'words': len(words), 'duration': info.duration, 'output': str(out_base)}, indent=2))
