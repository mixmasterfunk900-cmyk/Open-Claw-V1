# 02 — Project Initialisation

## Must do

- Select writable VPS project root.
- Create `${VIDEO_DIR}` and all required subdirectories.
- Create `production_manifest.json` before production work.
- Create or update the project tracker.

## Required directories

- `${VIDEO_DIR}/audio`
- `${VIDEO_DIR}/scenes`
- `${VIDEO_DIR}/renders`
- `${VIDEO_DIR}/qa`
- `${VIDEO_DIR}/logs`
- `${VIDEO_DIR}/proof`
- `${VIDEO_DIR}/thumbnail`

## Manifest must include

- SOP version: V2
- topic/title source
- selected topic
- winning title once chosen
- image model policy
- voice lock policy
- Drive folder id
- Vibe Zone destination
- phase status object
- QA gate status object

## Pass criteria

- Manifest exists and is valid JSON.
- Project tracker exists as local CSV/Markdown at minimum.
- No desktop/local-user paths are used.
