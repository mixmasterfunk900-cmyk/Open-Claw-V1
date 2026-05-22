# Content HQ Master Plan

## North star

Vibe Zone is becoming Content HQ: a livestream-first creator operating system that turns every completed stream into a compounding content machine.

The creator should mainly focus on streaming and making good raw material. After the stream, Content HQ should ingest, analyze, package, distribute, measure, and reinforce the best ideas across platforms.

## Primary objective

Every livestream should become:

- Viral short-form clips.
- Long-form evergreen videos.
- Written posts, threads, articles, and newsletters.
- Audio/podcast assets.
- Community prompts and announcements.
- Searchable archive material.
- Audience-funnel assets for email, Discord, Patreon, memberships, and future products.

## Strategy priorities

1. Maximum leverage from each stream.
2. Multi-platform native distribution.
3. Short-form → long-form → owned-audience funnels.
4. Automation with clear review gates.
5. Platform-safe reposting and variant generation.
6. Analytics-driven reinforcement.
7. Creator voice consistency.
8. Local/cheap-first infrastructure until APIs are explicitly approved.

## Guardrails

- Drafts, schedules, and export bundles are safe by default.
- External posting, account actions, API keys, logins, cookies, and public writes require explicit approval until Masala changes that policy.
- Do not spam, impersonate, fake engagement, or evade platform enforcement.
- Platform-specific variants are allowed to make content native and avoid lazy duplicate reposting, but the system should stay compliant with platform rules.
- Never post unlabelled AI-simulated chat or audience activity.
- Use Masala's face/likeness only after approved reference images and explicit approval.

## End-to-end flow

### Input

- YouTube livestream URL, where public extraction is possible.
- Locally recorded stream/video upload.
- Future: OBS/local companion handoff after stream end.

### Outputs

- YouTube long-form uploads.
- YouTube Shorts.
- TikTok clips.
- Instagram Reels.
- Facebook Reels.
- X posts/threads.
- Reddit-ready discussion/value posts.
- Medium articles/blog exports.
- Substack posts/newsletters.
- Spotify/podcast audio assets.
- Discord announcements/prompts.
- Patreon exclusives/early access/archive drops.
- Searchable local archive.

## Core pipeline

### 1. Ingestion

- Detect completed streams.
- Download/import locally.
- Validate media integrity before processing.
- Transcribe with local Whisper first.
- Generate timestamps, chapters, and SRT/VTT/ASS captions.
- Optional future speaker diarization.
- Detect moments by transcript, audio, visual, and chat signals.

Moment signals to detect:

- Emotional spikes.
- Funny moments.
- Debates, arguments, reactions, hot takes.
- Story arcs and payoff moments.
- Quotable lines.
- Audience/chat engagement spikes.
- Clear educational value.
- Mistakes, surprises, wins, fails, and decisions.

### 2. Clip generation

Generate candidates at multiple lengths:

- 15s.
- 30s.
- 45s.
- 60s.
- 90s.
- Longer mid-form/highlight cuts where useful.

Each candidate should include:

- Hook/title variants.
- Platform target recommendations.
- Caption/subtitle style.
- Crop/layout recommendation.
- CTA/funnel recommendation.
- Suggested metadata and hashtags.

Clip quality priorities:

- Strong first 1–2 seconds.
- High retention probability.
- Clear curiosity gap.
- Readable captions in safe zones.
- Emotional intensity or practical usefulness.
- Replayability.
- Platform-native pacing.

### 3. Rendering

Render platform-native variants from clean masters.

Required presets:

- Shorts/TikTok/Reels 9:16 punchy captions.
- Clean/no-caption variant.
- Standard caption variant.
- Long-form 16:9 with chapters/captions.
- Facecam crop / 50-50 layout.
- Platform-specific variant pass for Facebook/Reels and repost testing.

Variant knobs:

- Crop/zoom timing.
- Intro frame/title card.
- Caption wording/style.
- Subtitle emphasis.
- Audio level normalization.
- Watermark-free clean exports.

### 4. Scoring and tiers

Score each clip by:

- Hook strength.
- Likely retention.
- Emotional engagement.
- Novelty.
- Controversy/discussion potential.
- Replayability.
- Platform suitability.
- Creator voice fit.
- Funnel value.

Rank as:

- S tier: publish/test first, create variants.
- A tier: publish/schedule.
- B tier: archive or niche/platform-specific use.
- Archive: searchable for future compilation/remix.

### 5. Distribution engine

Default mode: generate export bundles and schedules for human approval.

Future approved mode: use official APIs/schedulers where available, respecting rate limits and platform policies.

Primary short-form:

- YouTube Shorts.
- TikTok.
- Instagram Reels.
- Facebook Reels.

Secondary/social:

- X/Twitter.
- Reddit.
- Snapchat Spotlight.

Long-form/audio:

- YouTube long-form.
- Spotify/podcast feed.

Owned audience:

- Substack/email.
- Discord.
- Patreon.
- Membership/community CTAs.

Search/SEO:

- Medium/blog article export.
- Searchable archive.

## Platform rules

### YouTube long-form

- Evergreen titles.
- SEO metadata.
- Chapters.
- Thumbnail concepts and A/B board.
- Pinned comment drafts.
- CTA toward subscription, memberships, Discord, newsletter, Patreon, or relevant product.

### YouTube Shorts

- Only strongest short clips.
- Retention-first edits.
- Funnel toward full stream, long-form cut, or owned audience.

### TikTok

