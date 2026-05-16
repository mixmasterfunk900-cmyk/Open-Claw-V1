# OpenClaw Grid Coordination

Operating model:
- CEO Bot owns final direction and priority.
- Planner Bot is the primary intake/router for new Telegram/user requests and turns goals into queue items for section bots.
- Controller Bot overlaps with Planner as the safety/QA gate: use it for routing ambiguous intake, checking overlaps, and recording accepted updates.
- Section bots own their lane and write handoffs before claiming work is shipped.

Condensed lanes:
- Rex Bot: Rex Live Roadmap + Rex Activity/Jobs.
- Core App Bot: Dashboard + Settings + shared navigation/control-room UX.
- Media Factory Bot: Media Pipeline + Clip Factory + Viral Hunter.
- YouTube Bot: treat as social-media/packaging lane for now; coordinate with Social Live instead of acting as a separate strategy owner.
- Social Live Bot: Social Dashboard + Social Connections + Live Chat Co-Pilot + Studio Feedback.

Rules:
1. Before editing shared files, check this coordination record and relevant queue notes.
2. Do not overwrite another bot's in-progress work.
3. Record shipped summaries in .openclaw-grid/handoffs/<bot>.md.
4. Controller Bot promotes clean summaries into .openclaw-grid/master/ship-log.md.
5. CEO Bot uses this folder as the operating picture.
