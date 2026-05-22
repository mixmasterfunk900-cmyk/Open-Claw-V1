# Planner Queue

## Active intake rule — 2026-05-15
Telegram/direct requests should route through Planner first, with Controller as the QA/routing fallback. Do not revive old cron loops unless Masala explicitly asks.

Current reset posture:
- Localhost Vibe Zone frontend/API should stay live.
- Website, templates, code, confirmed template docs, reusable assets, and product framework stay intact.
- Old automation loops stay disabled while Masala designs the new logic system.
- Terminal/grid bots are primary comms.
