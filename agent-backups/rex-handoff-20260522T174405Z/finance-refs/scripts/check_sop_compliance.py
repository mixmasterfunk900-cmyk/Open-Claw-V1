#!/usr/bin/env python3
"""Finance SOP compliance gate.

This is intentionally conservative. It prevents the Director from marking a video
ready when required SOP evidence is missing or known failure patterns are present.

Usage:
  python scripts/check_sop_compliance.py --video-dir videos/<slug> --phase 08
  python scripts/check_sop_compliance.py --video-dir videos/<slug> --phase final

Exit codes:
  0 = pass
  1 = fail
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path
from typing import Any

PHASE_REQUIREMENTS: dict[str, list[str]] = {
    "01": ["logs/phase_01_topic_discovery.log"],
    "02": ["production_manifest.json"],
    "03": ["title_thumbnail_concepts.md"],
    "04": ["script_approved.md", "voiceover_script_clean.md"],
    "05": ["audio/voiceover_full.wav"],
    "06": ["character_lock.json", "qa/character_consistency_report.md"],
    "07": ["style_lock.json", "qa/style_consistency_report.md"],
    "08": ["scene_manifest.json", "image_beat_manifest.json", "scene_tagged_script.md"],
    "09": ["image_prompt_manifest.json", "image_generation_manifest.json"],
    "10": ["qa/image_uniqueness_report.json", "qa/script_visual_alignment_report.md", "qa/character_consistency_report.md", "qa/style_consistency_report.md", "proof/image_contact_sheet_pre_render.jpg"],
    "11": ["editing_plan.json"],
    "12": ["renders"],
    "13": [],
    "14": ["qa/final_ffprobe_report.json", "qa/final_qa_report.md"],
    "15": ["final_report.md"],
    "16": ["logs/project_tracker.csv", "logs/project_tracker.md"],
}

KNOWN_LEGACY_REJECTED = {
    "rent-trap-broke-american-dream": "legacy pre-V5 output; not stick-animation upload-ready unless rebuilt through enforced V5 gates"
}

MULTI_SCENE_PROMPT_RE = re.compile(
    r"\b(create|generate|make)\s+\d+\s+(separate\s+)?(images|scenes|frames)\b|\bscenes\s*:\s*1\)",
    re.I,
)


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def ffprobe_duration(path: Path) -> float | None:
    try:
        out = subprocess.check_output([
            "ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", str(path)
        ], text=True).strip()
        return float(out)
    except Exception:
        return None


def ffprobe_video_duration(path: Path) -> float | None:
    try:
        out = subprocess.check_output([
            "ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=duration", "-of", "default=nw=1:nk=1", str(path)
        ], text=True).strip().splitlines()[0]
        return float(out)
    except Exception:
        return None


def require_files(video_dir: Path, phase: str, errors: list[str]) -> None:
    for rel in PHASE_REQUIREMENTS.get(phase, []):
        p = video_dir / rel
        if not p.exists():
            errors.append(f"missing required evidence for phase {phase}: {rel}")


def find_manifest(video_dir: Path, names: list[str]) -> Path | None:
    for name in names:
        p = video_dir / name
        if p.exists():
            return p
    # Some V5 runs store manifests in subdirs; allow discovery but report path.
    for name in names:
        hits = sorted(video_dir.glob(f"**/{name}"))
        if hits:
            return hits[0]
    return None


def check_legacy(video_dir: Path, errors: list[str]) -> None:
    slug = video_dir.name
    marker = video_dir / "REJECTED_LEGACY_NOT_UPLOAD_READY.md"
    if slug in KNOWN_LEGACY_REJECTED or marker.exists():
        errors.append(f"legacy/rejected output cannot be upload-ready: {slug} ({KNOWN_LEGACY_REJECTED.get(slug, marker)})")


def check_runtime(video_dir: Path, errors: list[str], min_runtime: float = 480.0) -> None:
    candidates = list(video_dir.glob("**/*.mp4"))
    if not candidates:
        errors.append("no mp4 render found")
        return
    # Prefer review/burned caption files, otherwise longest mp4.
    scored = []
    for p in candidates:
        dur = ffprobe_duration(p)
        if dur:
            priority = 2 if re.search(r"review|burned|caption", p.name, re.I) else 1
            scored.append((priority, dur, p))
    if not scored:
        errors.append("could not ffprobe any mp4 render")
        return
    _, dur, p = max(scored, key=lambda x: (x[0], x[1]))
    vdur = ffprobe_video_duration(p)
    if dur < min_runtime:
        errors.append(f"container/runtime below {min_runtime:.0f}s: {dur:.2f}s ({p})")
    if vdur is None:
        errors.append(f"could not read video stream duration: {p}")
    elif vdur < min_runtime:
        errors.append(f"video stream duration below {min_runtime:.0f}s: {vdur:.2f}s ({p})")


def iter_manifest_items(data: Any) -> list[dict[str, Any]]:
    if isinstance(data, list):
        return [x for x in data if isinstance(x, dict)]
    if isinstance(data, dict):
        for key in ("items", "beats", "images", "scenes", "manifest"):
            val = data.get(key)
            if isinstance(val, list):
                return [x for x in val if isinstance(x, dict)]
    return []


def check_beat_cadence(video_dir: Path, errors: list[str], min_beats: int = 96) -> None:
    p = find_manifest(video_dir, ["image_beat_manifest.json", "v5_full_4to6s_beat_manifest.json", "scene_manifest.json"])
    if not p:
        errors.append("missing beat manifest for cadence check")
        return
    data = load_json(p)
    items = iter_manifest_items(data)
    if not items:
        errors.append(f"beat manifest has no item list: {p}")
        return
    bad = []
    durations = []
    for i, item in enumerate(items, start=1):
        start = item.get("start_timestamp", item.get("start", item.get("start_time")))
        end = item.get("end_timestamp", item.get("end", item.get("end_time")))
        try:
            dur = float(end) - float(start)
        except Exception:
            continue
        durations.append(dur)
        hold = str(item.get("type", "")).upper() == "HOLD" or item.get("hold_reason")
        if not hold and not (4.0 <= dur <= 6.0):
            bad.append((i, dur))
    if not durations:
        errors.append(f"could not read beat durations from {p}")
    elif bad:
        errors.append(f"visual beat cadence fail; {len(bad)} beats outside 4-6s, examples: {bad[:8]}")
    if len(items) < min_beats:
        errors.append(f"beat count too low for required cadence/profile: {len(items)} < {min_beats}")


def check_image_generation(video_dir: Path, errors: list[str], min_images: int = 96) -> None:
    p = find_manifest(video_dir, ["image_generation_manifest.json", "v5_full_4to6s_image_generation_manifest.json"])
    if not p:
        errors.append("missing image generation manifest")
        return
    data = load_json(p)
    items = iter_manifest_items(data)
    if not items and isinstance(data, dict) and "final_frame_files" in data:
        # Summary-only manifest is not enough for future upload-ready status.
        errors.append(f"image generation manifest is summary-only; per-beat provenance required: {p}")
        return
    if not items:
        errors.append(f"image generation manifest has no per-beat items: {p}")
        return
    hashes: dict[str, int] = {}
    for idx, item in enumerate(items, start=1):
        prompt = str(item.get("prompt", item.get("unique_prompt", "")))
        if MULTI_SCENE_PROMPT_RE.search(prompt):
            errors.append(f"multi-scene/batch prompt forbidden at item {idx}: {prompt[:120]}")
        if item.get("fallback_used") and not item.get("debug_report"):
            errors.append(f"fallback used without debug report at item {idx}")
        provider = str(item.get("provider", "")).lower()
        model = str(item.get("model", "")).lower()
        if not provider and not model:
            errors.append(f"missing provider/model at image item {idx}")
        rel = item.get("image_path") or item.get("frame") or item.get("path")
        if rel:
            img = Path(rel)
            if not img.is_absolute():
                img = video_dir / img
            if img.exists():
                h = item.get("sha256") or sha256(img)
                hashes[h] = hashes.get(h, 0) + 1
            else:
                errors.append(f"missing image file at item {idx}: {img}")
    dupes = [h for h, n in hashes.items() if n > 1]
    if dupes:
        errors.append(f"duplicate image hashes found: {len(dupes)}")
    if len(items) < min_images:
        errors.append(f"image count too low for required cadence/profile: {len(items)} < {min_images}")


def check_reports_no_false_pass(video_dir: Path, errors: list[str]) -> None:
    catastrophic = re.compile(r"catastrophic|complete fail|rejected|legacy|not upload-ready|not review-ready|collage|2x2|four.image|style drift|character drift|duplicated|unapproved reuse|cycled", re.I)
    pass_word = re.compile(r"\bPASS\b|VIDEO_READY_LOCAL\s*[:=]\s*true|VIBE_ZONE_READY\s*[:=]\s*true", re.I)
    for p in list((video_dir / "qa").glob("*.md")) + list(video_dir.glob("*REPORT*.md")) + list(video_dir.glob("final_report.md")):
        txt = p.read_text(errors="ignore")
        if pass_word.search(txt) and catastrophic.search(txt):
            errors.append(f"report appears to claim PASS while containing catastrophic/rejected terms: {p}")


def check_vibe_lane(video_dir: Path, errors: list[str]) -> None:
    final = video_dir / "final_report.md"
    if final.exists():
        txt = final.read_text(errors="ignore")
        if "media/exports/rent-trap-broke-american-dream" in txt:
            errors.append("final report points to legacy rent-trap export lane")
        if "finance-content" not in txt and "Vibe Zone" in txt:
            errors.append("final report mentions Vibe Zone but not Finance content lane")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--video-dir", required=True)
    ap.add_argument("--phase", required=True, help="01..17 or final")
    ap.add_argument("--profile", choices=["full", "smoke60"], default="full", help="full=enforce >=480s/96+ beats; smoke60=enforce >=55s/11+ beats for SOP smoke tests only")
    args = ap.parse_args()
    video_dir = Path(args.video_dir).resolve()
    errors: list[str] = []

    if not video_dir.exists():
        errors.append(f"video dir does not exist: {video_dir}")
    else:
        phase = args.phase.lower()
        if phase != "final":
            require_files(video_dir, phase.zfill(2), errors)
        else:
            check_legacy(video_dir, errors)
            for ph in ["02", "04", "08", "09", "10", "12", "14", "15", "16"]:
                require_files(video_dir, ph, errors)
            if args.profile == "smoke60":
                min_runtime = 55.0
                min_beats = 11
                min_images = 11
            else:
                min_runtime = 480.0
                min_beats = 96
                min_images = 96
            check_runtime(video_dir, errors, min_runtime=min_runtime)
            check_beat_cadence(video_dir, errors, min_beats=min_beats)
            check_image_generation(video_dir, errors, min_images=min_images)
            check_reports_no_false_pass(video_dir, errors)
            check_vibe_lane(video_dir, errors)

    if errors:
        print("SOP_COMPLIANCE: FAIL")
        for e in errors:
            print(f"- {e}")
        return 1
    print("SOP_COMPLIANCE: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
