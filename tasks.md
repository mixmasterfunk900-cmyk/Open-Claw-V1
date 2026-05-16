# T‑REX Agent Lab Tasks

Persistent backlog for the ongoing Ralph loop. Do not mark the project complete until Masala explicitly says the lab is done.

## Phase 1 — Foundation
- [x] Create `trex-agent-lab.html`, `style.css`, and `script.js`.
- [x] Build semantic app shell: lab board, brain inspector, T‑rex evolution strip.
- [x] Seed initial task backlog and changelog.

## Phase 2 — Agent Model + Board
- [x] Define mock agent objects with id, name, role, tile position, status, level, XP, task, modules, and logs.
- [x] Render a 12×8 board with positioned clickable agent characters.
- [x] Add selected/hover/status visuals for agents.

## Phase 3 — Brain Inspector
- [x] Show placeholder when no agent is selected.
- [x] Render selected agent name, role, status, task, level/XP, modules, and logs.
- [x] Keep inspector synced as simulation changes selected agent.

## Phase 4 — Simulation + T‑rex Evolution
- [x] Add fake simulation loop for movement, status changes, task completion, XP, levels, and logs.
- [x] Add global task counters and T‑rex XP/level/mood/progress.
- [x] Provide a clear `updateAgentsFromState(newState)` integration hook for future backend data.

## Phase 5 — Accessibility + Responsiveness
- [x] Make layout responsive for desktop and mobile.
- [x] Add accessible labels/buttons/status text.
- [x] Respect reduced motion for animations.

## Phase 6 — Live Dashboard Integration
- [x] Mount T‑REX Agent Lab into the actual Rex Command Center dashboard, not only the standalone HTML prototype.
- [x] Add live dashboard styling for the habitat board, Brain Inspector, XP meter, and animated agents.
- [x] Validate Vibe Zone build and confirm localhost Vite serves the new component/CSS.

## Phase 7 — Polish / Next Iterations
- [ ] Add richer agent brain views: memory nodes, active prompt preview, tool permissions.
- [ ] Add real event timeline/global log console.
- [ ] Add drag/select command actions for agents.
- [ ] Add save/load mock state via localStorage.
- [ ] Add backend adapter stub docs for `/agents/state` or WebSocket.
- [ ] Add more T‑rex evolution forms/visual upgrades.
- [ ] Add visual regression checklist/screenshots.
- [ ] Browser visual check pending: OpenClaw browser control was disabled during initial build, so v1 was checked with static validation + local HTTP probe only.

## Changelog
- 2026-05-15: Integrated T‑REX Agent Lab into the live Rex Command Center (`vibe-zone/src/RexLiveRoadmap.tsx` + `src/App.css`) after Masala reported the dashboard looked unchanged. Validation: `npm run build` passed, localhost `5173` source probe shows `TrexAgentLabDashboard`, CSS probe shows `.trex-live-lab`, and `graphify update .` completed.
- 2026-05-15: Initial v1 built: dark lab board, clickable Sim-style agents, inspector, fake simulation loop, T‑rex evolution strip, responsive/accessibility baseline. Validation: `node --check script.js`, HTML/CSS reference checks, and local HTTP 200 probe passed. Browser visual check blocked by disabled OpenClaw browser control.
- 2026-05-15: Vibe Zone Day 4 upload-drive package rendered from `_R2pPID8N-o`: 5 Confirmed Template #1 shorts, one long-form montage, seed thumbnails, UI/data registration, contact-sheet + border/caption QA. Ready files live under `vibe-zone/media/exports/READY_TO_SHIP_NOW/`; report: `vibe-zone/media/reviews/day4-package-20260515T1310Z/report.json`.
