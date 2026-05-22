# 01 — Topic Discovery & Ledger

Runs when no topic/title is provided.

## Must do

- Generate at least 10 finance topic candidates across two independent passes.
- Score each by CPM fit, viewer pain, Laura/John generational gap, citation strength, title/thumbnail potential, evergreen/timely value, and duplicate risk.
- Check `logs/title_topic_ledger.json` and `logs/title_topic_ledger.md` before selecting.
- Reject exact and near-duplicate topics, titles, stat bombs, or core angles.
- Select one non-duplicate topic that can support at least 8 minutes.

## Must not do

- Do not reuse a completed/materially-started topic.
- Do not choose generic “budgeting” style topics without a sharp angle.
- Do not proceed without ledger check.

## Required files

- `logs/topic_discovery_candidates.md`
- `logs/title_topic_ledger.json`
- `logs/title_topic_ledger.md`
- `${VIDEO_DIR}/topic_discovery_decision.md`
- `${VIDEO_DIR}/logs/phase_01_topic_discovery.log`

## Pass criteria

- At least 10 candidates reviewed.
- Selected candidate duplicate risk <= 2.
- Selected topic has credible citation sources.
- Selected topic has strong Laura/John tension.
- Ledger is updated as `in_progress` once topic/title is locked.
