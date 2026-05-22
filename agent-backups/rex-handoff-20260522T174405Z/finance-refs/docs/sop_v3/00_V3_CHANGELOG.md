# Finance SOP V3 — Changelog

V3 purpose: make QA responsible for catching every known historical failure before Masala sees the output.

V3 builds on modular V2 and adds:

1. Historical Regression QA gates.
2. Mandatory 5-minute tracker updates by Reporting/Tracker Agent.
3. Explicit checkpoint schedule before irreversible/expensive downstream phases.
4. Final output quality remains the highest priority.

V3 does not loosen any V2 hard gate.
