# Controller Queue

## Active gate — 2026-05-15
Controller overlaps with Planner for routing/QA. Use this lane to verify Telegram intake, prevent duplicate bot work, and protect shipped assets/templates from destructive cleanup.

Current reset posture:
- No destructive purge of website/templates/code/framework.
- Uploaded media cleanup only after explicit confirmation.
- Old cron loops should remain disabled unless Masala explicitly asks.
