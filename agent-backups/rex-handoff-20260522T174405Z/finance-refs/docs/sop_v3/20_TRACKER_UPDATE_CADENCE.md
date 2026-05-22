# 20 — Tracker Update Cadence

## Rule

The Reporting/Tracker Agent must update the project tracker every 5 minutes while a production run is active.

## Must do

- Update local CSV.
- Update local Markdown.
- Attempt Google Sheet/Drive sync.
- Do not block build agents while updating tracker.
- If Sheet sync fails, keep local tracker current and copy it to Drive when possible.

## Tracker freshness gate

Before final status or any long phase transition, check:

```json
{
  "tracker_last_updated_minutes_ago": 0,
  "tracker_fresh": true
}
```

If tracker is older than 5 minutes during an active run, set status:

`TRACKER_STALE_WAITING_FOR_UPDATE`

and update tracker before continuing to the next phase.