- Higher posting frequency.
- Multiple hook variants.
- Fast trend adaptation.
- Aggressive experiment tracking.

### Instagram Reels

- Cleaner captions and aesthetics.
- Optimize for shares/saves.
- Strong visual polish.

### Facebook Reels

- Do not repost exact TikTok watermarked exports.
- Use native clean renders.
- Create platform-specific variants: intro frame, captions, crop/zoom timing, audio normalization.
- Keep an original master export and render variants from that master.

### X/Twitter

- Generate quote posts, hooks, short opinion posts, and threads.
- Turn winning ideas into repeated angles without spamming.
- Use clips plus written context.

### Reddit

- Never spam or obvious self-promote.
- Generate subreddit-specific value-first framing.
- Adapt tone to subreddit culture.
- Prefer discussion prompts, lessons learned, and useful clips where allowed.

### Substack

- Expand streams into deeper written breakdowns.
- Include behind-the-scenes thoughts, creator commentary, and stream summaries.
- Convert algorithmic reach into owned email audience.

### Medium/blog

- SEO-style evergreen articles.
- Educational breakdowns.
- Searchable long-tail content from stream topics.

### Spotify/podcast

- Extract audio.
- Remove dead air where safe.
- Generate show notes, episode title, timestamps, and summary.
- Consider audio-only exclusive edits from long streams.

### Discord

- Announce streams, top clips, articles, and experiments.
- Generate community engagement prompts.
- Keep tone human and non-spammy.

### Patreon

- Early access cuts.
- Extended/uncensored versions where appropriate.
- Archive access.
- Behind-the-scenes explanations.

## Winner detection

Continuously track analytics where available:

- Watch time.
- Retention.
- Rewatches.
- Comments.
- Shares.
- Saves.
- CTR.
- Engagement velocity.
- Follower/subscriber/email conversion.

Detect:

- Breakout clips.
- Breakout topics.
- Breakout hooks.
- Breakout formats.
- Platform-specific winners.

When a clip wins:

- Create variants.
- Redistribute to suitable platforms.
- Clip adjacent stream moments.
- Create a compilation.
- Create a long-form follow-up topic.
- Generate X thread, Reddit discussion, Substack deep dive, and Medium/blog angle.
- Add topic/hook to the creator playbook.

## Funnel strategy

Top of funnel:

- TikTok.
- Instagram Reels.
- Facebook Reels.
- YouTube Shorts.
- X.

Mid funnel:

- YouTube long-form.
- Spotify/podcast.
- Reddit.
- Medium/blog.

Bottom funnel:

- Substack/email.
- Discord.
- Patreon.
- Memberships.
- Products/services later.

Every asset should answer: where should this send the viewer next?

## Archive and reuse

Maintain searchable local archive of:

- Streams.
- Clips.
- Transcripts.
- Captions.
- Thumbnails.
- Metadata.
- Analytics.
- Post copy.
- Platform decisions.
- Winner/loser outcomes.

Search modes:

- Semantic search.
- Topic search.
- Quote search.
- Date/stream search.
- Platform/performance search.
- Remix/compilation discovery.

## Automation roadmap

### Stage 1 — Review-first automation

- Ingest/import stream.
- Validate/transcribe/render.
- Generate ranked clips.
- Generate metadata and platform export bundles.
- Show everything in Clip Review / Dispatch for approval.

### Stage 2 — Scheduling and analytics

- Add platform-specific calendar.
- Add analytics import/manual entry first.
- Add winner detection dashboard.
- Recommend reposts, variants, and follow-ups.

### Stage 3 — Approved integrations

- Add official APIs/schedulers after explicit approval.
- Store credentials safely.
- Respect rate limits.
- Require owner approval for public writes unless/until policy changes.

### Stage 4 — Self-improving Content HQ

- Learn creator voice from approved edits.
- Learn winning hooks and formats.
- Learn best posting cadence per platform.
- Auto-create content briefs for future streams.
- Turn every stream into a compounding media asset library.

## Product modules

1. Ingest Inbox.
2. Processing Jobs.
3. Moment Miner.
4. Clip Review.
5. Render Lab.
6. Thumbnail Lab.
7. Copy Studio.
8. Dispatch Calendar.
9. Analytics / Winner Radar.
10. Archive Search.
11. Funnel Builder.
12. Stream Overlay + Chat Co-Pilot.
13. Rex Live Companion / Avatar.
14. Settings / Guardrails.

## Rex Live Companion / Avatar

Future direction: Content HQ is built around livestreaming, so Rex should eventually be present as a live stream-side companion, not just a dashboard backend.

Ideas to park for later:

- Always-visible Rex status panel watching jobs and stream context.
- Stream-safe avatar that reacts to workflow state, chat, clips, or alerts.
- Optional OBS/browser overlay for Rex presence.
- Voice/interactive companion mode during streams.
- Long-term physical/hologram-style presence so Masala can interact with Rex beside the desk.

This is a future experience layer, not an immediate replacement for the media pipeline. Do not interrupt current core work unless Masala explicitly asks to prototype it.

## Near-term implementation implications

- Keep current media pipeline work; it is Stage 1 of Content HQ.
- Add Dispatch as a first-class workflow after Render Lab.
- Add platform target metadata to every clip.
- Add master/variant render relationship.
- Add analytics fields even before API integrations.
- Add owned-audience CTA fields to export bundles.
- Add winner detection model and dashboard.
- Add article/newsletter/podcast export generators from transcript segments.
