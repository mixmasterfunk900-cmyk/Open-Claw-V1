#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const dataPath = path.join(root, 'data/vibe-zone.json')
const now = new Date().toISOString()
const stamp = '20260515T1349Z'
const thumbnails = [
  {
    slug: 'day4-stream-once-forever',
    clipId: 'clip_day4-stream-once-forever_20260515T1310Z',
    title: 'STREAM ONCE FOREVER',
    imageUrl: 'media/thumbnails/day4-package-20260515T1310Z/generated-clickable/day4-stream-once-forever-thumbnail.png',
    visualAngle: 'Face-led creator-machine hook: one stream becomes infinite content without showing platform logos.',
  },
  {
    slug: 'day4-zero-risk-creator',
    clipId: 'clip_day4-zero-risk-creator_20260515T1310Z',
    title: 'ZERO RISK CREATOR',
    imageUrl: 'media/thumbnails/day4-package-20260515T1310Z/generated-clickable/day4-zero-risk-creator-thumbnail.png',
    visualAngle: 'Risk-free creator SaaS pricing tension with growth/money energy.',
  },
  {
    slug: 'day4-telegram-is-chaos',
    clipId: 'clip_day4-telegram-is-chaos_20260515T1310Z',
    title: 'TELEGRAM CHAOS',
    imageUrl: 'media/thumbnails/day4-package-20260515T1310Z/generated-clickable/day4-telegram-is-chaos-thumbnail.png',
    visualAngle: 'Chaotic chat/agent overload without exposing private messages.',
  },
  {
    slug: 'day4-algorithm-wakes-up',
    clipId: 'clip_day4-algorithm-wakes-up_20260515T1310Z',
    title: 'ALGORITHM WOKE UP',
    imageUrl: 'media/thumbnails/day4-package-20260515T1310Z/generated-clickable/day4-algorithm-wakes-up-thumbnail.png',
    visualAngle: 'Analytics spike / algorithm awakening moment from the traction segment.',
  },
  {
    slug: 'day4-one-billion-live',
    clipId: 'clip_day4-one-billion-live_20260515T1310Z',
    title: '$1B LIVE',
    imageUrl: 'media/thumbnails/day4-package-20260515T1310Z/generated-clickable/day4-one-billion-live-thumbnail.png',
    visualAngle: 'Outrageous build-in-public ambition: billion-dollar company energy live on stream.',
  },
]

const data = JSON.parse(await readFile(dataPath, 'utf8'))
data.thumbnailConcepts ||= []
for (const item of thumbnails) {
  const clip = (data.clips || []).find((c) => c.id === item.clipId)
  if (clip) {
    clip.thumbnailProofPath = item.imageUrl
    clip.proofFrames = [...new Set([item.imageUrl, ...(clip.proofFrames || [])])]
    clip.seo ||= {}
    clip.seo.thumbnailText = item.title
    clip.seo.thumbnailImage = item.imageUrl
    clip.updatedAt = now
  }
  const concept = {
    id: `thumb_${item.slug}_${stamp}`,
    sourceClipId: item.clipId,
    sourceTranscriptId: '_R2pPID8N-o',
    sourceTitle: clip?.title || item.title,
    sourceVideoPath: clip?.renderPath || '',
    sourceProofPath: clip?.proofFramePath || '',
    status: 'ready',
    rating: null,
    title: item.title,
    thumbnailText: item.title,
    visualAngle: item.visualAngle,
    emotion: 'expressive creator shock/curiosity',
    style: 'GothamChess-inspired: huge expressive creator face, dark high-contrast neon tech background, one bold readable headline, no logos, no tiny UI, no green border/box.',
    prompt: `Face-led GothamChess-style YouTube thumbnail. Text: ${item.title}. ${item.visualAngle}`,
    learningNotes: 'Generated after Masala noticed Day 4 renders were missing proper clickable thumbnails; seed-frame stills are no longer the primary thumbnail asset.',
    imageUrl: item.imageUrl,
    createdAt: now,
    updatedAt: now,
  }
  const idx = data.thumbnailConcepts.findIndex((existing) => existing.id === concept.id || existing.sourceClipId === concept.sourceClipId && existing.title === concept.title && String(existing.id).includes('day4'))
  if (idx >= 0) data.thumbnailConcepts[idx] = { ...data.thumbnailConcepts[idx], ...concept }
  else data.thumbnailConcepts.unshift(concept)
}
data.mediaJobs ||= []
data.mediaJobs.unshift({
  id: `media_job_day4_clickable_thumbnails_${stamp}`,
  type: 'thumbnail-generation',
  title: 'Generated Day 4 clickable thumbnails',
  status: 'done',
  detail: `Generated and registered ${thumbnails.length} proper face-led clickable thumbnails for the Day 4 short batch. Replaced seed-frame stills as clip thumbnailProofPath assets.`,
  command: 'node scripts/register-day4-clickable-thumbnails-20260515T1349Z.mjs',
  createdAt: now,
  assets: thumbnails.map((item) => item.imageUrl),
})
await writeFile(dataPath, JSON.stringify(data, null, 2) + '\n')
console.log(JSON.stringify({ ok: true, registered: thumbnails.length, assets: thumbnails.map((item) => item.imageUrl) }, null, 2))
