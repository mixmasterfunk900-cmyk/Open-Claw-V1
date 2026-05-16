# TOOLS.md - Local Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## What Goes Here

Things like:

- Camera names and locations
- SSH hosts and aliases
- Preferred voices for TTS
- Speaker/room names
- Device nicknames
- Anything environment-specific

## Graphify

- Graphify is installed in `/root/.openclaw/workspace/.venv-graphify` with CLI symlink `/root/.local/bin/graphify`.
- OpenClaw skill installed at `/root/.openclaw/skills/graphify/SKILL.md`.
- Vibe Zone has an AST-only graph at `vibe-zone/graphify-out/graph.json` and call-flow page `vibe-zone/graphify-out/vibe-zone-callflow.html`.
- Run from a project root: `graphify update .` for local AST graph refresh; use `graphify extract .` only when LLM API keys are available.

## Local Transcription

- Voice-note transcription is available locally via `/root/.openclaw/workspace/.venv-transcribe`.
- Run from workspace:

```bash
. .venv-transcribe/bin/activate
whisper /path/to/audio.ogg --model base --language en --output_format txt --output_dir transcripts
```

- `ffmpeg`, `python3-pip`, and `python3.12-venv` are installed on the host.
- Whisper model `base` has been downloaded once and should be reusable.

## Examples

```markdown
### Cameras

- living-room → Main area, 180° wide angle
- front-door → Entrance, motion-triggered

### SSH

- home-server → 192.168.1.100, user: admin

### TTS

- Preferred voice: "Nova" (warm, slightly British)
- Default speaker: Kitchen HomePod
```

## Why Separate?

Skills are shared. Your setup is yours. Keeping them apart means you can update skills without losing your notes, and share skills without leaking your infrastructure.

---

Add whatever helps you do your job. This is your cheat sheet.

## Related

- [Agent workspace](/concepts/agent-workspace)
