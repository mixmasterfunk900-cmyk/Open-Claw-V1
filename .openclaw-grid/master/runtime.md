# Runtime Facts

Current Vibe Zone local dev URLs on the VPS:

- Frontend: http://127.0.0.1:5173/
- OpenClaw gateway: http://127.0.0.1:18789/

Do not guess ports like 5177 or 8799 unless a fresh `ss -ltnp` or project script confirms them.
For visual/browser/canvas checks, use the frontend URL above.
OpenClaw node host must be running for canvas/browser tools: `openclaw node status`.
