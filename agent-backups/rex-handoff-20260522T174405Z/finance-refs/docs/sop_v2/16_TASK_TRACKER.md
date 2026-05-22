# 16 — Task Tracker

## Must do

- Create a project tracker named with the project/video name.
- Prefer Google Sheet in the provided Drive folder if credentials allow.
- Always maintain local CSV + Markdown fallback.
- Track every phase/task as one of:
  - `planned`
  - `in_progress`
  - `waiting`
  - `complete`
  - `blocked`

## Required local files

- `${VIDEO_DIR}/logs/task_tracker.csv`
- `${VIDEO_DIR}/logs/task_tracker.md`

## Required columns

- task_id
- phase
- task
- status
- owner
- started_at
- completed_at
- blocker
- output_path
- notes

## Pass criteria

- Tracker exists within first 10 minutes of run.
- Tracker is updated at every phase transition.
- If Google Sheet is unavailable, local tracker path is reported to Masala.
