# Topic Discovery Extension

Masala approved adding Rex's recommendation to the Finance SOP without removing anything else.

This extension is now embedded in the canonical SOP as **Phase -1 — Topic Discovery & Duplicate Ledger Check**.

Core behavior:
- If Masala provides a topic/title, start at Phase 0 as originally written.
- If Masala asks for a Finance video without a topic/title, run Phase -1 first.
- Phase -1 discovers, scores, and selects a non-duplicate topic automatically.
- The title/topic ledger must be checked before selection and updated after production.

Canonical ledger files:
- `logs/title_topic_ledger.json`
- `logs/title_topic_ledger.md`
