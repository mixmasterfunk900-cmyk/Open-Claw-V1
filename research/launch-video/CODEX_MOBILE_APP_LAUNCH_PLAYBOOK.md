# Codex Mobile App Launch Playbook

Source to review: https://www.youtube.com/watch?v=BMMcmmnjrM8

Video title from YouTube oEmbed: **How to Build Mobile Apps with Claude Code: Full Course (2026)** by Nick Saraev.

Note: the VPS is currently blocked by YouTube for transcript/video extraction, so this is a Codex-adapted working playbook scaffold. Update it with the full transcript once available.

## Goal

Use Codex as the main coding agent for launching mobile apps quickly, safely, and repeatedly.

## Default launch workflow

1. **Product brief**
   - Problem, target user, core promise.
   - 3-5 must-have screens.
   - 1 monetization idea.
   - What success looks like in the first week.

2. **PRD + acceptance criteria**
   - Convert the idea into a buildable spec.
   - Define app flows, edge cases, and launch constraints.
   - Keep the first version brutally small.

3. **Tech choice**
   - Prefer Expo / React Native for fast cross-platform apps.
   - Use Firebase/Supabase only when needed.
   - Local mock data first where possible.
   - Avoid overbuilding backend before the app loop is proven.

4. **Codex build loop**
   - Ask Codex to scaffold the app.
   - Build one screen/flow at a time.
   - Run tests/typecheck/build after every meaningful change.
   - Commit often with clear messages.

5. **Preview and QA**
   - Run on device/simulator.
   - Check onboarding, auth, core action, paywall/free flow, settings.
   - Capture screenshots for store listing.

6. **Launch prep**
   - App name, icon, screenshots, short description, long description.
   - Privacy policy / terms if collecting data.
   - App Store / Play Store metadata.
   - TestFlight/Internal testing first.

7. **Marketing loop**
   - Build in public.
   - Clip the build process.
   - Generate TikTok/Shorts/X content from the development story.
   - Use Vibe Zone to track clips and launch assets.

## Codex prompt pattern

```text
You are building [APP NAME], a mobile app for [TARGET USER].

Goal:
[ONE SENTENCE PROMISE]

MVP screens:
1. ...
2. ...
3. ...

Constraints:
- Use Expo + React Native unless there is a strong reason not to.
- Keep the first version simple and shippable.
- No secrets committed.
- Add README run instructions.
- Run typecheck/build where possible.
- Commit changes with clear messages.

Start by creating a concise build plan, then implement the first working version.
```

## How this connects to Vibe Zone

- Vibe Zone should become the launch HQ for app projects.
- Each app gets: idea brief, build status, launch checklist, content clips, store assets, and post-launch metrics.
- Rex/Codex can build the app while Vibe Zone tracks the public launch workflow.

## Still needed from the video

- Exact recommended toolchain.
- Any store submission shortcuts.
- Claude-specific steps to translate into Codex equivalents.
- Any mobile-specific pitfalls mentioned by the creator.
