# Vibe Zone

Vibe Zone is Masala's local-first livestream/product control room. The first version is a Vite + React single-page app with page-style navigation, mock data, and no external write actions.

## Pages included

- Dashboard
- Clip Factory
- Viral Research
- Studio Feedback
- Social Dashboard
- Live Chat Co-Pilot
- Rex Activity / Jobs
- Settings

## Quick start

```bash
cd vibe-zone
npm install
npm run dev
```

Local URL: <http://localhost:5173>

## Verification commands

```bash
npm run lint
npm run build
npm run dev -- --host 127.0.0.1
```

## Architecture

- `src/App.tsx` contains the current mock data, navigation model, and page components.
- `src/App.css` contains the dashboard layout and responsive UI styling.
- `src/index.css` contains global browser defaults.
- No backend yet. The prototype is intentionally local/static so it is cheap to run and stream-safe.

## Environment variables

No environment variables are required for this version.

Planned examples for later:

```bash
VITE_APP_MODE=local
VITE_ENABLE_MOCKS=true
VITE_API_BASE_URL=http://localhost:8787
```

Keep real API keys in `.env.local`; never commit secrets. External posting/login integrations should stay draft-only until explicit human approval workflows exist.

## Cheap/local-first direction

Start with mock data and browser/local files. Add persistent storage only when the workflow is proven:

1. JSON files or SQLite for local state.
2. Small local API for transcript/clip processing.
3. Optional integrations for OBS, Twitch/YouTube chat, GitHub issues, and social draft exports.
4. Cloud services only when a specific workflow needs them.

## Next steps

- Split mock data into `src/data`.
- Add local persistence for jobs, clips, and draft posts.
- Add transcript import and clip candidate scoring.
- Add stream-safe redaction warnings around logs/config screens.
- Add automated tests once interactions become stateful.
