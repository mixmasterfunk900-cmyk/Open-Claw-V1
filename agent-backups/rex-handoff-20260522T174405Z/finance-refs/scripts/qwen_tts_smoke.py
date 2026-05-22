#!/usr/bin/env python3
"""Qwen/Qwen3 TTS smoke test via Alibaba Cloud DashScope.

Requires:
  export DASHSCOPE_API_KEY=...

Examples:
  . .venv/bin/activate
  python scripts/qwen_tts_smoke.py --text "Hello from Laura and John." --voice Cherry --out /tmp/qwen_tts.mp3
  python scripts/qwen_tts_smoke.py --model qwen3-tts-instruct-flash --instructions "Warm, conversational, finance explainer narration." --text "Small payments are not automatically harmless." --voice Cherry --out /tmp/qwen_tts.mp3
"""
from __future__ import annotations
import argparse, base64, json, os, sys, urllib.request
from pathlib import Path

import dashscope


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('--text', required=True)
    ap.add_argument('--voice', default='Cherry')
    ap.add_argument('--model', default='qwen3-tts-flash')
    ap.add_argument('--instructions', default=None)
    ap.add_argument('--out', default='qwen_tts_output.mp3')
    ap.add_argument('--region', choices=['intl','cn'], default='intl')
    args = ap.parse_args()

    api_key = os.getenv('DASHSCOPE_API_KEY') or os.getenv('QWEN_API_KEY')
    if not api_key:
        print('Missing DASHSCOPE_API_KEY (or QWEN_API_KEY).', file=sys.stderr)
        return 2

    dashscope.base_http_api_url = 'https://dashscope-intl.aliyuncs.com/api/v1' if args.region == 'intl' else 'https://dashscope.aliyuncs.com/api/v1'

    kwargs = dict(model=args.model, api_key=api_key, text=args.text, voice=args.voice)
    if args.instructions:
        kwargs['instructions'] = args.instructions
        kwargs['optimize_instructions'] = True

    response = dashscope.MultiModalConversation.call(**kwargs)
    # DashScope responses have changed shapes over time; save metadata and try common audio fields.
    out = Path(args.out)
    meta = out.with_suffix(out.suffix + '.json')
    try:
        meta.write_text(json.dumps(response, default=lambda o: getattr(o, '__dict__', str(o)), indent=2), encoding='utf-8')
    except Exception:
        meta.write_text(str(response), encoding='utf-8')

    data = response if isinstance(response, dict) else getattr(response, '__dict__', {})
    audio_url = None
    audio_b64 = None

    def walk(x):
        nonlocal audio_url, audio_b64
        if isinstance(x, dict):
            for k, v in x.items():
                lk = str(k).lower()
                if isinstance(v, str):
                    if lk in {'url','audio_url','audio'} and v.startswith(('http://','https://')):
                        audio_url = audio_url or v
                    if lk in {'audio','audio_base64','base64'} and len(v) > 100 and not v.startswith('http'):
                        audio_b64 = audio_b64 or v
                walk(v)
        elif isinstance(x, list):
            for v in x:
                walk(v)

    walk(data)
    if audio_url:
        urllib.request.urlretrieve(audio_url, out)
        print(out)
        return 0
    if audio_b64:
        out.write_bytes(base64.b64decode(audio_b64))
        print(out)
        return 0

    print(f'No audio field found. Metadata saved to {meta}', file=sys.stderr)
    return 1

if __name__ == '__main__':
    raise SystemExit(main())
