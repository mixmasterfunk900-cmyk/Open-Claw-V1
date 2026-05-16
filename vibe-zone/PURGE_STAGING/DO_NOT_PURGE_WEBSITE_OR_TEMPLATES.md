# Do not purge website/templates

Masala clarified on 2026-05-15 that “purge/reset” means the old automation should be idle and ready for a new logic system. It does **not** mean destroying the website, templates, code, product state, confirmed template docs, fonts/logos, or built framework.

Cancelled destructive apply script: `PURGE_STAGING/cancelled/apply-purge-20260515T1000Z.sh.cancelled`

Safe reset actions already done:
- Disabled old Vibe Zone cron loops.
- Stopped local dev/API stack.

Future cleanup should be conservative: archive/remove only uploaded media outputs after explicit confirmation, while preserving source code, templates, docs, settings, and reusable assets.
