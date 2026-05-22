#!/usr/bin/env python3
"""Local open-source Qwen3-TTS smoke test.

Uses the OSS Hugging Face model, not DashScope/API:
  Qwen/Qwen3-TTS-12Hz-0.6B-CustomVoice

Run from workspace:
  . .venv-qwen-tts/bin/activate
  python youtube-automation-finance/scripts/qwen3_tts_local_smoke.py \
    --text "Small payments are not automatically harmless." \
    --speaker Aiden \
    --out /tmp/qwen3_aiden.wav

Notes:
- English speakers listed by the model card: Ryan, Aiden.
- This machine currently has torch CUDA unavailable, so CPU inference may be very slow or memory-tight.
"""
from __future__ import annotations
import argparse
from pathlib import Path
import torch
import soundfile as sf
from qwen_tts import Qwen3TTSModel


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('--model', default='Qwen/Qwen3-TTS-12Hz-0.6B-CustomVoice')
    ap.add_argument('--text', required=True)
    ap.add_argument('--speaker', default='Aiden', choices=['Ryan','Aiden','Vivian','Serena','Uncle_Fu','Dylan','Eric','Ono_Anna','Sohee'])
    ap.add_argument('--language', default='English')
    ap.add_argument('--instruct', default='Warm, natural, conversational finance explainer voice. Not robotic. Clear pacing.')
    ap.add_argument('--out', default='qwen3_tts_local.wav')
    args = ap.parse_args()

    device = 'cuda:0' if torch.cuda.is_available() else 'cpu'
    dtype = torch.bfloat16 if torch.cuda.is_available() else torch.float32
    print({'device': device, 'dtype': str(dtype), 'model': args.model, 'speaker': args.speaker})

    model = Qwen3TTSModel.from_pretrained(
        args.model,
        device_map=device,
        dtype=dtype,
        # flash_attention_2 is faster but unavailable on this host.
        attn_implementation='sdpa' if torch.cuda.is_available() else 'eager',
    )
    wavs, sr = model.generate_custom_voice(
        text=args.text,
        language=args.language,
        speaker=args.speaker,
        instruct=args.instruct,
    )
    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    sf.write(out, wavs[0], sr)
    print(out)
    return 0

if __name__ == '__main__':
    raise SystemExit(main())
